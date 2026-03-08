/**
 * Hook encapsulating contact (call/WhatsApp) outcome tracking.
 * Manages the 2-step confirm sheet: outcome selection then optional note.
 * Includes AppState listener for detecting return from phone/WhatsApp.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { addCandidateActivity } from '@/lib/recruitment';
import type { CandidateActivity, CandidateOutcome } from '@/types/recruitment';

interface UseContactOutcomeParams {
    candidateId: string;
    candidateName: string;
    candidatePhone: string;
    userId: string | undefined;
    userName: string | undefined;
    onActivityLogged: (activity: CandidateActivity) => void;
}

interface ContactOutcomeState {
    pendingType: 'call' | 'whatsapp' | null;
    showConfirmSheet: boolean;
    confirmStep: 'outcome' | 'note';
    selectedOutcome: CandidateOutcome | null;
    noteText: string;
    setNoteText: (v: string) => void;
    handleCall: () => void;
    handleWhatsApp: () => void;
    handleOutcomeSelect: (outcome: CandidateOutcome) => void;
    handleSaveActivity: (skipNote?: boolean) => void;
    handleDismissSheet: () => void;
}

export function useContactOutcome({
    candidateId,
    candidateName,
    candidatePhone,
    userId,
    userName,
    onActivityLogged,
}: UseContactOutcomeParams): ContactOutcomeState {
    const [pendingType, setPendingType] = useState<'call' | 'whatsapp' | null>(null);
    const [showConfirmSheet, setShowConfirmSheet] = useState(false);
    const [confirmStep, setConfirmStep] = useState<'outcome' | 'note'>('outcome');
    const [selectedOutcome, setSelectedOutcome] = useState<CandidateOutcome | null>(null);
    const [noteText, setNoteText] = useState('');
    const hasPendingContact = useRef(false);
    const wentToBackground = useRef(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'background') {
                wentToBackground.current = true;
            } else if (nextState === 'active' && wentToBackground.current && hasPendingContact.current) {
                wentToBackground.current = false;
                setConfirmStep('outcome');
                setShowConfirmSheet(true);
            }
        });
        return () => subscription.remove();
    }, []);

    const handleDismissSheet = useCallback(() => {
        hasPendingContact.current = false;
        setPendingType(null);
        setSelectedOutcome(null);
        setNoteText('');
        setShowConfirmSheet(false);
        setConfirmStep('outcome');
    }, []);

    const handleCall = useCallback(() => {
        hasPendingContact.current = true;
        setPendingType('call');
        Linking.openURL(`tel:${candidatePhone.replace(/\s/g, '')}`);
    }, [candidatePhone]);

    const handleWhatsApp = useCallback(() => {
        hasPendingContact.current = true;
        setPendingType('whatsapp');
        Linking.openURL(`https://wa.me/${candidatePhone.replace(/[\s+]/g, '')}`);
    }, [candidatePhone]);

    const handleOutcomeSelect = useCallback((outcome: CandidateOutcome) => {
        setSelectedOutcome(outcome);
        setConfirmStep('note');
    }, []);

    const handleSaveActivity = useCallback(
        (skipNote = false) => {
            if (!pendingType || !selectedOutcome) return;
            const note = skipNote ? null : noteText.trim() || null;
            const activity: CandidateActivity = {
                id: `ca_${Date.now()}`,
                candidate_id: candidateId,
                user_id: userId || 'me',
                type: pendingType,
                outcome: selectedOutcome,
                note,
                created_at: new Date().toISOString(),
                actor_name: userName || undefined,
            };
            onActivityLogged(activity);
            if (userId) {
                addCandidateActivity(candidateId, userId, pendingType, selectedOutcome, note);
            }
            handleDismissSheet();
        },
        [pendingType, selectedOutcome, noteText, candidateId, userId, userName, onActivityLogged, handleDismissSheet],
    );

    return {
        pendingType,
        showConfirmSheet,
        confirmStep,
        selectedOutcome,
        noteText,
        setNoteText,
        handleCall,
        handleWhatsApp,
        handleOutcomeSelect,
        handleSaveActivity,
        handleDismissSheet,
    };
}

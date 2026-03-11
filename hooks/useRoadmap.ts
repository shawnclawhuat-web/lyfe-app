import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchCandidateRoadmap, computeNodeStates } from '@/lib/roadmap';
import type { ProgrammeWithModules, NodeState } from '@/types/roadmap';

interface UseRoadmapResult {
    programmes: ProgrammeWithModules[];
    nodeStates: Map<string, NodeState>;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    activeProgrammeIndex: number;
    setActiveProgrammeIndex: (index: number) => void;
}

/**
 * Candidate-facing hook: read-only roadmap data.
 * No completion actions — completion is managed by PA/Manager/Director
 * from the CandidateProgressView in management screens.
 */
export function useRoadmap(candidateId: string | undefined): UseRoadmapResult {
    const [programmes, setProgrammes] = useState<ProgrammeWithModules[]>([]);
    const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeProgrammeIndex, setActiveProgrammeIndex] = useState(0);
    const mountedRef = useRef(true);

    const loadRoadmap = useCallback(async () => {
        if (!candidateId) return;
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await fetchCandidateRoadmap(candidateId);

        if (!mountedRef.current) return;

        if (fetchError) {
            setError(fetchError);
            setIsLoading(false);
            return;
        }

        if (data) {
            setProgrammes(data);

            const stateMap = new Map<string, NodeState>();
            data.forEach((programme) => {
                const states = computeNodeStates(programme.modules);
                programme.modules.forEach((m, i) => {
                    stateMap.set(m.id, states[i]);
                });
            });
            setNodeStates(stateMap);
        }

        setIsLoading(false);
    }, [candidateId]);

    useFocusEffect(
        useCallback(() => {
            mountedRef.current = true;
            loadRoadmap();
            return () => {
                mountedRef.current = false;
            };
        }, [loadRoadmap]),
    );

    return {
        programmes,
        nodeStates,
        isLoading,
        error,
        refresh: loadRoadmap,
        activeProgrammeIndex,
        setActiveProgrammeIndex,
    };
}

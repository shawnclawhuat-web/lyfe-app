import ConfirmDialog, { type ConfirmDialogButton } from '@/components/ConfirmDialog';
import ErrorBanner from '@/components/ErrorBanner';
import MathRenderer from '@/components/MathRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { submitExamAttempt, submitVarkAttempt } from '@/lib/exams';
import { computeVarkScores } from '@/lib/vark';
import { supabase } from '@/lib/supabase';
import type { ExamQuestion } from '@/types/exam';
import { ACTIVE_EXAM_SCHEMA_VERSION } from '@/types/exam';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const PAPER_DURATIONS: Record<string, number> = { m5: 60, m9: 60, m9a: 45, hi: 45 };
const PAPER_CODES: Record<string, string> = { m5: 'M5', m9: 'M9', m9a: 'M9A', hi: 'HI' };

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const STORAGE_KEY = 'lyfe_active_exam';

/**
 * Check if a question is answered. For multi-select, an empty string
 * after all deselections means "not answered".
 */
function isQuestionAnswered(answers: Record<string, string>, questionId: string): boolean {
    const val = answers[questionId];
    return val != null && val.length > 0;
}

export default function TakeExamScreen() {
    const { paperId } = useLocalSearchParams<{ paperId: string }>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [paperTitle, setPaperTitle] = useState<string | null>(null);
    const [dialogConfig, setDialogConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons: ConfirmDialogButton[];
    }>({ visible: false, title: '', message: '', buttons: [] });

    const showDialog = (title: string, message: string, buttons: ConfirmDialogButton[]) => {
        setDialogConfig({ visible: true, title, message, buttons });
    };
    const hideDialog = () => setDialogConfig((prev) => ({ ...prev, visible: false }));

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const pausedAtRef = useRef<number | null>(null);
    const startedAtRef = useRef<number>(Date.now());
    const hasRestoredRef = useRef(false);
    const isMultiSelectRef = useRef(false);

    // Load questions + restore saved progress
    useEffect(() => {
        const loadQuestions = async () => {
            let questionsData: ExamQuestion[] = [];
            let duration = 60;

            const { data, error } = await supabase
                .from('exam_questions')
                .select('*')
                .eq('paper_id', paperId)
                .order('question_number');

            if (error) {
                setError('Failed to load questions. Please try again.');
                setIsLoading(false);
                return;
            }
            questionsData = data as ExamQuestion[];

            const { data: paper } = await supabase
                .from('exam_papers')
                .select('duration_minutes, allow_multiple_answers, title')
                .eq('id', paperId)
                .single();

            duration = paper?.duration_minutes || 60;
            const multiSelect = paper?.allow_multiple_answers === true;
            setIsMultiSelect(multiSelect);
            isMultiSelectRef.current = multiSelect;
            setPaperTitle(paper?.title || null);

            setQuestions(questionsData);

            // Try to restore saved progress
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const state = JSON.parse(saved);
                    // Only restore if same paper AND same schema version AND same multi-select mode
                    if (
                        state.paperId === paperId &&
                        state.schemaVersion === ACTIVE_EXAM_SCHEMA_VERSION &&
                        state.allowMultipleAnswers === multiSelect
                    ) {
                        setAnswers(state.answers || {});
                        setCurrentIndex(state.currentIndex || 0);
                        startedAtRef.current = state.startedAt || Date.now();
                        if (typeof state.timeLeft === 'number' && state.timeLeft > 0) {
                            setTimeLeft(state.timeLeft);
                        } else {
                            const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
                            setTimeLeft(Math.max(0, duration * 60 - elapsed));
                        }
                        setIsLoading(false);
                        setTimeout(() => {
                            hasRestoredRef.current = true;
                        }, 0);
                        return;
                    }
                    // Incompatible saved state — discard it
                    await AsyncStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                if (__DEV__) console.error('[ExamTake] Failed to restore saved state:', e);
            }

            // No saved state — start fresh
            startedAtRef.current = Date.now();
            setTimeLeft(duration * 60);
            setIsLoading(false);
            setTimeout(() => {
                hasRestoredRef.current = true;
            }, 0);
        };

        loadQuestions();
    }, [paperId]);

    // Timer
    useEffect(() => {
        if (isLoading || isSubmitting) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isLoading, isSubmitting]);

    // App state listener — pause timer when backgrounded
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
                pausedAtRef.current = Date.now();
                if (timerRef.current) clearInterval(timerRef.current);
            } else if (nextState === 'active' && appStateRef.current.match(/inactive|background/)) {
                pausedAtRef.current = null;
            }
            appStateRef.current = nextState;
        });

        return () => subscription.remove();
    }, []);

    // Auto-save answers + timer to AsyncStorage
    useEffect(() => {
        if (questions.length === 0 || !hasRestoredRef.current) return;
        const state = {
            schemaVersion: ACTIVE_EXAM_SCHEMA_VERSION,
            attemptId: `${user?.id}_${paperId}`,
            paperId: paperId || '',
            paperCode: PAPER_CODES[paperId || ''] || paperTitle || '',
            answers,
            currentIndex,
            startedAt: startedAtRef.current,
            durationMinutes: PAPER_DURATIONS[paperId || ''] || 60,
            totalQuestions: questions.length,
            timeLeft,
            allowMultipleAnswers: isMultiSelectRef.current,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) => {
            if (__DEV__) console.error('[ExamTake] Failed to auto-save state:', e);
        });
    }, [answers, currentIndex, timeLeft]);

    // ── Answer handlers ──

    /** Single-select: replace answer */
    const handleSelectAnswer = (questionId: string, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    /** Multi-select: toggle an option on/off (comma-separated) */
    const handleToggleAnswer = (questionId: string, option: string) => {
        setAnswers((prev) => {
            const current = prev[questionId] || '';
            const selections = current ? current.split(',') : [];
            const idx = selections.indexOf(option);
            if (idx >= 0) {
                selections.splice(idx, 1);
            } else {
                selections.push(option);
            }
            // Sort to keep stable order (A,B,C,D)
            selections.sort();
            return { ...prev, [questionId]: selections.join(',') };
        });
    };

    const handleAutoSubmit = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const label = isMultiSelectRef.current ? 'assessment' : 'exam';
        showDialog("Time's Up!", `Your ${label} has been automatically submitted.`, [
            {
                text: 'View Results',
                onPress: () => {
                    hideDialog();
                    submitExam('auto_submitted');
                },
            },
        ]);
    }, [answers, questions]);

    const handleSubmit = () => {
        const unanswered = questions.filter((q) => !isQuestionAnswered(answers, q.id)).length;

        if (unanswered > 0) {
            const unansweredMsg = isMultiSelect
                ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. They will not count toward your results. Submit anyway?`
                : `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Unanswered questions will be marked incorrect. Submit anyway?`;

            showDialog('Unanswered Questions', unansweredMsg, [
                { text: 'Review', style: 'cancel', onPress: hideDialog },
                {
                    text: 'Submit',
                    style: 'destructive',
                    onPress: () => {
                        hideDialog();
                        submitExam('submitted');
                    },
                },
            ]);
        } else {
            const title = isMultiSelect ? 'Submit Assessment' : 'Submit Exam';
            showDialog(title, 'Are you sure you want to submit? You cannot change your answers after submission.', [
                { text: 'Cancel', style: 'cancel', onPress: hideDialog },
                {
                    text: 'Submit',
                    onPress: () => {
                        hideDialog();
                        submitExam('submitted');
                    },
                },
            ]);
        }
    };

    const submitExam = async (status: 'submitted' | 'auto_submitted') => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const pc = PAPER_CODES[paperId || ''] || paperTitle || paperId || '';

        if (user?.id) {
            const submitFn = isMultiSelect ? submitVarkAttempt : submitExamAttempt;
            const { data: result, error } = await submitFn(
                {
                    userId: user.id,
                    paperId: paperId || '',
                    questions,
                    answers,
                    status,
                    startedAt: startedAtRef.current,
                },
                pc,
            );

            if (error || !result) {
                if (__DEV__) console.error('Failed to submit to Supabase:', error);
                // Fall through to local fallback
            } else {
                await AsyncStorage.setItem(`exam_result_${result.id}`, JSON.stringify(result));
                await AsyncStorage.removeItem(STORAGE_KEY);
                // Route to VARK results or standard results
                if (result.personalityResults) {
                    router.replace(`/(tabs)/exams/results/vark/${result.id}`);
                } else {
                    router.replace(`/(tabs)/exams/results/${result.id}`);
                }
                return;
            }
        }

        // Local-only fallback
        if (isMultiSelect) {
            // VARK fallback — compute personality results locally
            const varkResults = computeVarkScores(questions, answers);
            const resultId = `result_${Date.now()}`;
            const result = {
                id: resultId,
                score: 0,
                totalQuestions: questions.length,
                percentage: 0,
                passed: false,
                status,
                answers: questions.map((q) => ({
                    questionId: q.id,
                    selected: answers[q.id] || null,
                    isCorrect: false,
                    correctAnswer: q.correct_answer,
                })),
                questions,
                paperCode: pc,
                personalityResults: varkResults,
            };
            await AsyncStorage.setItem(`exam_result_${resultId}`, JSON.stringify(result));
            await AsyncStorage.removeItem(STORAGE_KEY);
            router.replace(`/(tabs)/exams/results/vark/${resultId}`);
        } else {
            // Standard exam fallback
            let correct = 0;
            const answerDetails = questions.map((q) => {
                const selected = answers[q.id] || null;
                const isCorrect = selected === q.correct_answer;
                if (isCorrect) correct++;
                return { questionId: q.id, selected, isCorrect, correctAnswer: q.correct_answer };
            });

            const percentage = Math.round((correct / questions.length) * 100);
            const passed = percentage >= 70;

            const resultId = `result_${Date.now()}`;
            const result = {
                id: resultId,
                score: correct,
                totalQuestions: questions.length,
                percentage,
                passed,
                status,
                answers: answerDetails,
                questions,
                paperCode: PAPER_CODES[paperId || ''] || paperId,
            };

            await AsyncStorage.setItem(`exam_result_${resultId}`, JSON.stringify(result));
            await AsyncStorage.removeItem(STORAGE_KEY);
            router.replace(`/(tabs)/exams/results/${resultId}`);
        }
    };

    const handleBack = () => {
        const label = isMultiSelect ? 'assessment' : 'exam';
        showDialog(`Leave ${isMultiSelect ? 'Assessment' : 'Exam'}?`, 'Your progress is saved. You can resume later.', [
            { text: 'Stay', style: 'cancel', onPress: hideDialog },
            {
                text: 'Leave',
                style: 'destructive',
                onPress: () => {
                    hideDialog();
                    if (timerRef.current) clearInterval(timerRef.current);
                    router.back();
                },
            },
        ]);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading questions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = questions[currentIndex];
    const answeredCount = questions.filter((q) => isQuestionAnswered(answers, q.id)).length;
    const isTimeLow = timeLeft < 300;
    const displayCode = PAPER_CODES[paperId || ''] || paperTitle || paperId;

    // For multi-select, parse currently selected options for this question
    const currentSelections = isMultiSelect ? (answers[currentQuestion.id] || '').split(',').filter(Boolean) : [];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Top Bar */}
            <View style={[styles.topBar, { borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.topCenter}>
                    <Text style={[styles.paperCode, { color: colors.accent }]}>{displayCode}</Text>
                    <Text style={[styles.questionCount, { color: colors.textSecondary }]}>
                        {currentIndex + 1} / {questions.length}
                    </Text>
                </View>
                <View
                    style={[
                        styles.timerBadge,
                        { backgroundColor: isTimeLow ? colors.dangerLight : colors.surfacePrimary },
                    ]}
                >
                    <Ionicons name="time-outline" size={16} color={isTimeLow ? colors.danger : colors.textSecondary} />
                    <Text style={[styles.timerText, { color: isTimeLow ? colors.danger : colors.textPrimary }]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarOuter, { backgroundColor: colors.surfacePrimary }]}>
                <View
                    style={[
                        styles.progressBarInner,
                        {
                            backgroundColor: colors.accent,
                            width: `${((currentIndex + 1) / questions.length) * 100}%`,
                        },
                    ]}
                />
            </View>

            {error && (
                <ErrorBanner
                    message={error}
                    onRetry={() => router.replace(`/exams/take/${paperId}`)}
                    onDismiss={() => setError(null)}
                />
            )}

            {/* Question Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Text */}
                <View
                    style={[
                        styles.questionCard,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <Text style={[styles.questionLabel, { color: colors.textTertiary }]}>
                        Question {currentQuestion.question_number}
                    </Text>
                    {currentQuestion.has_latex ? (
                        <MathRenderer content={currentQuestion.question_text} fontSize={16} />
                    ) : (
                        <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                            {currentQuestion.question_text}
                        </Text>
                    )}
                    {isMultiSelect && (
                        <Text style={[styles.multiSelectHint, { color: colors.textTertiary }]}>
                            Select all that apply
                        </Text>
                    )}
                </View>

                {/* Options */}
                {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = currentQuestion.options[option];
                    if (!optionText) return null;

                    const isSelected = isMultiSelect
                        ? currentSelections.includes(option)
                        : answers[currentQuestion.id] === option;
                    const hasLatexContent = optionText.includes('$') || optionText.includes('\\');

                    return (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionCard,
                                {
                                    backgroundColor: isSelected ? colors.accentLight : colors.cardBackground,
                                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                                    borderWidth: isSelected ? 1.5 : 0.5,
                                },
                            ]}
                            onPress={() =>
                                isMultiSelect
                                    ? handleToggleAnswer(currentQuestion.id, option)
                                    : handleSelectAnswer(currentQuestion.id, option)
                            }
                            activeOpacity={0.7}
                            accessibilityRole={isMultiSelect ? 'checkbox' : 'radio'}
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Option ${option}: ${optionText}`}
                        >
                            <View
                                style={[
                                    styles.optionLetter,
                                    isMultiSelect
                                        ? {
                                              backgroundColor: isSelected ? colors.accent : 'transparent',
                                              borderColor: isSelected ? colors.accent : colors.border,
                                              borderRadius: 6,
                                              borderWidth: 1.5,
                                          }
                                        : {
                                              backgroundColor: isSelected ? colors.accent : colors.surfacePrimary,
                                              borderColor: isSelected ? colors.accent : colors.border,
                                              borderRadius: 8,
                                          },
                                ]}
                            >
                                {isMultiSelect ? (
                                    isSelected ? (
                                        <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                                    ) : null
                                ) : (
                                    <Text
                                        style={[
                                            styles.optionLetterText,
                                            { color: isSelected ? colors.textInverse : colors.textSecondary },
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.optionContent}>
                                {hasLatexContent ? (
                                    <MathRenderer content={optionText} fontSize={15} />
                                ) : (
                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>{optionText}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Bottom Navigation */}
            <View
                style={[
                    styles.bottomBar,
                    { backgroundColor: colors.cardBackground, borderTopColor: colors.borderLight },
                ]}
            >
                <TouchableOpacity
                    style={[styles.navButton, { opacity: currentIndex === 0 ? 0.3 : 1 }]}
                    onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                    <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Prev</Text>
                </TouchableOpacity>

                {/* Question Grid Toggle */}
                <TouchableOpacity
                    style={[styles.gridButton, { backgroundColor: colors.surfacePrimary }]}
                    onPress={() => setShowGrid(!showGrid)}
                >
                    <Ionicons name="grid-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.gridBadge, { color: colors.accent }]}>
                        {answeredCount}/{questions.length}
                    </Text>
                </TouchableOpacity>

                {currentIndex === questions.length - 1 ? (
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: colors.accent, opacity: isSubmitting ? 0.6 : 1 },
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.textInverse} />
                        ) : (
                            <>
                                <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>Submit</Text>
                                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                    >
                        <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Next</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Question Grid Overlay */}
            {showGrid && (
                <View style={[styles.gridOverlay, { backgroundColor: colors.background + 'F2' }]}>
                    <View
                        style={[
                            styles.gridContainer,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        <View style={styles.gridHeader}>
                            <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Question Navigator</Text>
                            <TouchableOpacity onPress={() => setShowGrid(false)}>
                                <Ionicons name="close" size={22} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.gridItems}>
                            {questions.map((q, idx) => {
                                const isAnswered = isQuestionAnswered(answers, q.id);
                                const isCurrent = idx === currentIndex;
                                return (
                                    <TouchableOpacity
                                        key={q.id}
                                        style={[
                                            styles.gridItem,
                                            {
                                                backgroundColor: isCurrent
                                                    ? colors.accent
                                                    : isAnswered
                                                      ? colors.accentLight
                                                      : colors.surfacePrimary,
                                                borderColor: isCurrent
                                                    ? colors.accent
                                                    : isAnswered
                                                      ? colors.accent
                                                      : colors.border,
                                            },
                                        ]}
                                        onPress={() => {
                                            setCurrentIndex(idx);
                                            setShowGrid(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.gridItemText,
                                                {
                                                    color: isCurrent
                                                        ? colors.textInverse
                                                        : isAnswered
                                                          ? colors.accent
                                                          : colors.textTertiary,
                                                },
                                            ]}
                                        >
                                            {idx + 1}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                visible={dialogConfig.visible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                buttons={dialogConfig.buttons}
                onDismiss={hideDialog}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
    },
    backButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topCenter: { alignItems: 'center' },
    paperCode: { fontSize: 14, fontWeight: '700' },
    questionCount: { fontSize: 12, marginTop: 2 },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timerText: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
    progressBarOuter: { height: 3 },
    progressBarInner: { height: 3 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 24 },
    questionCard: {
        borderRadius: 12,
        borderWidth: 0.5,
        padding: 16,
        marginBottom: 16,
    },
    questionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
    questionText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
    multiSelectHint: { fontSize: 12, fontWeight: '500', fontStyle: 'italic', marginTop: 8 },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLetterText: { fontSize: 14, fontWeight: '700' },
    optionContent: { flex: 1 },
    optionText: { fontSize: 15, lineHeight: 22 },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 0.5,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minHeight: 44,
    },
    navButtonText: { fontSize: 14, fontWeight: '600' },
    gridButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    gridBadge: { fontSize: 13, fontWeight: '700' },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    submitButtonText: { fontSize: 14, fontWeight: '700' },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    gridContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 0.5,
        padding: 20,
    },
    gridHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridTitle: { fontSize: 16, fontWeight: '700' },
    gridItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridItem: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridItemText: { fontSize: 14, fontWeight: '600' },
});

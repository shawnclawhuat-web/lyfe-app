import { CANDIDATE_STATUS_CONFIG, type CandidateStatus } from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusStepperProps {
    currentStatus: CandidateStatus;
    colors: any;
}

export default function StatusStepper({ currentStatus, colors }: StatusStepperProps) {
    const steps: CandidateStatus[] = [
        'applied',
        'interview_scheduled',
        'interviewed',
        'approved',
        'exam_prep',
        'licensed',
        'active_agent',
    ];
    const currentIdx = steps.indexOf(currentStatus);

    return (
        <View style={styles.container}>
            {steps.map((step, idx) => {
                const cfg = CANDIDATE_STATUS_CONFIG[step];
                const isComplete = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const dotColor = isComplete || isCurrent ? cfg.color : colors.border;

                return (
                    <View key={step} style={styles.stepRow}>
                        <View style={styles.dotCol}>
                            <View style={[styles.dot, { backgroundColor: dotColor, borderColor: dotColor }]}>
                                {isComplete && <Ionicons name="checkmark" size={10} color="#FFF" />}
                                {isCurrent && <View style={styles.activeDotInner} />}
                            </View>
                            {idx < steps.length - 1 && (
                                <View
                                    style={[styles.line, { backgroundColor: isComplete ? cfg.color : colors.border }]}
                                />
                            )}
                        </View>
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isCurrent
                                        ? cfg.color
                                        : isComplete
                                          ? colors.textPrimary
                                          : colors.textTertiary,
                                },
                                isCurrent && { fontWeight: '700' },
                            ]}
                        >
                            {cfg.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 0 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
    dotCol: { width: 24, alignItems: 'center' },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    line: {
        width: 2,
        height: 18,
    },
    label: { fontSize: 13, marginLeft: 10, marginTop: 1 },
});

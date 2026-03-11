import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import RoadmapNode, { NODE_SIZE, SHADOW_DEPTH } from './RoadmapNode';
import NodeBubble from './NodeBubble';
import type { RoadmapModuleWithProgress, NodeState } from '@/types/roadmap';
import type { ThemeColors } from '@/types/theme';

const SCREEN_W = Dimensions.get('window').width;
const NODE_SPACING = 88;
const AMPLITUDE = SCREEN_W * 0.18;
const CENTER_X = SCREEN_W / 2;
const TOP_PADDING = 20;
const BOTTOM_PADDING = 150;
const NODE_WRAPPER_W = 80;
const NODE_VISUAL_H = NODE_SIZE + SHADOW_DEPTH; // 69
const NODE_CENTER_OFFSET = NODE_VISUAL_H / 2;
const LINE_THICKNESS = 2.5;
const CARET_SIZE = 14;
const BUBBLE_GAP = 6;
const BUBBLE_MARGIN = 24;
const BUBBLE_W = SCREEN_W - BUBBLE_MARGIN * 2;
const BUBBLE_EST_H = 130; // estimated bubble height for scroll calculations

interface Props {
    modules: RoadmapModuleWithProgress[];
    nodeStates: Map<string, NodeState>;
    onNodePress: (moduleId: string) => void;
    colors: ThemeColors;
    reducedMotion?: boolean;
    /** Called when a bubble opens and may need scrolling into view */
    onScrollToNode?: (nodeTop: number, bubbleBottom: number) => void;
}

function RoadmapPath({ modules, nodeStates, onNodePress, colors, reducedMotion, onScrollToNode }: Props) {
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const didAutoSelect = useRef(false);

    // Calculate node positions along an S-curve
    const nodePositions = useMemo(() => {
        return modules.map((_, index) => {
            const y = TOP_PADDING + index * NODE_SPACING;
            const x = CENTER_X + AMPLITUDE * Math.sin((index * Math.PI) / 2.5);
            return { x, y };
        });
    }, [modules]);

    // Count completed nodes from start (contiguous)
    const completedCount = useMemo(() => {
        let count = 0;
        for (const module of modules) {
            if (nodeStates.get(module.id) === 'completed') {
                count++;
            } else {
                break;
            }
        }
        return count;
    }, [modules, nodeStates]);

    const totalHeight = TOP_PADDING + modules.length * NODE_SPACING + BOTTOM_PADDING;

    const dismissBubble = useCallback(() => {
        if (selectedModuleId && !isClosing) {
            setIsClosing(true);
        }
    }, [selectedModuleId, isClosing]);

    const handleDismissComplete = useCallback(() => {
        setIsClosing(false);
        setSelectedModuleId(null);
    }, []);

    const handleNodeTap = useCallback(
        (moduleId: string) => {
            if (isClosing) return;
            if (selectedModuleId === moduleId) {
                dismissBubble();
            } else {
                // Switch to new node immediately (no close anim for swap)
                setIsClosing(false);
                setSelectedModuleId(moduleId);
            }
        },
        [selectedModuleId, isClosing, dismissBubble],
    );

    const handleBubbleAction = useCallback(() => {
        if (selectedModuleId) {
            const state = nodeStates.get(selectedModuleId);
            if (state !== 'locked') {
                onNodePress(selectedModuleId);
            }
            dismissBubble();
        }
    }, [selectedModuleId, onNodePress, nodeStates, dismissBubble]);

    // Auto-select the current node on first mount (like Duolingo)
    useEffect(() => {
        if (didAutoSelect.current || modules.length === 0) return;
        didAutoSelect.current = true;
        const currentIndex = modules.findIndex((m) => nodeStates.get(m.id) === 'current');
        if (currentIndex >= 0) {
            // Small delay so layout settles before bubble + scroll
            setTimeout(() => setSelectedModuleId(modules[currentIndex].id), 300);
        }
    }, [modules, nodeStates]);

    // Notify parent to scroll when bubble opens
    useEffect(() => {
        if (!selectedModuleId || !onScrollToNode) return;
        const idx = modules.findIndex((m) => m.id === selectedModuleId);
        if (idx < 0) return;
        const pos = nodePositions[idx];
        if (!pos) return;
        const nodeTop = pos.y;
        const bubbleBottom = pos.y + NODE_VISUAL_H + BUBBLE_GAP + BUBBLE_EST_H;
        // Small delay so NodeBubble entrance animation has started
        setTimeout(() => onScrollToNode(nodeTop, bubbleBottom), 100);
    }, [selectedModuleId, modules, nodePositions, onScrollToNode]);

    // Build line segments between consecutive nodes
    const lineSegments = useMemo(() => {
        if (nodePositions.length < 2) return [];

        return nodePositions.slice(1).map((curr, i) => {
            const prev = nodePositions[i];
            const x1 = prev.x;
            const y1 = prev.y + NODE_CENTER_OFFSET;
            const x2 = curr.x;
            const y2 = curr.y + NODE_CENTER_OFFSET;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isCompleted = i < completedCount - 1;

            return { length, angle, midX, midY, isCompleted, key: i };
        });
    }, [nodePositions, completedCount]);

    // ── Bubble positioning ──────────────────────────────────────
    const selectedIndex = selectedModuleId ? modules.findIndex((m) => m.id === selectedModuleId) : -1;
    const selectedModule = selectedIndex >= 0 ? modules[selectedIndex] : null;
    const selectedPos = selectedIndex >= 0 ? nodePositions[selectedIndex] : null;
    const selectedState = selectedModuleId ? (nodeStates.get(selectedModuleId) ?? 'locked') : 'locked';

    // Resolve the node's main candy-button color for the bubble bg
    const selectedNodeColor = useMemo(() => {
        if (!selectedModuleId) return colors.accent;
        const state = nodeStates.get(selectedModuleId) ?? 'locked';
        if (state === 'completed') return colors.success;
        if (state === 'current') return colors.accent;
        if (state === 'locked') return '#4A4A4E';
        const mod = modules.find((m) => m.id === selectedModuleId);
        return mod?.icon_color ?? '#6E6E73';
    }, [selectedModuleId, nodeStates, modules, colors]);

    // Full-width bubble with fixed margins — only caret position varies
    const bubbleLeft = BUBBLE_MARGIN;
    const caretOffset = selectedPos
        ? Math.max(20, Math.min(BUBBLE_W - 20, selectedPos.x - bubbleLeft - CARET_SIZE / 2))
        : 0;
    const bubbleTop = selectedPos ? selectedPos.y + NODE_VISUAL_H + BUBBLE_GAP : 0;

    return (
        <View style={[styles.container, { height: totalHeight }]}>
            {/* Connecting line segments */}
            {lineSegments.map((seg) => (
                <View
                    key={`line-${seg.key}`}
                    style={[
                        styles.lineSegment,
                        {
                            width: seg.length,
                            height: LINE_THICKNESS,
                            backgroundColor: seg.isCompleted ? colors.success + 'CC' : colors.border + '60',
                            left: seg.midX - seg.length / 2,
                            top: seg.midY - LINE_THICKNESS / 2,
                            transform: [{ rotate: `${seg.angle}deg` }],
                        },
                    ]}
                />
            ))}

            {/* Dismiss overlay — tapping empty space closes the bubble */}
            {selectedModuleId && <Pressable style={StyleSheet.absoluteFill} onPress={dismissBubble} />}

            {/* Nodes positioned absolutely */}
            {modules.map((module, index) => {
                const pos = nodePositions[index];
                const state = nodeStates.get(module.id) ?? 'locked';

                return (
                    <View
                        key={module.id}
                        style={[
                            styles.nodeContainer,
                            {
                                left: pos.x - NODE_WRAPPER_W / 2,
                                top: pos.y,
                            },
                        ]}
                    >
                        <RoadmapNode
                            title={module.title}
                            state={state}
                            moduleType={module.module_type}
                            index={index}
                            onPress={() => handleNodeTap(module.id)}
                            colors={colors}
                            iconName={module.icon_name ?? undefined}
                            iconColor={module.icon_color ?? undefined}
                            reducedMotion={reducedMotion}
                        />
                    </View>
                );
            })}

            {/* Popup bubble for selected node */}
            {selectedModule && selectedPos && (
                <View key={selectedModuleId} style={[styles.bubbleContainer, { left: bubbleLeft, top: bubbleTop }]}>
                    <NodeBubble
                        title={selectedModule.title}
                        state={selectedState}
                        nodeColor={selectedNodeColor}
                        onAction={handleBubbleAction}
                        colors={colors}
                        caretOffset={caretOffset}
                        closing={isClosing}
                        onDismissComplete={handleDismissComplete}
                    />
                </View>
            )}
        </View>
    );
}

/**
 * Compute a strokeDasharray that shows the path as "completed" up to the last completed node.
 * Each segment between nodes is approximately NODE_SPACING in length.
 * (Kept for backward compatibility with tests)
 */
export function computeCompletedDash(
    modules: RoadmapModuleWithProgress[],
    nodeStates: Map<string, NodeState>,
    spacing: number,
): string {
    let completedSegments = 0;
    for (const module of modules) {
        if (nodeStates.get(module.id) === 'completed') {
            completedSegments++;
        } else {
            break;
        }
    }

    if (completedSegments === 0) return '0 9999';

    const segmentLength = spacing * 1.2;
    const completedLength = completedSegments * segmentLength;

    return `${completedLength} 9999`;
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: SCREEN_W,
        overflow: 'visible',
    },
    lineSegment: {
        position: 'absolute',
        borderRadius: LINE_THICKNESS / 2,
    },
    nodeContainer: {
        position: 'absolute',
        width: NODE_WRAPPER_W,
        alignItems: 'center',
    },
    bubbleContainer: {
        position: 'absolute',
        zIndex: 10,
        width: BUBBLE_W,
    },
});

export default React.memo(RoadmapPath);

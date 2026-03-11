import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchCandidateRoadmap, computeNodeStates } from '@/lib/roadmap';
import type { ProgrammeWithModules, NodeState } from '@/types/roadmap';

interface UseRoadmapResult {
    programmes: ProgrammeWithModules[];
    nodeStates: Map<string, NodeState>;
    isLoading: boolean;
    /** True only when the user explicitly pulls to refresh (drives RefreshControl spinner). */
    isRefreshing: boolean;
    error: string | null;
    /** User-initiated pull-to-refresh — shows the RefreshControl spinner. */
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeProgrammeIndex, setActiveProgrammeIndex] = useState(0);
    const mountedRef = useRef(true);
    const hasLoadedRef = useRef(false);

    const loadRoadmap = useCallback(
        async (showRefreshIndicator = false) => {
            if (!candidateId) return;

            if (!hasLoadedRef.current) {
                // First load: show full-screen spinner
                setIsLoading(true);
            } else if (showRefreshIndicator) {
                // User-initiated pull: show RefreshControl spinner
                setIsRefreshing(true);
            }
            // Focus returns: silent background refresh (no spinner)

            setError(null);

            const { data, error: fetchError } = await fetchCandidateRoadmap(candidateId);

            if (!mountedRef.current) return;

            if (fetchError) {
                setError(fetchError);
                setIsLoading(false);
                setIsRefreshing(false);
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

            hasLoadedRef.current = true;
            setIsLoading(false);
            setIsRefreshing(false);
        },
        [candidateId],
    );

    // Focus effect: silent background refresh (no spinner)
    useFocusEffect(
        useCallback(() => {
            mountedRef.current = true;
            loadRoadmap(false);
            return () => {
                mountedRef.current = false;
            };
        }, [loadRoadmap]),
    );

    // User-initiated pull-to-refresh: shows the RefreshControl spinner
    const pullToRefresh = useCallback(() => loadRoadmap(true), [loadRoadmap]);

    return {
        programmes,
        nodeStates,
        isLoading,
        isRefreshing,
        error,
        refresh: pullToRefresh,
        activeProgrammeIndex,
        setActiveProgrammeIndex,
    };
}

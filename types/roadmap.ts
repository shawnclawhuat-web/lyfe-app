import type { Tables } from './supabase';

// ─── Programme & Module Types ────────────────────────────────────────────────

export type ProgrammeIconType = 'seedling' | 'sprout';
export type ModuleType = 'training' | 'exam' | 'resource';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';
export type EnrollmentStatus = 'active' | 'completed' | 'paused';
export type ResourceType = 'link' | 'file' | 'video' | 'text';
export type NodeState = 'completed' | 'current' | 'available' | 'locked';

export type RoadmapProgramme = Omit<Tables<'roadmap_programmes'>, 'icon_type'> & {
    icon_type: ProgrammeIconType;
};

export type RoadmapModule = Omit<Tables<'roadmap_modules'>, 'module_type'> & {
    module_type: ModuleType;
};

export type RoadmapResource = Omit<Tables<'roadmap_resources'>, 'resource_type'> & {
    resource_type: ResourceType;
};

export type CandidateModuleProgress = Omit<Tables<'candidate_module_progress'>, 'status'> & {
    status: ModuleStatus;
};

export type CandidateProgrammeEnrollment = Omit<Tables<'candidate_programme_enrollment'>, 'status'> & {
    status: EnrollmentStatus;
};

// ─── Enriched UI Types ──────────────────────────────────────────────────────

export interface RoadmapModuleWithProgress extends RoadmapModule {
    progress: CandidateModuleProgress | null;
    resources: RoadmapResource[];
    isLocked: boolean;
    examPaper: { code: string; title: string; pass_percentage: number } | null;
    prerequisiteIds: string[];
    isArchived: boolean;
}

export interface ProgrammeWithModules extends RoadmapProgramme {
    modules: RoadmapModuleWithProgress[];
    completedCount: number;
    totalCount: number;
    percentage: number;
    isLocked: boolean;
    manuallyUnlocked: boolean;
    unlockedByName: string | null;
}

export interface RoadmapNodeData {
    module: RoadmapModuleWithProgress;
    state: NodeState;
    index: number;
    isExam: boolean;
}

// ─── Config ─────────────────────────────────────────────────────────────────

export const MODULE_TYPE_CONFIG: Record<ModuleType, { label: string; icon: string }> = {
    training: { label: 'Training', icon: 'book-outline' },
    exam: { label: 'Exam', icon: 'school-outline' },
    resource: { label: 'Resource', icon: 'folder-outline' },
};

/** Map module type → theme color key for type-safe color lookup */
export const MODULE_TYPE_COLOR_KEY = {
    training: 'roadmapTraining',
    exam: 'roadmapExam',
    resource: 'roadmapResource',
} as const;

export const RESOURCE_TYPE_CONFIG: Record<ResourceType, { label: string; icon: string }> = {
    link: { label: 'Link', icon: 'link-outline' },
    file: { label: 'File', icon: 'document-outline' },
    video: { label: 'Video', icon: 'videocam-outline' },
    text: { label: 'Article', icon: 'reader-outline' },
};

export const NODE_STATE_CONFIG: Record<NodeState, { opacity: number; scale: number }> = {
    completed: { opacity: 1, scale: 1 },
    current: { opacity: 1, scale: 1.05 },
    available: { opacity: 0.9, scale: 1 },
    locked: { opacity: 0.4, scale: 0.95 },
};

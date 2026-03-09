/**
 * Database types for the Lyfe app — derived from auto-generated Supabase types.
 *
 * Row types come directly from `types/supabase.ts` (run `npm run gen:types` to refresh).
 * Only add computed/client-only fields here; never duplicate DB column definitions.
 */

import type { Tables, Enums } from './supabase';

// ── Row types (1:1 with Supabase tables) ──

export type User = Tables<'users'> & {
    /** Set to true when the user completes the onboarding flow. Defaults to false for new users. */
    onboarding_complete?: boolean;
};
export type PaManagerAssignment = Tables<'pa_manager_assignments'>;
export type InviteToken = Tables<'invite_tokens'>;

// ── Re-export useful enum types ──

export type UserRole = Enums<'user_role'>;
export type LifecycleStage = Enums<'lifecycle_stage'>;
export type CandidateStatus = Enums<'candidate_status'>;

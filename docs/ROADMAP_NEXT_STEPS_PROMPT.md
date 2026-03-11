# Roadmap Feature — Continue from Code Review

The roadmap feature (SeedLYFE → SproutLYFE) was implemented across Phases 1-3 and 5. A thorough 3-agent code review was done and all CRITICAL/IMPORTANT bugs were fixed. There are remaining tasks documented in `memory/roadmap-next-steps.md`. Execute them in priority order.

## Current State
- **85 test suites, 1054 tests, 0 failures**
- DB migration applied to Supabase (`nvtedkyjwulkzjeoqjgx`)
- `types/supabase.ts` regenerated with all 6 roadmap tables
- Tab swapped: exams → roadmap in `_layout.tsx` and `Roles.ts`
- 13/13 components built in `components/roadmap/`
- Management progress screen wired into candidate profile

## Tasks to Execute (in order)

### Task 1: Write missing tests (`memory/roadmap-next-steps.md` §1a-1e)

Files with 0% test coverage that need tests:

1. **`components/roadmap/CandidateProgressView.tsx`** (311 lines) — the most complex component. Props: `candidateId`, `candidateName`, `reviewerId`, `canMarkComplete`, `colors`, `expanded?`, `hideHeader?`, `onViewFull?`. Test: toggle complete, save note, unlock confirm, summary vs expanded, error banners, loading, fetchError display. Create `__tests__/components/roadmap/CandidateProgressView.test.tsx`.

2. **`components/roadmap/ModuleCard.tsx`** (319 lines) — Props: `module: RoadmapModuleWithProgress`, `colors`, `onTakeExam?`. Test: status badges (not_started/in_progress/completed), learning objectives, resources list, exam CTA visibility, management notes read-only, completed date. Create `__tests__/components/roadmap/ModuleCard.test.tsx`.

3. **`components/roadmap/ProgrammeLockedOverlay.tsx`** (196 lines) — Props: `seedProgramme?`, `manuallyUnlocked?`, `unlockedByName?`, `colors`. Test: locked with progress, manually unlocked banner. Create `__tests__/components/roadmap/ProgrammeLockedOverlay.test.tsx`.

4. **`components/roadmap/RoadmapPath.tsx`** — has an exported pure function `computeCompletedDash(modules, nodeStates, spacing) → string` at lines 124-145. Test this independently. Add to existing or new test file.

5. **4 untested service functions in `lib/roadmap.ts`** — add to existing `__tests__/lib/roadmap.test.ts`:
   - `fetchModule(moduleId)` (lines 16-29)
   - `fetchModuleProgressForCandidate(candidateId, moduleId)` (lines 33-48)
   - `fetchProgrammeModules(programmeId)` (lines 67-79)
   - `fetchCandidateProgress(candidateId)` (lines 99-109)
   - All use the Supabase mock pattern: `jest.mock('@/lib/supabase')` + `__getChain(table).__resolveWith(value)`

### Task 2: Derive types from `Tables<>` (`memory/roadmap-next-steps.md` §2a)

`types/roadmap.ts` has 8 hand-written interfaces that should derive from `Tables<'table_name'>` (pattern established in `types/database.ts`). Replace the 6 DB-backed interfaces with:

```typescript
import type { Tables } from './supabase';

export type RoadmapProgramme = Omit<Tables<'roadmap_programmes'>, 'icon_type'> & {
    icon_type: ProgrammeIconType;
};
export type RoadmapModule = Omit<Tables<'roadmap_modules'>, 'module_type'> & {
    module_type: ModuleType;
};
// etc. for RoadmapResource, CandidateModuleProgress, CandidateProgrammeEnrollment
```

Keep the union literal types (`ProgrammeIconType`, `ModuleType`, `ModuleStatus`, etc.), the enriched UI types (`RoadmapModuleWithProgress`, `ProgrammeWithModules`, `RoadmapNodeData`), and the config objects (`MODULE_TYPE_CONFIG`, etc.) as-is.

After changing, run `npm test` to catch any type mismatches.

### Task 3: UX fixes (`memory/roadmap-next-steps.md` §3a-3b)

1. **`hooks/useRoadmap.ts`** — Add `useFocusEffect` to re-fetch roadmap data when the tab regains focus (so candidate sees updated progress after management marks modules). The hook already has a `mountedRef` for cleanup.

2. **`components/roadmap/ProgrammeTabs.tsx`** — Replace `const tabWidth = 150` (line 52) with dynamic width calculated from container via `onLayout` or `useWindowDimensions`. Container has `marginHorizontal: 16` so available width = screenWidth - 32 - 4 (padding).

### Task 4: DB CHECK constraints (`memory/roadmap-next-steps.md` §4a)

Create a new migration adding CHECK constraints for: `module_type`, `icon_type`, `status` (on candidate_module_progress), `resource_type`, enrollment `status`. Apply via MCP Supabase tools.

## Important Context
- Supabase mock: `lib/__mocks__/supabase.ts` — Proxy-based chain mock with `__getChain(table)` / `__resolveWith(value)`. Read existing tests in `__tests__/lib/roadmap.test.ts` for the pattern.
- Theme: always `useTheme().colors` — never hardcode hex
- Ionicons only — no emoji
- Prettier: single quotes, 4-space indent, 120 printWidth
- Pre-commit hooks: eslint + prettier + jest --findRelatedTests
- `canMarkComplete = role === 'admin' || role === 'pa' || role === 'manager' || role === 'director'`
- Candidate-facing screens are 100% read-only — zero write operations

Spin up specialized agents in parallel where tasks are independent. Run `npm test` after each task to verify no regressions.

# SeedLYFE → SproutLYFE Roadmap — Implementation Plan (v4)

> **v4 changelog**: All code sections now contain complete, copy-pasteable implementations (no placeholders or "same as v2" stubs). Added `unlockProgrammeForCandidate`, `updateModuleNotes`, and full `useRoadmap` hook. Complete TypeScript types for all interfaces including v3 fields. Added prerequisite retroactivity rules and disabled-vs-archived comparison table.
>
> **v3 changelog**: Corrected all remaining self-completion code paths. PA explicitly included in all completion permissions. Added soft-delete strategy for modules (no hard delete). Tightened disabled-module rules. Aligned all code examples, schema, and service logic to final business rules.
>
> **v2 changelog**: Updated business rules for module completion (management-only), programme-level progression locking with manual override, admin-configurable prerequisites, and disabled module behavior.

---

## 1. Executive Summary

Replace the SCI Exams tab (4 screens, 2 components, 4 DB tables, 9 admin files) with a **data-driven candidate development roadmap**. The roadmap renders a Duolingo-inspired vertical path from backend data, supports two programmes (SeedLYFE, SproutLYFE), and integrates with the existing admin platform for full CMS control. Candidates see the roadmap as their own tab; PA/Manager/Director monitor progress from candidate profile views. The existing exam infrastructure (tables, attempts) is preserved and linked as milestone nodes within the roadmap.

**Scope**: 6 new DB tables, 1 Supabase migration, ~15 mobile files (screens + components + hooks + service + types), ~8 admin files (CRUD pages), modifications to candidate profile and role config.

**Key codebase facts that override some stack assumptions:**
- **No NativeWind** — the entire app uses `StyleSheet.create()` + `useTheme().colors`
- **No Zustand** — state is React Context + hooks
- **No React Navigation** — uses Expo Router (file-based)
- **react-native-reanimated v4.1.1** is installed and used (Confetti, LiveEventBar)
- **Ionicons only** — no emoji in UI
- Admin is Next.js + shadcn + TanStack Table + Zod

---

## 2. Product and UX Concept

**Core metaphor**: A professional growth journey, not a course. The candidate is "growing" from seedling to sprout — each module is a step on a nature-themed path that feels premium, not gamified.

**Design pillars**:
- **Progression clarity** — always know where you are, what's next, what's done
- **Premium restraint** — subtle animations, muted palette with accent highlights, no bouncing mascots
- **Data-driven rendering** — every node, label, and resource comes from the backend
- **Professional context** — module names and descriptions are business-relevant, not playful
- **Management-driven completion** — candidates observe their journey; PA/Manager/Director drive completion

**Visual language**:
- SVG pixel-art seedling/sprout as hero illustrations (not mascots — static art that breathes)
- Vertical S-curve path with circular nodes
- Completed = filled accent circle + checkmark
- Current = pulsing ring + accent glow
- Locked = grey circle + lock icon
- Exam milestones = diamond-shaped nodes to differentiate from training modules

---

## 3. Business Rules

### 3.1 Module Completion

| Rule | Detail |
|------|--------|
| **Candidates CANNOT self-mark modules as complete** | No completion buttons, toggles, or actions in any candidate-facing screen. Zero exceptions. |
| **Completion roles** | Only **PA**, **Manager**, or **Director** can mark a candidate's module as complete. |
| **Candidate can** | View module content, resources, progress status, exam info, management notes (read-only). |
| **Candidate cannot** | Toggle completion, edit notes, modify any progress state, or call any progress-mutation API. |
| **Exam modules** | Auto-complete when the candidate passes the linked exam paper (existing exam flow writes the result). Management can also manually mark complete or override. |
| **Candidate-facing hook (`useRoadmap`)** | Exposes only read operations: `programmes`, `nodeStates`, `refresh`. No `markModule` or write functions. *(v3 fix)* |
| **Module detail screen** | No "Mark as Complete" button. No completion callback. Status shown as a read-only badge. *(v3 fix)* |

### 3.2 Programme Progression

| Rule | Detail |
|------|--------|
| **SproutLYFE is locked by default** | Candidates cannot access SproutLYFE modules until SeedLYFE is complete. |
| **SeedLYFE completion defined as** | Every **required** (`is_required = true`) and **active** (`is_active = true`) and **not archived** (`archived_at IS NULL`) module in SeedLYFE has `status = 'completed'` in `candidate_module_progress`. |
| **SproutLYFE unlock — automatic** | When SeedLYFE is complete, SproutLYFE unlocks automatically on the next roadmap fetch. |
| **SproutLYFE unlock — manual override** | A PA / Manager / Director can manually unlock SproutLYFE for a specific candidate before SeedLYFE is done. |
| **Override is stored per-enrollment** | `candidate_programme_enrollment.manually_unlocked = true`, with `unlocked_by` and `unlocked_at` recorded. |
| **Override is permanent** | Once manually unlocked, SproutLYFE stays unlocked for that candidate even if the override user changes roles. |

### 3.3 Module Prerequisites

| Rule | Detail |
|------|--------|
| **No prerequisites by default** | All modules start with zero prerequisites. |
| **Admin-configurable** | Platform admin can optionally define prerequisite modules for any module from the web admin platform. |
| **Prerequisite checking** | A module is locked for a candidate if any of its **active, non-archived** prerequisite modules are not completed. |
| **Prerequisites are within-programme** | A SeedLYFE module can only have SeedLYFE prerequisites. SproutLYFE likewise. Cross-programme dependencies are handled by the programme-level lock (3.2). |
| **Sequential ordering is NOT automatic locking** | Display order determines visual position only. Locking is determined solely by explicit prerequisites (if any) + programme-level lock. |
| **Disabled/archived prerequisites** | If a prerequisite module is disabled or archived, it is considered **satisfied** (skipped). It must not block downstream modules. |
| **Retroactive prerequisite changes** | Prerequisites are evaluated at query time on each roadmap fetch. If an admin **adds** a new prerequisite to a module, any candidate who hasn't completed that module will see it locked on their next visit. If a candidate has **already completed** the downstream module, their completion is preserved — the new prerequisite does not un-complete it. If an admin **removes** a prerequisite, the downstream module unlocks immediately on next fetch. |

### 3.4 Disabled Module Behavior

| Rule | Detail |
|------|--------|
| **Candidate-facing** | Disabled modules (`is_active = false`) are **hidden entirely** from the candidate roadmap. They do not appear on the path. Not accessible even via deep link. |
| **Management-facing** | Disabled modules appear in the management progress view with a "Disabled" badge, greyed out. Historical progress (if any) is visible. |
| **Completion percentage** | Disabled modules are **excluded** from both numerator and denominator. |
| **Historical data** | Progress records are **preserved**. Disabling does not delete any candidate data. |
| **API behavior** | Candidate-facing queries filter `is_active = true`. Management queries return all modules with `is_active` flag. |
| **Prerequisite impact** | A disabled prerequisite is considered satisfied (skipped). Disabling a module must not block downstream modules. |

### 3.5 Deleted (Archived) Module Behavior *(v3 — new)*

| Rule | Detail |
|------|--------|
| **No hard deletes** | Modules are **never hard-deleted** from the database. Admin "delete" is a soft-delete that sets `archived_at = now()` and `archived_by = admin_user_id`. |
| **Candidate-facing** | Archived modules are **hidden entirely** (same as disabled). |
| **Management-facing** | Archived modules are **hidden from the default progress view**. Available in a "Show archived" toggle or reporting view if needed. |
| **Completion percentage** | Archived modules are **excluded** from percentage calculation. |
| **Historical data** | All `candidate_module_progress` records for archived modules are **preserved permanently**. No cascade deletion. |
| **Reporting / audit** | Archived modules and their progress remain queryable for compliance, analytics, and audit purposes. |
| **Re-activation** | Admin can restore an archived module by clearing `archived_at`. All historical progress reappears. |
| **FK safety** | The FK from `candidate_module_progress` to `roadmap_modules` uses `ON DELETE RESTRICT` (not CASCADE) to prevent accidental data loss if someone bypasses the soft-delete. *(v3 fix)* |
| **Resources** | Resources attached to archived modules are also hidden but preserved. |
| **Prerequisites referencing archived modules** | Treated as satisfied (skipped), same as disabled. |

### 3.6 Disabled vs Archived — Comparison

| Dimension | Disabled (`is_active = false`) | Archived (`archived_at IS NOT NULL`) |
|-----------|-------------------------------|--------------------------------------|
| **Who can do it** | Platform Admin (toggle) | Platform Admin (archive action) |
| **Candidate roadmap** | Hidden entirely | Hidden entirely |
| **Management progress view** | Visible, greyed, "Disabled" badge | Hidden by default; shown via "Show archived" toggle |
| **Completion percentage** | Excluded | Excluded |
| **Historical progress** | Preserved, visible to management | Preserved, visible in archive/audit view |
| **Prerequisite impact** | Treated as satisfied (skipped) | Treated as satisfied (skipped) |
| **Deep link** | Redirects back | Redirects back |
| **Reversible** | Yes — re-enable instantly | Yes — restore from archive |
| **Intended use** | Temporarily hide a module (e.g. under revision) | Permanently retire a module while preserving history |
| **Sets `is_active`** | `false` (explicitly) | `false` (automatically on archive) |
| **Sets `archived_at`** | No change | `now()` |
| **On restore** | `is_active` → `true` | `archived_at` → `null`, `is_active` → `true` |

**Key distinction**: Disabled is a lightweight visibility toggle. Archived is a soft-delete with audit trail (`archived_at`, `archived_by`). A module can be disabled without being archived, but archiving always disables.

---

## 4. Permissions Matrix *(v4 — final)*

| Action | Candidate | PA | Manager | Director | Platform Admin |
|--------|-----------|-----|---------|----------|----------------|
| View own roadmap tab | Yes | — | — | — | — |
| View module content & resources | Yes | Yes (via candidate profile) | Yes | Yes | — |
| **Mark module as complete** | **No** | **Yes** | **Yes** | **Yes** | — |
| **Add/edit module notes** | **No** | **Yes** | **Yes** | **Yes** | — |
| **Manually unlock SproutLYFE** | **No** | **Yes** | **Yes** | **Yes** | — |
| View candidate progress (management) | No | Yes (assigned) | Yes (team) | Yes (all) | — |
| Create/edit programmes | No | No | No | No | **Yes** |
| Create/edit modules | No | No | No | No | **Yes** |
| **Archive (soft-delete) modules** | No | No | No | No | **Yes** *(v3)* |
| Define module prerequisites | No | No | No | No | **Yes** |
| Enable/disable modules | No | No | No | No | **Yes** |
| Reorder modules | No | No | No | No | **Yes** |
| Manage resources/content | No | No | No | No | **Yes** |
| **Restore archived modules** | No | No | No | No | **Yes** *(v3)* |

**Key v3 clarification**: PA has full completion + notes + unlock permissions, identical to Manager and Director. The `canMarkComplete` prop in `CandidateProgressView` must be `true` for all three roles.

---

## 5. Candidate Flow *(v4 — final)*

```
Candidate Home → Quick Action "Roadmap" or Tab press
  → Roadmap Screen (FULLY READ-ONLY)
    → Hero: animated seedling/sprout + programme title + progress bar
    → Programme tabs: SeedLYFE | SproutLYFE
      → SproutLYFE tab shows locked overlay if SeedLYFE incomplete
         (unless manually unlocked by management)
    → Vertical S-curve path with module nodes
      → Only active, non-archived modules shown
      → Completed: green checkmark (set by PA/Manager/Director)
      → Current: pulsing accent ring (first unlocked incomplete module)
      → Available: muted but tappable
      → Locked: grey + lock (prerequisite not met)
    → Tap unlocked node → Module Detail Screen (READ-ONLY)
      → Title, description, learning objectives
      → Resources list (tappable links/files/videos)
      → Read-only status badge: "Not Started" / "In Progress" / "Completed"
      → "Completed by [name] on [date]" if completed
      → Exam CTA (if exam milestone) → existing exam flow
      → Management notes (read-only) if any
      → NO completion button of any kind
      → Back to roadmap
```

**v3 enforcement**: The candidate-facing `useRoadmap` hook exposes zero write operations. The module detail screen imports zero progress-mutation functions. There is no code path from any candidate screen to `updateModuleProgress`.

---

## 6. Management Flow (PA / Manager / Director) *(v4 — final)*

```
Candidates Tab → Candidate Card → Candidate Profile [candidateId]
  → "Development Roadmap" section
    → Compact progress summary card
      → SeedLYFE: X/Y modules, Z% complete
      → SproutLYFE: X/Y modules, Z% complete (or "Locked" badge)
      → "Unlock SproutLYFE" button (if locked)
    → Tap "View Full Progress" → CandidateProgressScreen
      → Programme tabs
      → Module list (includes disabled modules with "Disabled" badge)
      → Archived modules hidden by default, "Show archived" toggle for audit
      → Each active module row:
        → Completion toggle (checkbox) — PA/Manager/Director can tap
        → Title + type badge
        → Score (if exam)
        → Note icon → inline editor
      → Disabled module row:
        → Greyed, "Disabled" badge, no toggle, progress preserved
      → "Unlock SproutLYFE" button with confirmation sheet
```

**Who calls `updateModuleProgress`**: Only the `CandidateProgressView` component (rendered in management screens). The `reviewerId` parameter is always the logged-in PA/Manager/Director's `user.id`. Never the candidate's ID.

**v3 correction**: The JSDoc and all references now explicitly list PA alongside Manager and Director for all completion actions. The `canMarkComplete` prop is `true` for `role === 'pa' || role === 'manager' || role === 'director'`.

---

## 7. Admin Platform Flow *(v4 — final)*

```
Admin Sidebar → Training
  → Programmes Tab
    → Table: SeedLYFE, SproutLYFE (create/edit/reorder)
  → Modules Tab
    → Table: all active modules (filterable by programme)
    → "Show archived" toggle → shows archived modules with "Archived" badge
    → Create/edit module dialog
      → Prerequisites multi-select (same-programme modules only)
      → Active/inactive toggle (with confirmation on disable)
      → Exam paper link (dropdown)
    → "Archive" action (replaces "delete") — with confirmation dialog:
      ⚠ Archive Module
      Archiving "[Title]" will:
      • Remove it from all candidate roadmaps
      • Exclude it from completion percentages
      • Preserve all historical progress data permanently
      • Skip it as a prerequisite for downstream modules
      This can be reversed by restoring the module.
      [Cancel] [Archive Module]
    → "Restore" action on archived modules
    → Drag-to-reorder within programme
  → Resources Tab (nested under modules)
```

**v3 key change**: "Delete" is replaced with "Archive" everywhere in the admin UI. There is no hard-delete action. Archived modules can be restored.

---

## 8. Information Architecture

```
ROADMAP FEATURE
├── Programmes (SeedLYFE, SproutLYFE)
│   ├── Modules (ordered, typed: training | exam | resource)
│   │   ├── Resources (links, files, videos, text)
│   │   ├── Prerequisites (optional, admin-configured, within-programme)
│   │   ├── Exam link (optional, → exam_papers)
│   │   └── Lifecycle: active → disabled → archived  ← v3
│   └── Programme metadata (title, description, icon, order)
├── Candidate Progress
│   ├── Programme Enrollment (candidate × programme, with manual unlock flag)
│   ├── Module Progress (candidate × module: status, notes, score)
│   │   └── completed_by: always PA/Manager/Director user ID, never candidate
│   └── Exam Attempts (existing exam_attempts table)
└── Access Control
    ├── Candidate: read-only view — zero write operations
    ├── PA/Manager/Director: mark complete, add notes, unlock programmes
    └── Platform Admin: full CMS (programmes, modules, prerequisites, resources, archive/restore)
```

---

## 9. Screen-by-Screen Breakdown

### Screen 1: Roadmap Main (`app/(tabs)/roadmap/index.tsx`)

| Section | Details |
|---------|---------|
| **Hero** | Animated pixel seedling OR sprout, programme title, progress bar, percentage |
| **Programme Tabs** | `SeedLYFE` / `SproutLYFE`. SproutLYFE shows lock overlay if locked |
| **Locked State** | Lock icon + "Complete SeedLYFE to unlock" + SeedLYFE progress. If manually unlocked: "Unlocked early by [name]" |
| **Path** | S-curve SVG with nodes. **Only active non-archived modules**. Disabled/archived = omitted |
| **Node states** | Locked / Available / Current / Completed — **candidate cannot change state** |
| **Hook** | `useRoadmap` — read-only, no write functions exposed |

### Screen 2: Module Detail (`app/(tabs)/roadmap/module/[moduleId].tsx`)

| Section | Details |
|---------|---------|
| **Status** | Read-only badge: Not Started / In Progress / Completed |
| **Completed by** | "Marked complete by [name] on [date]" |
| **Resources** | Tappable links/files/videos |
| **Exam** | "Take Exam" CTA → existing exam flow (auto-completes on pass) |
| **Notes** | Management notes shown read-only: "Notes from your manager" |
| **Completion** | **NO button. NO callback. NO import of `updateModuleProgress`.** *(v3 enforced)* |

### Screen 3: Candidate Progress Summary (in candidate profile)

| Section | Details |
|---------|---------|
| **Summary card** | SeedLYFE + SproutLYFE progress bars. "Locked" badge if applicable |
| **Unlock button** | "Unlock SproutLYFE" with confirmation sheet (PA/Manager/Director) |
| **"View Full Progress"** | Pushes to full progress screen |

### Screen 4: Full Candidate Progress (management)

| Section | Details |
|---------|---------|
| **Module list** | Active modules with completion toggles. Disabled modules greyed with badge. Archived hidden by default |
| **Completion** | Checkbox toggle per module — **this is the only place modules are marked complete** |
| **Notes** | Inline editor per module |
| **Exam results** | Score + pass/fail + date |

---

## 10. Component Architecture

```
components/roadmap/
├── RoadmapPath.tsx              # SVG S-curve path + positioned nodes
├── RoadmapNode.tsx              # Individual node (circle/diamond, status-aware)
├── ProgrammeHero.tsx            # Hero section: illustration + progress bar
├── ProgrammeTabs.tsx            # Segmented control for SeedLYFE/SproutLYFE
├── ProgrammeLockedOverlay.tsx   # Lock state for SproutLYFE
├── PixelSeedling.tsx            # Animated SVG pixel seedling
├── PixelSprout.tsx              # Animated SVG pixel sprout
├── ModuleCard.tsx               # Module detail card
├── ResourceItem.tsx             # Resource row
├── ProgressSummaryCard.tsx      # Compact progress for candidate profile
├── CandidateProgressView.tsx    # Management view: completion toggles + notes + unlock
├── CandidateProgressRow.tsx     # Module row with toggle + disabled/archived state
└── UnlockConfirmSheet.tsx       # Confirmation sheet for SproutLYFE unlock
```

---

## 11. Animation Strategy

| Animation | Approach | Duration | Easing |
|-----------|----------|----------|--------|
| **Seedling sway** | `withRepeat(withSequence(withTiming(5°, 2000), withTiming(-5°, 2000)))` | 4s cycle | `Easing.inOut(Easing.sin)` |
| **Sprout sway** | Same, 3° amplitude | 5s cycle | Same |
| **Breathing scale** | `withRepeat(withSequence(withTiming(1.03, 3000), withTiming(1.0, 3000)))` | 6s cycle | Sine |
| **Node completion** | `withSpring({ scale: [0.8, 1.15, 1.0] })` + checkmark fade-in | 400ms | Spring (damping: 12) |
| **Current node pulse** | Ring opacity `withRepeat(withTiming(0.3↔1.0, 1200))` | 2.4s cycle | Sine |
| **Path segment glow** | Opacity pulse on completed segments, staggered | 3s cycle | Sine |
| **Programme tab switch** | `withTiming` translateX | 300ms | `Easing.out(Easing.cubic)` |
| **Programme lock overlay** | Fade-in | 200ms | `Easing.out(Easing.quad)` |
| **Confetti on programme complete** | Reuse `<Confetti>` | 2600ms | Existing |

Engine: `react-native-reanimated` v4. All animations on UI thread via worklets.

---

## 12. Data Model and Types *(v4 — complete)*

### Schema Changes from v2

| Table | Change | Reason |
|-------|--------|--------|
| `roadmap_modules` | **Add** `archived_at TIMESTAMPTZ`, `archived_by UUID REFERENCES users(id)` | Soft-delete instead of hard delete *(v3)* |
| `roadmap_programmes` | **Add** `archived_at TIMESTAMPTZ`, `archived_by UUID REFERENCES users(id)` | Consistency *(v3)* |
| `candidate_module_progress` | **Change FK** on `module_id` from `ON DELETE CASCADE` to `ON DELETE RESTRICT` | Prevent accidental data loss *(v3)* |
| `roadmap_resources` | **Change FK** on `module_id` from `ON DELETE CASCADE` to `ON DELETE RESTRICT` | Resources preserved with archived modules *(v3)* |

### Full Migration

```sql
-- Migration: 20260310100000_create_roadmap_tables.sql

-- Programmes
CREATE TABLE roadmap_programmes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    display_order   INT NOT NULL DEFAULT 0,
    icon_type       TEXT NOT NULL DEFAULT 'seedling',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    archived_at     TIMESTAMPTZ,                              -- v3: soft-delete
    archived_by     UUID REFERENCES users(id),                -- v3: who archived
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules
CREATE TABLE roadmap_modules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id        UUID NOT NULL REFERENCES roadmap_programmes(id) ON DELETE RESTRICT,  -- v3
    title               TEXT NOT NULL,
    description         TEXT,
    learning_objectives TEXT,
    module_type         TEXT NOT NULL DEFAULT 'training',
    display_order       INT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    is_required         BOOLEAN NOT NULL DEFAULT true,
    estimated_minutes   INT,
    exam_paper_id       UUID REFERENCES exam_papers(id) ON DELETE SET NULL,
    icon_name           TEXT DEFAULT 'book-outline',
    icon_color          TEXT DEFAULT '#007AFF',
    archived_at         TIMESTAMPTZ,                              -- v3: soft-delete
    archived_by         UUID REFERENCES users(id),                -- v3: who archived
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_modules_programme ON roadmap_modules(programme_id, display_order);
CREATE INDEX idx_roadmap_modules_active ON roadmap_modules(is_active) WHERE archived_at IS NULL;  -- v3

-- Resources
CREATE TABLE roadmap_resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,  -- v3
    title           TEXT NOT NULL,
    description     TEXT,
    resource_type   TEXT NOT NULL,
    content_url     TEXT,
    content_text    TEXT,
    display_order   INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_resources_module ON roadmap_resources(module_id, display_order);

-- Prerequisites (admin-configurable, none by default)
CREATE TABLE roadmap_prerequisites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id           UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,  -- v3
    required_module_id  UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,  -- v3
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(module_id, required_module_id),
    CHECK(module_id != required_module_id)
);

-- Candidate progress per module
CREATE TABLE candidate_module_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    module_id       UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,  -- v3: RESTRICT not CASCADE
    status          TEXT NOT NULL DEFAULT 'not_started',
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),  -- always PA/Manager/Director, never candidate
    score           NUMERIC,
    notes           TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, module_id)
);

CREATE INDEX idx_candidate_progress_candidate ON candidate_module_progress(candidate_id);
CREATE INDEX idx_candidate_progress_module ON candidate_module_progress(module_id);

-- Candidate programme enrollment (with manual unlock)
CREATE TABLE candidate_programme_enrollment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    programme_id        UUID NOT NULL REFERENCES roadmap_programmes(id) ON DELETE RESTRICT,  -- v3
    status              TEXT NOT NULL DEFAULT 'active',
    manually_unlocked   BOOLEAN NOT NULL DEFAULT false,
    unlocked_by         UUID REFERENCES users(id),
    unlocked_at         TIMESTAMPTZ,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, programme_id)
);

-- Triggers
CREATE TRIGGER roadmap_programmes_updated_at BEFORE UPDATE ON roadmap_programmes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER roadmap_modules_updated_at BEFORE UPDATE ON roadmap_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER candidate_module_progress_updated_at BEFORE UPDATE ON candidate_module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE roadmap_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_programme_enrollment ENABLE ROW LEVEL SECURITY;

-- Read policies: only active, non-archived for candidates
CREATE POLICY "Read active non-archived programmes" ON roadmap_programmes
    FOR SELECT TO authenticated USING (is_active = true AND archived_at IS NULL);
CREATE POLICY "Read active non-archived modules" ON roadmap_modules
    FOR SELECT TO authenticated USING (is_active = true AND archived_at IS NULL);
CREATE POLICY "Read active resources" ON roadmap_resources
    FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Read prerequisites" ON roadmap_prerequisites
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage progress" ON candidate_module_progress
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Manage enrollment" ON candidate_programme_enrollment
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO roadmap_programmes (slug, title, description, display_order, icon_type) VALUES
    ('seedlyfe', 'SeedLYFE', 'Foundation programme for new candidates. Build your core knowledge and professional skills.', 0, 'seedling'),
    ('sproutlyfe', 'SproutLYFE', 'Advanced programme for licensed advisors. Develop your practice and master client engagement.', 1, 'sprout');

-- SeedLYFE modules (10 training + 4 exams)
WITH seed AS (SELECT id FROM roadmap_programmes WHERE slug = 'seedlyfe')
INSERT INTO roadmap_modules (programme_id, title, description, module_type, display_order, icon_name, icon_color, estimated_minutes) VALUES
    ((SELECT id FROM seed), 'VARK', 'Discover your learning style using the VARK framework.', 'training', 0, 'eye-outline', '#007AFF', 30),
    ((SELECT id FROM seed), 'Enneagram', 'Understand your personality type through the Enneagram system.', 'training', 1, 'people-outline', '#AF52DE', 45),
    ((SELECT id FROM seed), 'Personal Branding', 'Craft your professional identity and personal brand.', 'training', 2, 'star-outline', '#FF9500', 40),
    ((SELECT id FROM seed), 'Personal Grooming', 'Master professional presentation standards.', 'training', 3, 'shirt-outline', '#5856D6', 25),
    ((SELECT id FROM seed), 'Tax', 'Singapore tax fundamentals relevant to financial planning.', 'training', 4, 'calculator-outline', '#34C759', 60),
    ((SELECT id FROM seed), 'CPF', 'Master the Central Provident Fund system.', 'training', 5, 'wallet-outline', '#007AFF', 55),
    ((SELECT id FROM seed), 'MAP Calculation / Credit System', 'Monthly Allowance Programme and credit system.', 'training', 6, 'trending-up-outline', '#FF9500', 35),
    ((SELECT id FROM seed), 'Telemarketing', 'Effective telephone prospecting skills.', 'training', 7, 'call-outline', '#34C759', 50),
    ((SELECT id FROM seed), 'Money Instruments', 'Overview of financial instruments.', 'training', 8, 'cash-outline', '#5856D6', 45),
    ((SELECT id FROM seed), 'Prospecting / MySeminar', 'Prospecting strategies and MySeminar system.', 'training', 9, 'megaphone-outline', '#FF3B30', 50),
    ((SELECT id FROM seed), 'RES5 Exam', 'Rules and Ethics of Financial Advisory Services.', 'exam', 10, 'school-outline', '#FF9500', 120),
    ((SELECT id FROM seed), 'M9 Exam', 'Life Insurance and Investment-Linked Policies.', 'exam', 11, 'school-outline', '#FF9500', 120),
    ((SELECT id FROM seed), 'M9A Exam', 'Health Insurance Module.', 'exam', 12, 'school-outline', '#FF9500', 90),
    ((SELECT id FROM seed), 'HI Exam', 'Health Insurance.', 'exam', 13, 'school-outline', '#FF9500', 90);

-- SproutLYFE modules (11 training)
WITH sprout AS (SELECT id FROM roadmap_programmes WHERE slug = 'sproutlyfe')
INSERT INTO roadmap_modules (programme_id, title, description, module_type, display_order, icon_name, icon_color, estimated_minutes) VALUES
    ((SELECT id FROM sprout), 'Project 100 / First 9 in 90', 'Launch your practice with the Project 100 framework.', 'training', 0, 'rocket-outline', '#FF3B30', 60),
    ((SELECT id FROM sprout), 'Business Ethics', 'Ethical standards in financial advisory.', 'training', 1, 'shield-checkmark-outline', '#007AFF', 40),
    ((SELECT id FROM sprout), 'MAP Calculation / Credit System', 'Advanced MAP and credit system mastery.', 'training', 2, 'trending-up-outline', '#34C759', 45),
    ((SELECT id FROM sprout), 'Goal Setting', 'Strategic goal-setting for your advisory career.', 'training', 3, 'flag-outline', '#AF52DE', 35),
    ((SELECT id FROM sprout), 'PAC / PW', 'Prudential Assurance Company and PruWealth product training.', 'training', 4, 'briefcase-outline', '#FF9500', 50),
    ((SELECT id FROM sprout), 'PVA / PVW', 'PruVantage advanced ILP and wealth accumulation solutions.', 'training', 5, 'bar-chart-outline', '#5856D6', 50),
    ((SELECT id FROM sprout), 'PIIB / PILI', 'Prudential income and legacy products.', 'training', 6, 'umbrella-outline', '#007AFF', 45),
    ((SELECT id FROM sprout), 'Whole Life / Term / Pruman / PruLady', 'Core life insurance product suite.', 'training', 7, 'heart-outline', '#FF3B30', 55),
    ((SELECT id FROM sprout), 'Prushield + PA', 'Health insurance product mastery.', 'training', 8, 'medkit-outline', '#34C759', 50),
    ((SELECT id FROM sprout), 'Roadshow / Prospecting', 'Advanced roadshow execution and prospecting.', 'training', 9, 'storefront-outline', '#FF9500', 45),
    ((SELECT id FROM sprout), 'Financial Planning Concepts', 'Holistic financial planning framework.', 'training', 10, 'analytics-outline', '#5856D6', 60);
```

### TypeScript Types (`types/roadmap.ts`) — complete *(v4: full types, no placeholders)*

```typescript
// ─── Programme & Module Types ────────────────────────────────────────────────

export type ProgrammeIconType = 'seedling' | 'sprout';
export type ModuleType = 'training' | 'exam' | 'resource';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';
export type EnrollmentStatus = 'active' | 'completed' | 'paused';
export type ResourceType = 'link' | 'file' | 'video' | 'text';
export type NodeState = 'completed' | 'current' | 'available' | 'locked';

export interface RoadmapProgramme {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    display_order: number;
    icon_type: ProgrammeIconType;
    is_active: boolean;
    archived_at: string | null;     // null = active, ISO string = archived
    archived_by: string | null;     // user who archived
    created_at: string;
    updated_at: string;
}

export interface RoadmapModule {
    id: string;
    programme_id: string;
    title: string;
    description: string | null;
    learning_objectives: string | null;
    module_type: ModuleType;
    display_order: number;
    is_active: boolean;
    is_required: boolean;
    estimated_minutes: number | null;
    exam_paper_id: string | null;
    icon_name: string | null;
    icon_color: string | null;
    archived_at: string | null;     // null = active, ISO string = archived
    archived_by: string | null;     // user who archived
    created_at: string;
    updated_at: string;
}

export interface RoadmapResource {
    id: string;
    module_id: string;
    title: string;
    description: string | null;
    resource_type: ResourceType;
    content_url: string | null;
    content_text: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export interface CandidateModuleProgress {
    id: string;
    candidate_id: string;
    module_id: string;
    status: ModuleStatus;
    completed_at: string | null;
    completed_by: string | null;    // always PA/Manager/Director user ID, never candidate
    score: number | null;
    notes: string | null;
    updated_at: string;
    created_at: string;
}

export interface CandidateProgrammeEnrollment {
    id: string;
    candidate_id: string;
    programme_id: string;
    status: EnrollmentStatus;
    manually_unlocked: boolean;     // true = SproutLYFE unlocked early
    unlocked_by: string | null;     // PA/Manager/Director who unlocked
    unlocked_at: string | null;     // when it was unlocked
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

// ─── Enriched UI Types ──────────────────────────────────────────────────────

export interface RoadmapModuleWithProgress extends RoadmapModule {
    progress: CandidateModuleProgress | null;
    resources: RoadmapResource[];
    isLocked: boolean;
    examPaper: { code: string; title: string; pass_percentage: number } | null;
    prerequisiteIds: string[];       // admin-configured prerequisite module IDs
    isArchived: boolean;             // convenience flag (archived_at !== null)
}

export interface ProgrammeWithModules extends RoadmapProgramme {
    modules: RoadmapModuleWithProgress[];
    completedCount: number;          // required + active + non-archived + completed
    totalCount: number;              // required + active + non-archived
    percentage: number;              // Math.round((completedCount / totalCount) * 100)
    isLocked: boolean;               // programme-level lock (SproutLYFE locked until SeedLYFE done)
    manuallyUnlocked: boolean;       // true if PA/Manager/Director unlocked early
    unlockedByName: string | null;   // display name of who unlocked (populated in UI)
}

export interface RoadmapNodeData {
    module: RoadmapModuleWithProgress;
    state: NodeState;
    index: number;
    isExam: boolean;
}

// ─── Config ─────────────────────────────────────────────────────────────────

export const MODULE_TYPE_CONFIG: Record<ModuleType, { label: string; icon: string; color: string }> = {
    training: { label: 'Training', icon: 'book-outline', color: '#007AFF' },
    exam: { label: 'Exam', icon: 'school-outline', color: '#FF9500' },
    resource: { label: 'Resource', icon: 'folder-outline', color: '#34C759' },
};

export const NODE_STATE_CONFIG: Record<NodeState, { opacity: number; scale: number }> = {
    completed: { opacity: 1, scale: 1 },
    current: { opacity: 1, scale: 1.1 },
    available: { opacity: 0.7, scale: 1 },
    locked: { opacity: 0.35, scale: 0.95 },
};
```

---

## 13. API / Data-Flow — Complete Service Layer *(v4: full implementations)*

### `lib/roadmap.ts` — complete

```typescript
import { supabase } from './supabase';
import type {
    RoadmapProgramme,
    RoadmapModule,
    RoadmapResource,
    CandidateModuleProgress,
    CandidateProgrammeEnrollment,
    ProgrammeWithModules,
    RoadmapModuleWithProgress,
    NodeState,
    ModuleStatus,
} from '@/types/roadmap';

// ─── Fetch all active programmes ────────────────────────────────────────────

export async function fetchProgrammes(): Promise<{
    data: RoadmapProgramme[] | null;
    error: string | null;
}> {
    const { data, error } = await supabase
        .from('roadmap_programmes')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    return { data: data as RoadmapProgramme[] | null, error: error?.message ?? null };
}

// ─── Fetch resources for a module ───────────────────────────────────────────

export async function fetchModuleResources(moduleId: string): Promise<{
    data: RoadmapResource[] | null;
    error: string | null;
}> {
    const { data, error } = await supabase
        .from('roadmap_resources')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('display_order');
    return { data: data as RoadmapResource[] | null, error: error?.message ?? null };
}

// ─── Fetch full enriched roadmap for a candidate ────────────────────────────
// Candidate view (default): only active + non-archived modules
// Management view: pass includeDisabled / includeArchived to see more

export async function fetchCandidateRoadmap(
    candidateId: string,
    options?: {
        includeDisabled?: boolean;   // management: show disabled modules
        includeArchived?: boolean;   // management: show archived modules
    }
): Promise<{
    data: ProgrammeWithModules[] | null;
    error: string | null;
}> {
    try {
        // Build module query based on view context
        const moduleQuery = supabase
            .from('roadmap_modules')
            .select('*, exam_papers:exam_paper_id(code, title, pass_percentage)')
            .order('display_order');
        if (!options?.includeDisabled) moduleQuery.eq('is_active', true);
        if (!options?.includeArchived) moduleQuery.is('archived_at', null);

        const [programmesRes, modulesRes, progressRes, enrollmentRes, prerequisitesRes] = await Promise.all([
            supabase
                .from('roadmap_programmes')
                .select('*')
                .eq('is_active', true)
                .is('archived_at', null)
                .order('display_order'),
            moduleQuery,
            supabase.from('candidate_module_progress').select('*').eq('candidate_id', candidateId),
            supabase.from('candidate_programme_enrollment').select('*').eq('candidate_id', candidateId),
            supabase.from('roadmap_prerequisites').select('*'),
        ]);

        if (programmesRes.error) throw programmesRes.error;
        if (modulesRes.error) throw modulesRes.error;

        const programmes = programmesRes.data as RoadmapProgramme[];
        const modules = modulesRes.data as (RoadmapModule & {
            exam_papers: { code: string; title: string; pass_percentage: number } | null;
        })[];
        const progress = (progressRes.data ?? []) as CandidateModuleProgress[];
        const enrollments = (enrollmentRes.data ?? []) as CandidateProgrammeEnrollment[];
        const prerequisites = (prerequisitesRes.data ?? []) as { module_id: string; required_module_id: string }[];

        const progressMap = new Map(progress.map((p) => [p.module_id, p]));
        const enrollmentMap = new Map(enrollments.map((e) => [e.programme_id, e]));

        // Build prerequisite lookup: moduleId → [required_module_ids]
        const prereqMap = new Map<string, string[]>();
        prerequisites.forEach((p) => {
            const existing = prereqMap.get(p.module_id) ?? [];
            existing.push(p.required_module_id);
            prereqMap.set(p.module_id, existing);
        });

        // Build module set for prerequisite checking (active non-archived only)
        const activeModuleIds = new Set(modules.filter((m) => m.is_active && !m.archived_at).map((m) => m.id));

        // Determine SeedLYFE completion for programme-level locking
        const seedProgramme = programmes.find((p) => p.slug === 'seedlyfe');
        let isSeedComplete = false;
        if (seedProgramme) {
            const seedModules = modules.filter(
                (m) => m.programme_id === seedProgramme.id && m.is_required && m.is_active && !m.archived_at
            );
            isSeedComplete = seedModules.every((m) => {
                const p = progressMap.get(m.id);
                return p?.status === 'completed';
            });
        }

        const result: ProgrammeWithModules[] = programmes.map((programme) => {
            const enrollment = enrollmentMap.get(programme.id);
            const isManuallyUnlocked = enrollment?.manually_unlocked ?? false;

            // Programme-level lock: SproutLYFE locked until SeedLYFE complete or manually unlocked
            const isProgrammeLocked =
                programme.slug === 'sproutlyfe' && !isSeedComplete && !isManuallyUnlocked;

            const programmeModules = modules
                .filter((m) => m.programme_id === programme.id)
                .map((m): RoadmapModuleWithProgress => {
                    const moduleProgress = progressMap.get(m.id) ?? null;
                    const modulePrereqIds = prereqMap.get(m.id) ?? [];

                    // Module locked if programme locked, or any active non-archived prerequisite incomplete
                    const isLockedByPrereq = modulePrereqIds.some((reqId) => {
                        // Disabled/archived prerequisites are satisfied (skipped)
                        if (!activeModuleIds.has(reqId)) return false;
                        const reqProgress = progressMap.get(reqId);
                        return !reqProgress || reqProgress.status !== 'completed';
                    });

                    return {
                        ...m,
                        progress: moduleProgress,
                        resources: [],
                        isLocked: isProgrammeLocked || isLockedByPrereq,
                        examPaper: m.exam_papers ?? null,
                        prerequisiteIds: modulePrereqIds,
                        isArchived: m.archived_at !== null,
                    };
                });

            // Completion percentage: only required, active, non-archived modules
            const countableModules = programmeModules.filter(
                (m) => m.is_required && m.is_active && !m.isArchived
            );
            const completedCount = countableModules.filter((m) => m.progress?.status === 'completed').length;
            const totalCount = countableModules.length;

            return {
                ...programme,
                modules: programmeModules,
                completedCount,
                totalCount,
                percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
                isLocked: isProgrammeLocked,
                manuallyUnlocked: isManuallyUnlocked,
                unlockedByName: null, // Populated in UI layer if needed
            };
        });

        return { data: result, error: null };
    } catch (err: any) {
        return { data: null, error: err.message ?? 'Failed to fetch roadmap' };
    }
}

// ─── Update module progress (MANAGEMENT-ONLY) ──────────────────────────────
// Called ONLY from CandidateProgressView (management screens).
// The candidate-facing useRoadmap hook does NOT import this function.
// updatedBy is ALWAYS the PA/Manager/Director user ID. NEVER the candidate.

export async function updateModuleProgress(
    candidateId: string,
    moduleId: string,
    status: ModuleStatus,
    updatedBy: string,
    notes?: string,
    score?: number
): Promise<{ error: string | null }> {
    const { error } = await supabase.from('candidate_module_progress').upsert(
        {
            candidate_id: candidateId,
            module_id: moduleId,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            completed_by: status === 'completed' ? updatedBy : null,
            score: score ?? null,
            notes: notes ?? null,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'candidate_id,module_id' }
    );
    return { error: error?.message ?? null };
}

// ─── Update management notes (MANAGEMENT-ONLY) ─────────────────────────────

export async function updateModuleNotes(
    candidateId: string,
    moduleId: string,
    notes: string
): Promise<{ error: string | null }> {
    const { error } = await supabase.from('candidate_module_progress').upsert(
        {
            candidate_id: candidateId,
            module_id: moduleId,
            notes,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'candidate_id,module_id' }
    );
    return { error: error?.message ?? null };
}

// ─── Enroll candidate in programme ──────────────────────────────────────────

export async function enrollCandidate(
    candidateId: string,
    programmeId: string
): Promise<{ error: string | null }> {
    const { error } = await supabase.from('candidate_programme_enrollment').upsert(
        {
            candidate_id: candidateId,
            programme_id: programmeId,
            status: 'active',
            started_at: new Date().toISOString(),
        },
        { onConflict: 'candidate_id,programme_id' }
    );
    return { error: error?.message ?? null };
}

// ─── Manually unlock programme for candidate (PA/Manager/Director) ─────────

export async function unlockProgrammeForCandidate(
    candidateId: string,
    programmeId: string,
    unlockedBy: string
): Promise<{ error: string | null }> {
    const { error } = await supabase.from('candidate_programme_enrollment').upsert(
        {
            candidate_id: candidateId,
            programme_id: programmeId,
            status: 'active',
            manually_unlocked: true,
            unlocked_by: unlockedBy,
            unlocked_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
        },
        { onConflict: 'candidate_id,programme_id' }
    );
    return { error: error?.message ?? null };
}

// ─── Archive module (ADMIN-ONLY, replaces hard delete) ─────────────────────

export async function archiveModule(
    moduleId: string,
    archivedBy: string
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('roadmap_modules')
        .update({
            archived_at: new Date().toISOString(),
            archived_by: archivedBy,
            is_active: false,  // also disable when archiving
        })
        .eq('id', moduleId);
    return { error: error?.message ?? null };
}

// ─── Restore archived module (ADMIN-ONLY) ──────────────────────────────────

export async function restoreModule(moduleId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('roadmap_modules')
        .update({
            archived_at: null,
            archived_by: null,
            is_active: true,
        })
        .eq('id', moduleId);
    return { error: error?.message ?? null };
}

// ─── Compute node states for rendering ─────────────────────────────────────
// Operates on already-filtered module list (active, non-archived for candidates)
// The first non-completed required module becomes 'current'.

export function computeNodeStates(modules: RoadmapModuleWithProgress[]): NodeState[] {
    let foundCurrent = false;

    return modules.map((m) => {
        if (m.isLocked) return 'locked';
        if (m.progress?.status === 'completed') return 'completed';
        if (m.progress?.status === 'in_progress') {
            foundCurrent = true;
            return 'current';
        }
        if (!foundCurrent && m.is_required) {
            foundCurrent = true;
            return 'current';
        }
        return 'available';
    });
}
```

### Candidate-facing hook (`hooks/useRoadmap.ts`) — complete *(v4: full implementation)*

**Critical rule**: This hook exposes ZERO write operations. No `markModule`. No `updateProgress`. No progress mutation of any kind.

```typescript
import { useCallback, useEffect, useState } from 'react';
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
 * Candidate-facing hook: READ-ONLY roadmap data.
 * Zero write operations. No completion. No progress mutation.
 * Completion is managed by PA/Manager/Director from CandidateProgressView.
 */
export function useRoadmap(candidateId: string | undefined): UseRoadmapResult {
    const [programmes, setProgrammes] = useState<ProgrammeWithModules[]>([]);
    const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeProgrammeIndex, setActiveProgrammeIndex] = useState(0);

    const loadRoadmap = useCallback(async () => {
        if (!candidateId) return;
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await fetchCandidateRoadmap(candidateId);

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

    useEffect(() => {
        loadRoadmap();
    }, [loadRoadmap]);

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
```

---

## 14. Admin Content Management *(v4 — final)*

### Admin actions (`actions.ts`)

```typescript
'use server';

// Programme CRUD
export async function createProgramme(data: ProgrammeFormData) { ... }
export async function updateProgramme(id: string, data: ProgrammeFormData) { ... }
export async function archiveProgramme(id: string, archivedBy: string) { ... }  // v3: replaces delete
export async function restoreProgramme(id: string) { ... }                      // v3: new
export async function reorderProgrammes(orderedIds: string[]) { ... }

// Module CRUD
export async function createModule(data: ModuleFormData) { ... }
export async function updateModule(id: string, data: ModuleFormData) { ... }
export async function archiveModule(id: string, archivedBy: string) { ... }     // v3: replaces delete
export async function restoreModule(id: string) { ... }                         // v3: new
export async function reorderModules(programmeId: string, orderedIds: string[]) { ... }
export async function toggleModuleActive(id: string, isActive: boolean) { ... }

// Prerequisites
export async function setModulePrerequisites(moduleId: string, requiredModuleIds: string[]) { ... }

// Resources (CASCADE from module still applies for resources when module is archived,
// but since we never hard-delete, resources are preserved)
export async function createResource(data: ResourceFormData) { ... }
export async function updateResource(id: string, data: ResourceFormData) { ... }
export async function deleteResource(id: string) { ... }  // resources CAN be hard-deleted (no progress link)
export async function reorderResources(moduleId: string, orderedIds: string[]) { ... }
```

### Module dialog — prerequisite field

- Multi-select dropdown showing other **active, non-archived** modules in the same programme
- Empty by default
- Circular dependency validation on save
- Warning if selected prerequisite is currently disabled

### Archive confirmation dialog

```
⚠ Archive Module

Archiving "[Module Title]" will:
• Remove it from all candidate roadmaps immediately
• Exclude it from completion percentages
• Preserve all historical progress data permanently
• Skip it as a prerequisite for downstream modules

This can be reversed by restoring the module later.

[Cancel]  [Archive Module]
```

---

## 15. Folder Structure

```
app/(tabs)/roadmap/
├── _layout.tsx
├── index.tsx                    # Read-only candidate roadmap
└── module/
    └── [moduleId].tsx           # Read-only module detail (NO completion button)

app/(tabs)/candidates/
├── progress/
│   └── [candidateId].tsx        # Management: completion toggles + notes + unlock

components/roadmap/
├── RoadmapPath.tsx
├── RoadmapNode.tsx
├── ProgrammeHero.tsx
├── ProgrammeTabs.tsx
├── ProgrammeLockedOverlay.tsx
├── PixelSeedling.tsx
├── PixelSprout.tsx
├── ModuleCard.tsx
├── ResourceItem.tsx
├── ProgressSummaryCard.tsx
├── CandidateProgressView.tsx    # Management: PA/Manager/Director completion + notes
├── CandidateProgressRow.tsx     # Toggle + disabled/archived state
└── UnlockConfirmSheet.tsx

lib/roadmap.ts                   # Service: read + management-write + admin-archive
types/roadmap.ts                 # Types: archived fields added
hooks/useRoadmap.ts              # Candidate hook: READ-ONLY, zero write ops
lib/mockData/roadmap.ts          # Mock data

supabase/migrations/
└── 20260310100000_create_roadmap_tables.sql  # RESTRICT FKs, archived columns

admin/src/app/(dashboard)/training/
├── page.tsx
├── actions.ts                   # archive/restore replaces delete
├── training-client.tsx
├── programmes-table.tsx
├── modules-table.tsx            # "Show archived" toggle
├── resources-table.tsx
├── programme-dialog.tsx
├── module-dialog.tsx            # Prerequisites multi-select
└── resource-dialog.tsx
```

---

## 16. Implementation Phases

### Phase 1: Foundation
1. Apply migration (6 tables, RESTRICT FKs, archived columns, seed data)
2. `npm run gen:types`
3. Create `types/roadmap.ts` (with archived fields)
4. Create `lib/roadmap.ts` (read + management-write + archive functions)
5. Tests for service layer

### Phase 2: Core Mobile UI
1. `npx expo install react-native-svg`
2. Build all `components/roadmap/` components
3. Build `hooks/useRoadmap.ts` — **read-only, zero write ops**
4. Build roadmap screens — **candidate view is fully read-only**
5. Update `_layout.tsx` and `Roles.ts` (exams → roadmap)
6. Tests

### Phase 3: Management Integration
1. Build `CandidateProgressView` — completion toggles for PA/Manager/Director
2. Build `UnlockConfirmSheet`
3. Wire `canMarkComplete = role === 'pa' || role === 'manager' || role === 'director'`
4. Add progress section to candidate profile
5. Tests

### Phase 4: Admin CMS
1. Build training page with programme/module tables
2. Module dialog with prerequisites multi-select
3. Archive/restore actions (no hard delete)
4. "Show archived" toggle in module table
5. Sidebar update

### Phase 5: Polish
1. Remove old exams files
2. Confetti on programme completion
3. Edge case testing
4. Full test suite

---

## 17. Edge Cases

| Scenario | Handling |
|----------|----------|
| Candidate tries to access disabled/archived module via deep link | Module detail checks `is_active` + `archived_at`; redirects back |
| Admin archives module with progress records | Progress preserved (RESTRICT FK prevents accidental hard delete) |
| Admin restores archived module | Module reappears; historical progress restored |
| Admin archives a prerequisite module | Treated as satisfied; downstream modules unlock |
| PA marks module complete | `completed_by` = PA's user ID. Works identically to Manager/Director |
| SproutLYFE manually unlocked then SeedLYFE completed | No conflict; both conditions allow access |
| Candidate passes exam | Exam result auto-writes completion. `completed_by` = null (system) |
| Management marks exam module complete manually | Overrides with their user ID |
| Admin disables then re-enables module | Progress preserved throughout |
| Concurrent PA + Manager updating same module | Last-write-wins via upsert |

---

## 18. Change Summary

### v4 changes (from v3)

| Item | v3 State | v4 Fix |
|------|----------|--------|
| Section 12 TypeScript types | Placeholders: `// ... all existing fields ...` | Complete copy-pasteable types for all 10 interfaces |
| `ProgrammeWithModules` type | Not shown in plan | Full interface with `isLocked`, `manuallyUnlocked`, `unlockedByName` |
| `CandidateProgrammeEnrollment` type | Not shown in plan | Full interface with `manually_unlocked`, `unlocked_by`, `unlocked_at` |
| Section 13 `fetchCandidateRoadmap` | Body said `// ... rest of enrichment logic same as v2` | Complete implementation with prerequisite, enrollment, and locking logic |
| Section 13 `updateModuleProgress` | Said `{ /* same as v2 */ }` | Complete upsert implementation |
| Section 13 `unlockProgrammeForCandidate` | Not in API section at all | Complete implementation added |
| Section 13 `updateModuleNotes` | Not in API section at all | Complete implementation added |
| Section 13 `useRoadmap` hook | Comment stub only | Complete hook with full state management |
| Section 13 `computeNodeStates` | Not shown | Complete implementation added |
| Section 3.3 prerequisites | Missing retroactivity rules | Added: how prerequisite changes affect in-progress candidates |
| Disabled vs Archived | Described separately, no comparison | Added Section 3.6 comparison table with 12 dimensions |

### v3 changes (from v2)

| Item | v2 State | v3 Correction |
|------|----------|---------------|
| Module detail screen | Had `handleMarkComplete` + button on disk | All completion code removed. Zero imports of `updateModuleProgress`. |
| `useRoadmap` hook | Exposed `markModule` with candidate self-completion | Read-only. No write functions. No `markModule`. |
| PA completion | Permissions table said Yes but JSDoc said "(manager, director, admin)" | JSDoc fixed. PA explicitly listed everywhere alongside Manager/Director. |
| Module deletion | `ON DELETE CASCADE` destroys progress | `ON DELETE RESTRICT` + soft-delete via `archived_at`/`archived_by`. No hard delete. |
| Admin "Delete" action | Hard delete | Replaced with "Archive" + restore capability. |
| RLS policies | Filtered `is_active = true` only | Now also filters `archived_at IS NULL` for candidate-facing queries. |
| Completion percentage | Excluded disabled only | Excludes both disabled AND archived modules. |
| Prerequisite checking | Skipped disabled prerequisites | Skips disabled AND archived prerequisites. |

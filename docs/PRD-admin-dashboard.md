# PRD: Lyfe Admin Dashboard (Web)

**Version:** 1.0
**Date:** 2026-03-06
**Author:** Claude (with Shawn)
**Status:** Draft

---

## 1. Overview

### 1.1 What
A standalone web-based admin dashboard for the Lyfe platform. It replaces the placeholder "Admin" tab in the mobile app with a full-featured web application that gives administrators complete control over users, leads, exams, recruitment, events, training materials, and system-wide analytics.

### 1.2 Why
- The mobile app is designed for field agents, managers, and candidates -- not for back-office administration
- Admin tasks (bulk user management, exam question authoring, analytics) require large-screen interfaces with tables, forms, and charts
- Separating the admin surface from the mobile app keeps the mobile experience focused and lightweight

### 1.3 Who
- **Primary:** `admin` role users (system administrators)
- **Secondary (future):** Could extend read-only dashboards to `director` role users via scoped permissions

---

## 2. Tech Stack

### 2.1 Framework & UI

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | **Next.js 15 (App Router)** | RSC support, file-based routing (mirrors Expo Router conventions), API routes for server-side operations, excellent Supabase integration |
| **Language** | **TypeScript 5.x** | Shared types with the mobile app (`types/` directory) |
| **UI Library** | **shadcn/ui + Tailwind CSS 4** | Production-grade components (tables, forms, dialogs, sheets), fully customizable, no vendor lock-in, accessible by default |
| **Charts** | **Recharts** | Most popular React charting lib, composable, works well with shadcn theming |
| **Forms** | **React Hook Form + Zod** | Type-safe validation, performant, pairs naturally with shadcn form components |
| **State** | **TanStack Query (React Query) v5** | Server-state caching, background refetching, optimistic updates for Supabase data |
| **Tables** | **TanStack Table v8** | Headless table with sorting, filtering, pagination -- rendered via shadcn DataTable |

### 2.2 Backend & Data

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Database** | **Supabase (existing)** | Shared Postgres database with the mobile app -- single source of truth |
| **Auth** | **Supabase Auth (email/password)** | Separate auth method from mobile (phone OTP). Admin accounts provisioned with email + password. Enforced to `admin` role only via RLS + middleware |
| **Realtime** | **Supabase Realtime** | Live updates for activity log, lead changes, new signups |
| **Storage** | **Supabase Storage (existing)** | Avatars, training materials (PDFs, videos) |
| **Edge Functions** | **Supabase Edge Functions (existing + new)** | Reuse MKTR sync; add new functions for bulk operations, report generation |

### 2.3 Deployment

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Hosting** | **Vercel** | Native Next.js host, edge middleware for auth checks, preview deployments |
| **Monorepo** | **Subfolder: `admin/`** in existing repo | Shared `types/` and `constants/` via TypeScript path aliases; single repo, single CI |

### 2.4 Project Structure

```
lyfe-app/
  admin/                        # <-- New Next.js app
    src/
      app/
        (auth)/
          login/page.tsx
        (dashboard)/
          layout.tsx            # Sidebar + topbar shell
          page.tsx              # Overview / home
          users/
            page.tsx            # User list
            [userId]/page.tsx   # User detail/edit
          leads/
            page.tsx            # All leads
            [leadId]/page.tsx   # Lead detail
          exams/
            page.tsx            # Exam papers list
            [paperId]/page.tsx  # Paper detail + questions editor
          training/
            page.tsx            # Training materials library
          candidates/
            page.tsx            # Recruitment pipeline
            [candidateId]/page.tsx
          events/
            page.tsx            # Events calendar + list
            [eventId]/page.tsx
          roles/
            page.tsx            # PA assignments, role management
          analytics/
            page.tsx            # Charts + reports
          activity-log/
            page.tsx            # Master audit log
        api/                    # Next.js API routes (server-side)
          ...
      lib/
        supabase/
          client.ts             # Browser Supabase client
          server.ts             # Server-side Supabase client (SSR)
          middleware.ts          # Auth + role guard
        validators/             # Zod schemas
        utils.ts
      components/
        ui/                     # shadcn components
        data-table/             # Reusable DataTable wrapper
        charts/                 # Chart components
        layout/                 # Sidebar, Topbar, Breadcrumbs
      types/                    # Symlinked or re-exported from root types/
    tailwind.config.ts
    next.config.ts
    package.json
  app/                          # Existing Expo mobile app
  types/                        # Shared TypeScript types
  constants/                    # Shared constants (Roles.ts, etc.)
  supabase/                     # Shared Supabase config & migrations
```

---

## 3. Authentication & Authorization

### 3.1 Admin Auth Flow
1. Admin navigates to the dashboard URL
2. Presented with email/password login form
3. Supabase Auth `signInWithPassword({ email, password })`
4. On success, fetch `users` profile and verify `role === 'admin'`
5. If not admin, sign out immediately and show "Access Denied"
6. Session persisted via Supabase cookie-based auth (SSR-compatible)

### 3.2 Provisioning Admin Accounts
- Admin accounts are created via Supabase Auth (email + password)
- A corresponding `public.users` row must exist with `role = 'admin'`
- Initially: seed the first admin via SQL migration or Supabase dashboard
- Later: existing admins can invite new admins from the dashboard

### 3.3 Middleware Guard
- Next.js middleware on all `/(dashboard)/**` routes
- Checks for valid Supabase session + `admin` role
- Redirects to `/login` if unauthenticated
- Redirects to `/unauthorized` if authenticated but non-admin

### 3.4 Mobile App Change
- Remove the `admin` tab from the mobile app's tab bar entirely
- The mobile app's `ROLE_TABS.admin` becomes `['home', 'profile']`
- Admin users on mobile get a minimal experience + a link to the web dashboard

---

## 4. Features

### 4.1 Dashboard Home (`/`)

**Overview cards:**
- Total users (by role breakdown)
- Active leads (pipeline summary)
- Candidates in pipeline (by stage)
- Upcoming events (next 7 days)
- Exam pass rate (overall)

**Quick charts:**
- Lead pipeline funnel (bar chart)
- New leads per week (line chart, trailing 12 weeks)
- Candidate pipeline stages (horizontal bar)
- Team performance leaderboard (top 5 agents by conversion)

**Recent activity feed:**
- Last 20 activities across all entities (real-time via Supabase Realtime)

---

### 4.2 User Management (`/users`)

**List view:**
- DataTable with columns: Name, Phone, Email, Role, Reports To, Status (active/inactive), Lifecycle Stage, Last Login, Created
- Filters: role, is_active, lifecycle_stage
- Search: by name, phone, email
- Bulk actions: activate/deactivate, change role

**Detail/Edit view (`/users/[userId]`):**
- Edit profile fields: full_name, email, phone, role, reports_to, lifecycle_stage, date_of_birth, is_active
- `reports_to` dropdown filtered to valid superiors (directors, managers)
- Role change with confirmation dialog (warns about permission implications)
- View user's leads, exam attempts, events, activity history
- Reset password action (sends Supabase password reset email)

**Create user:**
- Form: full_name, email, phone, role, reports_to
- Creates Supabase Auth account (email/password with temp password) + `public.users` row
- Sends welcome email with credentials

---

### 4.3 Lead Oversight (`/leads`)

**List view:**
- DataTable: Lead Name, Phone, Email, Status, Source, Product Interest, Assigned To (agent name), Created By, Last Updated
- Filters: status, source, product_interest, assigned_to (agent picker)
- Search: by lead name, phone, email
- Export: CSV download

**Detail view (`/leads/[leadId]`):**
- Full lead info with inline editing
- Activity timeline (all lead_activities)
- **Reassign lead:** dropdown to select any agent
- Add notes / log activities as admin

**Bulk operations:**
- Reassign multiple leads to a different agent
- Bulk status change (e.g., mark stale leads as "lost")

---

### 4.4 Exam Management (`/exams`)

**Papers list:**
- DataTable: Code, Title, Duration, Pass %, Question Count, Active, Mandatory, Display Order
- Toggle is_active / is_mandatory inline
- Reorder via drag-and-drop or display_order input

**Paper detail (`/exams/[paperId]`):**
- Edit paper metadata (title, description, duration, pass_percentage, question_count)
- **Question editor:**
  - List all questions for the paper, ordered by question_number
  - Add / edit / delete questions
  - Question form: question_text (with Markdown/LaTeX preview), options A-D, correct_answer, explanation
  - LaTeX toggle (has_latex, explanation_has_latex)
  - Reorder questions (drag-and-drop or number input)
  - Bulk import questions via CSV/JSON upload

**Exam results (read-only):**
- View all attempts across all users
- Filter by paper, user, pass/fail, date range
- DataTable: User, Paper, Score, Percentage, Passed, Duration, Status, Date
- Click through to see individual attempt answers

---

### 4.5 Training Materials (`/training`)

> **New feature** -- requires a new Supabase table.

**Schema: `training_materials`**
```sql
CREATE TABLE training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  material_type TEXT NOT NULL DEFAULT 'document'
    CHECK (material_type IN ('document', 'video', 'link', 'slide')),
  file_url TEXT,                -- Supabase Storage URL
  external_url TEXT,            -- External link (YouTube, etc.)
  file_size_bytes BIGINT,
  target_roles user_role[] NOT NULL DEFAULT '{candidate}',
  is_published BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**List view:**
- DataTable: Title, Category, Type, Target Roles, Published, File Size, Created
- Filters: category, material_type, target_roles, is_published
- Upload new materials (PDF, video, slides) to Supabase Storage

**Detail/Edit:**
- Edit metadata, replace file, toggle published
- Preview (PDF viewer, video player, link redirect)
- Assign target roles (which roles can see this material in the mobile app)

**Mobile app integration:**
- New `training` lib service to fetch published materials for the user's role
- Accessible from the candidate's Exams tab or a new Study section

---

### 4.6 Candidate & Recruitment Pipeline (`/candidates`)

**Pipeline board view:**
- Kanban-style columns: Applied > Interview Scheduled > Interviewed > Approved > Exam Prep > Licensed > Active Agent
- Cards show candidate name, assigned manager, days in stage
- Drag-and-drop to change status

**List view (toggle):**
- DataTable: Name, Phone, Email, Status, Assigned Manager, Invite Token, Created, Updated
- Filters: status, assigned_manager

**Detail view (`/candidates/[candidateId]`):**
- Edit candidate fields
- Interview history with add/edit/cancel interviews
- Status change with audit log
- View invite token status (consumed or pending)
- Trigger MKTR sync manually for `active_agent` candidates

---

### 4.7 Events Management (`/events`)

**Calendar view:**
- Monthly calendar with event dots/blocks
- Click date to see events for that day

**List view (toggle):**
- DataTable: Title, Type, Date, Time, Location, Attendees Count, Created By
- Filters: event_type, date range

**Create/Edit event:**
- Form: title, description, event_type, event_date, start_time, end_time, location
- Attendee picker: multi-select from all users with role tags
- Assign attendee_role (attendee, duty_manager, presenter)
- Edit/delete existing events

---

### 4.8 Role & Assignment Management (`/roles`)

**PA Assignments:**
- View existing PA-to-manager assignments
- Create new assignments: select PA user, select manager(s)
- Remove assignments
- View PA workload (how many managers each PA supports)

**Reporting Hierarchy:**
- Visual org tree: Director > Manager > Agent
- Edit `reports_to` relationships
- Bulk reassign agents when a manager leaves

**Invite Token Management:**
- List all tokens: token (masked), intended_role, assigned_manager, created_by, consumed_by, expires_at, status
- Generate new invite tokens for candidate or agent onboarding
- Revoke (delete) unused tokens
- Filters: consumed/pending/expired, role, manager

---

### 4.9 Analytics & Reporting (`/analytics`)

**Lead Analytics:**
- Pipeline funnel conversion (new > contacted > qualified > proposed > won)
- Conversion rate over time (weekly/monthly)
- Lead source effectiveness (which sources convert best)
- Average time-in-stage
- Agent performance comparison (table + bar chart)

**Recruitment Analytics:**
- Candidate pipeline velocity (avg days per stage)
- Interview-to-hire conversion rate
- Active vs. completed candidates
- Recruitment by manager

**Exam Analytics:**
- Pass rate per paper
- Average score per paper
- Attempt frequency (how many tries to pass)
- Score distribution histogram
- Candidate exam progress tracking

**Team Analytics:**
- Active users by role (pie chart)
- Login frequency / last login heatmap
- Agent-to-manager ratio
- Team growth over time

**Export:**
- All analytics tables exportable as CSV
- Date range filters on all charts

---

### 4.10 Master Activity Log (`/activity-log`)

> **New feature** -- requires a new Supabase table for system-wide audit logging.

**Schema: `audit_log`**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Composite index for common queries
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
```

**Tracked actions (non-exhaustive):**
| Entity | Actions |
|--------|---------|
| `user` | created, updated, role_changed, activated, deactivated, login, password_reset |
| `lead` | created, status_changed, reassigned, note_added, deleted |
| `candidate` | created, status_changed, interview_scheduled, interview_completed, activated_as_agent |
| `exam_paper` | created, updated, question_added, question_updated, question_deleted |
| `exam_attempt` | submitted, auto_submitted |
| `event` | created, updated, deleted, attendee_added, attendee_removed |
| `training_material` | created, updated, published, unpublished, deleted |
| `invite_token` | created, consumed, revoked |
| `pa_assignment` | created, removed |

**UI:**
- Infinite-scroll list, newest first
- Each entry: timestamp, actor name/avatar, action description, entity link
- Filters: entity_type, action, actor, date range
- Search: by entity label or actor name
- Real-time: new entries appear at top via Supabase Realtime subscription

**Implementation approach:**
- **Phase 1:** Log actions from the admin dashboard (server-side, in API routes)
- **Phase 2:** Add Postgres triggers or Supabase database webhooks to capture mobile app actions too (lead status changes, exam submissions, etc.)
- **Phase 3:** Backfill existing `lead_activities` data into audit_log for unified view

---

## 5. Database Changes Summary

### New Tables
| Table | Purpose |
|-------|---------|
| `training_materials` | Training content library (documents, videos, links) |
| `audit_log` | System-wide activity/audit trail |

### Schema Modifications
| Change | Detail |
|--------|--------|
| Admin email auth | Enable email provider in Supabase Auth (alongside existing phone provider) |
| New RLS policies | Admin-scoped policies for all tables (admin can read/write everything) |
| Indexes | Add indexes on `audit_log` for efficient querying |

### New Supabase Storage Buckets
| Bucket | Purpose |
|--------|---------|
| `training-materials` | PDFs, videos, slides for training content |

---

## 6. Shared Code Strategy

The admin dashboard and mobile app share the same Supabase database. To maximize code reuse:

| Shared | How |
|--------|-----|
| **TypeScript types** (`types/`) | Import via TS path alias: `@lyfe/types` |
| **Constants** (`constants/Roles.ts`) | Import via TS path alias: `@lyfe/constants` |
| **Supabase client config** | Separate clients (browser vs. SSR), but same env vars (`SUPABASE_URL`, keys) |
| **Zod validators** | New shared validators in a common location, used by both apps over time |

> Business logic (`lib/`) is NOT shared directly -- the admin dashboard has its own data-fetching layer optimized for server-side rendering and admin-scoped queries (no user-level RLS filtering).

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Scaffold Next.js 15 app in `admin/` directory
- [ ] Set up Tailwind CSS 4 + shadcn/ui
- [ ] Supabase client (browser + server) with cookie-based auth
- [ ] Email/password login page + middleware auth guard
- [ ] Dashboard shell (sidebar, topbar, breadcrumbs)
- [ ] Dashboard home with overview cards (static queries)
- [ ] Seed first admin account via migration

### Phase 2: Core CRUD (Week 2-4)
- [ ] User management (list, detail, create, edit, activate/deactivate)
- [ ] Lead oversight (list, detail, reassign, bulk actions)
- [ ] Candidate pipeline (list, kanban, detail, status changes)
- [ ] Event management (list, calendar, create, edit, delete)

### Phase 3: Exams & Training (Week 4-5)
- [ ] Exam paper management (list, edit metadata)
- [ ] Question editor (CRUD, LaTeX preview, reorder, bulk import)
- [ ] Exam results viewer (all attempts, per-user, per-paper)
- [ ] `training_materials` table migration
- [ ] Training materials CRUD + file upload

### Phase 4: Roles, Tokens & Assignments (Week 5-6)
- [ ] PA-to-manager assignment management
- [ ] Org hierarchy viewer + `reports_to` editor
- [ ] Invite token management (generate, list, revoke)
- [ ] Role change workflows with confirmation

### Phase 5: Analytics & Activity Log (Week 6-8)
- [ ] `audit_log` table migration
- [ ] Audit logging from admin API routes
- [ ] Master activity log page with filters + realtime
- [ ] Lead analytics (funnel, conversion, source effectiveness)
- [ ] Recruitment analytics (pipeline velocity, hire rate)
- [ ] Exam analytics (pass rates, score distribution)
- [ ] Team analytics (headcount, login activity, growth)
- [ ] CSV export on all analytics tables

### Phase 6: Polish & Mobile Integration (Week 8-9)
- [ ] Remove admin tab from mobile app, add "Open Dashboard" link in profile
- [ ] Mobile training materials screen (fetch published materials)
- [ ] Postgres triggers for audit_log (capture mobile app actions)
- [ ] Realtime subscriptions on dashboard home + activity log
- [ ] Responsive design pass (tablet-friendly)
- [ ] Error handling, loading states, empty states
- [ ] Dark mode (optional, using shadcn theme)

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Admin-only access | Middleware checks `role === 'admin'` on every request; RLS policies scoped to admin |
| Email/password auth | Enforce strong passwords; consider adding MFA (TOTP) in Phase 2 |
| Shared database | Admin uses `service_role` key on server-side only (never exposed to browser); browser client uses `anon` key + RLS |
| Audit trail | All admin mutations logged to `audit_log` with actor, action, entity, timestamp |
| CORS | Dashboard hosted on separate domain; Supabase CORS configured to allow it |
| Environment secrets | Supabase service_role key in server-only env vars (NEXT_PUBLIC_ prefix never used for secrets) |

---

## 9. Environment Variables

```env
# Public (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # For admin-level DB operations
```

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Admin can manage all users without SQL | 100% of user operations via UI |
| Exam questions authored via dashboard | Replace any manual SQL or CSV seeding |
| Lead reassignment time | < 30 seconds (vs. current manual process) |
| Activity log coverage | All admin actions logged from day 1; mobile actions by Phase 6 |
| Page load time | < 2s for any dashboard page |

---

## 11. Open Questions

1. **Domain:** What URL should the dashboard live at? (e.g., `admin.lyfe.sg`, `lyfe.sg/admin`)
2. **First admin account:** Create via SQL seed or Supabase dashboard UI?
3. **Training materials:** Any existing content to migrate, or starting fresh?
4. **Notifications:** Should the dashboard have email/push notifications for critical events (e.g., new candidate signup, exam failure)?
5. **Multi-admin:** How many admin users are expected? Need admin permission tiers (super-admin vs. read-only admin)?

---

## 12. Dependencies & Packages

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.98.0",
    "@supabase/ssr": "^0.5.0",
    "tailwindcss": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.23.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.0.0",
    "sonner": "^1.5.0",
    "next-themes": "^0.3.0"
  }
}
```

> shadcn/ui components are installed via CLI (`npx shadcn@latest add`) and live in `src/components/ui/` -- no package dependency.

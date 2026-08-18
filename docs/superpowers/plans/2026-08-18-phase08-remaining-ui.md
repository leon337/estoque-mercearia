# PHASE-08 Remaining UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete P8.3c, P8.4, P8.5 and P8.6 so every existing authenticated application page uses the Design System v1 without changing domain behavior.

**Architecture:** Keep every existing Supabase query, auth boundary, Server Action, RPC contract and route behavior as the source of truth. Replace only route composition/presentation with `AppShell`, semantic UI primitives and focused presentation components where client interactivity already exists. Preserve mobile-first behavior, semantic status text, real labels and >=48px primary controls.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, TypeScript 5, Tailwind 4, Supabase SSR, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-17-phase08-design-system-v1-design.md`

## Global Constraints

- Identity is `Estoque Mercearia`, language `pt-BR`.
- Reuse `AppShell`, `PageHeader`, `DataCard`, `StatusBadge` and `Button` before creating new primitives.
- Presentation components do not access Supabase or reimplement server/domain rules.
- No migration, schema, RLS, RPC, dependency, route or business-rule changes.
- Keep all existing authentication/authorization redirects and role checks.
- Keep existing movement idempotency, stock validation, confirmation and ADMIN-only INITIAL behavior.
- Keep history read-only with the same filters and 200-row cap.
- Keep admin profile update and stock-adjustment actions unchanged.
- Main touch targets are at least 48px.
- Status is never communicated only by color.

---

### Task 1: P8.3c Inventory

**Files:**
- Modify: `src/app/inventory/page.tsx`
- Create/Modify: `tests/p8-remaining-ui.test.mjs`

**Interfaces:**
- Consumes: existing `products(... inventory(quantity))` query and authenticated `profile`.
- Produces: inventory cards using `AppShell`, `PageHeader`, `DataCard`, `StatusBadge` and existing movement links.

- [ ] **Step 1: Write failing inventory contracts** requiring the shell/primitives, semantic `OK/BAIXO/ZERADO` tones, `font-data`, `role="status"`, existing movement links and unchanged Supabase query patterns.
- [ ] **Step 2: Run CI test suite and confirm the new contracts fail before production code changes.**
- [ ] **Step 3: Refactor only `inventory/page.tsx` presentation.** Keep `stockStatus`, `inventoryQuantity`, auth/profile checks and product query behavior intact; wrap with `AppShell role={profile.role}`; render empty state and inventory cards with semantic tokens; retain ADMIN-only Products link.
- [ ] **Step 4: Run tests and verify inventory contracts pass.**
- [ ] **Step 5: Commit inventory visual redesign.**

### Task 2: P8.4 New Movement

**Files:**
- Modify: `src/app/movements/new/page.tsx`
- Modify: `src/app/movements/new/movement-form.tsx`
- Test: `tests/p8-remaining-ui.test.mjs`

**Interfaces:**
- Consumes: `registerMovementAction`, `MovementType`, existing product options and generated operation id.
- Produces: transactional movement screen with unchanged form names/validation/idempotency and Design System presentation.

- [ ] **Step 1: Add failing contracts** for `AppShell`, `PageHeader`, `DataCard`, `Button`, `min-h-12`, `role="alert"`, `aria-live`, `crypto.randomUUID`, `window.confirm`, `operation_id`, product/type/quantity field names and ADMIN-only INITIAL logic.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Refactor the page** into AppShell/PageHeader and empty-state DataCard while keeping current auth/query/mapping logic.
- [ ] **Step 4: Refactor `MovementForm` presentation** using semantic token classes, `DataCard`, `Button`, real labels and `font-data` for balances; do not change state calculations, confirmation text semantics or Server Action.
- [ ] **Step 5: Run tests and commit movement redesign.**

### Task 3: P8.4 History

**Files:**
- Modify: `src/app/history/page.tsx`
- Test: `tests/p8-remaining-ui.test.mjs`

**Interfaces:**
- Consumes: same validated search params and same `stock_movements` read query.
- Produces: read-only filter panel and movement cards inside AppShell.

- [ ] **Step 1: Add failing history contracts** for shell/primitives, same filter names, same movement query limits/operators, no mutation actions, `font-data` numeric fields and semantic movement badges.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Refactor presentation only** into PageHeader, DataCard filter panel, responsive record cards and StatusBadge mapping for movement types. Preserve query construction, UUID/date validation and actor/product resolution.
- [ ] **Step 4: Run tests and commit history redesign.**

### Task 4: P8.5 Admin Users

**Files:**
- Modify: `src/app/admin/users/page.tsx`
- Test: `tests/p8-remaining-ui.test.mjs`

**Interfaces:**
- Consumes: unchanged `updateProfileAction` and ADMIN-only current-profile guard.
- Produces: AppShell admin user-management cards with semantic status and Design System controls.

- [ ] **Step 1: Add failing admin-users contracts** for shell/primitives, `role="alert"`, `role="status"`, names `user_id`, `role`, `active`, unchanged action binding and ADMIN guard.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Refactor presentation only** with AppShell, PageHeader, DataCard, StatusBadge and Button; keep all profile query fields and action behavior unchanged.
- [ ] **Step 4: Run tests and commit admin-users redesign.**

### Task 5: P8.5 Admin Adjustment

**Files:**
- Modify: `src/app/admin/adjustment/page.tsx`
- Modify: `src/app/admin/adjustment/adjustment-form.tsx`
- Test: `tests/p8-remaining-ui.test.mjs`

**Interfaces:**
- Consumes: unchanged `registerAdjustmentAction`, ADMIN guard, product inventory options and operation id.
- Produces: transactional admin adjustment UI with unchanged derived difference and confirmation behavior.

- [ ] **Step 1: Add failing adjustment contracts** for AppShell/PageHeader/DataCard/Button, exact form names, `crypto.randomUUID`, `window.confirm`, reason requirement, derived difference display and unchanged action binding.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Refactor page and form presentation only** using semantic tokens and Design System primitives; preserve all calculations and validations.
- [ ] **Step 4: Run tests and commit adjustment redesign.**

### Task 6: P8.6 Qualification

**Files:**
- Modify: `tests/p8-remaining-ui.test.mjs`
- Create: `artifacts/phases/PHASE-08-P8-6-QUALIFICATION/README.md`
- Create: `artifacts/phases/PHASE-08-P8-6-QUALIFICATION/PHASE-08-P8-6-VALIDATION.txt`

**Interfaces:**
- Consumes: all existing Phase 08 routes and Design System primitives.
- Produces: full regression/accessibility/static qualification evidence.

- [ ] **Step 1: Add cross-route qualification contracts** ensuring every authenticated page uses AppShell, public auth pages do not, presentation components remain free of direct Supabase access, no raw black CTA styling remains on migrated routes, and touch/semantic status contracts exist.
- [ ] **Step 2: Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` through CI; require zero failures.**
- [ ] **Step 3: Verify changed-file boundary against `main`: no migrations, RLS, RPC, dependency or action files changed.**
- [ ] **Step 4: Request Codex review on exact final HEAD and resolve every Critical/Important issue before merge.**
- [ ] **Step 5: Create MCF risk-B qualification records and manifest.**
- [ ] **Step 6: Merge only after final CI/review are green, then verify `main` tree and production public route guards.**

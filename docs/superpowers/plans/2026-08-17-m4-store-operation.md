# M4 Store Operation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute inline under the already-authorized continuous M4→M7 mission, with TDD and MCF gates between milestones.

**Goal:** Deliver the daily operational inventory UI for current stock, ENTRY, EXIT and ADMIN INITIAL while preserving the M3 RPC as the only write authority.

**Architecture:** Next.js App Router server pages read RLS-protected data. A focused client `MovementForm` provides preview/confirmation and a server action invokes the existing inventory wrapper. No new stock mutation SQL is introduced.

**Tech Stack:** Next.js App Router, TypeScript, React, Supabase SSR/PostgREST/RPC, Tailwind, Node test runner.

## Global Constraints
- No direct write to `inventory` or `stock_movements`.
- Browser never supplies actor, previous balance or resulting authoritative balance.
- ENTRY/EXIT require quantity > 0; INITIAL requires ADMIN and quantity >= 0.
- `operation_id` must remain stable for one form intent.
- No ADJUSTMENT UI in M4.
- Mobile-first and text status for accessibility.

---

### Task 1: Contract RED
**Files:** Create `tests/m4-store-operation.test.mjs`.
- [ ] Assert inventory page, movement server action, client form and home navigation contracts.
- [ ] Commit tests before implementation.
- [ ] Run CI and require failure due to absent M4 files.

### Task 2: Operational read model
**Files:** Create `src/app/inventory/page.tsx`.
- [ ] Authenticate active profile using existing SSR pattern.
- [ ] Query active products with current `inventory.quantity`.
- [ ] Derive semantic zero/low/ok status without database writes.
- [ ] Render accessible responsive cards/table and links to movements.
- [ ] Run tests/typecheck/build.

### Task 3: Movement write UI
**Files:** Create `src/app/movements/actions.ts`, `src/app/movements/new/page.tsx`, `src/app/movements/new/movement-form.tsx`.
- [ ] Server Action validates authenticated active profile and accepted type.
- [ ] Server Action enforces ADMIN for INITIAL before invoking RPC.
- [ ] Call `registerStockMovement` with product/type/quantity/operationId only.
- [ ] Translate known RPC failures to stable route error codes.
- [ ] Client form generates UUID once per intent, previews projected balance, blocks obvious negative exit and confirms submission.
- [ ] Page supplies active products/current quantities and hides INITIAL from OPERATOR.
- [ ] Run tests/typecheck/build.

### Task 4: Navigation integration
**Files:** Modify `src/app/page.tsx`.
- [ ] Replace M2 placeholder with links to inventory/new movement/products.
- [ ] Preserve login/profile/logout behavior.
- [ ] Run full CI.

### Task 5: Hosted validation and gate
- [ ] Verify no new migration is required.
- [ ] Validate current hosted RLS/read model and M3 RPC using disposable transaction/fixtures; remove all fixtures.
- [ ] Run Security Advisor and inspect PR diff.
- [ ] Assemble Class B PRF, audit, LÉO gate, final CI and squash merge if approved.
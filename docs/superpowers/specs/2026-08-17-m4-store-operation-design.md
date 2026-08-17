# M4 Store Operation Design

## Goal
Transform the approved M3 inventory core into the daily store workflow without moving business authority out of PostgreSQL.

## Approved context
This design materializes decisions already approved in PHASE-04 UX, PHASE-05 implementation planning, and M3. The continuous M4→M7 authorization is the execution approval for this existing design; no new product scope is introduced here.

## Routes and responsibilities
- `/inventory`: authenticated active users see active products, current quantity, unit, minimum stock and semantic status (`ZERADO`, `BAIXO`, `OK`). ADMIN may also see inactive products only through product administration; operational inventory remains active-only.
- `/movements/new`: authenticated active users register `ENTRY` and `EXIT`; ADMIN additionally registers `INITIAL` for products that still have no movement history.
- `/`: becomes the operational launcher with links to inventory, new movement and products.

## Data flow
1. Server page resolves the authenticated profile.
2. Server queries `products` plus `inventory` under existing RLS.
3. A client movement form receives only product identity/current quantity/minimum/unit.
4. The form creates one UUID `operation_id` per intent, previews the resulting balance locally and asks for confirmation.
5. Server Action validates shape/role and calls the existing `registerStockMovement()` wrapper.
6. PostgreSQL RPC remains authoritative for actor, current balance, authorization, locking, idempotency and negative-stock rejection.
7. Success revalidates `/`, `/inventory` and `/movements/new`; errors are translated into stable UI codes without exposing database internals.

## Error handling
- unauthenticated → `/login`;
- inactive profile → sign out + login error;
- invalid quantity/product/type → `validation`;
- insufficient stock → `insufficient_stock`;
- inactive/missing product → `product_unavailable`;
- INITIAL permission/already initialized → `permission` / `initial_already_registered`;
- idempotency conflict → `operation_conflict`;
- unexpected database/RPC failure → `database`.

## UX/accessibility
- mobile-first cards and large touch targets;
- labels on every form control;
- status always has text, never color alone;
- current and projected balances are announced in text;
- destructive/stock-changing submit requires explicit confirmation;
- ENTRY/EXIT are visually primary; INITIAL appears only for ADMIN.

## Testing
- structural RED→GREEN contract for routes/actions/form and home navigation;
- CI: npm ci, lint, node tests, typecheck, build;
- hosted Supabase smoke with disposable fixtures validating action-equivalent RPC behavior already guaranteed by M3 plus inventory reads under RLS;
- security review verifies no direct DML path was introduced.

## Out of scope
History filters/dashboard (M5), adjustment UI/user administration/hardening (M6), final end-to-end qualification (M7).
# M5 History + Dashboard Design

## Dashboard
The authenticated home remains the operational launcher and adds read-only metrics computed from active products plus embedded inventory: active products, zero stock, low stock (`quantity > 0 && quantity <= minimum_stock`). It lists urgent products with textual status and preserves the exact M1 profile-scope expression.

## History
`/history` is a server page. It loads active-user profile, product and profile filter options, then queries `stock_movements` ordered newest-first. Filters are applied server-side by product, movement type, actor and local-business date range (America/Recife offset `-03:00`). Product/profile labels are resolved with separate read queries to avoid brittle embedded-relation typing.

Each row shows timestamp, product/code, type, previous quantity, delta, resulting quantity, actor and reason. No edit/delete affordance exists.

## Security
M5 is read-only. Existing RLS on products, inventory and stock_movements remains authoritative. No migration, RPC or DML is introduced.

## Testing
RED→GREEN structural contract, full CI, hosted transaction smoke proving operator-readable history/dashboard source rows, Security Advisor and Class B audit/gate.
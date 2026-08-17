import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
const root=new URL("../",import.meta.url);
const read=(path)=>readFile(new URL(path,root),"utf8");
const exists=async(path)=>{await access(new URL(path,root));return true;};

const routes=[
 "src/app/login/page.tsx",
 "src/app/register/page.tsx",
 "src/app/products/page.tsx",
 "src/app/inventory/page.tsx",
 "src/app/movements/new/page.tsx",
 "src/app/history/page.tsx",
 "src/app/admin/users/page.tsx",
 "src/app/admin/adjustment/page.tsx",
];
const migrations=[
 "supabase/migrations/0001_auth_profiles.sql",
 "supabase/migrations/0002_products.sql",
 "supabase/migrations/0003_inventory_core.sql",
 "supabase/migrations/0004_inventory_core_maintenance.sql",
 "supabase/migrations/0005_inventory_core_privileges.sql",
 "supabase/migrations/0006_user_admin_hardening.sql",
 "supabase/migrations/0007_rpc_security_hardening.sql",
];

test("M7 verifies every MVP route and migration is present",async()=>{
 for(const path of [...routes,...migrations]) assert.equal(await exists(path),true,path);
});

test("M7 keeps runtime environment free of privileged Supabase secrets",async()=>{
 const env=await read(".env.example");
 assert.match(env,/NEXT_PUBLIC_SUPABASE_URL/);
 assert.match(env,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
 assert.doesNotMatch(env,/SERVICE_ROLE|SECRET_KEY|DATABASE_PASSWORD|SUPABASE_ACCESS_TOKEN/i);
});

test("M7 runbook covers bootstrap daily operation backup and recovery",async()=>{
 const runbook=await read("docs/operations/MVP-RUNBOOK.md");
 assert.match(runbook,/FIRST-ADMIN-BOOTSTRAP|primeiro ADMIN/i);
 assert.match(runbook,/INITIAL/);
 assert.match(runbook,/ENTRY|entrada/i);
 assert.match(runbook,/EXIT|saída/i);
 assert.match(runbook,/ADJUSTMENT|ajuste/i);
 assert.match(runbook,/supabase db dump/);
 assert.match(runbook,/roles\.sql/);
 assert.match(runbook,/schema\.sql/);
 assert.match(runbook,/data\.sql/);
 assert.match(runbook,/restaur/i);
 assert.match(runbook,/off-site|fora do ambiente|local seguro/i);
});

test("M7 acceptance document enumerates the canonical stock scenario and security gates",async()=>{
 const doc=await read("docs/operations/MVP-ACCEPTANCE.md");
 assert.match(doc,/20\s*\+\s*10\s*[-−]\s*4\s*=\s*26/);
 assert.match(doc,/25/);
 assert.match(doc,/inativo/i);
 assert.match(doc,/último ADMIN|LAST_ACTIVE_ADMIN/i);
 assert.match(doc,/idempot/i);
 assert.match(doc,/estoque negativo|STOCK_INSUFFICIENT/i);
 assert.match(doc,/Security Advisor/i);
 assert.match(doc,/CI/i);
});

test("M7 repository README identifies the MVP and reproducible CI path",async()=>{
 const readme=await read("README.md");
 const ci=await read(".github/workflows/ci.yml");
 assert.match(readme,/MVP/i);
 assert.match(readme,/M0.*M6|M0.*M7/is);
 assert.match(readme,/MVP-RUNBOOK/);
 assert.match(readme,/FIRST-ADMIN-BOOTSTRAP/);
 assert.match(ci,/npm ci/);
 assert.match(ci,/npm run lint/);
 assert.match(ci,/npm test/);
 assert.match(ci,/npm run typecheck/);
 assert.match(ci,/npm run build/);
});
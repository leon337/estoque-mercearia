# PHASE-07 — Mission Trace

Mission: `ESTOQUE-MERCEARIA-001`
Phase: `PHASE-07-PUBLIC-RELEASE`
Risk class: C
Human authorization: LEANDRO explicitly authorized public release on 2026-08-17.

## ESEV chronology

### 1. MESTRE — contract and orchestration
Input: MVP M0–M7 already qualified; public release not yet performed.
Action: opened Phase 07 as Class C and selected Gabriel, Bruno, Ricardo, Renato, Júlia, Augusto, Carmem, Emily and LÉO.
Evidence: Phase 07 PLAN committed to the product repository.
Result: publication authorized, scope frozen to release only.
Decision: proceed without adding product functionality.
Handoff: MESTRE → Bruno/Gabriel — create a public deployment from validated `main`.

### 2. Bruno/Gabriel — hosting and first deploy
Input: repository `leon337/estoque-mercearia`, validated main `fcd06b3b...`.
Action: created Render web service `estoque-mercearia` on free plan, Virginia, auto-deploy from `main`; configured only public Supabase URL and publishable key.
Evidence: Render service `srv-da1et8pt0dsc73bn9pgg`, first deploy `dep-da1et99t0dsc73bn9qd0`.
Result: first deploy reached `live`.
Decision: do not approve release until dependency and runtime checks complete.
Handoff: Bruno → Ricardo — inspect build security.

### 3. Ricardo — runtime dependency block
Input: first Render build logs.
Action: detected `3 high severity vulnerabilities`; reproduced with `npm audit --omit=dev --audit-level=high`.
Evidence: GitHub Actions run `32024595318`, job `95371222956`.
Result: HIGH issues in runtime dependency tree through Next.js 16.2.12.
Decision: `BLOQUEADO_POR_RISCO`; public endpoint must not be accepted.
Handoff: Ricardo → Rafael/Renato — apply focused dependency security update and regress.

### 4. Rafael/Renato — security hotfix
Input: audit remediation path.
Action: upgraded `next` and `eslint-config-next` to 16.3.1; regenerated lockfile; ran lint, tests, typecheck, build and runtime audit.
Evidence: run `32024713175`, job `95371585746`; 46/46 tests; `found 0 vulnerabilities`.
Result: security hotfix commit `49398e9...`.
Decision: integrate only after normal CI on clean branch.
Handoff: Renato → Gabriel/LÉO — integrate verified security hotfix.

### 5. LÉO/Gabriel — security hotfix integration
Input: clean branch HEAD `fb04d57e...`, normal CI `32024899480` PASS, zero review threads.
Action: approved hotfix integration, merged PR #10 by squash.
Evidence: main commit `30ca70843ee6d1c9ac1d45c7147670ae4ce16ea2`.
Result: Render auto-deploy `dep-da1f0b942hec73alv7hg` reached `live`; build showed Next.js 16.3.1 and `found 0 vulnerabilities`.
Decision: proceed to external public smoke.
Handoff: Gabriel → Renato — exercise public routes externally.

### 6. Renato — first public smoke and production defect
Input: public endpoint `https://estoque-mercearia.onrender.com`.
Action: ran external GitHub Actions smoke.
Evidence: run `32025281283`; `/login` PASS, `/register` failed.
Result: diagnostic run `32025396201` showed `/register` = HTTP 307.
Decision: `BLOQUEADO_POR_RISCO`; release not approved.
Handoff: Renato → Rafael — trace proxy routing and correct with RED/GREEN evidence.

### 7. Rafael/Renato — public registration route correction
Input: production 307 and `src/lib/supabase/proxy.ts`.
Action: root cause identified: proxy exposed only `/login`; added RED structural test, then made `/login` and `/register` public auth routes while preserving protection elsewhere.
Evidence: RED CI `32025510775`; GREEN CI `32025568296`; PR #11.
Result: PR #11 merged as `bf8eac22574ba12c0e16a80b432bb3d48fa7d742`.
Decision: redeploy and rerun exact failed smoke.
Handoff: Rafael → Bruno/Renato — deploy and verify unchanged smoke.

### 8. Bruno/Renato — final public smoke
Input: Render deploy `dep-da1f47m1egvs73a61ri0`.
Action: confirmed deploy live on `bf8eac22...`; reran failed public smoke without changing the test.
Evidence: rerun of `32025396201` completed SUCCESS.
Result: `/login` public PASS; `/register` public PASS; `/`, `/inventory`, `/products`, `/movements/new`, `/history`, `/admin/users`, `/admin/adjustment` all redirect anonymous users to `/login`; endpoint healthy afterward.
Decision: public behavior accepted.
Handoff: Renato → Ricardo/Júlia — final security and governance verification.

### 9. Ricardo/Júlia — final security/governance verification
Input: final public deploy and smoke.
Action: checked Render build/runtime and Supabase Security Advisor.
Evidence: Next.js 16.3.1; npm build `found 0 vulnerabilities`; Supabase Security Advisor `lints: []`.
Result: no privileged Supabase secret in runtime; no release fixture was created; public exposure matches the intended access-request/login model.
Decision: security/governance condition satisfied.
Handoff: Ricardo/Júlia → Carmem/Augusto — close Class C PRF.

### 10. Carmem/Augusto — PRF closeout
Input: chronological evidence above.
Action: produce complete Class C PRF and SHA-256 manifest.
Evidence: artifacts in this directory.
Result: package ready for independent audit.
Decision: await Emily.
Handoff: Carmem/Augusto → Emily — audit the exact closeout package.

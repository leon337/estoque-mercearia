# PHASE-09 Autonomous Production Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and execute an autonomous Playwright-based visual/functional production smoke with route discovery, responsive evidence, critical review and official reporting.

**Architecture:** A repository-owned Node/Playwright runner targets the existing Render production endpoint without modifying application auth/business logic. GitHub Actions installs Playwright ephemerally, runs public and authenticated/admin passes when Actions secrets exist, uploads non-secret evidence, and can later be triggered by MCF through an Issue #19 comment.

**Tech Stack:** Node.js 22, JavaScript ES modules, Playwright/Chromium installed ephemerally in GitHub Actions, GitHub Actions artifacts, existing Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-18-phase09-autonomous-e2e-smoke-design.md`

## Global Constraints

- Production target: `https://estoque-mercearia.onrender.com`.
- Never commit or print credentials.
- Authentication secrets: `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.
- No auth bypass, service-role secret, migration, RLS change, privileged QA endpoint or deployment behavior.
- QA data must be uniquely identified and limited to the minimum needed to materialize dynamic routes.
- Primary responsive coverage: 1440×900 desktop and 375×812 mobile.
- RC coverage: 320×568 and 1024×768 fresh contexts.
- Evidence must support every route classification.

---

### Task 1: Infrastructure contracts — RED

**Files:**
- Create: `tests/p9-autonomous-smoke-infrastructure.test.mjs`

**Interfaces:**
- Consumes: repository file layout.
- Produces: static contracts for the workflow, runner, RC module and evidence policy.

- [ ] **Step 1: Write failing contracts**

The test must require:
- `.github/workflows/production-smoke.yml`;
- `scripts/e2e/production-smoke.mjs`;
- `scripts/e2e/critical-review.mjs`;
- `scripts/e2e/smoke-lib.mjs`;
- workflow triggers for pull-request infrastructure changes, `workflow_dispatch`, and Issue #19 `/smoke-production` comments;
- secret references without literal credential values;
- artifact upload using `actions/upload-artifact@v4`;
- primary/RC viewport constants;
- mandatory routes including dynamic edit and admin adjustment;
- report statuses and QA naming policy.

- [ ] **Step 2: Commit RED before implementation**

Expected CI: existing tests remain green; only new PHASE-09 contracts fail because implementation files do not exist.

---

### Task 2: Evidence/runtime helpers — GREEN foundation

**Files:**
- Create: `scripts/e2e/smoke-lib.mjs`

**Interfaces:**
- Produces:
  - `PRIMARY_VIEWPORTS`
  - `RC_VIEWPORTS`
  - `SEED_ROUTES`
  - `createReport(baseURL)`
  - `inspectPage(page, route, viewportName)`
  - `captureEvidence(page, outputDir, viewportName, routeName, state)`
  - `recordRoute(report, record)`
  - `writeReports(report, outputDir)`
  - `collectSameOriginLinks(page, baseURL)`

- [ ] **Step 1: Implement deterministic evidence naming**

Normalize route names to filename-safe slugs and write full-page PNGs under `screenshots/`.

- [ ] **Step 2: Implement layout inspection**

Check document horizontal overflow, visible interactive elements escaping viewport bounds, too-small actionable controls, page errors collected by callers, and fixed-bottom overlap risk. Return structured findings, never a boolean-only result.

- [ ] **Step 3: Implement route/report aggregation**

Maintain route type, desktop/mobile state, functional state, evidence filenames, findings, discovered links, QA data and dimension summaries.

- [ ] **Step 4: Implement JSON/Markdown output**

Always emit `report.json`, `report.md` and `route-inventory.json`, including BLOCKED reason when credentials are absent.

---

### Task 3: Normal production smoke

**Files:**
- Create: `scripts/e2e/production-smoke.mjs`

**Interfaces:**
- Consumes helper interfaces from Task 2 and environment:
  - `E2E_BASE_URL` optional, defaults to production URL;
  - `E2E_ADMIN_EMAIL` optional;
  - `E2E_ADMIN_PASSWORD` optional;
  - `E2E_OUTPUT_DIR` optional.
- Produces non-secret evidence in output directory and an ephemeral auth storage state outside it.

- [ ] **Step 1: Public-route pass**

Open `/login` and `/register` in desktop/mobile contexts, capture evidence, inspect layouts, collect links and verify protected seed routes redirect unauthenticated users to `/login`.

- [ ] **Step 2: Credential boundary**

If either credential is missing, record all protected/admin routes as BLOCKED for authenticated visual/functional coverage, keep public results, write evidence/report and exit with a distinct non-zero code after evidence is complete.

- [ ] **Step 3: Authenticated login**

Fill `input[name="email"]` and `input[name="password"]`, submit `Entrar`, wait for `/`, assert the authenticated shell, then save ephemeral browser storage state.

- [ ] **Step 4: Canonical route discovery**

Visit `/`, `/products`, `/inventory`, `/movements/new`, `/history`, `/admin/users`, `/admin/adjustment` in desktop/mobile, capture evidence, inspect layout and collect same-origin links.

- [ ] **Step 5: Materialize dynamic product route**

Create a product named `QA-E2E-<run-id>` with unique internal code/barcode, unit `UN`, no category and minimum stock `1`. Confirm `Produto cadastrado.`, locate the product, follow its `Editar` link, capture `/products/[id]/edit`, and assert persisted form values.

- [ ] **Step 6: Functional edit and persistence**

Change only the QA product name to append `-EDIT`, submit `Salvar alterações`, verify `Produto atualizado.` and the updated list text.

- [ ] **Step 7: Safe operational smoke**

Verify the QA product appears in inventory; open new movement with the product where possible without submitting a stock mutation; verify history filters/rendering; verify admin-users controls without submitting role/status changes; in adjustment select the QA product, confirm submit is initially disabled, fill physical count/reason, confirm it becomes enabled, but do not submit the adjustment.

- [ ] **Step 8: QA cleanup**

Return to the QA edit page and inactivate only that QA product. Record the product id/name and final inactive state. Do not attempt audit-history deletion.

---

### Task 4: Independent critical review (RC)

**Files:**
- Create: `scripts/e2e/critical-review.mjs`

**Interfaces:**
- Consumes `--base-url`, `--storage-state`, `--output-dir`, `--routes-json`.
- Produces `critical-review/report.json` and screenshots under `critical-review/`.

- [ ] **Step 1: Fresh-browser narrow-mobile pass**

Use 320×568, revisit all public and authenticated discovered routes, independently detect overflow/clipping/touch-density/bottom-nav risks and capture screenshots.

- [ ] **Step 2: Fresh-browser intermediate pass**

Use 1024×768 to challenge desktop/mobile breakpoint transitions and repeated component consistency.

- [ ] **Step 3: Refute false PASS**

If RC finds a new defect on a route previously PASS, downgrade final route status and include RC evidence/finding in the consolidated report.

---

### Task 5: GitHub Actions orchestration

**Files:**
- Create: `.github/workflows/production-smoke.yml`

**Interfaces:**
- Pull-request trigger limited to E2E infrastructure files for qualification.
- `workflow_dispatch` for explicit runs.
- `issue_comment` trigger restricted to Issue #19 and `/smoke-production`.

- [ ] **Step 1: Checkout/setup**

Use `actions/checkout@v4` and Node 22.

- [ ] **Step 2: Install runner dependency ephemerally**

Run `npm ci --no-audit --no-fund`, then `npm install --no-save --package-lock=false @playwright/test@1.55.0`, followed by `npx playwright install --with-deps chromium`.

- [ ] **Step 3: Run smoke with secrets**

Pass production URL and Actions secrets as environment variables. Use `continue-on-error: true` on the smoke step so artifacts still upload.

- [ ] **Step 4: Upload evidence**

Always upload `e2e-output/` via `actions/upload-artifact@v4`, with a run-specific artifact name and retention suitable for audit.

- [ ] **Step 5: Restore failure semantics**

After artifact upload, fail the job when the smoke step did not succeed. BLOCKED credentials and confirmed FAIL therefore remain visible in CI.

---

### Task 6: Qualification and first autonomous execution

**Files:**
- Create/update: PHASE-09 PRF under `artifacts/phases/PHASE-09-AUTONOMOUS-E2E-SMOKE/` after runtime evidence exists.

- [ ] **Step 1: Run normal repository CI on exact HEAD**

Expected: lint, existing tests + PHASE-09 infrastructure tests, typecheck and build PASS.

- [ ] **Step 2: Execute production-smoke workflow from PR**

Inspect workflow result and artifact. If Actions secrets are absent, classify this as the legitimate credential HUMAN_GATE only after public evidence and BLOCKED report are preserved.

- [ ] **Step 3: When credentials are available, rerun failed workflow job**

No code change is required for credential provisioning. Rerun the same job/HEAD and require complete route matrix plus evidence artifact.

- [ ] **Step 4: Inspect screenshots independently**

Download the artifact, review every desktop/mobile/RC screenshot and compare against machine findings. Any defect found here overrides automatic PASS.

- [ ] **Step 5: Correct eligible defects and regress**

Use RED→GREEN for code defects inside the mission boundary, then rerun repository CI and production smoke for affected/all routes as appropriate.

- [ ] **Step 6: Codex/MCF gate**

Request exact-head Codex review, create risk-B PRF, verify manifest, and record RC + route matrix + artifacts in Issue #19.

- [ ] **Step 7: Integrate only after evidence-backed gate**

Merge under the user’s mission authorization if no legitimate human-reserved decision remains. Verify main and ensure the workflow is available for future MCF-triggered `/smoke-production` runs.

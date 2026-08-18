# PHASE-09 — Autonomous Production Smoke Design

## Status
Approved by LEANDRO through the mission specification supplied on 2026-08-18.

## Goal
Replace manual page-by-page browser validation with an autonomous, repeatable production smoke operated by the MCF team against `https://estoque-mercearia.onrender.com`.

## Architecture
The repository will own a Playwright/Chromium runner under `scripts/e2e/` and a GitHub Actions workflow dedicated to production smoke. The workflow can be triggered manually and, after integration, by an MCF comment `/smoke-production` on Issue #19. The runner does not require any application backdoor and never versions credentials.

Two passes are mandatory:
1. **normal smoke** — route discovery, desktop/mobile screenshots, functional navigation and safe QA flows;
2. **critical review (RC)** — fresh browser contexts at boundary widths, independent layout checks, false-PASS challenge and consistency checks.

## Authentication
Authenticated/admin coverage uses GitHub Actions secrets only:
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Secrets are never printed, written to artifacts or committed. If either is absent, public smoke still runs, protected routes are tested for correct redirect behavior, and the final result is `BLOCKED` with an explicit credential gate. No privileged QA endpoint, service-role secret or auth bypass may be added.

## Route inventory
The seed inventory is:
- `/login` — public
- `/register` — public
- `/` — authenticated
- `/products` — authenticated
- `/products/new` — administrative
- `/products/[id]/edit` — administrative/dynamic
- `/inventory` — authenticated
- `/movements/new` — authenticated
- `/history` — authenticated
- `/admin/users` — administrative
- `/admin/adjustment` — administrative

The runner also collects same-origin links encountered during navigation and records discovered routes. Dynamic product edit is materialized through a clearly identified QA product.

## Responsive matrix
Primary viewports:
- desktop: 1440×900
- mobile: 375×812

RC boundary viewports:
- narrow mobile: 320×568
- tablet/intermediate: 1024×768

## Visual checks
For every auditable page the runner checks, at minimum:
- horizontal document overflow;
- visible controls escaping the viewport;
- overlapping fixed bottom navigation with actionable content;
- interactive targets smaller than the approved 48px target where applicable;
- clipped form controls and headings;
- console/page errors;
- broken navigation state.

Screenshots are full-page PNGs using the pattern `<viewport>__<route>__<state>.png`.

## Functional smoke
When authenticated credentials are available, the runner must:
- log in successfully;
- reach dashboard and canonical navigation;
- create a uniquely named QA product;
- confirm product persistence in `/products`;
- open `/products/[id]/edit` and confirm persisted values;
- edit the QA product and confirm updated persistence;
- inspect inventory/new-movement/history/admin-users/admin-adjustment;
- verify adjustment disabled/enabled states without committing a destructive adjustment;
- inactivate the QA product at the end when safe, preserving the audit trail and identifying the QA record in the report.

The smoke must not mutate real user roles/status or real non-QA product data.

## Evidence
Workflow artifacts contain only non-secret evidence:
- `report.json`
- `report.md`
- `route-inventory.json`
- screenshots under `screenshots/`
- RC screenshots under `critical-review/`

Any ephemeral authenticated storage state remains outside the artifact directory and is deleted before workflow completion.

## Classification
Each route receives one of:
- `PASS`
- `PASS_COM_RESSALVA`
- `FAIL`
- `BLOCKED`

The report also emits:
- `desktop_visual`
- `mobile_visual`
- `functional_smoke`
- `responsive_consistency`
- `critical_review`
- `overall`

`PASS` requires inspected evidence, not merely an HTTP response.

## Failure and recovery
Recoverable navigation/transient failures may be retried once in a fresh page. Confirmed defects remain recorded with route, viewport, severity, evidence and likely responsible surface. Corrections inside the already authorized UI/QA boundary may be followed by affected-route regression. Security/auth model changes are outside this mission without a legitimate HUMAN_GATE.

## Governance
Issue #19 is the official mission record. Implementation uses a branch/PR, TDD, normal CI, Codex review, MCF risk gate and PRF. The production-smoke workflow is evidence-producing QA infrastructure and must not become a deployment mechanism.

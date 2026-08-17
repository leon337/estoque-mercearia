# PHASE-07 — Public Release Report

## Outcome

The qualified MVP was published as a public Render web service after two release-blocking defects were found and corrected under the MCF gates.

Public endpoint: `https://estoque-mercearia.onrender.com`

Final application commit validated in production before this closeout package:
`bf8eac22574ba12c0e16a80b432bb3d48fa7d742`

Render service:
- service: `estoque-mercearia`
- service id: `srv-da1et8pt0dsc73bn9pgg`
- plan: `free`
- region: `virginia`
- branch: `main`
- auto-deploy: enabled
- build: `npm ci && npm run build`
- start: `npm start -- -H 0.0.0.0 -p $PORT`

Runtime configuration contains only the public Supabase project URL and public publishable key. No `service_role`, database password, or administrative secret was added.

## Release corrections

### Security dependency correction

The initial public candidate built successfully but npm reported 3 HIGH runtime vulnerabilities. The release was explicitly blocked. A production-only audit reproduced the finding.

Next.js and its lint config were upgraded from 16.2.12 to 16.3.1, the lockfile was regenerated, and a dedicated verification run passed:
- lint: PASS
- tests: 46/46 PASS
- typecheck: PASS
- build: PASS
- runtime npm audit: 0 vulnerabilities

The security change entered main through PR #10 as:
`30ca70843ee6d1c9ac1d45c7147670ae4ce16ea2`

### Public registration routing correction

The first external public smoke then discovered that `/register` returned HTTP 307 to `/login`. The release was blocked again.

Root cause was the Supabase proxy classifying only `/login` as public. A RED test was committed first, then the proxy was corrected so `/login` and `/register` are public auth routes while all operational routes remain protected.

Evidence:
- RED CI: `32025510775`
- GREEN CI: `32025568296`
- PR #11
- final app commit: `bf8eac22574ba12c0e16a80b432bb3d48fa7d742`

The same external smoke that previously failed was rerun unchanged and passed.

## Final validation summary

- corrected Render deployment: `dep-da1f47m1egvs73a61ri0` — LIVE
- final public smoke: SUCCESS
- `/login`: public
- `/register`: public
- operational routes: anonymous access redirected to `/login`
- endpoint healthy after smoke
- npm build audit: 0 vulnerabilities
- Supabase Security Advisor: 0 lints
- privileged secrets in application runtime: none
- release test fixtures: none
- new functional scope: none

## Residual operational considerations

The service runs on a free hosting plan. Availability, cold-start behavior, and provider limits remain platform-level operational risks, not integrity or authorization failures. Backup/restore and first-admin procedures remain those qualified in M7.

## Release status before audit

`AGUARDANDO_AUDITORIA_E_GATE`

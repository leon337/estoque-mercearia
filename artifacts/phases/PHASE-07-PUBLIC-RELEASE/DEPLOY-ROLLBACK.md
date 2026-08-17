# Deployment and Rollback

## Current production

- Provider: Render
- Service: `estoque-mercearia`
- Service id: `srv-da1et8pt0dsc73bn9pgg`
- Branch: `main`
- Auto-deploy: enabled
- Public URL: `https://estoque-mercearia.onrender.com`

## Normal deployment

A reviewed and gated merge to `main` triggers Render auto-deploy. A release is not considered accepted until the target commit is live and the public smoke/security checks pass.

## Rollback trigger

Rollback is required for:
- authentication/authorization regression;
- persistent 5xx or startup failure;
- newly discovered critical/high runtime vulnerability with practical exposure;
- data-integrity regression;
- public exposure of an intended protected route.

## Rollback procedure

1. Identify the last known-good `main` commit/deploy.
2. Revert the offending application commit through the normal reviewed Git workflow.
3. Let Render auto-deploy the reverted `main`.
4. Confirm the rollback deploy is live.
5. Rerun the public smoke.
6. Review runtime logs and Supabase Security Advisor.
7. Record the incident and corrective decision in the PRF.

Phase 07 introduced no database migration, so rollback of the application release does not require reverting database schema.

## Known-good application release before PRF-only closeout

`bf8eac22574ba12c0e16a80b432bb3d48fa7d742`

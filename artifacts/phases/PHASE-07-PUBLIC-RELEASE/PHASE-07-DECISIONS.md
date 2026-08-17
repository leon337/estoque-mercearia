# PHASE-07 — Decisions

1. LEANDRO's explicit authorization is the HUMAN_GATE for public release.
2. Render free plan was selected because it provides a connected, no-new-cost public deployment path.
3. Only public Supabase client configuration is permitted in hosting environment variables.
4. The first Render deployment was not accepted despite being live because npm reported 3 HIGH runtime vulnerabilities.
5. Release was blocked until a focused dependency update removed the runtime findings.
6. Next.js 16.3.1 and matching eslint-config-next 16.3.1 were accepted only after 46/46 tests, typecheck, build, and zero-vulnerability runtime audit.
7. The first external public smoke was not accepted because `/register` returned 307 to `/login`.
8. The registration routing defect was corrected with RED before GREEN; no operational route was made public.
9. The final external smoke reran the previously failing test unchanged and passed.
10. Supabase database schema was not changed by Phase 07.
11. Public release is considered technically valid only after final deployment, smoke, security review, PRF, independent audit and LÉO gate.
12. Free-hosting cold starts/provider availability are accepted residual operational risks for the MVP; they do not relax integrity or authorization controls.

## Audit
Pending Emily.

## Final gate
Pending LÉO.

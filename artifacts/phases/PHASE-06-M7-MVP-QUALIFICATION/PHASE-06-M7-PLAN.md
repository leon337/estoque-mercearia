# PHASE-06 / M7 — Qualificação do MVP — PLAN

```yaml
mission_id: ESTOQUE-MERCEARIA-001
phase_id: PHASE-06-M7-MVP-QUALIFICATION
objective: Qualificar e fechar o MVP completo M0-M6 sem adicionar novo escopo funcional.
expected_outcome: MVP demonstravelmente operável, seguro, rastreável e documentado, com cenário de aceite completo e checkpoint final.
scope:
  - mvp_acceptance_checklist
  - operational_runbook
  - backup_restore_runbook
  - full_hosted_acceptance
  - security_advisor_final
  - full_ci_final
  - http_application_smoke_when_verifiable
  - final_mcf_prf_and_gate
out_of_scope:
  - new_product_features
  - fiscal_pos_supplier_features
  - public_deployment_or_release
inputs:
  - M6 merge 08be302791cd45426e0890a581a2e9f2d249d126
  - milestones M0-M6 delivered
source_of_truth:
  - leon337/estoque-mercearia main
  - leon337/multiagent-collaboration-framework main
acceptance_criteria:
  - all MVP routes and migrations present
  - environment example contains only public Supabase URL/publishable key
  - first-admin bootstrap documented
  - backup procedure documented using current Supabase-supported logical dump for free-tier operations
  - full hosted scenario create product INITIAL20 ENTRY10 EXIT4 gives 26 with trace
  - adjustment to physical count 25 yields delta -1 with reason
  - inactive user has no operational read access
  - operator cannot manage users or adjust stock
  - last active ADMIN protection works
  - replay idempotency works and negative stock remains blocked
  - Security Advisor has zero critical/high and target zero lints
  - npm_ci_lint_tests_typecheck_build pass on final head
  - final audit and Leo gate approve MVP
  - no public release performed without HUMAN_GATE
authorizations:
  - continuous M4-M7 execution authorized by Leandro
  - scoped writes on M7 feature branch
  - disposable hosted validation fixtures with cleanup
prohibitions:
  - direct_main_write
  - new_feature_scope
  - privileged_secret_in_repo
  - public_release_without_human_gate
risk_class: B
current_state: PLANEJADO
cycle: 1
selected_agents: [Mestre, Miriam, Leonardo, Sofia, Rafael, Helena, Manoel, Renato, Ricardo, Vinicius, Marina, Augusto, Carmem, Gabriel, Emily]
decision_authority: Leo
human_escalation_triggers: [material_scope_change, new_cost, public_release, sensitive_credentials]
phase_artifact_directory: artifacts/phases/PHASE-06-M7-MVP-QUALIFICATION
```

## Qualification sequence
`PLAN → RED → RUNBOOK/CHECKLIST → FULL CI → HOSTED ACCEPTANCE → HTTP SMOKE ATTEMPT → SECURITY REVIEW → PRF → AUDIT → LEO FINAL GATE → MERGE → POST-MERGE VERIFICATION`

**LÉO internal plan approval: APROVAR.** M7 is qualification only; it does not authorize a public deployment.
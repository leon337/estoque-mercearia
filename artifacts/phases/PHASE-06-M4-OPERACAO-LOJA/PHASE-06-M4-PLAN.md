# PHASE-06 / M4 — Operação da Loja — PLAN

```yaml
mission_id: ESTOQUE-MERCEARIA-001
phase_id: PHASE-06-M4-OPERACAO-LOJA
title: Operação da Loja
objective: Disponibilizar a operação diária do estoque em interface web responsiva usando exclusivamente o núcleo transacional aprovado no M3.
expected_outcome: Usuários ativos consultam saldo e registram ENTRY/EXIT com confirmação; ADMIN também registra INITIAL; banco continua autoridade.
scope:
  - inventory_read_ui
  - entry_ui
  - exit_ui
  - initial_inventory_admin_ui
  - projected_balance_preview
  - operational_error_states
  - responsive_navigation
out_of_scope:
  - adjustment_ui
  - history_filters
  - dashboard_metrics
  - user_administration
  - public_deployment
inputs:
  - M3 merge 51398b977f3c5cd134ecb6ae359b7bffa26a7aa6
  - PHASE-04 UX approved
  - PHASE-05 implementation plan
source_of_truth:
  - leon337/estoque-mercearia main
  - leon337/multiagent-collaboration-framework main
assumptions:
  - hosted Supabase migrations M1-M3 are applied
  - browser never writes balance directly
acceptance_criteria:
  - active user can read active-product stock
  - zero/low/ok status is textual
  - ADMIN and OPERATOR can register ENTRY and EXIT
  - only ADMIN is offered INITIAL
  - projected balance is shown before submit
  - obvious negative EXIT is blocked client-side and authoritative block remains DB-side
  - operation_id is stable per intent
  - no actor or resulting authoritative balance comes from browser
  - known RPC failures map to stable UI errors
  - npm_ci_lint_tests_typecheck_build_pass
  - no critical/high security finding
  - Class B PRF complete
authorizations:
  - continuous M4 through M7 execution authorized by Leandro
  - scoped writes on feature branch
prohibitions:
  - direct_main_write
  - direct_inventory_dml
  - adjustment_ui_in_M4
  - public_release_without_gate
risk_class: B
current_state: PLANEJADO
cycle: 1
selected_agents:
  - Mestre
  - Sofia
  - Leonardo
  - Helena
  - Rafael
  - Renato
  - Ricardo
  - Vinicius
  - Augusto
  - Carmem
  - Gabriel
  - Emily
decision_authority: Leo
human_escalation_triggers:
  - material_scope_change
  - new_cost
  - public_release
  - sensitive_credentials
phase_artifact_directory: artifacts/phases/PHASE-06-M4-OPERACAO-LOJA
```

## Ordem
MESTRE → Sofia/Leonardo → Renato RED → Rafael/Helena GREEN → Renato CI/smoke → Ricardo/Vinicius revisão → Carmem/Augusto PRF → Emily auditoria → LÉO gate → Gabriel merge.

## Internal plan approval
**LÉO: APROVAR.** O desenho materializa UX/arquitetura previamente aprovados e não amplia o escopo do MVP.
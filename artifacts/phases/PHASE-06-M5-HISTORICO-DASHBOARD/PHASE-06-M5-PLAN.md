# PHASE-06 / M5 — Histórico + Dashboard — PLAN

```yaml
mission_id: ESTOQUE-MERCEARIA-001
phase_id: PHASE-06-M5-HISTORICO-DASHBOARD
objective: Expor histórico auditável e dashboard operacional de estoque sem criar novas mutações.
expected_outcome: Usuários ativos consultam movimentos com filtros e visualizam produtos ativos, zerados e abaixo do mínimo na home.
scope: [history_page, product_type_actor_date_filters, movement_trace, dashboard_metrics, low_zero_stock_lists, operational_links]
out_of_scope: [adjustment_ui, user_admin, public_deploy, new_inventory_mutation]
inputs: [M4 merge 5229a6901fba6c9ae364d001f7d89094217a33f1]
source_of_truth: [leon337/estoque-mercearia main, leon337/multiagent-collaboration-framework main]
acceptance_criteria:
  - history requires active authenticated user
  - filters for product type actor from/to are server-side
  - rows show product actor type date previous delta resulting and reason
  - dashboard shows active zero and low stock counts
  - dashboard provides low/zero product details and links to inventory/movements/history/products
  - M5 introduces no write to inventory or stock_movements
  - npm_ci_lint_tests_typecheck_build_pass
  - hosted read smoke pass
  - no critical/high security finding
  - Class B PRF complete
authorizations: [continuous_M4_M7, scoped_write_feature_branch]
prohibitions: [direct_main_write, new_stock_mutation, public_release_without_gate]
risk_class: B
current_state: PLANEJADO
cycle: 1
selected_agents: [Mestre, Leonardo, Helena, Rafael, Renato, Ricardo, Vinicius, Augusto, Carmem, Gabriel, Emily]
decision_authority: Leo
human_escalation_triggers: [material_scope_change, new_cost, public_release, sensitive_credentials]
phase_artifact_directory: artifacts/phases/PHASE-06-M5-HISTORICO-DASHBOARD
```

LÉO internal plan approval: APROVAR.
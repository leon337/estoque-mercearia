# PHASE-06 / M6 — Administração + Hardening — PLAN

```yaml
mission_id: ESTOQUE-MERCEARIA-001
phase_id: PHASE-06-M6-ADMIN-HARDENING
objective: Fechar o MVP com onboarding pendente seguro, administração de perfis, ajuste físico de estoque e hardening de autorização.
expected_outcome: Novos cadastros não acessam dados até aprovação; ADMIN gerencia papel/ativação sem bloquear o último admin; ajuste físico é ADMIN-only e auditável.
scope:
  - pending_self_registration
  - inactive_user_data_lockout
  - admin_profile_management
  - last_admin_protection
  - adjustment_ui
  - authorization_hardening
  - accessibility_and_error_hardening
out_of_scope:
  - service_role_in_application
  - public_release
  - fiscal_pos_supplier_features
inputs: [M5 merge 624b51cd8423ad8097558412f8b0e422889e271a]
source_of_truth: [leon337/estoque-mercearia main, leon337/multiagent-collaboration-framework main]
acceptance_criteria:
  - new signup profile defaults OPERATOR inactive
  - inactive authenticated user cannot select categories products inventory stock_movements
  - inactive user cannot call stock movement or admin profile RPCs
  - active ADMIN can list profiles and activate/deactivate/change role
  - OPERATOR cannot manage profiles
  - last active ADMIN cannot be demoted/deactivated
  - public app never contains service_role/admin secret
  - registration ends signed out and pending approval
  - adjustment is ADMIN-only with counted quantity >=0 and mandatory reason
  - adjustment uses M3 RPC and records derived delta
  - full CI green
  - hosted migration/security smoke green
  - no critical/high advisor finding
  - Class B PRF complete
authorizations: [continuous_M4_M7, scoped_write_feature_branch, hosted_migration_testing]
prohibitions: [direct_main_write, service_role_in_browser_or_repo, public_release_without_gate]
risk_class: B
current_state: PLANEJADO
cycle: 1
selected_agents: [Mestre, Leonardo, Sofia, Rafael, Helena, Manoel, Renato, Ricardo, Vinicius, Marina, Augusto, Carmem, Gabriel, Emily]
decision_authority: Leo
human_escalation_triggers: [material_scope_change, new_cost, public_release, sensitive_credentials]
phase_artifact_directory: artifacts/phases/PHASE-06-M6-ADMIN-HARDENING
```

## Security design
- Self-registration is not operational access: `private.handle_new_user()` creates `OPERATOR`, `active=false`.
- Product/category SELECT policies require `private.is_active_user()`; inventory/movements already do.
- Direct DML on `profiles` is revoked from anon/authenticated/service_role; privileged changes use `public.admin_update_profile()` with active-admin authorization and last-admin guard.
- First ADMIN is an environment bootstrap responsibility of the database owner; no bootstrap email/token is embedded in source.
- Registration uses normal Supabase signup, signs the browser out, and shows pending-approval state.
- Adjustment reuses M3 `ADJUSTMENT`; browser sends counted quantity/reason/operation id only.

**LÉO internal plan approval: APROVAR.** No sensitive privileged credential is introduced.
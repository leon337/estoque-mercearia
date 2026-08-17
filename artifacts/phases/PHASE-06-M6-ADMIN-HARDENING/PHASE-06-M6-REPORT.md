# PHASE-06 / M6 — REPORT

## Entrega
M6 fecha as superfícies administrativas e endurece autorização sem introduzir credencial privilegiada na aplicação.

### Onboarding e perfis
- `/register`: signup normal; trigger cria `OPERATOR` inativo; sessão é encerrada e usuário aguarda aprovação.
- categorias/produtos passam a exigir `private.is_active_user()` também para leitura.
- `/admin/users`: ADMIN ativo lista perfis e chama `admin_update_profile`; nenhum UPDATE direto de `profiles`.
- proteção `LAST_ACTIVE_ADMIN` impede desativar/rebaixar o último ADMIN.
- primeiro ADMIN documentado como bootstrap único do proprietário; depois toda gestão ocorre pela UI.

### Ajuste físico
- `/admin/adjustment`: ADMIN-only; contagem final >= 0, motivo obrigatório, preview/diferença e confirmação.
- usa o wrapper/RPC do núcleo com `ADJUSTMENT`; banco deriva delta e preserva histórico/ator.

### Hardening de RPC
- implementações `register_stock_movement` e `admin_update_profile` movidas para schema `private` como SECURITY DEFINER.
- endpoints `public` permanecem com as mesmas assinaturas, mas são SECURITY INVOKER e delegam ao privado.
- `anon` e `service_role` não executam os endpoints; `authenticated` executa somente as APIs previstas.
- Supabase Security Advisor: **0 lints**.

## Evidência
- RED principal: CI `32019452922`.
- GREEN base: CI `32019862966`.
- smoke 0006 hospedado: PASS, rollback zero.
- RED RPC: CI `32020057858`.
- pós-0007: Advisor zero + smoke PASS.
- CI `32020129985`: falso positivo de regex, 39/40; não contado como PASS.
- CI pós-correção/limpeza: `32020303906`, 40/40 + build PASS.
- RED primeiro ADMIN: `32020429417`.
- GREEN final funcional/documental: `32020498485`, 41/41 + lint/typecheck/build PASS.

Nenhum release público foi feito no M6.
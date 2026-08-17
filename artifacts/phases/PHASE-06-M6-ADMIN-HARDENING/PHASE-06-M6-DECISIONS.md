# PHASE-06 / M6 — DECISIONS

1. Novos cadastros são pedidos de acesso: `OPERATOR`, `active=false`.
2. Usuário inativo não recebe leitura operacional em categories/products/inventory/stock_movements.
3. Gestão de perfis ocorre por `admin_update_profile`; não existe UPDATE direto de `profiles` no app.
4. O último ADMIN ativo não pode ser desativado/rebaixado.
5. Nenhuma credencial administrativa privilegiada é introduzida no app, navegador ou repositório.
6. O primeiro ADMIN usa bootstrap owner-only uma única vez; depois `/admin/users` é o fluxo normal.
7. Ajuste físico é ADMIN-only, exige motivo e reutiliza `ADJUSTMENT` do núcleo.
8. WARNs de SECURITY DEFINER exposto foram eliminados: APIs públicas são SECURITY INVOKER e delegam para implementações privadas.
9. `service_role` não recebe EXECUTE dos RPCs públicos/privados e não é necessário para o runtime do MVP.
10. M7 inicia automaticamente após gate/merge e serve somente para qualificação/fechamento do MVP.

## Auditoria
Pendente de Emily.

## Gate
Pendente de LÉO.
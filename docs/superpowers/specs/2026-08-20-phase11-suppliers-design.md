# PHASE-11 — Fornecedores — Design

## Objetivo
Adicionar fornecedores como domínio mestre, reutilizável pelas compras da PHASE-12, sem acoplar recebimento, custos ou vendas.

## Arquitetura
O domínio usa duas tabelas públicas com RLS: `suppliers` e `product_suppliers`. Usuários autenticados ativos podem ler fornecedores ativos e vínculos ativos; ADMIN pode criar/editar/inativar. Não há DELETE pela aplicação. O vínculo possui `supplier_code`, `preferred` e garante no banco no máximo um fornecedor preferencial por produto.

A UI segue o Design System v1 e os padrões existentes de Server Components/Server Actions:
- `/suppliers`: listagem e busca;
- `/suppliers/new`: cadastro ADMIN;
- `/suppliers/[id]/edit`: edição ADMIN, status e vínculos com produtos.

## Dados
### suppliers
`id uuid`, `name text`, `tax_id text?`, `email text?`, `phone text?`, `notes text?`, `active boolean`, timestamps. Nome obrigatório. Documento opcional, mas quando informado é único sem diferenciar espaços/caixa.

### product_suppliers
`id uuid`, `product_id`, `supplier_id`, `supplier_code text?`, `preferred boolean`, `active boolean`, timestamps. Único por `(product_id, supplier_id)`. Índice parcial único por `product_id where preferred and active`.

## Segurança
- RLS habilitado nas duas tabelas;
- `anon`: sem acesso;
- `authenticated`: SELECT; INSERT/UPDATE somente quando `private.is_admin()`;
- DELETE revogado;
- Server Actions também exigem ADMIN para defesa em profundidade.

## Navegação móvel
A navegação inferior deixa de depender de `grid-cols-5` e passa a aceitar rolagem horizontal, evitando quebra quando novos módulos forem adicionados.

## Erros
Validação inválida → `error=validation`; unicidade → `error=duplicate`; demais falhas → `error=database`; permissão → redirect para `/suppliers?error=permission`.

## Testes
Contratos estáticos Node verificam migration/RLS, actions, rotas, navegação e inclusão do smoke. CI continua com lint, testes, typecheck e build. Pós-merge, migration é aplicada ao Supabase hospedado e o Production Smoke E2E é executado contra Render.

## Fora de escopo
Pedidos de compra, recebimentos, custos, preços, vendas, fiscal e integrações externas.

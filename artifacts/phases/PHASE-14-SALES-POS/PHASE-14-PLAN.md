# PHASE-14 — Vendas / PDV mínimo — Plano de fechamento

Issue canônica: #41  
Classificação de risco: `B`  
Missão: adicionar venda operacional mínima sobre a baseline PHASE-13, reutilizando o domínio autoritativo de estoque.

## Plano aprovado e executado
1. Definir design e plano versionados em `docs/superpowers/specs/2026-08-24-phase14-sales-design.md` e `docs/superpowers/plans/2026-08-24-phase14-sales.md`.
2. Materializar TDD RED para domínio, autorização, snapshot de preço, conclusão atômica, UI, navegação e Production Smoke.
3. Implementar `sales` / `sale_items`, RLS, triggers e RPCs transacionais.
4. Implementar `/sales`, `/sales/new`, `/sales/[id]` e navegação mobile limitada.
5. Aplicar migrations no Supabase hospedado e validar boundaries.
6. Corrigir regressões encontradas por auditoria com migrations forward-only `0014`, `0015` e `0016`.
7. Qualificar HEAD com `verify`.
8. Integrar em `main`.
9. Executar Production Smoke E2E pós-recovery contra produção pública.
10. Consolidar PRF Classe B, auditar e fechar a missão somente após todos os critérios, incluindo identidade LIVE do Render, estarem comprovados.

## Critérios de aceite
- cliente não controla preço autoritativo;
- `DRAFT → COMPLETED` gera `EXIT` atômico por item;
- estoque insuficiente reverte a venda;
- replay idempotente não duplica baixa;
- total é derivado, não persistido;
- histórico concluído não possui DELETE da aplicação;
- ADMIN e OPERATOR ativos podem operar;
- Production Smoke final prova saldo `5 → 2 UN`;
- PRF integrado;
- Render LIVE no SHA integrado.

## Fora de escopo
Pagamentos, Pix/cartão, caixa financeiro, clientes/fiado, descontos, impostos/fiscal, devoluções, promoções, comissões, integrações externas e multi-loja.

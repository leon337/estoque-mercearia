# PHASE-08 / P8.3a — Dashboard Visual

- Issue: #13
- PR: #16
- Risco MCF: B
- Base: `main@6acf364c4fbf336e002fb1752b0dc8d2ef501191`
- Escopo: redesenhar somente o dashboard `/` com Design System v1.

## Objetivo

Evoluir a apresentação do painel operacional sem alterar autenticação, autorização, queries Supabase, regras de estoque, Server Actions, schema ou RLS.

## Critérios de aceite

- reutilizar `PageHeader`, `MetricCard`, `DataCard`, `StatusBadge` e `Button`;
- preservar produtos ativos, estoque zerado, estoque baixo e limite de 8 itens urgentes;
- manter Administração apenas para `ADMIN`;
- comunicar `ZERADO` e `BAIXO` com texto e tom semântico;
- manter layout mobile-first e bento 2/3 + 1/3 no desktop;
- não criar gráficos, relatórios ou métricas sem fonte funcional;
- lint, testes, typecheck e build verdes;
- revisão Codex sem achado bloqueante antes do merge.

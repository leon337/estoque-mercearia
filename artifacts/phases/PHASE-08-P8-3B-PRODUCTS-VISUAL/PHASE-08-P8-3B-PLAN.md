# PHASE-08 / P8.3b — Produtos Visual

- Issue: #13
- PR: #17
- Risco MCF: B
- Base: `main@6e4d4e302b01f1219327936f418bd9c4b2a501fa`
- Escopo: redesenhar `/products`, `/products/new` e `/products/[id]/edit` com o Design System v1.

## Objetivo

Evoluir as superfícies de Produtos sem alterar autenticação, autorização, queries, Server Actions, schema, RLS ou regras de domínio.

## Critérios de aceite

- reutilizar `AppShell`, `PageHeader`, `DataCard`, `StatusBadge` e `Button`;
- preservar busca por nome/código e filtro de status restrito a ADMIN;
- preservar criação, edição e ativação/inativação de produtos;
- preservar criação e ativação/inativação de categorias;
- compartilhar os seis campos de produto em componente puro de apresentação;
- manter feedback semântico e controles touch-friendly;
- não alterar `src/app/products/actions.ts`;
- lint, testes, typecheck e build verdes;
- revisão Codex sem achado bloqueante antes do merge.

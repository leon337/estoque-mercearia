# PHASE-08 / P8.6 — Decisões

1. Concluir as páginas restantes em um único PR para evitar pausas e deploys intermediários.
2. Tratar toda a onda final como apresentação-only e risco MCF B.
3. Preservar integralmente autenticação, autorização, queries, actions, RPCs e regras de estoque.
4. Usar o AppShell em toda rota autenticada e manter `/login` e `/register` fora dele.
5. Usar `Button` em mutações/formulários e `Link` estilizado em navegação.
6. Manter status textuais juntamente com tons semânticos; cor nunca é o único sinal.
7. Preservar idempotência e confirmação nas operações de estoque e ajuste.
8. Considerar o smoke visual autenticado pós-deploy uma ressalva não bloqueante, pois exige a sessão do usuário.
9. A autorização contínua da PHASE-08 permite merge quando CI e revisão final estiverem verdes.

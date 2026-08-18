# PHASE-08 / P8.3a — Decisões

1. Preservar integralmente a fonte de dados e os cálculos do dashboard existente.
2. Reutilizar primitives do Design System v1 em vez de criar uma segunda família de cards.
3. Usar `critical` para estoque zerado e `warning` para estoque baixo, sempre acompanhados por texto.
4. Não adicionar gráficos ou métricas sem fonte funcional.
5. Manter `ADMIN` como única condição para expor o bloco Administração.
6. Aceitar a ampliação retrocompatível do `DataCard` com `padding="default" | "none"` para corrigir o P2 do Codex sem depender da ordem de utilities Tailwind.
7. Classificar P8.3a como risco B: mudança visual em rota operacional autenticada, sem alteração de domínio ou segurança.
8. LÉO: `APROVAR_COM_RESSALVAS`; a ressalva é o smoke visual autenticado mobile/desktop, a ser realizado quando houver sessão autenticada ou consolidado em P8.6.
9. A autorização contínua da PHASE-08 permite merge e acompanhamento do auto-deploy sem novo HUMAN_GATE, desde que o HEAD final esteja verde e sem bloqueio crítico.

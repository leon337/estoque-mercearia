# PHASE-15 — Alertas operacionais de estoque — Plano

## Objetivo
Entregar um centro de alertas derivado, responsivo e qualificado em produção.

## Passos
1. RED: adicionar contratos que exigem helper de derivação, rota `/alerts`, navegação e cobertura no smoke.
2. GREEN: implementar helper puro e página SSR com auth/perfil ativo, consulta direta de inventory, filtros e ações.
3. Integrar `/alerts` à navegação desktop e ao dashboard, preservando cinco destinos no mobile.
4. Adicionar `/alerts` ao `SEED_ROUTES` do Production Smoke.
5. Executar `verify` completo.
6. Merge em `main`, confirmar Render LIVE no SHA integrado e Production Smoke pós-deploy.
7. Gerar PRF, auditar e fechar Issue #47.

## Critérios de aceite
- nenhum estado de alerta persistido;
- somente produtos ativos;
- classificação CRITICAL/WARNING correta;
- busca e filtro server-side;
- leitura direta de `inventory`;
- bottom nav <= 5 destinos;
- lint + testes + typecheck + build PASS;
- Production Smoke PASS.

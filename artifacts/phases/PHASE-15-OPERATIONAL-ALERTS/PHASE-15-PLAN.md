# PHASE-15 — Alertas operacionais de estoque — Plano de fase

Issue: #47  
Classe de risco: `A`  
Baseline funcional final: `main@8d43e46aac11120ac786e6e1e343b9175050a11a`

## Objetivo
Entregar e qualificar em produção um centro de alertas operacionais derivado do estoque autoritativo, sem persistir saldo ou severidade duplicados.

## Escopo confirmado
- rota `/alerts`;
- derivação em leitura a partir de produtos ativos + `inventory`;
- `CRITICAL` quando `quantity <= 0`;
- `WARNING` quando `quantity > 0 && quantity <= minimum_stock`;
- busca, filtro, contadores e ordenação;
- links para os fluxos operacionais;
- integração no AppShell e no dashboard;
- Production Smoke em desktop/mobile e revisão crítica responsiva.

## Fora de escopo
E-mail, WhatsApp, SMS, push, webhooks, cron externo, IA externa, auto-compra e qualquer novo estado autoritativo de estoque.

## Critérios de aceite
1. design e plano versionados;
2. TDD RED anterior à implementação;
3. `verify` verde;
4. merge funcional em `main`;
5. Render LIVE no SHA integrado;
6. Production Smoke pós-deploy PASS;
7. PRF e Issue #47 encerrada.

## Autorizações
A Issue #47 registra autorização contínua de LEANDRO para PHASE-15 → PHASE-18. Nenhum gatilho de escalonamento humano reservado foi acionado no closeout.

## Agentes de continuidade/controle
- MESTRE — orquestração e reconstrução do estado real;
- Miriam — retomada por múltiplas fontes e validação do checkpoint;
- Renato — requalificação técnica e evidência de CI/smoke;
- Carmem — consistência do PRF;
- Gabriel — provenance GitHub/Render;
- Emily — auditoria independente;
- LÉO — gate operacional interno.

## Plano de closeout recuperado
1. confirmar `main`, Issue, PRs e evidências live;
2. confirmar Render LIVE no SHA final;
3. reexecutar `verify` no SHA exato;
4. reconciliar falhas/recoveries da fase;
5. gerar PRF;
6. auditar;
7. gate LÉO;
8. merge do PRF e encerramento da Issue #47;
9. transferir checkpoint para PHASE-16.

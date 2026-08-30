# PHASE-15 — Decisões

## D1 — Arquitetura
Alertas são derivados em leitura; nenhuma severidade ou saldo autoritativo novo é persistido.

## D2 — Recovery do dashboard
O dashboard deve apontar explicitamente para `/alerts`; PR #51 integrou a correção.

## D3 — Recovery responsivo
A falha do smoke em 320 px foi tratada como defeito real, não como ruído de fixture. PR #52 corrigiu min-content/overflow e requalificou o sistema.

## D4 — Miriam — continuidade
Estado recuperado a partir de GitHub, Render, CI, Issues, PRs, código/documentos e evidências do SHA aplicável. Documentos canônicos parados na PHASE-14 foram classificados como desatualizados frente ao live.

## D5 — Renato — validação
O `verify` foi reexecutado em 2026-08-30 no SHA `8d43e46aac11120ac786e6e1e343b9175050a11a`. Attempt 2 / job `99336733237` concluiu lint, testes, typecheck e build com sucesso.

## D6 — Emily — auditoria
Critérios da Issue #47 estão satisfeitos tecnicamente; não há finding aberto que impeça closeout. A lacuna restante é integrar este PRF e encerrar a Issue.

## D7 — LÉO — gate
`APROVAR`.

Justificativa: objetivo atendido, recovery concluído, SHA final qualificado, Render LIVE, Production Smoke PASS e requalificação fresca PASS.

Próximo estado: `GATE_APPROVED_AWAITING_CLOSEOUT_MERGE`.

## D8 — Autoridade humana
Nenhum novo HUMAN_GATE. A Issue #47 registra autorização contínua de LEANDRO para PHASE-15 → PHASE-18; nenhum gatilho reservado do protocolo vigente foi acionado.

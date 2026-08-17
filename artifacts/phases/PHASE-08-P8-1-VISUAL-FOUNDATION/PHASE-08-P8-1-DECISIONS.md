# PHASE-08 / P8.1 — Decisões

## D1 — Estratégia visual
Decisão: Design System semântico + evolução incremental.
Status: aprovado por LEANDRO.

## D2 — Boundary
Decisão: Stitch é referência visual; não copiar HTML/Tailwind CDN/scripts.
Status: aprovado.

## D3 — Execução
Decisão: TDD RED→GREEN, branch isolada, sem merge/deploy automático.
Status: executado.

## D4 — Typed routes
Decisão: manter `typedRoutes: true` e tipar a navegação com união literal `AppRoute`.

## D5 — Revisão UX
Decisão: exigir sidebar desktop persistente e Administração ativa em todo `/admin/*`.
Status: corrigido via RED→GREEN.

## D6 — Gate de revisão
LEANDRO selecionou a opção 2 para avançar PR #14 ao gate MCF.
Status: executado.

## D7 — Auditoria inicial
Veredito: `PASS_COM_RESSALVA`.
Ressalva: smoke visual real ausente.

## D8 — Gate de LÉO
Decisão: `APROVAR_COM_RESSALVAS`.

## D9 — Revisão Codex
A revisão externa do HEAD `d52ea029...` encontrou:
- P1: reset global `a { color: inherit; }` interferindo em utilities de cor do Tailwind;
- P2: manifest SHA-256 inconsistente.
Decisão: não integrar até corrigir ambos.

## D10 — Correção P1
RED em `580c6972...` / CI `32073167386`: 53/54 PASS, falha apenas no contrato novo.
GREEN em `24b0a968...` / CI `32073240183`: 54/54 PASS, lint/typecheck/build PASS.
Decisão: remover somente o reset duplicado de links.

## D11 — Correção P2
Decisão: recalcular o manifest a partir dos conteúdos retornados pelo GitHub connector.
A verificação integral detectou e corrigiu também o hash de `PHASE-08-P8-1-REPORT.md`.

## D12 — HUMAN_GATE de integração
Em 2026-08-17, LEANDRO respondeu `AUTORIZO` ao pedido explícito de autorização para merge do PR #14.
Interpretação operacional:
- merge do PR #14: `AUTHORIZED`;
- deploy manual adicional: `NOT_AUTHORIZED`;
- integração somente após CI verde do HEAD exato;
- após integração, verificar `main` e realizar/observar smoke no ambiente materializado quando disponível.

Próximo estado:
`MERGE_AUTHORIZED_PENDING_EXECUTION`

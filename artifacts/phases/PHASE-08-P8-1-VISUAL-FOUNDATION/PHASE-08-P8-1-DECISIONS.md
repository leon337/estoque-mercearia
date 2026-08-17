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
Motivo: corrigir causa raiz sem enfraquecer configuração do Next.js.

## D5 — Revisão UX
Decisão: exigir sidebar desktop persistente e Administração ativa em todo `/admin/*`.
Status: corrigido via RED→GREEN.

## D6 — Autorização humana de 2026-08-17
LEANDRO escolheu a opção 2:
`avançar PR #14 para revisão/gate MCF`.
Interpretação operacional:
- autorizado preparar e submeter gate;
- não autorizado fazer merge;
- não autorizado executar deploy público.

## D7 — Auditoria
Veredito: `PASS_COM_RESSALVA`.
Ressalva: ausência de smoke visual real da branch e ausência de instância cognitiva independente de auditoria.

## D8 — Gate de LÉO
Decisão: `APROVAR_COM_RESSALVAS`.
Justificativa:
- escopo e boundary respeitados;
- CI final completamente verde;
- regressão preservada;
- achados de revisão corrigidos;
- falta smoke visual real antes de afirmar entrega visual plena.

Próximo estado:
`AGUARDANDO_HUMAN_GATE_PARA_INTEGRACAO`

Próxima ação:
Solicitar a LEANDRO autorização explícita para merge/deploy boundary. Após ambiente autorizado materializar o HEAD, executar smoke visual mobile/desktop antes do fechamento pleno da P8.1.

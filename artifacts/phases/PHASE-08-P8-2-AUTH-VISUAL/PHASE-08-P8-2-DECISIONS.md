# PHASE-08 / P8.2 — Decisões

## D1 — Boundary
Preservar Server Actions, Supabase, RLS, redirects e regras de aprovação. Apenas apresentação e testes P8.2 podem mudar.

## D2 — Estrutura visual
Usar `AuthCard` compartilhado, sem AppShell nas rotas públicas, com composição mobile-first e painel de identidade no desktop.

## D3 — Acessibilidade
Inputs usam borda `--color-outline`; textos informativos no painel verde usam no mínimo `text-white/80`.

## D4 — Revisão externa
Os dois achados P2 do Codex foram classificados como `defeito_confirmado` e corrigidos via RED→GREEN.

## D5 — Gate de Léo
`APROVAR_COM_RESSALVAS`: CI e boundary estão verdes; smoke visual real só pode ocorrer após materialização no Render porque previews de PR estão desabilitados.

## D6 — HUMAN_GATE
O turno atual do usuário autorizou a continuidade até o merge após revisão/gate e validação verde. Não é necessário novo pedido de autorização para o merge desta P8.2.

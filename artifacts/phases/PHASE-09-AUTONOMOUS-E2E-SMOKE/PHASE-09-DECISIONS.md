# PHASE-09 — Decisões

## D1 — Automação de navegador
**Decisão:** substituir o smoke manual por Playwright/Chromium executado no GitHub Actions.  
**Motivo:** eliminar dependência de LEANDRO operar o navegador e gerar evidência reproduzível.

## D2 — Segurança das credenciais
**Decisão:** usar somente `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` como repository secrets.  
**Gate:** aprovado por LEANDRO em 2026-08-18.  
**Limite:** a autorização não cobre merge, backdoor ou alterações de auth/RLS/DB.

## D3 — Recuperação de cold start
**Decisão:** retry limitado somente para HTTP 429/502/503/504.  
**Motivo:** Render free-tier demonstrou 503 transitório.

## D4 — Falso FAIL do coletor
**Decisão:** reiniciar a coleção de erros na navegação do frame principal.  
**Evidência:** RED `9401b0dd2938d930f6296fa1008ba20e010ef610` e GREEN `050b8bd1b285ba7238fe7653289f3ceb00ab045f`.  
**Propriedade preservada:** erros reais da navegação final continuam bloqueantes; navegação de subframe não limpa o coletor.

## D5 — Validação
**Renato:** `PASS` — CI `32127079936` com 87/87, typecheck/build e smoke `32127079958` com overall PASS.

## D6 — Rastreabilidade
**Augusto:** `PASS` — falha, causa raiz, RED/GREEN, recuperação, artifact e checkpoint possuem identificadores verificáveis.

## D7 — Auditoria
**Emily:** `APROVADO_COM_RESSALVA` — nenhuma mudança de auth/DB/regra de negócio; smoke e RC verdes. Ressalva não bloqueante: o install efêmero do Playwright imprimiu summary de 2 HIGH, sem alteração de dependência/lockfile da aplicação; requer hardening separado se desejado, não é alegado como audit de runtime.

## D8 — Gate de LÉO
**Decisão:** `ESCALAR_PARA_LEANDRO`.  
**Justificativa:** objetivo técnico atingido e evidência final verde; entretanto o HUMAN_GATE anterior declarou explicitamente que não autorizava merge da PR #20.  
**Próximo estado:** `QUALIFIED_AWAITING_HUMAN_MERGE_GATE`.  
**Ação:** solicitar autorização explícita de merge sobre o HEAD/PRF qualificado.

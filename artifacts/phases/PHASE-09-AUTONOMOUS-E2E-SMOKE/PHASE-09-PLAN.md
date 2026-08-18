# PHASE-09 — Plano de Smoke Autônomo E2E

## Contrato
- **Issue:** #19
- **PR:** #20
- **Classe de risco:** B
- **Objetivo:** substituir dependência de operação manual do navegador por smoke de produção autônomo, rastreável e reproduzível.
- **Resultado esperado:** navegador real em GitHub Actions cobrindo rotas públicas, autenticadas, administrativas e dinâmica de produto; desktop/mobile; fluxo funcional seguro; revisão crítica independente; evidência preservada.
- **Fonte de verdade:** repositório `leon337/estoque-mercearia`, estado live do GitHub Actions e artefato do workflow.

## Escopo
- Runner Playwright/Chromium de produção.
- `/login`, `/register`, `/`, `/products`, `/products/new`, `/products/[id]/edit`, `/inventory`, `/movements/new`, `/history`, `/admin/users`, `/admin/adjustment`.
- Desktop 1440x900 e mobile 375x812.
- RC em 320x568 e 1024x768.
- Produto QA identificável, reversível por inativação.
- Evidências JSON/Markdown/screenshots e artifact do GitHub Actions.

## Fora de escopo
- Alterações de autenticação, RLS, migrations, RPC, Server Actions ou regras de negócio.
- Backdoor ou bypass de autenticação.
- Exposição de credenciais.
- Mutação real de estoque em smoke.
- Merge sem HUMAN_GATE específico.

## Critérios de aceite
1. CI normal verde em código qualificado.
2. Credenciais presentes somente como GitHub Actions secrets.
3. Login ADMIN real concluído.
4. Todas as rotas mínimas qualificadas em desktop/mobile.
5. Fluxo QA cria, persiste, edita e inativa o produto de teste.
6. RC independente executada sem achado bloqueante.
7. `overall=PASS` ou justificativa formal para ressalva.
8. Artifact preservado e rastreável.
9. PRF completo antes do gate de merge.

## Autorizações e proibições
- LEANDRO aprovou o HUMAN_GATE de credenciais em 2026-08-18, limitado ao provisionamento seguro da conta QA/E2E e dos secrets.
- A autorização de credenciais **não** autoriza merge da PR #20.
- Nenhum segredo deve aparecer em commit, Issue, PR, relatório ou artifact.

## Agentes/controles
- **MESTRE:** coordenação e checkpoint.
- **Renato:** validação/CI/smoke.
- **Augusto:** rastreabilidade e CAF.
- **Carmem:** consistência do PRF.
- **Emily:** auditoria processual baseada em evidência.
- **LÉO:** gate interno e escalonamento para LEANDRO.

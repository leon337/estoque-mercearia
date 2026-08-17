# MISSION TRACE — PHASE-06 / M7 — Qualificação do MVP

1. **MESTRE/LÉO — contrato.** M7 aberto como Classe B de qualificação, sem novo escopo funcional e sem release público. Objetivo terminal: `MVP_PRONTO_VALIDADO`. Handoff → Renato/Carmem.
2. **Renato — RED final.** `tests/m7-mvp-qualification.test.mjs` versionado; CI `32021317175`: install/lint PASS, testes FAIL por runbook/aceite ausentes, typecheck/build skipped. RED válido.
3. **Carmem/Miriam — documentação operacional.** Criados `MVP-RUNBOOK.md`, `MVP-ACCEPTANCE.md` e README M0–M7, cobrindo bootstrap, operação, backup lógico `supabase db dump`, restore e gate de release. CI `32021459931`: tests/typecheck/build PASS.
4. **Renato/Manoel/Ricardo — aceite hospedado completo.** Transação descartável provou: novos usuários pendentes; admin aprova operator; INITIAL20; ENTRY10; replay idempotente; EXIT4 → 26; saída 100 rejeitada; operator sem ADJUSTMENT/admin; update direto de saldo bloqueado; inativo sem leitura; último ADMIN protegido; ADJUSTMENT 26→25 delta -1 com motivo. Exatamente 4 movimentos e atores corretos. ROLLBACK; zero fixtures. PASS.
5. **Renato — HTTP attempt 1.** Run `32021726912` falhou inicialmente antes do app: fixture Auth sintético tinha tokens NULL e GoTrue retornou erro de scan. Classificado como fixture inválido, não falha do MVP. Tokens foram normalizados para strings vazias.
6. **Renato — HTTP attempt 2/harness.** Auth hospedado e build passaram; POST do Server Action permaneceu na tela de login. Diagnóstico: harness não simulava corretamente o formulário nativo. Não contabilizado como PASS.
7. **Renato — HTTP attempt 3.** Run `32022074887` adicionou Origin/Referer, mas ainda enviava urlencoded; Server Action não foi despachado. Não PASS.
8. **Renato — HTTP GREEN.** Harness passou a enviar multipart, como o formulário renderizado. Run `32022187217`: Auth por senha, build/start, login Server Action, cookie e rotas protegidas principais PASS.
9. **Renato — logout/final HTTP.** Run `32022300390`: Auth, build/start, login, `/`, `/inventory`, `/movements/new`, `/history`, `/admin/users`, `/admin/adjustment`, `/products`, logout Server Action e invalidação da sessão PASS.
10. **Renato — cleanup.** Fixture HTTP e workflow temporário removidos. Contagens finais: users=0, identities=0, profiles=0, categories=0, products=0, inventory=0, movements=0.
11. **Ricardo — segurança final.** Supabase Security Advisor: `0 lints`.
12. **Carmem/Augusto — PRF final pré-auditoria.** Consolidação da evidência, incluindo tentativas HTTP inválidas sem reclassificá-las como PASS. Handoff → Emily.
13. **Emily — auditoria final.** Pendente.
14. **LÉO — gate final.** Pendente após auditoria.
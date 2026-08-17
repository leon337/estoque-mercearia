# MISSION TRACE — PHASE-06 / M4 — Operação da Loja

1. **MESTRE — contrato.** Recuperou M3 `51398b97…`, classificou M4 como Classe B e delimitou estoque/ENTRY/EXIT/INITIAL; histórico, ajuste e administração ficaram fora do escopo. Handoff → Sofia/Leonardo.
2. **Sofia/Leonardo — desenho.** Materializaram o UX aprovado em `/inventory`, `/movements/new` e launcher na home, mantendo o RPC M3 como autoridade. Handoff → Renato.
3. **Renato — RED.** Commit `f2bcc76…`; CI `32016698099`: install/lint PASS, testes FAIL pela ausência dos arquivos M4, typecheck/build skipped. RED válido. Handoff → Rafael/Helena.
4. **Rafael/Helena — GREEN inicial.** Commit `3e6a99c…` com leitura de estoque, Server Action, formulário e navegação. CI `32016973641` falhou no lint por `setState` síncrono em effect. CAF aplicado.
5. **Rafael/Helena — correção de lifecycle.** UUID inicial passou a vir do server render; effect removido (`de0205b…`, `410d7a9…`). CI `32017089246`: lint PASS; M4 PASS, mas regressão M1 detectou expressão de escopo alterada semanticamente.
6. **Rafael — preservação da regressão M1.** Home voltou à expressão canônica `.eq("id", claimsData.claims.sub)` em `1571778…`. CI `32017152044`: 31/31 testes PASS; typecheck FAIL porque relação `inventory` é array embutido.
7. **Rafael/Helena — normalização de relação.** `inventoryQuantity()` passou a ler a primeira linha embutida (`3c2d9ef…`, `be2e964…`). CI `32017253510`: npm ci, lint, 31/31 testes, typecheck e build PASS.
8. **Renato — smoke hospedado.** Fixture transacional no Supabase: ADMIN INITIAL=5; depois OPERATOR ENTRY +3 e EXIT -2 → saldo 6; três movimentos, ator correto; INITIAL por OPERATOR rejeitado `ADMIN_REQUIRED`; ROLLBACK e cleanup zero. PASS.
9. **Ricardo/Vinícius — revisão.** Nenhum DML direto novo; ação envia só intenção; Security Advisor sem crítico/alto novo e com o WARN esperado do RPC M3; zero threads bloqueantes. Handoff → Carmem/Augusto.
10. **Carmem/Augusto — PRF.** Consolidaram evidências, falhas e recuperações sem reclassificar execuções vermelhas como PASS. Handoff → Emily.
11. **Emily — auditoria.** Pendente de registro final no gate.
12. **LÉO — gate.** Pendente de registro final após auditoria.
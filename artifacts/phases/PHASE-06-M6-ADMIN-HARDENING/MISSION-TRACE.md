# MISSION TRACE — PHASE-06 / M6 — Administração + Hardening

1. **MESTRE/LÉO — contrato e desenho.** M6 Classe B: onboarding pendente, lockout de inativos, gestão de perfis, proteção do último ADMIN, ajuste físico e hardening. Decisão: nenhum segredo administrativo no app; primeiro ADMIN é bootstrap único do owner. Handoff → Renato.
2. **Renato — RED principal.** Commit `afc526795d22b619ce6aeb1fd8d443c686d94773`; CI `32019452922`: install/lint PASS, testes FAIL por implementação ausente, typecheck/build skipped. RED válido. Handoff → Manoel/Rafael/Helena.
3. **Manoel/Rafael/Helena — GREEN inicial.** Commit `1d17089e3b9b759f7b6700296f75d0651798beb5`: migration 0006, registro pendente, users admin, adjustment e navegação. Regressão textual M1/M5 detectada e corrigida em `b48056ac…` preservando `.eq("id", claimsData.claims.sub)`. CI `32019862966`: 39 testes + typecheck/build PASS.
4. **Manoel/Renato/Ricardo — banco real 0006.** Migration `user_admin_hardening` aplicada. Smoke: novos usuários OPERATOR/inativos; inativo sem leitura operacional; OPERATOR sem gestão; último ADMIN protegido; ADMIN aprova usuário; ajuste 10→7 com delta -3 e motivo; rollback zero. PASS.
5. **Ricardo — Advisor.** Detectou WARNs em RPCs públicos SECURITY DEFINER (estoque herdado do M3 e administração novo). Decisão: eliminar avisos evitáveis no milestone de hardening. Handoff → Renato/Manoel.
6. **Renato — RED RPC.** Commit `666f3200…`; CI `32020057858`: install/lint PASS, novo teste FAIL pela ausência da migration 0007. RED válido.
7. **Manoel — GREEN RPC.** Commit `8ef13979…`; migration 0007 move implementações privileged para `private` e recria APIs públicas SECURITY INVOKER. Aplicada no Supabase. Security Advisor passou a `0 lints`. Smoke pós-hardening: wrappers de admin/estoque funcionam; `prosecdef=false` público; rollback zero.
8. **Renato — falso positivo de teste.** CI `32020129985` teve 39 PASS/1 FAIL porque regex alcançou comentário textual `SECURITY DEFINER`; comportamento do banco já PASS. Teste foi escopado aos blocos públicos em `6166b670…` sem enfraquecer a garantia.
9. **Rafael — limpeza lint.** `src/lib/supabase/server.ts` passou a consumir explicitamente o argumento `headers`, removendo warning não funcional; commit `86ceec0b…`. CI `32020303906`: 40/40, lint/typecheck/build PASS.
10. **Renato — RED bootstrap operacional.** Commit `eb6f3e33…`; CI `32020429417`: install/lint PASS, testes FAIL porque runbook do primeiro ADMIN não existia. RED válido.
11. **Carmem/Rafael — GREEN bootstrap.** `docs/operations/FIRST-ADMIN-BOOTSTRAP.md` criado em `0d395e54…`; procedimento owner-only uma vez, depois `/admin/users`; sem segredo versionado. CI `32020498485`: 41/41 testes, lint/typecheck/build PASS.
12. **Ricardo/Vinícius — revisão final.** Advisor `0 lints`; público SECURITY INVOKER; privado SECURITY DEFINER; authenticated execute somente nos caminhos previstos; anon/service_role sem execute; zero threads bloqueantes. Handoff → Carmem/Augusto.
13. **Carmem/Augusto — PRF.** Consolidam trilha sem reclassificar REDs/falso positivo como PASS. Handoff → Emily.
14. **Emily — auditoria.** Pendente de registro final.
15. **LÉO — gate.** Pendente após auditoria.
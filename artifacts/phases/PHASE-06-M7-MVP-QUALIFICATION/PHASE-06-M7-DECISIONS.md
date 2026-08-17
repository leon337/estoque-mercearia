# PHASE-06 / M7 — DECISIONS

1. M7 não adiciona funcionalidade; apenas qualifica M0–M6.
2. O cenário canônico obrigatório é INITIAL20 + ENTRY10 - EXIT4 = 26, seguido de ADJUSTMENT para 25.
3. Evidência de banco e HTTP são independentes: integridade/autorização no PostgreSQL e sessão/rotas no Next.js real.
4. Tentativas HTTP com fixture ou encoding incorretos permanecem registradas como NOT PASS e não contam para o gate.
5. O run final HTTP `32022300390` é a evidência de sessão de ponta a ponta: Auth, login, cookie, rotas e logout.
6. Security Advisor final deve permanecer em zero lints.
7. Toda fixture de qualificação deve retornar a zero antes do gate.
8. Backup lógico e restauração são requisitos operacionais documentados, sem armazenar connection strings ou dumps no Git.
9. Primeiro ADMIN continua owner-only e one-time; não é fluxo administrativo diário.
10. `MVP_PRONTO_VALIDADO` significa produto técnico qualificado. Não significa deploy/release público.
11. Release público exige HUMAN_GATE separado de LEANDRO.

## Auditoria final
**Emily: APROVADO.** CI do PRF `32022615896` verde; aceite hospedado completo PASS; HTTP final `32022300390` PASS; cleanup zero; Security Advisor `0 lints`; nenhum achado bloqueante.

## Gate final
**LÉO: APROVAR → `MVP_PRONTO_VALIDADO`.** Integração autorizada após manifesto SHA-256, CI final do HEAD e zero threads bloqueantes. O gate não autoriza publicação pública.
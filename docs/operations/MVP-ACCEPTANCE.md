# MVP Acceptance — Estoque Mercearia

> **Documento histórico de critérios da PHASE-06/M7.** Os itens abaixo preservam o checklist original e **não representam o estado atual do projeto**. O MVP foi qualificado, publicado na PHASE-07, redesenhado na PHASE-08 e recebeu smoke E2E autônomo na PHASE-09. Para o estado atual, consulte [`../CURRENT-STATE.md`](../CURRENT-STATE.md) e confirme itens voláteis no GitHub/produção live.

O MVP só pode ser declarado pronto quando todos os itens abaixo possuem evidência verificável.

## Funcional

- [ ] login e logout por e-mail/senha;
- [ ] novo cadastro fica pendente/inativo até aprovação;
- [ ] ADMIN aprova usuários e define `ADMIN` / `OPERATOR`;
- [ ] cadastro e busca de categorias/produtos;
- [ ] produto possui código interno, unidade e estoque mínimo;
- [ ] inventário inicial ADMIN-only;
- [ ] entrada e saída operacionais;
- [ ] saída não permite estoque negativo;
- [ ] ajuste físico ADMIN-only com motivo;
- [ ] histórico preserva ator, data, saldo anterior, delta e saldo resultante;
- [ ] dashboard mostra ativos, zerados e estoque baixo.

## Cenário canônico de estoque

1. criar produto de teste;
2. `INITIAL 20` → saldo 20;
3. `ENTRY 10` → saldo 30;
4. `EXIT 4` → saldo 26;
5. comprovar **20 + 10 − 4 = 26** com três movimentos rastreáveis;
6. repetir a mesma intenção/idempotency key e provar que não duplica movimento;
7. tentar saída acima do saldo e comprovar `STOCK_INSUFFICIENT` / bloqueio de estoque negativo;
8. `ADJUSTMENT` para contagem física **25**, com motivo obrigatório → saldo 25 e delta -1;
9. histórico final contém quatro movimentos e atores corretos.

## Autorização

- [ ] usuário inativo não lê dados operacionais;
- [ ] OPERATOR consulta estoque/produtos e registra ENTRY/EXIT;
- [ ] OPERATOR não chama gestão administrativa nem ADJUSTMENT;
- [ ] ADMIN executa INITIAL, ADJUSTMENT e administração;
- [ ] tentativa de remover/rebaixar o **último ADMIN** é rejeitada por `LAST_ACTIVE_ADMIN`;
- [ ] nenhum ator ou saldo resultante autoritativo é aceito do navegador;
- [ ] `service_role` ou equivalente não aparece no runtime do MVP.

## Integridade e segurança

- [ ] `inventory` possui no máximo uma linha por produto;
- [ ] `stock_movements` é append-only para a aplicação;
- [ ] `operation_id` é único e replay é idempotente;
- [ ] RPCs públicos expostos são `SECURITY INVOKER`;
- [ ] implementações privilegiadas permanecem no schema privado;
- [ ] RLS impede acesso operacional de usuário inativo;
- [ ] **Security Advisor** sem achado crítico/alto; meta M7: zero lints;
- [ ] fixtures de qualificação são removidos/rollback após testes.

## Qualidade

- [ ] `npm ci` PASS;
- [ ] `npm run lint` PASS;
- [ ] `npm test` PASS;
- [ ] `npm run typecheck` PASS;
- [ ] `npm run build` PASS;
- [ ] rotas principais compilam no build;
- [ ] estados e status críticos possuem texto, não dependem somente de cor;
- [ ] fluxos operacionais possuem confirmação antes de alterar estoque.

## Operação

- [ ] `FIRST-ADMIN-BOOTSTRAP.md` disponível;
- [ ] `MVP-RUNBOOK.md` disponível;
- [ ] processo de backup lógico documentado;
- [ ] processo de restauração documentado;
- [ ] `.env.example` contém somente variáveis públicas permitidas;
- [ ] release/deploy público não é confundido com qualificação técnica do MVP.

## Gate final histórico

A sequência final prevista era: cenário hospedado completo → CI final → Security Advisor → auditoria Emily → gate LÉO → merge M7 → verificação pós-merge da `main`.

Resultado terminal pretendido naquele boundary: `MVP_PRONTO_VALIDADO`, sem alegar publicação pública. Esse boundary foi posteriormente sucedido pelas PHASE-07, PHASE-08 e PHASE-09.

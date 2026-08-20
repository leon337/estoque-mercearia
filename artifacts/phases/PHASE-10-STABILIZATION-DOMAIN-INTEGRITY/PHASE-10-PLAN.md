# PHASE-10 — Plano de estabilização, integridade de domínio e reconciliação

## Missão
Alinhar código, documentação, configuração do repositório e comportamento de produção antes de iniciar novas funcionalidades.

## Risco
Classe B — alterações de regra de negócio de estoque, migrations, CI, configuração de repositório e validação em produção, sem operação destrutiva deliberada.

## Escopo
- P10.1 — reconciliar documentação pós-PHASE-09;
- P10.2 — impor precisão de quantidade coerente com unidade;
- P10.3 — endurecer CI e fluxo de integração;
- P10.4 — corrigir e proteger precisão de estoque mínimo;
- concluir HUMAN_GATE de branch padrão e proteção de `main`;
- executar smoke final e gerar PRF de fechamento.

## Fora de escopo
- vendas/PDV;
- fornecedores/compras;
- financeiro;
- multi-loja;
- redesign adicional;
- enfraquecimento de Auth/RLS.

## Critérios de aceite
1. README e `docs/CURRENT-STATE.md` distinguem estado atual de snapshots históricos.
2. `11.000001 UN` é rejeitado em UI e no boundary autoritativo.
3. quantidades são apresentadas em pt-BR.
4. `minimum_stock` respeita a precisão da unidade em UI/servidor/banco.
5. regressão CI verde no HEAD qualificado.
6. Production Smoke E2E final verde.
7. `default_branch=main`.
8. `main` protegida por ruleset ativo, PR obrigatório e check `verify`.
9. PRF Classe B completo e gate interno final registrado.

## Agentes de fechamento
- MESTRE — coordenação e fechamento;
- Miriam — recuperação do estado live e precedência;
- Renato — validações;
- Augusto — mission trace;
- Carmem — consistência documental do PRF;
- Emily — auditoria de suficiência;
- LÉO — decisão do gate interno.

## Fonte de verdade
1. instrução atual de LEANDRO;
2. GitHub/Render/Supabase live;
3. código, testes e workflows do SHA aplicável;
4. protocolo MCF vigente;
5. evidências históricas.

## Baseline de fechamento
`main@326d1b2059e77253bac446ff111b297a3e428a71` antes do commit documental de closeout.

## Autorizações e proibições
- escrita somente em branch de fechamento + PR;
- não escrever diretamente em `main`;
- não declarar `ENTREGUE` com smoke final ou check `verify` pendente;
- não expor secrets/credenciais;
- não alterar dados de produção no fechamento documental.

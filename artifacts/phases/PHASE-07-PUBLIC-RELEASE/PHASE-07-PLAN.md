# PHASE-07 — Public Release

## Contrato

- mission_id: ESTOQUE-MERCEARIA-001
- phase_id: PHASE-07-PUBLIC-RELEASE
- objective: publicar o MVP validado em um endpoint público sem ampliar o escopo funcional nem expor credenciais privilegiadas.
- expected_outcome: serviço público funcional, smoke validado e rollback conhecido.
- risk_class: C
- source_of_truth: main @ fcd06b3b63cbd1b6b1018c765746e6a66e2e4066; MCF v1.1 @ 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef.
- authorization: HUMAN_GATE explícito de Leandro em 2026-08-17 para publicação/deploy público.

## Escopo

- criar trilha de release separada;
- publicar exatamente o conteúdo validado de `main`;
- usar hospedagem sem novo custo (`free`);
- configurar somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- executar smoke público e revisar logs/segurança;
- documentar deploy, rollback, evidências, auditoria e gate final.

## Fora de escopo

- novas funcionalidades;
- custom domain pago;
- alteração do banco além das migrations já aplicadas;
- uso de `service_role`, senha de banco ou segredo administrativo no runtime;
- mudança de modelo de autorização.

## Critérios de aceite

1. deploy público conclui com status operacional;
2. `/login` responde publicamente;
3. rotas protegidas não expõem conteúdo sem sessão;
4. aplicação consegue alcançar o Supabase hospedado sem credencial privilegiada;
5. Security Advisor permanece sem lints bloqueantes;
6. nenhum fixture/teste residual é deixado no banco;
7. procedimento de rollback fica documentado;
8. PRF Classe C completo e auditado;
9. gate final de LÉO = APROVAR.

## Agentes

- MESTRE: coordenação e continuidade;
- Gabriel: branch/PR/release;
- Bruno: deploy e observabilidade;
- Ricardo: segurança e segredos;
- Renato: smoke e validação;
- Júlia: governança da exposição pública;
- Augusto: mission trace Classe C;
- Carmem: PRF;
- Emily: auditoria independente;
- LÉO: gate operacional.

## Plano

PLAN → internal approval → deploy free → smoke público → logs/security → rollback readiness → PRF → audit → LÉO gate → merge da documentação de release.

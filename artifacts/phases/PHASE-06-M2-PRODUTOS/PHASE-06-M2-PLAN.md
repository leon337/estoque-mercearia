# PHASE-06 / M2 — PLAN

## Objetivo
Implementar categorias e produtos do MVP, permitindo cadastro, edição, consulta, busca e ativação/inativação com autorização ADMIN/OPERATOR e persistência protegida por RLS.

## Escopo
- `public.categories`;
- `public.products`;
- código interno obrigatório e único;
- código de barras opcional e único quando informado;
- nome obrigatório;
- categoria opcional;
- unidade obrigatória;
- estoque mínimo não negativo;
- estado ativo/inativo sem exclusão física pela aplicação;
- ADMIN cria/edita/ativa/inativa categorias e produtos;
- OPERATOR consulta produtos ativos;
- busca por nome ou código interno;
- páginas web responsivas de listagem, cadastro e edição.

## Fora de escopo
Saldo de estoque, inventário, entrada, saída, ajuste, histórico de movimentações, dashboard de estoque, integração fiscal/POS e fornecedores.

## Critérios de aceite
- migration cria tabelas e constraints sem quebrar M1;
- RLS habilitado nas duas tabelas;
- nenhuma policy de DELETE para categorias/produtos;
- ADMIN pode inserir e atualizar;
- OPERATOR pode consultar registros ativos, sem escrever;
- código interno é único sem diferenciar maiúsculas/minúsculas;
- barcode vazio é persistido como `NULL` e barcode preenchido é único;
- `minimum_stock >= 0`;
- busca por nome ou código funciona;
- cadastro/edição exige ADMIN em aplicação e banco;
- inativação preserva o registro;
- CI: `npm ci`, lint, testes, typecheck e build verdes;
- migration e RLS validados no Supabase real;
- smoke funcional mínimo concluído;
- PRF Classe B completo.

## Riscos
Escalada de permissão, duplicidade por normalização de código, barcode vazio tratado como valor único, exclusão indevida, busca vulnerável a filtro bruto, referência a categoria inativa e ampliação acidental para estoque.

## Agentes selecionados
- MESTRE: coordenação e gate interno;
- Rafael: implementação e integração;
- Manoel: schema, constraints, migration e RLS de dados;
- Helena: páginas e formulários conforme UX aprovado;
- Renato: TDD, regressões, CI e smoke;
- Ricardo: autorização, policies e risco residual;
- Vinícius: code review;
- Augusto: mission trace obrigatório Classe B;
- Carmem: consistência do PRF;
- Gabriel: branch, PR, CI e integração;
- Emily: auditoria independente.

## Fluxo
PLANO → RED → IMPLEMENTAÇÃO → GREEN → BANCO REAL → REVIEW → PRF → AUDITORIA → GATE → MERGE.

## Autorizações
`SCOPED_WRITE` somente em `feature/m2-products`. Proibido escrever diretamente em `main` ou integrar antes de CI, auditoria e gate.

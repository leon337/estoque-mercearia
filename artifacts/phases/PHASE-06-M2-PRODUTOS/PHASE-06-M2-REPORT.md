# PHASE-06 / M2 — REPORT

## Entrega técnica
- branch: `feature/m2-products`;
- PR: #4;
- implementation HEAD: `c932a26ac2bd80d6ab3dbbb230f21b3434b2aff0`;
- migration hospedada: `20260817072340 / products`;
- Supabase project: `exwtngpwqgkrkoszpgib`.

## Implementado
- categorias com nome único case-insensitive, ativo/inativo e preservação de registro;
- produtos com código interno único case-insensitive, barcode opcional/único, nome, categoria, unidade, estoque mínimo e ativo/inativo;
- FK de produto para categoria com `ON DELETE RESTRICT`;
- RLS nas duas tabelas;
- sem policy de DELETE;
- ADMIN com escrita; OPERATOR com leitura de registros ativos;
- busca por nome e código interno sem filtro `.or()` bruto;
- cadastro, edição, ativação/inativação e listagem responsiva;
- barcode vazio normalizado para `NULL`;
- categoria ativa obrigatória para criar, editar ou reativar produto;
- categoria não pode ser inativada enquanto houver produto ativo usando-a;
- mensagens específicas para categoria inativa/em uso.

## Validação hospedada
No Supabase real:
- migration aplicada com sucesso;
- Security Advisor: zero lints;
- OPERATOR ao inserir categoria: bloqueado por RLS (`42501`);
- ADMIN criou categoria/produto;
- código interno duplicado ignorando caixa/espaços: bloqueado (`23505`);
- estoque mínimo negativo: bloqueado (`23514`);
- barcode duplicado: bloqueado (`23505`);
- OPERATOR não alterou produto;
- produto inativo ficou oculto ao OPERATOR;
- fixtures removidos, com contagens finais zero.

## TDD/CI
- RED inicial: run `32005141108`;
- GREEN inicial: run `32005478465`;
- RED de consistência de categoria: run `32005884754`;
- GREEN: run `32005950199`;
- RED final de reativação/mensagens: run `32007530229`;
- GREEN final: run `32007742548`.

## Smoke de interface
O smoke E2E hospedado foi impedido pelo rate limit de e-mail do Supabase antes de criar usuário. Tentativas em Supabase local validaram startup, migrations, criação de fixtures e build, mas apresentaram comportamento de sessão/perfil incompatível com o fluxo hospedado já validado no M1. O harness local foi aposentado e **não é contabilizado como PASS**.

Cobertura substituta aceita para este gate:
- Auth/SSR hospedado já validado no M1, sem alteração funcional no login;
- regras de produtos validadas por TDD e CI;
- migration/RLS/constraints validados no Supabase hospedado;
- build real do Next.js verde;
- revisão de código sobre autorização, integridade e interface.

## Auditoria e gate
- Emily: `APROVADO COM RESSALVA`; zero achados críticos/altos.
- Ressalva: E2E completo de escrita pela UI permaneceu inconclusivo e não é contabilizado como PASS.
- LÉO: `APROVAR_COM_RESSALVA`; integração liberada após CI final do registro documental.

## Estado
Aprovado para integração com ressalva explicitamente preservada.

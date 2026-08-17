# PHASE-08 / P8.1 — Relatório de execução

## Estado
`MERGE_AUTHORIZED_PENDING_EXECUTION`

## Execução observável
1. contrato RED inicial criado;
2. tokens, fontes e primitives implementados;
3. AppShell, sidebar e navegação mobile implementados;
4. dashboard envolvido pelo AppShell sem reescrita das queries/regras;
5. incompatibilidade de typed routes corrigida com tipo literal `AppRoute`;
6. revisão interna corrigiu persistência da sidebar e agrupamento `/admin/*` via RED→GREEN;
7. gate técnico inicial passou;
8. PRF MCF foi criado e o PR marcado Ready for review;
9. revisão Codex encontrou P1 no cascade CSS e P2 no manifest;
10. P1 foi reproduzido por novo teste: CI `32073167386`, 53/54 PASS;
11. P1 foi corrigido removendo `a { color: inherit; }`: CI `32073240183`, 54/54 PASS, lint/typecheck/build PASS;
12. P2 foi corrigido por recálculo dos hashes; a verificação integral encontrou também o hash de REPORT incorreto;
13. LEANDRO autorizou explicitamente o merge do PR #14.

## Escopo alterado
Código/apresentação:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ui/*`
- `src/components/shell/*`
- `tests/p8-design-system-foundation.test.mjs`

Documentação:
- `docs/superpowers/specs/*`
- `docs/superpowers/plans/*`
- este PRF.

## Escopo preservado
Sem mudanças em migrations, `src/lib/supabase`, proxy, `actions.ts`, núcleo de inventory, `package.json` ou `package-lock.json`.

## Segurança e funcionalidade
`NO DB/RLS/AUTH/BUSINESS RULE CHANGE`

## Revisão externa
Codex GitHub review: P1 e P2 corrigidos antes do merge.

## Lacuna transferida
Não existe preview autenticado da branch para validação visual real em viewports mobile e desktop. Essa verificação permanece como ressalva pós-integração/primeiro ambiente autorizado.

## Autorização
Merge do PR #14: autorizado por LEANDRO em 2026-08-17.
Deploy manual adicional: não autorizado.

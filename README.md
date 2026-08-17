# Estoque Mercearia

MVP web de controle de estoque para uma pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

## Escopo do MVP

Roadmap de implementação:

- **M0 — Fundação:** Next.js, TypeScript, CI e estrutura base.
- **M1 — Auth + Banco Base:** login, perfis, ADMIN/OPERATOR e RLS.
- **M2 — Produtos:** categorias, produtos, busca, estoque mínimo e ativação.
- **M3 — Núcleo de Estoque:** saldo, INITIAL, ENTRY, EXIT, ADJUSTMENT, atomicidade, idempotência e histórico.
- **M4 — Operação da Loja:** estoque atual e interface de entrada/saída/inventário inicial.
- **M5 — Histórico + Dashboard:** filtros, rastreabilidade, estoque zerado/baixo.
- **M6 — Administração + Hardening:** cadastro pendente, usuários, ajuste físico, last-admin guard e hardening dos RPCs.
- **M7 — Qualificação:** runbook, backup/recuperação, aceite completo, CI, segurança e gate final do MVP.
- **Phase 07 — Public Release:** deploy público, correções de segurança/roteamento encontradas no smoke real e qualificação do endpoint de produção.

## Stack

- Next.js + React
- TypeScript
- Tailwind CSS
- PostgreSQL / Supabase
- Supabase Auth + RLS
- GitHub Actions
- Render

## Requisitos locais

- Node.js >= 20.9
- npm

## Configuração

Copie `.env.example` para `.env.local` e preencha apenas:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Não versione `.env.local`, senha do banco, chaves administrativas ou outros segredos.

## Comandos reproduzíveis

```bash
npm ci
npm run lint
npm test
npm run typecheck
npm run build
npm run dev
```

A CI executa a mesma sequência essencial usando `npm ci`.

## Operação

- Runbook completo: `docs/operations/MVP-RUNBOOK.md`
- Bootstrap único do primeiro administrador: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`
- Checklist de qualificação: `docs/operations/MVP-ACCEPTANCE.md`

Fluxo inicial: criar o primeiro usuário em `/register`, executar o bootstrap owner-only do primeiro ADMIN, cadastrar produtos, registrar `INITIAL` e conferir estoque/histórico. Depois disso, aprovações de usuários ocorrem em `/admin/users`.

## Segurança

O navegador envia intenção, nunca o saldo autoritativo ou o ator da movimentação. Alterações de estoque passam pelos RPCs controlados; APIs públicas privilegiadas são wrappers `SECURITY INVOKER` e as implementações privilegiadas ficam em schema privado. Usuários inativos não possuem acesso operacional.

Nunca versionar credenciais reais, dumps de produção ou chaves privilegiadas.

## Backup e recuperação

O `MVP-RUNBOOK.md` define backup lógico periódico com Supabase CLI (`supabase db dump`) e armazenamento fora do ambiente principal, além do procedimento de restauração e validação pós-restore.

## Release

Produção pública: https://estoque-mercearia.onrender.com

A Phase 07 publica o MVP qualificado em Render e mantém evidências de deploy, smoke público, segurança, rollback, auditoria e gate em `artifacts/phases/PHASE-07-PUBLIC-RELEASE/`.

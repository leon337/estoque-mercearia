# Estoque Mercearia

MVP de controle de estoque para uma pequena mercearia.

## Estado atual

`PHASE-06 / M0 — Fundação`

Este milestone prepara a base técnica. Ainda não implementa autenticação, produtos ou movimentações de estoque.

## Stack aprovada

- Next.js + TypeScript
- React
- Tailwind CSS
- PostgreSQL/Supabase a partir dos milestones de dados
- GitHub Actions para CI

## Requisitos locais

- Node.js >= 20.9
- npm

## Comandos

```bash
npm install
npm run dev
npm run lint
npm test
npm run typecheck
npm run build
```

## Segurança

Nunca versionar `.env` real, credenciais, service-role keys ou outros segredos. O arquivo `.env.example` deve conter somente nomes/documentação de variáveis permitidas.

## Observação do bootstrap

O ambiente usado para preparar este patch não conseguiu alcançar o registro npm. Por isso, o `package-lock.json` ainda não pôde ser gerado nem o `next build` executado localmente. O primeiro ambiente com acesso ao npm deve executar `npm install`, versionar o lockfile e então exigir instalação reprodutível na CI.

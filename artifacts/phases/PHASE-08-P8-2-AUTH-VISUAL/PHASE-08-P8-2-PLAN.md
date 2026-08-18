# PHASE-08 / P8.2 — Plano

## Objetivo
Redesenhar `/login` e `/register` com o Design System v1, preservando integralmente autenticação, redirects, Supabase, aprovação de usuários e Server Actions.

## Risco
`B` — páginas públicas de autenticação são alteradas visualmente, sem mudança de comportamento de autenticação.

## Escopo
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/components/auth/AuthCard.tsx`
- testes P8.2

## Fora de escopo
- migrations;
- RLS;
- `src/app/login/actions.ts`;
- `src/app/register/actions.ts`;
- proxy;
- dependências;
- regras de autenticação/aprovação.

## Aceite
- Design System v1 aplicado às duas páginas;
- fluxo funcional preservado;
- touch targets >= 48px;
- feedback acessível;
- contraste de controles/texto atendido;
- lint, testes, typecheck e build verdes;
- revisão de código tratada;
- gate MCF registrado.

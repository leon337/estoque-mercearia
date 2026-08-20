# PHASE-11 Suppliers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar cadastro de fornecedores e vínculo produto-fornecedor com segurança e evidência de produção.

**Architecture:** Next.js Server Components/Actions sobre Supabase Auth + RLS. `suppliers` e `product_suppliers` são persistidos por migration 0010; mutações exigem ADMIN; páginas reutilizam o Design System v1.

**Tech Stack:** Next.js 16.3.1, React 19, TypeScript, Supabase/PostgreSQL, Node test, GitHub Actions, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-20-phase11-suppliers-design.md`

## Global Constraints
- Sem DELETE de fornecedor/vínculo pela aplicação.
- Sem dependência nova.
- Sem pedido de compra, custo ou venda nesta fase.
- TDD RED antes de código de produção.
- `verify` e Production Smoke obrigatórios antes do encerramento.

---

### Task 1: Contratos RED
**Files:** Create `tests/p11-suppliers.test.mjs`.
- [ ] Exigir migration, actions, páginas, navegação e seed route do smoke.
- [ ] Fazer push e capturar CI RED causado apenas pela ausência da feature.

### Task 2: Persistência e RLS
**Files:** Create `supabase/migrations/0010_suppliers.sql`.
- [ ] Criar `suppliers` e `product_suppliers` com constraints e índices.
- [ ] Habilitar RLS, revogar anon/DELETE e permitir mutação somente a ADMIN.
- [ ] Manter leitura autenticada apropriada.

### Task 3: Server Actions
**Files:** Create `src/app/suppliers/actions.ts`.
- [ ] Implementar `createSupplier`, `updateSupplier`, `toggleSupplierActive`, `upsertProductSupplier`, `toggleProductSupplierActive`.
- [ ] Validar entrada, ADMIN, unicidade e fornecedor/produto ativos.
- [ ] Revalidar rotas afetadas e mapear erros por query string.

### Task 4: UI
**Files:** Create `src/app/suppliers/page.tsx`, `src/app/suppliers/new/page.tsx`, `src/app/suppliers/[id]/edit/page.tsx`, `src/components/suppliers/SupplierFormFields.tsx`; modify navigation/mobile nav.
- [ ] Listar/pesquisar fornecedores.
- [ ] Cadastrar/editar/inativar com campos aprovados.
- [ ] Gerenciar vínculos com produtos e fornecedor preferencial.
- [ ] Tornar a navegação móvel escalável.

### Task 5: Smoke e qualificação
**Files:** Modify `scripts/e2e/smoke-lib.mjs`; create PRF `artifacts/phases/PHASE-11-SUPPLIERS/`.
- [ ] Adicionar rotas de fornecedores ao inventário do smoke.
- [ ] Obter CI GREEN no HEAD.
- [ ] Aplicar migration ao Supabase hospedado e validar constraints/RLS.
- [ ] Abrir PR, obter `verify`, integrar, aguardar deploy e executar Production Smoke PASS.
- [ ] Fechar Issue #28 e transferir checkpoint para PHASE-12.

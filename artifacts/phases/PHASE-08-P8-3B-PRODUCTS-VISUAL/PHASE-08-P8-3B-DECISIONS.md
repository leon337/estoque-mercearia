# PHASE-08 / P8.3b — Decisões

1. Preservar integralmente queries, Server Actions e regras de produto/categoria.
2. Reutilizar o Design System v1 e o AppShell em todas as três rotas de Produtos.
3. Manter links de navegação como `Link`; usar `Button` nas ações de formulário/mutação.
4. Extrair apenas os seis campos repetidos para `ProductFormFields`, sem Supabase, estado ou regra de domínio.
5. Atualizar o teste legado M2 para seguir a nova localização estrutural dos mesmos campos, sem remover nenhuma garantia.
6. Manter busca por nome e código interno sem `.or()` bruto e filtro de status somente para ADMIN.
7. Classificar P8.3b como risco B: mudança visual em rotas autenticadas operacionais, sem alteração de segurança ou domínio.
8. LÉO: `APROVAR_COM_RESSALVAS`; a ressalva é o smoke visual autenticado mobile/desktop, a ser consolidado em P8.6 se não houver sessão disponível antes.
9. A autorização contínua da PHASE-08 permite merge e acompanhamento do auto-deploy sem novo HUMAN_GATE, desde que CI e revisão final estejam verdes.

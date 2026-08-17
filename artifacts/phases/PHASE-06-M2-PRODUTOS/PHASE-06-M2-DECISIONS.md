# PHASE-06 / M2 — DECISIONS

1. Manter M2 restrito a cadastro mestre de categorias/produtos; saldo e movimentações permanecem fora de escopo.
2. Usar tabelas `categories` e `products` com preservação de registros, sem DELETE pela aplicação.
3. Código interno é único case-insensitive; barcode é opcional e único quando presente.
4. Barcode vazio é normalizado para `NULL`.
5. ADMIN escreve; OPERATOR consulta somente registros ativos.
6. Busca por nome/código usa consultas `.ilike()` separadas e merge por ID, evitando filtro OR bruto.
7. Produto só pode criar/editar/reativar com categoria ativa.
8. Categoria só pode ser inativada se nenhum produto ativo a utilizar.
9. Falhas do smoke hospedado/local foram registradas como limitações do harness; não foram convertidas em PASS.
10. A ausência de E2E completo de escrita pela UI será apresentada a Emily como limitação residual explícita, sustentada por DB/RLS hospedado, TDD, CI e build.
11. Workflow local temporário será removido antes do gate/merge.
12. Emily auditou o PR #4: `APROVADO COM RESSALVA`, sem achados críticos/altos.
13. LÉO decidiu `APROVAR_COM_RESSALVA` e liberar integração após CI final verde.
14. A ressalva do E2E de escrita pela UI permanece no checkpoint e não pode ser reinterpretada como PASS em fases posteriores.

# PHASE-11 — Decisões

1. **Fornecedor é domínio mestre independente.** Compras, custos/preços e vendas permanecem fases posteriores.
2. **Sem DELETE pela aplicação.** O lifecycle usa ativação/inativação para preservar rastreabilidade.
3. **Mutações exigem ADMIN em duas camadas.** Server Actions e RLS aplicam defesa em profundidade.
4. **Fornecedor preferencial é único por produto.** A regra é autoritativa no banco por índice parcial único.
5. **Navegação móvel deve degradar sem escape de viewport.** O primeiro smoke pós-merge revelou o problema; a PR #30 corrigiu e requalificou o comportamento.
6. **Smoke de produção é gate obrigatório.** A fase só é declarada qualificada pelo run final `32483860330` em `main@f08c760...`.
7. **Autorização contínua PHASE-11 → PHASE-14 permanece consumível.** Nenhum HUMAN_GATE adicional foi necessário dentro deste boundary.

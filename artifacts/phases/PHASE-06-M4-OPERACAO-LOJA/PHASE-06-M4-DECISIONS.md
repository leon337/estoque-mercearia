# PHASE-06 / M4 — DECISIONS

1. O banco continua autoridade do saldo; M4 não cria mutation SQL.
2. `registerMovementAction` aceita somente ENTRY, EXIT e INITIAL; ADJUSTMENT permanece M6.
3. INITIAL é oferecido e validado em aplicação somente para ADMIN; o RPC mantém a segunda barreira autoritativa.
4. `operation_id` é gerado por intenção e enviado ao wrapper existente.
5. Preview de saldo é apenas informativo; o resultado real vem do RPC.
6. Estados ZERADO/BAIXO/OK são textuais para não depender de cor.
7. O teste M1 de escopo de perfil foi preservado em vez de enfraquecido quando uma refatoração equivalente alterou sua expressão canônica.
8. Relações Supabase embutidas são normalizadas como array para type safety.
9. O WARN M3 de SECURITY DEFINER permanece conhecido, intencional e sem agravamento no M4.
10. M5 inicia automaticamente após merge porque existe autorização contínua M4→M7.

## Auditoria independente
**Emily: APROVADO.** CI e smoke efetivos, zero resíduo e nenhum achado crítico/alto ou thread bloqueante.

## Gate operacional
**LÉO: APROVAR** → `APROVADO_PARA_INTEGRACAO`.
Condições finais: manifesto SHA-256, CI verde do HEAD final e zero threads bloqueantes.

# M5 REPORT

Entregue histórico filtrável e dashboard operacional sem nova mutação.

- Histórico: filtros server-side por produto, tipo, ator e período; exibe data/hora Recife, produto/código, tipo, saldo anterior, delta, saldo resultante, ator e motivo; limite de 200 mais recentes.
- Dashboard: produtos ativos, estoque zerado, estoque baixo e lista urgente, preservando launcher operacional e expressão de escopo M1.
- Segurança: RLS existente preservada; perfil de outro ator não é ampliado para OPERATOR, usando identificador estável como fallback.

Evidência: RED `32018205694`; GREEN `32018436703`; smoke Supabase hospedado PASS; cleanup zero; nenhum crítico/alto novo.
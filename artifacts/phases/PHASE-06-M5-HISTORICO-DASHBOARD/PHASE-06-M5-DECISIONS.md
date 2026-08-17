# M5 DECISIONS

1. M5 é estritamente read-only e não adiciona migration/RPC/DML.
2. Histórico aplica filtros no servidor e limita a 200 registros mais recentes.
3. Datas do filtro são interpretadas no fuso operacional `-03:00`; exibição usa `America/Recife`.
4. Perfis de outros atores não são liberados a OPERATOR. Quando a RLS não fornece nome, a UI identifica o ator por prefixo estável do UUID.
5. Dashboard calcula zerado/baixo a partir de `products + inventory`; não duplica saldo em nova tabela.
6. A expressão canônica de escopo de perfil da home permanece intacta para preservar a regressão M1.
7. M6 inicia automaticamente após gate/merge.

## Auditoria
Pendente Emily.

## Gate
Pendente LÉO.
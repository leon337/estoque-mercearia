# PHASE-06 / M1 — REPORT

## Execução
- M0 integrado em `main`: `9c45d652704b7df2f8af2000ba11250ebac41634`.
- PR acidental #2 (`noop`) foi fechado sem merge e sem efeito no código.
- branch `feature/m1-auth-base` criada a partir da `main`.
- PR draft #3 aberto.
- RED inicial: `828db0bed67ac164e0a99aee5d00605b17b43209`; CI falhou nos testes como esperado.
- critério inseguro de role em metadata corrigido: `8f878508ce3f05692dd50cd7d744f17c8a638d51`.
- GREEN inicial: `2c46e76615243b25b68ce4f2031f24eaa523b8c4`; CI verde.
- code review encontrou leitura de `profiles` sem filtro, incompatível com ADMIN lendo várias linhas.
- RED de regressão: `671dd4770a12098340bd22d927a35cb782f18682`; CI `32001394273` falhou em testes.
- correções de escopo: `05af9d2c8cc800a7c328c119a66a0fcedea0fe30` e `6d0327fe0d28479c5659a0c0a73ab3093dac879a`; CI verde.
- revisão de segurança identificou necessidade de manter função privilegiada fora de schema exposto.
- RED de segurança: `47a820e49d4f7c6140e3a085ef1491e7db275438`; CI `32001534801` falhou em testes.
- GREEN de segurança: `29cd988345c2d2ef43f255c2745eaf2f9c27591b`; CI verde.
- refactor do trigger privilegiado para `private`: `abc421c47ccb430a5d3706b92a5c6e9081c4a99a`; CI `32001672763` verde.

## Estado
Código e migration estão validados estaticamente e por build. Falta projeto Supabase dedicado para aplicar migration e executar smoke real de Auth/RLS.

## Pendências
- escolher organização Supabase e confirmar eventual custo antes de criar projeto;
- aplicar migration;
- criar primeiro usuário/ADMIN e OPERATOR de teste;
- validar políticas em banco real;
- `package-lock.json` segue como dívida de reprodutibilidade herdada do M0.

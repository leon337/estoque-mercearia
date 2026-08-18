# PHASE-08 / P8.3a — Relatório

## Entrega

O dashboard `/` foi redesenhado sobre o AppShell existente. As três métricas continuam derivadas dos mesmos produtos ativos. O bloco `Atenção no estoque` mantém o mesmo conjunto urgente e o limite de 8 itens. A lateral concentra ações rápidas e Administração continua condicionada ao papel `ADMIN`.

## TDD

- RED inicial `871b61b7...` / CI `32092755741`: 60/63 PASS; somente 3 contratos visuais P8.3a falharam.
- RED refinado `b927f4d3...` / CI `32092823526`: 60/63 PASS; contrato funcional P8.3a permaneceu PASS.
- GREEN inicial `ed51a7c6...` / CI `32092898087`: 63/63 PASS + lint/typecheck/build.
- Codex encontrou 1 P2 válido: conflito `p-4`/`p-0` no `DataCard`.
- RED da revisão `6ec391ec...` / CI `32093205129`: 63/64 PASS; falha somente no novo contrato de padding.
- GREEN da revisão `ab3b708a...` / CI `32093280676`: 64/64 PASS + lint/typecheck/build.
- Correção: `DataCard` recebeu API explícita `padding="default" | "none"`; o card de alertas usa `padding="none"`.

## Boundary

Código qualificado: `ab3b708a62d8014fef9b7f4cc10e9ce009e16ebe`.

Nenhuma migration, RLS, Server Action, integração Supabase, proxy, dependência ou regra de estoque foi alterada. A única ampliação de primitive é retrocompatível: `DataCard` mantém `padding="default"` como padrão.

## Gate

LÉO: `APROVAR_COM_RESSALVAS`.

Ressalva: smoke visual autenticado mobile/desktop não é possível no preview de PR e deve ser materializado após merge ou consolidado em P8.6. A autorização contínua PHASE-08 cobre merge e auto-deploy quando o HEAD final estiver verde e sem novo bloqueio.

# PHASE-08 / P8.1 — Auditoria de gate

## Escopo da auditoria
Revisão de:
- diff completo de `main...phase08/p8-1-visual-foundation`;
- PR #14 e revisão Codex;
- CI e ciclo RED→GREEN;
- requisitos da SPEC;
- boundary de segurança;
- navegação e acessibilidade estrutural;
- integridade do PRF.

## Achados críticos
Nenhum achado crítico observado.

## Achados importantes e correções
1. **Smoke visual real ausente antes do merge.**
   - impacto: comportamento visual/responsivo ainda não foi observado em navegador;
   - mitigação: executar smoke no primeiro ambiente autorizado que materialize o merge.

2. **P1 Codex — reset global de cor em links.**
   - causa: `a { color: inherit; }` fora das layers do Tailwind podia suprimir utilities `text-*`;
   - RED: commit `580c6972...`, CI `32073167386`, 53/54 PASS e falha apenas no novo contrato;
   - GREEN: commit `24b0a968...`, CI `32073240183`, 54/54 PASS, lint/typecheck/build PASS;
   - correção: remoção do reset duplicado.

3. **P2 Codex — manifest SHA-256 inconsistente.**
   - quatro entradas indicadas pela revisão foram recalculadas;
   - a verificação integral dos dez conteúdos via GitHub connector encontrou também hash incorreto em `PHASE-08-P8-1-REPORT.md`;
   - manifest regenerado a partir dos conteúdos finais do PRF.

### Corrigidos anteriormente
- sidebar desktop persistente ao rolar;
- Administração ativa em todo `/admin/*`;
- typed routes compatíveis com `AppRoute`.

## Boundary
Confirmado pelo diff:
- nenhuma migration;
- nenhuma mudança em Supabase/RLS;
- nenhuma Server Action alterada;
- nenhuma dependência nova;
- nenhuma regra de estoque alterada.

## Independência
Houve revisão externa automatizada Codex no GitHub, que produziu os achados P1/P2 acima. A função de auditoria MCF continua sendo consolidada pelo mesmo assistente/orquestrador; portanto não se reivindica independência cognitiva completa entre modelos.

## Veredito de auditoria
`PASS_COM_RESSALVA`

Ressalva obrigatória: smoke visual mobile/desktop deve ocorrer no primeiro ambiente autorizado antes de declarar P8.1 plenamente entregue em produção.

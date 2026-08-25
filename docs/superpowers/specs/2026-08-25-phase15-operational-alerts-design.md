# PHASE-15 — Alertas operacionais de estoque — Design

## Contexto
A baseline PHASE-14 já possui estoque mínimo, saldos autoritativos e um resumo de atenção no dashboard. A PHASE-15 transforma essa informação em uma superfície operacional própria sem duplicar estado de estoque e sem introduzir canais externos.

## Decisão
Criar `/alerts` como uma visão derivada, em tempo de leitura, a partir de produtos ativos e `public.inventory`. A severidade não será persistida.

### Classificação
- `CRITICAL`: `quantity <= 0`.
- `WARNING`: `quantity > 0 && quantity <= minimum_stock`.
- produtos acima do mínimo não aparecem no centro de alertas.

## Arquitetura
Browser/SSR → `/alerts` → Supabase Auth/RLS → `products` + `inventory` → derivação pura no servidor → UI.

A página consulta `inventory` diretamente por `product_id`, evitando depender de relação embutida após mutações transacionais.

## UX
- contadores críticos/baixos;
- busca por código/nome;
- filtro `ALL|CRITICAL|WARNING`;
- ordenação: críticos, depois warnings, depois nome;
- ação para estoque e compras;
- desktop recebe item `Alertas`; bottom nav mobile continua limitado a cinco destinos.

## Segurança
Nenhuma mutation nova. Usuário inativo continua bloqueado pelo mesmo padrão de sessão/perfil. RLS existente controla as leituras.

## Fora de escopo
E-mail, WhatsApp, SMS, push, webhooks, cron externo, IA externa e criação automática de compras.

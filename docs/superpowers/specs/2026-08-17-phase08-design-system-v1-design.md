# PHASE-08 — Design System v1 / Evolução Visual

Status: `DESIGN_APPROVED_PENDING_WRITTEN_SPEC_REVIEW`
Issue: #13
Base funcional: `main@4bac3a964d2cc4aba6e2f8ae55d715db52309647`
Referência visual: Google Stitch project `16117855143662200347`

## 1. Objetivo

Evoluir a interface do Estoque Mercearia usando o Google Stitch como referência visual, sem substituir nem reescrever a arquitetura funcional já validada. A mudança deve preservar autenticação, Supabase, RLS, Server Actions, regras de autorização, invariantes de estoque, rotas e comportamento público já qualificado.

## 2. Abordagens consideradas

### A. Copiar o HTML do Stitch

Vantagem: velocidade visual inicial.

Desvantagens: Tailwind CDN, scripts inline, páginas HTML independentes, dados hardcoded, nomenclaturas inconsistentes, ausência de componentes React e alto risco de regressão.

Decisão: **rejeitada**.

### B. Redesenhar cada página isoladamente

Vantagem: permite atualizar telas rapidamente e de forma independente.

Desvantagens: duplica estilos, navegação e estados; torna manutenção e acessibilidade inconsistentes.

Decisão: **rejeitada como estratégia principal**.

### C. Design System semântico + implementação incremental

Vantagem: preserva a lógica, reduz duplicação e permite migração por lotes pequenos e revisáveis.

Desvantagem: exige uma fundação visual antes das telas completas.

Decisão: **aprovada**.

## 3. Boundary técnico

A camada visual envolve a lógica existente, mas não a substitui.

Permanecem fonte de verdade:

- queries Supabase e Server Components existentes;
- Server Actions existentes;
- RLS, roles e permissões;
- regras de estoque e histórico;
- validações de servidor;
- rotas existentes;
- proxy e comportamento público de `/login` e `/register`.

Não haverá nesta fase:

- migration ou mudança de schema;
- alteração de RLS;
- nova regra de estoque;
- nova biblioteca de UI no primeiro ciclo;
- dark mode prometido apenas porque aparece no Stitch;
- gráficos ou relatórios sem fonte funcional correspondente;
- Suppliers, Settings ou Reports de vendas sem rota/requisito real;
- HTML bruto, Tailwind CDN ou scripts inline do Stitch em produção.

## 4. Identidade e conteúdo

Identidade canônica: **Estoque Mercearia**.

Idioma inicial: **pt-BR**.

Remover da referência antes de implementação:

- StockFlow;
- FreshFlow;
- Main Branch;
- Manager Access;
- Warehouse como rótulo de estoque;
- avatares fotográficos genéricos;
- obrigatoriedade de foto de produto.

## 5. Tokens visuais

### Cores

- `primary`: `#006C49`
- `primary-container`: `#10B981`
- `on-primary`: `#FFFFFF`
- `background` / `surface`: `#F8F9FA`
- `surface-lowest`: `#FFFFFF`
- `surface-low`: `#F3F4F5`
- `surface-container`: `#EDEEEF`
- `surface-high`: `#E7E8E9`
- `surface-highest`: `#E1E3E4`
- `on-surface`: `#191C1D`
- `on-surface-variant`: `#3C4A42`
- `outline`: `#6C7A71`
- `outline-variant`: `#BBCABF`
- `border-subtle`: `#E5E7EB`
- `status-success`: `#10B981`
- `status-warning`: `#F59E0B`
- `status-critical`: `#EF4444`
- `error`: `#BA1A1A`
- `secondary`: `#0058BE`, reservado para informação secundária.

### Tipografia

- UI: `Inter`.
- Dados, SKU, códigos e números tabulares: `JetBrains Mono`.
- Escala: `12 / 14 / 16 / 18 / 20 / 24 / 32px`.
- Pesos principais: `400 / 600 / 700`.

### Espaçamento

Base de 4px:

- `base=4`
- `xs=8`
- `sm=12`
- `md=16`
- `lg=24`
- `xl=32`
- touch target principal mínimo: `48px`.

### Radius

- `sm=4px`
- `md=8px`
- `lg=12px`
- `full=9999px`

### Elevação

- superfícies: border sutil + sombra baixa;
- navegação fixa, modal ou FAB: sombra moderada;
- sombra nunca é o único indicador de foco ou seleção.

## 6. Responsividade

- abordagem mobile-first;
- `<768px`: MobileTopBar + MobileBottomNav em rotas operacionais;
- páginas transacionais podem suprimir BottomNav;
- `>=768px`: DesktopSidebar/AppShell persistente;
- `>=1024px`: grids podem expandir para três ou mais colunas quando o conteúdo justificar;
- conteúdo principal deve possuir largura máxima adequada.

## 7. Arquitetura da camada visual

```text
src/
├── app/                       # rotas/composição; mantém lógica funcional existente
├── components/
│   ├── ui/                    # primitives sem regra de domínio
│   │   ├── Button.tsx
│   │   ├── FormField.tsx
│   │   ├── MetricCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SearchField.tsx
│   │   ├── PageHeader.tsx
│   │   └── EmptyState.tsx
│   ├── shell/                 # navegação/layout
│   │   ├── AppShell.tsx
│   │   ├── DesktopSidebar.tsx
│   │   ├── MobileTopBar.tsx
│   │   └── MobileBottomNav.tsx
│   └── domain/                # apresentação com semântica de negócio, sem acesso direto ao banco
│       ├── InventoryStatus.tsx
│       ├── ProductListItem.tsx
│       ├── MovementListItem.tsx
│       └── ConfirmationPanel.tsx
├── lib/                       # integrações/infra compartilhada existentes
└── modules/                   # boundary de domínio existente
```

Componentes de `ui/` não consultam Supabase. Componentes de `domain/` recebem dados por props e não substituem regras de servidor.

## 8. Semântica do estoque

- `OK`: texto + indicador success;
- `BAIXO`: texto + indicador warning;
- `ZERADO` / `CRÍTICO`: texto + indicador critical;
- estado nunca comunicado somente por cor.

## 9. Mapeamento de rotas

- `/login` → Login Stitch adaptado;
- `/register` → família visual do Login;
- `/` → Dashboard Stitch com métricas reais atuais;
- `/products` → Lista de Produtos;
- `/products/new` → Cadastro de Produto;
- `/products/[id]` → mesma linguagem visual em modo edição;
- `/inventory` → Inventário Detalhado;
- `/movements/new` → Nova Movimentação;
- `/history` → Histórico de Movimentações;
- `/admin/users` → AppShell + DataCard/FormField;
- `/admin/adjustment` → padrão transacional + ConfirmationPanel.

## 10. Navegação canônica

- Painel
- Produtos
- Estoque
- Movimentações
- Histórico
- Administração, somente quando `role === ADMIN`.

A navegação ativa deve usar `aria-current="page"`.

## 11. Acessibilidade

- foco de teclado sempre visível;
- botões somente com ícone exigem `aria-label`;
- inputs mantêm labels reais;
- erros devem ser associados ao campo quando aplicável;
- status críticos devem ter texto equivalente;
- touch target principal mínimo de 48px em mobile;
- contraste deve ser validado antes do gate da implementação;
- qualquer gráfico futuro deve possuir resumo textual equivalente.

## 12. Estados dos componentes

Primitives interativos devem prever, quando aplicável:

- default;
- hover;
- focus-visible;
- active;
- disabled;
- loading;
- error.

Telas de dados devem prever:

- loading;
- empty;
- error;
- populated.

Nenhum estado visual pode inventar estado de domínio que não exista nos dados reais.

## 13. Sequência incremental

- **P8.1 — Fundação visual:** tokens, fontes, primitives iniciais, AppShell e navegação responsiva.
- **P8.2 — Autenticação:** `/login` e `/register`.
- **P8.3a — Dashboard:** `/`.
- **P8.3b — Produtos:** `/products`, `/products/new`, `/products/[id]`.
- **P8.3c — Estoque:** `/inventory`.
- **P8.4 — Movimentações:** `/movements/new`, `/history`.
- **P8.5 — Administração:** `/admin/users`, `/admin/adjustment`.
- **P8.6 — Qualificação:** acessibilidade, regressão, performance e smoke.

## 14. P8.1 — escopo implementável

P8.1 pode alterar somente a fundação visual e componentes compartilhados necessários para estabelecer o Design System.

Pode incluir:

- `src/app/globals.css` com tokens semânticos;
- fontes Inter e JetBrains Mono usando mecanismos compatíveis com Next.js;
- primitives sem regra de domínio;
- AppShell e navegação responsiva;
- testes estruturais/semânticos desses componentes;
- adoção inicial no dashboard apenas se necessária para validar o shell, sem alterar queries ou regras.

Não pode incluir:

- mudança de schema/RLS;
- alteração de Server Actions;
- mudança em regras de autenticação;
- expansão funcional de rotas;
- componentes do Stitch copiados literalmente.

## 15. Estratégia de validação

Antes de integração de qualquer lote:

1. testes existentes permanecem verdes;
2. novos componentes recebem testes de contrato/semântica quando aplicável;
3. `npm run lint` passa;
4. `npm test` passa;
5. `npm run typecheck` passa;
6. `npm run build` passa;
7. revisão verifica que nenhuma query, action, migration ou política foi alterada sem escopo explícito;
8. navegação e estados críticos são verificados em viewport mobile e desktop;
9. integração/deploy permanece sujeita aos gates MCF aplicáveis.

## 16. Riscos e mitigação

### Regressão funcional
Mitigação: componentes recebem dados existentes por props; queries e actions não são reescritas em P8.1.

### Duplicação visual
Mitigação: primitives e shell compartilhados antes da migração de páginas.

### Estado visual divergente do domínio
Mitigação: semântica de status deriva exclusivamente dos dados reais fornecidos pelas páginas.

### Acessibilidade perdida por customização
Mitigação: elementos HTML nativos por padrão, foco explícito, labels e testes semânticos.

### Scope creep a partir do Stitch
Mitigação: somente rotas já existentes entram no mapa; relatórios/suppliers/settings permanecem fora.

## 17. Critérios de aceite do design

- tokens definidos sem hex espalhado pelas páginas como regra principal;
- arquitetura de componentes com boundaries claros;
- rotas atuais mapeadas;
- estados críticos/empty/error/loading documentados;
- acessibilidade-base definida;
- nenhuma mudança funcional ou de banco necessária para aplicar o design-base;
- plano incremental P8.1→P8.6 definido;
- referência Stitch tratada como design, nunca como fonte de lógica.

## 18. Decisão

A estratégia aprovada é **Design System semântico + evolução visual incremental**, preservando integralmente o comportamento funcional já entregue. A implementação começa somente após revisão desta especificação escrita e plano de implementação detalhado.

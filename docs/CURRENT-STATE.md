# Estoque Mercearia — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `STABLE_BASELINE`  
**Baseline funcional qualificada:** `main@8e508e3421528a6da60c8a9b571097a11f651c69`  
**Fase mais recente:** PHASE-16 — Lotes e validade de recebimentos  
**Data da reconciliação:** 2026-08-30/31

## 1. Precedência de verdade
1. instrução explícita atual de LEANDRO;
2. GitHub / Render / Supabase live;
3. código, testes e workflows do SHA aplicável;
4. este mapa de estado;
5. PRFs, Issues e documentos históricos.

Estados de deploy, branch, PR, Issue e workflow são voláteis e devem ser confirmados live quando relevantes.

## 2. Estado executivo
```text
PHASE-06  MVP funcional                 ✅
PHASE-07  Public Release                ✅
PHASE-08  Design System v1              ✅
PHASE-09  Production Smoke autônomo     ✅
PHASE-10  Estabilização e integridade   ✅
PHASE-11  Fornecedores                  ✅
PHASE-12  Compras e Reposição           ✅
PHASE-13  Custos e Preços               ✅
PHASE-14  Vendas / PDV mínimo           ✅
PHASE-15  Alertas operacionais          ✅
PHASE-16  Lotes e validade              ✅ qualificada
PHASE-17  Próximo loop                  ⚪ não instanciada
```

## 3. Capacidades atuais
### Fundação
- autenticação e perfis `ADMIN` / `OPERATOR`;
- categorias/produtos;
- estoque materializado;
- movimentos `INITIAL`, `ENTRY`, `EXIT`, `ADJUSTMENT`;
- histórico auditável, idempotência, bloqueio de estoque negativo e precisão por unidade.

### Fornecedores, compras, preços e vendas
- fornecedores e vínculos produto-fornecedor;
- pedidos, recebimentos e entrada autoritativa de estoque;
- custo e preço de venda;
- vendas `DRAFT`, `COMPLETED`, `CANCELLED`;
- snapshot de preço e conclusão atômica com `EXIT`.

### Alertas
- `/alerts`;
- estoque crítico/baixo derivado de `products.minimum_stock + inventory.quantity`;
- validade de lotes integrada como seção derivada;
- nenhum saldo/severidade duplicado como autoridade.

### PHASE-16 — Lotes e validade
- `receipt_batches` ligado a `purchase_receipt_items`;
- `lot_code`, `expires_on`, `quantity`, `active`, ator e timestamps;
- soma de lotes ativos não excede a quantidade efetivamente recebida;
- precisão reutiliza a política da unidade do produto;
- RLS: usuário ativo lê; ADMIN cria/corrige/inativa;
- sem DELETE pela aplicação;
- `/batches` e `/batches/new`;
- estados `EXPIRED`, `EXPIRING`, `OK`, `NO_EXPIRY`;
- nenhuma baixa por lote/FEFO e nenhum saldo autoritativo por lote.

## 4. PHASE-16 — evidência terminal
### Implementação
- design: `docs/superpowers/specs/2026-08-25-phase16-receipt-batches-design.md`;
- plano: `docs/superpowers/plans/2026-08-25-phase16-receipt-batches.md`;
- RED inicial `984411bc39160169f11f10993236ca643d8a4379`;
- GREEN inicial `21752599aaa62d27425dc26a9011a018f0c5f460`;
- merge funcional inicial PR #54 → `73942ff9bc06e9f6f2ab4d804590d30a8dc8bf71`.

### Finding e recovery
- smoke `33341812298` bloqueou closeout por overflow em `/batches/new` em 375/320 px;
- artifact `9740814353`;
- RED recovery `9a37012197e90e3fcb144b883ec8fb6b421872b7`;
- GREEN recovery `cb569a42d92f7ae17e8c0f5c5672a2ffcdeb2408`;
- PR #56 merge final `8e508e3421528a6da60c8a9b571097a11f651c69`.

### CI final
- run `33344608583`;
- job `99346251908`;
- lint PASS;
- 147 testes PASS;
- typecheck PASS;
- build PASS.

### Supabase live
Projeto `exwtngpwqgkrkoszpgib`:
- tabela `receipt_batches` presente e RLS habilitado;
- policies `receipt_batches_active_user_select`, `receipt_batches_admin_insert`, `receipt_batches_admin_update`;
- triggers `receipt_batches_set_actor`, `receipt_batches_touch_updated_at`, `receipt_batches_validate`;
- grants `authenticated` restritos às colunas previstas;
- `anon` sem grants;
- funções privadas relevantes sem EXECUTE para `authenticated`/`anon`.

### Render
- workspace `tea-d2u2msje5dus73eb6ehg`;
- service `srv-da1et8pt0dsc73bn9pgg`;
- deploy `dep-daackkc9v7es73e9ifdg`;
- commit `8e508e3421528a6da60c8a9b571097a11f651c69`;
- status `live`.

### Production Smoke final
- run `33344692905`;
- job `99346483166`;
- head SHA `8e508e3421528a6da60c8a9b571097a11f651c69`;
- workflow `success`;
- normal smoke PASS;
- independent critical review PASS;
- enforcement PASS;
- `/batches` PASS;
- `/batches/new` PASS em desktop/mobile/narrow/intermediate;
- artifact `9741654703`;
- digest `sha256:b1df8994cae45a5bd6c252535627d113d72b8aead8b3d448833fe0cb084abba3`.

## 5. Arquitetura operacional
```text
Browser / Next.js UI
        ↓
Server Actions / SSR
        ↓
Supabase Auth + RLS
        ↓
PostgreSQL domains
  ├─ products / suppliers
  ├─ purchases / receipts
  ├─ inventory / stock_movements
  ├─ sales / sale_items
  └─ receipt_batches (traceability only)

/alerts
  └─ derived stock + batch-expiry signals
```

Princípios:
- cliente envia intenção;
- ator deriva da sessão;
- `inventory.quantity` é saldo autoritativo;
- lotes descrevem recebimentos, não substituem estoque;
- operações transacionais são idempotentes;
- histórico não é reescrito para “corrigir” operações concluídas.

## 6. Governança
```yaml
default_branch: main
ruleset: Protect main
require_pull_request: true
required_status_check: verify
required_approvals: 0
bypass_list: empty
block_force_push: true
restrict_deletions: true
```

## 7. Produção
URL: `https://estoque-mercearia.onrender.com`

Baseline:
`8e508e3421528a6da60c8a9b571097a11f651c69`

Deploy:
`dep-daackkc9v7es73e9ifdg` → `8e508e3421528a6da60c8a9b571097a11f651c69` (`live`).

## 8. Continuidade ativa
A PHASE-16 está tecnicamente qualificada e aguarda apenas merge do PRF/closeout e fechamento da Issue #49.

Não existe PHASE-17 materializada em Issue, PR, branch ou documento no snapshot de reconciliação. Após o closeout:
1. confirmar live `main`, Issue #49 e deploy;
2. iniciar o próximo loop objetivo do MCF;
3. recuperar o próximo objetivo do roadmap/código/evidência vigente;
4. instanciar PHASE-17 somente então;
5. continuar dentro da autorização PHASE-15→18, escalando a LEANDRO apenas se surgir gate reservado.

## 9. Fora do escopo atual
- saldo autoritativo por lote;
- FEFO automático;
- serialização/recall/cadeia fria;
- multi-loja;
- fiscal/NF-e/NFC-e;
- caixa financeiro;
- pagamentos integrados;
- automação/IA avançada.

## 10. Regra de continuidade
Ao retomar:
1. verificar GitHub/Render/Supabase live;
2. usar este arquivo como mapa canônico após a leitura live;
3. consultar o PRF da PHASE-16;
4. recuperar o próximo objetivo antes de criar PHASE-17;
5. escalar a LEANDRO somente nos gates reservados pelo MCF.

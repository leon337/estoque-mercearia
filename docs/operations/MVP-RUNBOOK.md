# Runbook operacional — Estoque Mercearia (baseline PHASE-16)

Este runbook descreve como preparar, operar e recuperar o sistema qualificado até a PHASE-16. Não contém senhas, chaves administrativas ou strings de conexão reais. Para estados voláteis, consulte `docs/CURRENT-STATE.md` e os providers live.

## 1. Pré-requisitos

- Node.js >= 20.9 e npm.
- Projeto Supabase dedicado.
- Migrations versionadas `0001` até `0017`: aplicar em ordem em ambiente novo. Em ambiente existente, verificar o histórico remoto antes de aplicar qualquer script; presença de arquivo no Git não comprova que a migration foi executada.
- Variáveis do aplicativo:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use somente a URL pública e a publishable key no runtime do MVP. Credenciais administrativas ou senha do banco não pertencem ao navegador, ao Git ou ao `.env.example`.

## 2. Instalação e verificação

```bash
npm ci
npm run lint
npm test
npm run typecheck
npm run build
npm run dev
```

Em produção, use o artefato validado por `npm run build` e inicie com `npm start` no ambiente de hospedagem escolhido.

## 3. Primeiro ADMIN

Em um ambiente novo, siga `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`:

1. o primeiro responsável se cadastra em `/register`;
2. o perfil nasce `OPERATOR` e inativo;
3. o proprietário do banco promove esse usuário uma única vez para `ADMIN` ativo;
4. depois disso, toda aprovação e mudança de papel ocorre por `/admin/users`.

Nunca use o bootstrap inicial como rotina diária.

## 4. Cadastro inicial da mercearia

1. ADMIN entra no sistema.
2. Em `/products`, cria categorias e produtos com código interno, nome, unidade e estoque mínimo.
3. Para cada produto ativo, abre `/movements/new` e registra `INITIAL` com a contagem física existente.
4. Confere `/inventory` e `/history` antes de iniciar a operação normal.

## 5. Rotina diária

### Entrada de mercadoria

Abra `/movements/new`, escolha `ENTRY`, produto e quantidade. Confira **Saldo atual** e **Saldo após**, confirme e verifique o novo saldo em `/inventory`.

### Saída

Use `EXIT`. A interface bloqueia uma saída obviamente maior que o saldo e o banco repete a validação de forma autoritativa. Nunca edite o saldo diretamente.

### Ajuste por contagem física

Somente ADMIN usa `/admin/adjustment`. Informe a contagem física real e um motivo. O núcleo registra `ADJUSTMENT`, calcula a diferença e preserva saldo anterior, delta, saldo resultante, ator, data e motivo.

### Histórico e reposição

- `/history`: filtre por produto, tipo, ator e período.
- dashboard: acompanhe **Estoque zerado** e **Estoque baixo**.
- `/inventory`: consulte o saldo atual antes de decisões de reposição.

### Fluxos adicionados entre PHASE-11 e PHASE-16
- **Fornecedores:** ADMIN cadastra e vincula fornecedores em `/suppliers`.
- **Compras e recebimentos:** ADMIN cria pedidos em `/purchases` e registra recebimentos parciais/totais. Recebimentos confirmados geram entrada autoritativa de estoque; **não** lançar a mesma entrada manualmente em `/movements/new`.
- **Custos e preços:** ADMIN mantém valores por produto/compra. Recebimento pode atualizar o custo atual; totais monetários operacionais não equivalem a contabilidade/fiscal.
- **Vendas/PDV:** usuários ativos autorizados usam `/sales`; concluir uma venda registra baixa transacional. **Não** repetir uma `EXIT` manual para a mesma venda.
- **Alertas:** consultar `/alerts` para estoque zerado/baixo e prazos de validade.
- **Lotes:** ADMIN cadastra rastreabilidade de recebimentos em `/batches/new`; consultar `/batches` para `EXPIRED`, `EXPIRING`, `OK` ou `NO_EXPIRY`. A fase não implementa saldo nem baixa autoritativa por lote ou FEFO.
- **Autoridade de estoque:** `inventory.quantity` continua sendo o saldo quantitativo, preservando auditoria por movimentos.

## 6. Usuários e permissões

- novo cadastro: `OPERATOR` inativo;
- ADMIN: aprova, ativa/desativa e define `ADMIN` ou `OPERATOR` em `/admin/users`;
- OPERATOR: consulta e registra `ENTRY`/`EXIT`;
- `INITIAL`, `ADJUSTMENT` e gestão de usuários são administrativos;
- o banco impede remover ou desativar o último ADMIN ativo.

Ao desligar uma pessoa da operação, desative o perfil imediatamente.

## 7. Backup obrigatório

O MVP deve possuir cópia lógica periódica independente do banco online. A documentação atual do Supabase recomenda que projetos sem retenção automática suficiente exportem os dados regularmente com a CLI e mantenham backups **off-site**, fora do ambiente principal.

Para esta mercearia, execute o backup **diariamente ao final da operação** e também antes de migrations ou mudanças relevantes. Mantenha pelo menos cópias recentes em um local seguro diferente do projeto Supabase.

Obtenha a connection string pelo painel **Connect** somente no momento da operação. Não a salve no repositório.

Com Supabase CLI e Docker disponíveis:

```bash
supabase db dump --db-url "[CONNECTION_STRING]" -f roles.sql --role-only
supabase db dump --db-url "[CONNECTION_STRING]" -f schema.sql
supabase db dump --db-url "[CONNECTION_STRING]" -f data.sql --use-copy --data-only
```

Arquivos esperados:

- `roles.sql`
- `schema.sql`
- `data.sql`

Depois da geração:

1. confirme que os três arquivos existem e têm tamanho maior que zero;
2. mova uma cópia para armazenamento seguro fora do ambiente principal;
3. identifique a data/hora do backup;
4. não versione dumps que contenham dados da mercearia ou usuários no Git.

## 8. Recuperação

Restaure primeiro em um projeto/banco de teste sempre que possível. Com uma connection string válida do destino e `psql`:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "[DESTINATION_CONNECTION_STRING]"
```

Após restaurar, valide no mínimo:

- `auth.users` e `public.profiles`;
- categorias/produtos;
- `inventory`;
- `stock_movements`;
- RLS e funções do banco;
- login de um ADMIN e um OPERATOR de teste;
- cenário de estoque de ponta a ponta.

A restauração de banco pode exigir reconfigurar itens externos ao dump, como chaves/API e configurações de Auth. Não reutilize segredos de outro ambiente sem revisão.

## 9. Incidentes operacionais

- **Saldo incorreto:** não altere `inventory` manualmente; ADMIN registra ajuste físico com motivo.
- **Tentativa de estoque negativo:** operação deve ser rejeitada; confira o histórico e a quantidade solicitada.
- **Usuário sem autorização:** desative o perfil; não apague histórico.
- **Perda de dados:** interrompa novas movimentações, preserve evidências, escolha o backup anterior ao incidente, restaure primeiro em ambiente controlado e confira os critérios de aceite.
- **Falha de internet:** não faça anotações retroativas sem identificação; registre as operações no sistema assim que a conexão voltar, respeitando a ordem real e os responsáveis.

## 10. Integração e release atual

A qualificação M7 é histórica; desde então o produto foi publicado e evoluiu até PHASE-16. O processo atual exige:
1. mudança em branch e PR, sem push direto na `main`;
2. check obrigatório `verify` (lint, testes, typecheck, build) aprovado antes do merge;
3. validação de SHA e estado de deploy no Render;
4. confirmação da saúde do Supabase e do histórico de migrations;
5. Production Smoke E2E pós-deploy, com revisão crítica e evidências;
6. respeito aos gates do MCF para mudanças de produção e decisões que afetem custos ou outros projetos.

CI verde ou Render `live`, isoladamente, não comprovam saúde do banco nem a operação fim a fim.

## 11. Banco Supabase inativo/pausado

Projetos do plano gratuito podem ser pausados após baixa atividade. Quando o Supabase informa `INACTIVE`, primeiro verificar se há pausa e se o banco pode ser restaurado.

- Confirmar a identidade do projeto antes de restaurar;
- se houver limite de projetos gratuitos ativos, **não** pausar outro projeto e **não** contratar plano sem decisão explícita de LEANDRO;
- após a restauração, conferir `ACTIVE_HEALTHY`, migrations aplicadas, RLS, login e smoke funcional;
- se a restauração falhar, registrar o erro do provedor e manter `AGUARDANDO_DEPENDENCIA_EXTERNA` para tarefas dependentes do banco.

Referência: https://supabase.com/docs/guides/platform/free-project-pausing. O achado de 2026-11-04 está registrado em `docs/CURRENT-STATE.md`.
# Recuperação do cadastro e preparação do Google OAuth — 2026-11-04

## Evidência verificada pelo MBC

- Supabase Auth tem dois usuários. Primeiro usuário cadastrado em 2026-08-17 com perfil ADMIN ativo. O cadastro de 2026-11-04 é OPERATOR inativo e aguarda confirmação de e-mail e aprovação administrativa.
- Logs do Supabase: POST /auth/v1/signup às 13:46:42 (HTTP 200); nova tentativa às 13:46:46 (HTTP 429). A primeira solicitação funcionou. As mensagens genéricas e a nova tentativa causaram a percepção de erro.
- Site URL estava http://localhost:3000; foi corrigida pelo MBC para https://estoque-mercearia.onrender.com, com https://estoque-mercearia.onrender.com/auth/callback na lista de redirects.
- Email Signup habilitado e confirmação obrigatória. SMTP customizado desabilitado, com limite padrão de 2 mensagens por hora e entrega restrita a e-mails da equipe.
- Google no Supabase Auth está DESABILITADO. Não há Client ID e Client Secret verificados.
- Production Smoke GitHub 41863574758 falhou na instalação do Playwright 1.55.0 em runner Ubuntu 26.04 (runner, não aplicação). Workflow agora fixa ubuntu-24.04.

## O que o código corrige

1. Login por senha diferencia e-mail não confirmado.
2. Cadastro distingue limite de tentativas, indisponibilidade de e-mail, cadastro desabilitado e erro geral; nenhuma senha ou e-mail é registrada em logs.
3. Botão de cadastro fica desabilitado enquanto a ação está em andamento; sucesso informa confirmação e aprovação pendentes.
4. OAuth Google usa PKCE do Supabase SSR, callback /auth/callback e checagem obrigatória de profiles.active. Um usuário Google novo continua OPERATOR inativo; a autenticação não concede ADMIN.
5. Botão Google somente é mostrado quando GOOGLE_OAUTH_ENABLED=true; fica oculto enquanto não houver provedor configurado.
6. Proxy libera o callback mesmo antes de o navegador ter sessão, sem liberar rotas de estoque.
7. Workflow Production Smoke fixa Ubuntu 24.04.

## Configuração externa ainda necessária: Google OAuth

Não criar credenciais Google Cloud em conta de titularidade não confirmada.

1. Na conta Google Cloud oficial do responsável, criar ou selecionar projeto e configurar Google Auth Platform (branding, público-alvo e escopos openid/email/profile).
2. Criar OAuth Client do tipo **Web application**. Origem autorizada: https://estoque-mercearia.onrender.com. URI de retorno Google: https://exwtngpwqgkrkoszpgib.supabase.co/auth/v1/callback (não confundir com o callback do Next.js).
3. Em Supabase > Authentication > Sign In / Providers > Google, habilitar Google e cadastrar Client ID e Client Secret com segurança. Não adicionar o segredo ao GitHub.
4. Em Render, definir NEXT_PUBLIC_SITE_URL=https://estoque-mercearia.onrender.com e GOOGLE_OAUTH_ENABLED=true; reiniciar/redeploy o serviço.
5. Testar Google para ADMIN existente com identidade vinculada corretamente, novo Google como OPERATOR inativo, bloqueio até aprovação e funcionamento de logout.
6. Se o e-mail já estiver cadastrado por senha, confirmar o comportamento de vinculação de identidades do Supabase, evitando duplicidade ou elevação de privilégios.

## Configuração externa ainda necessária: SMTP

1. Escolher SMTP confiável (por exemplo, Resend, SES, Postmark, Brevo), usar domínio remetente validado e credenciais de propriedade do responsável.
2. No Supabase > Authentication > Emails > SMTP Settings, configurar host, porta, usuário, senha, remetente e ativar SMTP customizado.
3. Confirmar envio e recebimento de confirmação, recuperação e convite para e-mails fora da equipe; só depois ajustar limites conforme necessidade.
4. Manter confirmação obrigatória e nunca aprovar novos perfis automaticamente.

## Critérios de aceite

- Site URL/redirects conferidos por leitura após recarregar o painel.
- CI verify e teste auth-recovery-google verdes.
- Production Smoke executado em runner suportado; resultado real registrado, sem alegar PASS se bloqueado por credenciais.
- Signup real de QA recebe estado pendente; não permite operações sem aprovação.
- Login Google E2E só pode ser classificado PASS após client externo válido, SMTP (para flows de e-mail), configuração do provider e testes de identidade.

## Princípios

Sem alterações em roles, policies, admins existentes, senhas ou segredos. Não desativar confirmação de e-mail para contornar limitações do SMTP. Não registrar segredos em logs nem no repositório.

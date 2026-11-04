# Consentimento Google OAuth — preparação de páginas públicas

Em 2026-11-04, o Google Auth Platform mostra o aplicativo em modo externo / Testing, autorizado para a conta de teste designada. O Supabase Auth Google está Enabled. O software de produção ainda esconde o botão Google por `GOOGLE_OAUTH_ENABLED` até validação E2E.

Esta alteração fornece, sob o mesmo host da aplicação, páginas públicas de contexto e dados:
- Página inicial OAuth: `https://estoque-mercearia.onrender.com/sobre`
- Privacidade: `https://estoque-mercearia.onrender.com/privacidade`
- Termos: `https://estoque-mercearia.onrender.com/termos`

As páginas não expõem inventário nem dados pessoais. Rotas de operação permanecem protegidas e a autenticação Google não concede automaticamente acesso de operador ou admin.

**Gate de publicação:** após deploy das páginas e verificação via navegador, conferir precisão editorial e domínio que atenda aos requisitos atuais de titularidade/validação do Google. Só então cadastrar esses links em Google Cloud > Google Auth Platform > Branding, confirmar acesso como visitante e publicar, se o console e a governança permitirem. Não declarar publicação apenas por criar páginas.

**Gate de SMTP:** um remetente de domínio validado e SMTP próprio ainda são necessários para confirmações e recuperação com e-mails de usuários fora da equipe do Supabase. Não desabilitar confirmação de e-mail.

**Gate de E2E:** testar com o usuário Google de teste, confirmar perfil OPERATOR inativo antes de aprovação, validar acesso após aprovação administrativa e logout, e registrar evidências do resultado. Não alterar o ADMIN existente.

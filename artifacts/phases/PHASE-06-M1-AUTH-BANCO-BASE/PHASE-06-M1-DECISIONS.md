# PHASE-06 / M1 — DECISIONS

1. Usar Supabase SSR com clientes browser/server e proxy.
2. Não aceitar role de autorização a partir de `raw_user_meta_data`; todo novo usuário nasce `OPERATOR`.
3. Escopar consultas de perfil ao ID do usuário autenticado, mesmo para ADMIN.
4. Habilitar RLS em `public.profiles`.
5. Manter funções `SECURITY DEFINER` do M1 no schema `private`.
6. Não reutilizar projetos Supabase existentes para a mercearia.
7. Não criar projeto Supabase sem escolha explícita da organização e confirmação do custo exigida pela ferramenta.
8. Não fazer merge do PR #3 antes do smoke real de Auth/RLS e do gate do MCF.

# PHASE-06 / M1 — DECISIONS

1. Usar Supabase SSR com clientes browser/server e proxy.
2. Não aceitar role de autorização a partir de `raw_user_meta_data`; todo novo usuário nasce `OPERATOR`.
3. Escopar consultas de perfil ao ID do usuário autenticado, inclusive quando o usuário é ADMIN.
4. Habilitar e validar RLS em `public.profiles`.
5. Manter funções `SECURITY DEFINER` do M1 no schema `private`.
6. Usar projeto Supabase dedicado à mercearia; não reutilizar bases existentes.
7. Criar projeto somente após organização, custo e autorização explícitos; custo confirmado em 0/mês.
8. Não versionar segredo administrativo; chave publishable pode ser cliente-side.
9. Resolver reprodutibilidade com `package-lock.json` e `npm ci`.
10. Não transformar limitação de Vercel em alegação de deploy; substituir por smoke verificável do Next.js real no runner.
11. Tratar rate limit de e-mail como falha externa e usar fixture Auth temporário, limitado ao teste e removido.
12. Não fazer merge até CI limpa, PRF, auditoria e gate.

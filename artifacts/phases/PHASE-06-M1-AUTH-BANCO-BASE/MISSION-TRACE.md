# MISSION TRACE — PHASE-06 / M1

MESTRE → abriu M1 e preservou branch isolada.
Gabriel → integrou M0; incidente de PR #2 foi capturado e recuperado por fechamento sem merge; criou branch M1 e PR #3.
Rafael → implementou Supabase SSR, login e base de perfil.
Renato → evidenciou ciclos RED→GREEN e CI.
Ricardo → encontrou riscos de autoelevação, consulta de perfil não escopada e função privilegiada em schema exposto.
Rafael → corrigiu cada achado em ciclos verificáveis.
Augusto → rastreou commits, CI, falhas e recuperações.
Carmem → consolidou o PRF do primeiro checkpoint.
LEANDRO → autorizou criação do projeto Supabase dedicado na organização `leon337's Org`, região `sa-east-1`.
MESTRE → confirmou custo informado pelo Supabase de 0/mês antes da criação.
Manoel → criou o projeto `estoque-mercearia` (`exwtngpwqgkrkoszpgib`) e aplicou a migration `auth_profiles`.
Renato → validou no banco real RLS, policies, funções privadas, trigger de perfil e comportamento ADMIN/OPERATOR.
Ricardo → confirmou Security Advisor sem lints após o DDL.
Renato → removeu todos os fixtures de validação; zero perfis temporários permaneceram.
Emily → auditoria final permanece condicionada ao smoke HTTP real de sessão por senha.
MESTRE → mantém estado como AGUARDANDO_DEPENDENCIA_EXTERNA.

Falhas/recuperações:
- PR #2 criado por engano → fechado sem merge.
- teste inicial sugeria role via user metadata → critério corrigido antes da implementação.
- consulta `.single()` sem filtro → regressão criada, falha comprovada, correção validada.
- `SECURITY DEFINER` em public → regressão criada, falha comprovada, correção validada.
- geração local de lockfile sem rede → não fabricado; dívida mantida explicitamente.
- primeira chamada de aplicação da migration teve erro de transcrição (`as $$;`) → migration não foi registrada; rollback confirmado por lista vazia; reaplicação exata do arquivo versionado foi bem-sucedida.
- runtime local não resolveu o host Supabase no smoke HTTP → não houve tentativa de mascarar o bloqueio; sessão por senha continua pendente.

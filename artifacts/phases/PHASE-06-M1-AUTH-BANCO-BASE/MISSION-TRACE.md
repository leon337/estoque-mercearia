# MISSION TRACE — PHASE-06 / M1

MESTRE → abriu M1 e preservou branch isolada.
Gabriel → integrou M0; incidente de PR #2 foi capturado e recuperado por fechamento sem merge; criou branch M1 e PR #3.
Rafael → implementou Supabase SSR, login e base de perfil.
Renato → evidenciou ciclos RED→GREEN e CI.
Ricardo → encontrou riscos de autoelevação, consulta de perfil não escopada e função privilegiada em schema exposto.
Rafael → corrigiu cada achado em ciclos verificáveis.
Augusto → rastreou commits, CI, falhas e recuperações.
Carmem → consolidou PRF deste checkpoint.
Emily → auditoria final permanece condicionada ao smoke real no Supabase dedicado.
MESTRE → transfere estado como AGUARDANDO_DEPENDENCIA_EXTERNA.

Falhas/recuperações:
- PR #2 criado por engano → fechado sem merge.
- teste inicial sugeria role via user metadata → critério corrigido antes da implementação.
- consulta `.single()` sem filtro → regressão criada, falha comprovada, correção validada.
- `SECURITY DEFINER` em public → regressão criada, falha comprovada, correção validada.
- geração local de lockfile sem rede → não fabricado; dívida mantida explicitamente.

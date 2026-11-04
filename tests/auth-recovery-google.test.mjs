import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("registration remains inactive and prevents repeat submission", async () => {
  const form = await read("src/app/register/page.tsx");
  const action = await read("src/app/register/actions.ts");
  const submit = await read("src/components/auth/SubmitButton.tsx");
  const migration = await read("supabase/migrations/0006_user_admin_hardening.sql");

  assert.match(form, /SubmitButton/);
  assert.match(submit, /useFormStatus/);
  assert.match(submit, /disabled=\{Boolean\(disabled\) \|\| pending\}/);
  assert.match(action, /signUp\(/);
  assert.match(action, /error\.status === 429/);
  assert.match(action, /email_address_not_authorized/);
  assert.match(action, /register\?error=rate_limit/);
  assert.match(migration, /'OPERATOR'::public\.app_role,\s*false/);
});

test("Google OAuth is disabled until configured and handles the PKCE callback", async () => {
  const login = await read("src/app/login/page.tsx");
  const action = await read("src/app/login/actions.ts");
  const callback = await read("src/app/auth/callback/route.ts");
  const proxy = await read("src/lib/supabase/proxy.ts");

  assert.match(login, /GOOGLE_OAUTH_ENABLED === "true"/);
  assert.match(login, /action=\{loginWithGoogle\}/);
  assert.match(action, /GOOGLE_OAUTH_ENABLED !== "true"/);
  assert.match(action, /signInWithOAuth\(/);
  assert.match(action, /provider: "google"/);
  assert.match(action, /redirectTo/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /from\("profiles"\)/);
  assert.match(callback, /!profile\?\.active/);
  assert.match(callback, /auth\.signOut\(\)/);
  assert.match(proxy, /isOAuthCallback = pathname === "\/auth\/callback"/);
  assert.match(proxy, /isAuthenticated && isLoginOrRegister/);
  assert.doesNotMatch(action, /service.role|service_role/i);
});

test("production smoke uses a Playwright-supported hosted runner", async () => {
  const source = await read(".github/workflows/production-smoke.yml");
  assert.match(source, /runs-on: ubuntu-24\.04/);
  assert.match(source, /npx playwright install chromium/);
});

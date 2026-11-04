import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const src = async (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("OAuth consent information routes are public without weakening inventory access", async () => {
  const proxy = await src("src/lib/supabase/proxy.ts");
  assert.match(proxy, /isPublicInfoRoute = \["\/sobre", "\/privacidade", "\/termos"\]\.includes\(pathname\)/);
  assert.match(proxy, /isPublicAuthRoute = isLoginOrRegister \|\| isOAuthCallback \|\| isPublicInfoRoute/);
  assert.match(proxy, /!isAuthenticated && !isPublicAuthRoute/);
  assert.match(proxy, /isAuthenticated && isLoginOrRegister/);
});

test("public pages describe the product, data processing and approved access", async () => {
  const about = await src("src/app/sobre/page.tsx");
  const privacy = await src("src/app/privacidade/page.tsx");
  const terms = await src("src/app/termos/page.tsx");
  const layout = await src("src/components/public/PublicPage.tsx");
  const auth = await src("src/components/auth/AuthCard.tsx");

  assert.match(about, /estoque mínimo/);
  assert.match(about, /aprovação de um administrador/);
  assert.match(privacy, /Supabase Auth/);
  assert.match(privacy, /Google/);
  assert.match(privacy, /Render/);
  assert.match(terms, /Criar uma conta ou autenticar-se com Google não concede/);
  for (const source of [layout, auth]) {
    assert.match(source, /href="\/sobre"/);
    assert.match(source, /href="\/privacidade"/);
    assert.match(source, /href="\/termos"/);
  }
});

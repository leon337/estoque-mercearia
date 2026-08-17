import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const proxy = await readFile("src/lib/supabase/proxy.ts", "utf8");

test("public auth routes include login and registration", () => {
  assert.match(proxy, /\/login/);
  assert.match(proxy, /\/register/);
  assert.match(proxy, /isPublicAuthRoute/);
});

test("unauthenticated users are redirected only outside public auth routes", () => {
  assert.match(proxy, /!isAuthenticated\s*&&\s*!isPublicAuthRoute/);
});

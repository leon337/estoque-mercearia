import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P8.2 auth pages use a shared public auth card and Design System button", async () => {
  const login = await read("src/app/login/page.tsx");
  const register = await read("src/app/register/page.tsx");
  const card = await read("src/components/auth/AuthCard.tsx");

  for (const source of [login, register]) {
    assert.match(source, /AuthCard/);
    assert.match(source, /Button/);
    assert.doesNotMatch(source, /AppShell/);
  }

  assert.match(card, /Estoque Mercearia/);
  assert.match(card, /--color-primary/);
  assert.match(card, /--color-surface-lowest/);
  assert.match(card, /min-h-screen/);
});

test("P8.2 login preserves auth contracts and exposes accessible feedback", async () => {
  const source = await read("src/app/login/page.tsx");

  assert.match(source, /action=\{login\}/);
  assert.match(source, /name="email"/);
  assert.match(source, /name="password"/);
  assert.match(source, /autoComplete="email"/);
  assert.match(source, /autoComplete="current-password"/);
  assert.match(source, /role="status"/);
  assert.match(source, /role="alert"/);
  assert.match(source, /href="\/register"/);
  assert.match(source, /min-h-12/);
});

test("P8.2 registration preserves approval flow and accessible form contracts", async () => {
  const source = await read("src/app/register/page.tsx");

  assert.match(source, /action=\{register\}/);
  assert.match(source, /name="name"/);
  assert.match(source, /name="email"/);
  assert.match(source, /name="password"/);
  assert.match(source, /name="password_confirm"/);
  assert.match(source, /minLength=\{8\}/);
  assert.match(source, /role="alert"/);
  assert.match(source, /href="\/login"/);
  assert.match(source, /aprova/i);
  assert.match(source, /min-h-12/);
});

test("P8.2 presentation layer remains isolated from Supabase", async () => {
  for (const path of [
    "src/app/login/page.tsx",
    "src/app/register/page.tsx",
    "src/components/auth/AuthCard.tsx",
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /@\/lib\/supabase|createClient|\.from\(/, path);
  }
});

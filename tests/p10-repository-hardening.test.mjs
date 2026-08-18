import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P10 CI verifies pull requests and pushes integrated into main", async () => {
  const workflow = await read(".github/workflows/ci.yml");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:[\s\S]*branches:[\s\S]*-\s*["']?main["']?/);
});

test("P10 production smoke command is not permanently tied to the closed PHASE-09 issue", async () => {
  const workflow = await read(".github/workflows/production-smoke.yml");

  assert.doesNotMatch(workflow, /github\.event\.issue\.number\s*==\s*19/);
  assert.match(workflow, /author_association/);
  assert.match(workflow, /OWNER|MEMBER|COLLABORATOR/);
  assert.match(workflow, /\/smoke-production/);
});

import test from "node:test";
import assert from "node:assert/strict";

import { attachErrorCollector } from "../scripts/e2e/smoke-lib.mjs";

function createFakePage() {
  const handlers = new Map();
  const mainFrame = { name: "main" };
  return {
    on(event, handler) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    mainFrame() {
      return mainFrame;
    },
    emit(event, payload) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    mainFrameRef: mainFrame,
  };
}

test("P9 runtime error collector discards errors from a superseded retry navigation", () => {
  const page = createFakePage();
  const errors = attachErrorCollector(page);

  page.emit("console", {
    type: () => "error",
    text: () => "Failed to load resource: the server responded with a status of 503 ()",
  });
  assert.equal(errors.length, 1, "transient error from the failed attempt must be observed initially");

  page.emit("framenavigated", page.mainFrameRef);
  assert.deepEqual(errors, [], "a new main-frame navigation must start a fresh runtime-error epoch");

  page.emit("console", {
    type: () => "error",
    text: () => "real error on the final page",
  });
  assert.equal(errors.length, 1, "errors from the final navigation must still be retained");

  page.emit("framenavigated", { name: "iframe" });
  assert.equal(errors.length, 1, "subframe navigation must not erase final-page errors");
});

import test from "node:test";
import assert from "node:assert/strict";

import { addHighscore, loadSettings, saveSettings } from "../src/storage.js";

function createStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    clear() {
      store.clear();
    },
  };
}

test.beforeEach(() => {
  globalThis.localStorage = createStorageMock();
});

test("loadSettings falls back to defaults when storage is empty", () => {
  const settings = loadSettings("game");
  assert.deepEqual(settings, {
    soundEnabled: true,
    highscores: [100, 80, 50, 30, 10],
  });
});

test("saveSettings stores normalized settings", () => {
  saveSettings("game", { soundEnabled: false, highscores: [7] });
  assert.equal(globalThis.localStorage.getItem("game"), JSON.stringify({
    soundEnabled: false,
    highscores: [7, 0, 0, 0, 0],
  }));
});

test("addHighscore updates settings and reports insertion", () => {
  const settings = { soundEnabled: true, highscores: [100, 80, 50, 30, 10] };
  let saved = 0;

  const inserted = addHighscore(settings, 40, () => {
    saved += 1;
  });

  assert.equal(inserted, true);
  assert.equal(saved, 1);
  assert.deepEqual(settings.highscores, [100, 80, 50, 40, 30]);
});

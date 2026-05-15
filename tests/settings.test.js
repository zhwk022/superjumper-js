import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultSettings, insertHighscore, normalizeSettings } from "../src/settings.js";

test("createDefaultSettings returns default sound and highscores", () => {
  assert.deepEqual(createDefaultSettings(), {
    soundEnabled: true,
    highscores: [100, 80, 50, 30, 10],
  });
});

test("normalizeSettings fills missing values and preserves explicit false", () => {
  assert.deepEqual(normalizeSettings({ highscores: [12, "9"], soundEnabled: false }), {
    soundEnabled: false,
    highscores: [12, 9, 0, 0, 0],
  });

  assert.deepEqual(normalizeSettings({}), {
    soundEnabled: true,
    highscores: [100, 80, 50, 30, 10],
  });
});

test("insertHighscore inserts score in order without mutating input", () => {
  const source = [100, 80, 50, 30, 10];
  const result = insertHighscore(source, 60);

  assert.equal(result.inserted, true);
  assert.deepEqual(result.highscores, [100, 80, 60, 50, 30]);
  assert.deepEqual(source, [100, 80, 50, 30, 10]);
});

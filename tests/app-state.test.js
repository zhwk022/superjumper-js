import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceHelp,
  createAppState,
  finalizeGameOver,
  openHelp,
  returnToMenu,
  startMenuGame,
  toggleSound,
} from "../src/app-state.js";
import { APP, GAME, STORAGE_KEY } from "../src/config/app-config.js";
import { FRUSTUM_HEIGHT } from "../src/config/world-config.js";

function createStorageMock(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

test.beforeEach(() => {
  globalThis.localStorage = createStorageMock();
});

test("createAppState loads defaults and starts in menu", () => {
  const state = createAppState();
  assert.equal(state.app, APP.menu);
  assert.equal(state.game.state, GAME.ready);
  assert.equal(state.settings.soundEnabled, true);
});

test("toggleSound updates state and persists settings", () => {
  const state = createAppState();
  toggleSound(state);

  assert.equal(state.settings.soundEnabled, false);
  assert.equal(
    globalThis.localStorage.getItem(STORAGE_KEY),
    JSON.stringify({ soundEnabled: false, highscores: [100, 80, 50, 30, 10] }),
  );
});

test("startMenuGame resets game and advances app", () => {
  const state = createAppState();
  const cam = { y: 999 };
  state.game.state = GAME.over;

  startMenuGame(state, cam);

  assert.equal(state.app, APP.game);
  assert.equal(state.game.state, GAME.ready);
  assert.equal(cam.y, FRUSTUM_HEIGHT / 2);
});

test("advanceHelp returns to menu after last help page", () => {
  const state = createAppState();
  openHelp(state);
  state.helpIdx = 1;

  assert.equal(advanceHelp(state, 2), false);
  assert.equal(state.app, APP.menu);
});

test("finalizeGameOver writes new highscore once", () => {
  const state = createAppState();
  state.game.state = GAME.over;
  state.game.world.score = 90;

  assert.equal(finalizeGameOver(state), true);
  assert.equal(finalizeGameOver(state), false);
  assert.equal(state.game.scoreLabel, "NEW HIGHSCORE: 90");
  assert.equal(state.game.handledOver, true);
  assert.deepEqual(state.settings.highscores, [100, 90, 80, 50, 30]);
});

test("returnToMenu optionally resets game", () => {
  const state = createAppState();
  const cam = { y: 777 };

  returnToMenu(state, cam, true);

  assert.equal(state.app, APP.menu);
  assert.equal(cam.y, FRUSTUM_HEIGHT / 2);
});

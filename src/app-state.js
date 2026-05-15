import { APP, GAME, STORAGE_KEY } from "./config/app-config.js";
import { winStoryMessages } from "./config/story-config.js";
import { FRUSTUM_HEIGHT } from "./config/world-config.js";
import { createGame } from "./game-logic.js";
import { addHighscore, loadSettings, saveSettings } from "./storage.js";

export function createAppState() {
  return {
    userInteracted: false,
    settings: loadSettings(STORAGE_KEY),
    app: APP.menu,
    helpIdx: 0,
    winStoryIdx: 0,
    game: createGame(),
  };
}

export function saveCurrentSettings(state) {
  saveSettings(STORAGE_KEY, state.settings);
}

export function resetGame(state, cam) {
  state.game = createGame();
  cam.y = FRUSTUM_HEIGHT / 2;
}

export function markUserInteracted(state) {
  state.userInteracted = true;
}

export function startMenuGame(state, cam) {
  resetGame(state, cam);
  state.app = APP.game;
}

export function openHighscores(state) {
  state.app = APP.highscores;
}

export function openHelp(state) {
  state.helpIdx = 0;
  state.app = APP.help;
}

export function returnToMenu(state, cam, reset = false) {
  state.app = APP.menu;
  if (reset) resetGame(state, cam);
}

export function toggleSound(state) {
  state.settings.soundEnabled = !state.settings.soundEnabled;
  saveCurrentSettings(state);
  return state.settings.soundEnabled;
}

export function advanceHelp(state, total) {
  state.helpIdx += 1;
  if (state.helpIdx < total) return true;

  state.app = APP.menu;
  return false;
}

export function advanceWinStory(state, cam, total = winStoryMessages.length) {
  state.winStoryIdx += 1;
  if (state.winStoryIdx < total) return true;

  returnToMenu(state, cam, true);
  return false;
}

export function startRunningGame(state) {
  state.game.state = GAME.running;
}

export function pauseRunningGame(state) {
  state.game.state = GAME.paused;
}

export function resumeRunningGame(state) {
  state.game.state = GAME.running;
}

export function finalizeGameOver(state) {
  if (state.game.state !== GAME.over || state.game.handledOver) return false;

  state.game.handledOver = true;
  const isNew = addHighscore(state.settings, state.game.world.score, () => saveCurrentSettings(state));
  if (isNew) state.game.scoreLabel = `NEW HIGHSCORE: ${state.game.world.score}`;
  return isNew;
}

export function enterWinStory(state) {
  state.game.state = GAME.win;
  state.winStoryIdx = 0;
  state.app = APP.winStory;
}

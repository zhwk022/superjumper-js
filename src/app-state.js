import { APP, FRUSTUM_HEIGHT, GAME, STORAGE_KEY } from "./config.js";
import { createGame } from "./game-logic.js";
import { loadSettings, saveSettings } from "./storage.js";

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

export function enterWinStory(state) {
  state.game.state = GAME.win;
  state.winStoryIdx = 0;
  state.app = APP.winStory;
}

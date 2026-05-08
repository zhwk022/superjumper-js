import { audios, beginCriticalAssetLoading, criticalAssets, ensureHelpImage, preloadHelpImages } from "./assets.js";
import { APP, GAME, menuBounds, pauseBtn, quitBtn, resumeBtn, UI, winStoryMessages } from "./config.js";
import { enterWinStory, resetGame, saveCurrentSettings } from "./app-state.js";
import { updateRunning } from "./game-logic.js";
import { addHighscore } from "./storage.js";
import { hit } from "./utils.js";
import { uiPointer } from "./viewport.js";

export function updateScreens({ state, input, canvas, cam, deltaSec, helps, playSound, applyMusic }) {
  if (criticalAssets.status !== "ready") {
    if (criticalAssets.status === "error" && input.pointer.justDown) beginCriticalAssetLoading();
    return;
  }

  if (state.app === APP.menu) {
    if (!input.pointer.justDown) return;

    const pointer = uiPointer(input.pointer, canvas, UI);
    if (hit(menuBounds.play, pointer.x, pointer.y)) {
      playSound(audios.click);
      resetGame(state, cam);
      state.app = APP.game;
    } else if (hit(menuBounds.hs, pointer.x, pointer.y)) {
      playSound(audios.click);
      state.app = APP.highscores;
    } else if (hit(menuBounds.help, pointer.x, pointer.y)) {
      playSound(audios.click);
      state.helpIdx = 0;
      preloadHelpImages(0, 2);
      state.app = APP.help;
    } else if (hit(menuBounds.sound, pointer.x, pointer.y)) {
      playSound(audios.click);
      state.settings.soundEnabled = !state.settings.soundEnabled;
      saveCurrentSettings(state);
      applyMusic();
    }
    return;
  }

  if (state.app === APP.help) {
    preloadHelpImages(state.helpIdx, 2);
    if (input.pointer.justDown) {
      const pointer = uiPointer(input.pointer, canvas, UI);
      if (hit({ x: 256, y: 0, w: 64, h: 64 }, pointer.x, pointer.y)) {
        playSound(audios.click);
        state.helpIdx += 1;
        if (state.helpIdx >= helps.length) {
          state.app = APP.menu;
        } else {
          ensureHelpImage(state.helpIdx);
        }
      }
    }
    return;
  }

  if (state.app === APP.highscores) {
    if (input.pointer.justDown) {
      const pointer = uiPointer(input.pointer, canvas, UI);
      if (hit({ x: 0, y: 0, w: 64, h: 64 }, pointer.x, pointer.y)) {
        playSound(audios.click);
        state.app = APP.menu;
      }
    }
    return;
  }

  if (state.app === APP.winStory) {
    if (input.pointer.justDown) {
      playSound(audios.click);
      state.winStoryIdx += 1;
      if (state.winStoryIdx >= winStoryMessages.length) {
        state.app = APP.menu;
        resetGame(state, cam);
      }
    }
    return;
  }

  if (state.app !== APP.game) return;

  if (state.game.state === GAME.ready) {
    if (input.pointer.justDown) state.game.state = GAME.running;
    return;
  }

  if (state.game.state === GAME.running) {
    if (input.pointer.justDown) {
      const pointer = uiPointer(input.pointer, canvas, UI);
      if (hit(pauseBtn, pointer.x, pointer.y)) {
        playSound(audios.click);
        state.game.state = GAME.paused;
        return;
      }
    }

    updateRunning({
      game: state.game,
      input,
      canvas,
      cam,
      deltaSec,
      audios,
      playSound,
      enterWinStory: () => enterWinStory(state),
    });

    if (state.game.state === GAME.over && !state.game.handledOver) {
      state.game.handledOver = true;
      const isNew = addHighscore(state.settings, state.game.world.score, () => saveCurrentSettings(state));
      if (isNew) state.game.scoreLabel = `NEW HIGHSCORE: ${state.game.world.score}`;
    }
    return;
  }

  if (state.game.state === GAME.paused) {
    if (!input.pointer.justDown) return;

    const pointer = uiPointer(input.pointer, canvas, UI);
    if (hit(resumeBtn, pointer.x, pointer.y)) {
      playSound(audios.click);
      state.game.state = GAME.running;
    } else if (hit(quitBtn, pointer.x, pointer.y)) {
      playSound(audios.click);
      state.app = APP.menu;
      resetGame(state, cam);
    }
    return;
  }

  if ((state.game.state === GAME.over || state.game.state === GAME.win) && input.pointer.justDown) {
    state.app = APP.menu;
    resetGame(state, cam);
  }
}

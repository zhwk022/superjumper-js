import { audios } from "../assets.js";
import {
  enterWinStory,
  finalizeGameOver,
  pauseRunningGame,
  resumeRunningGame,
  returnToMenu,
  startRunningGame,
} from "../app-state.js";
import { APP, GAME } from "../config/app-config.js";
import { UI, pauseBtn, quitBtn, resumeBtn } from "../config/ui-config.js";
import { updateRunning } from "../game-logic.js";
import { hit } from "../utils.js";
import { uiPointer } from "../viewport.js";

export function updateGameScreen({ state, input, canvas, cam, deltaSec, playSound }) {
  if (state.game.state === GAME.ready) {
    if (input.pointer.justDown) startRunningGame(state);
    return;
  }

  if (state.game.state === GAME.running) {
    if (input.pointer.justDown) {
      const pointer = uiPointer(input.pointer, canvas, UI);
      if (hit(pauseBtn, pointer.x, pointer.y)) {
        playSound(audios.click);
        pauseRunningGame(state);
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

    finalizeGameOver(state);
    return;
  }

  if (state.game.state === GAME.paused) {
    if (!input.pointer.justDown) return;

    const pointer = uiPointer(input.pointer, canvas, UI);
    if (hit(resumeBtn, pointer.x, pointer.y)) {
      playSound(audios.click);
      resumeRunningGame(state);
    } else if (hit(quitBtn, pointer.x, pointer.y)) {
      playSound(audios.click);
      returnToMenu(state, cam, true);
    }
    return;
  }

  if ((state.game.state === GAME.over || state.game.state === GAME.win) && input.pointer.justDown) {
    returnToMenu(state, cam, true);
  }
}

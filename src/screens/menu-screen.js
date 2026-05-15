import { audios, preloadHelpImages } from "../assets.js";
import { UI, menuBounds } from "../config/ui-config.js";
import { openHelp, openHighscores, startMenuGame, toggleSound } from "../app-state.js";
import { hit } from "../utils.js";
import { uiPointer } from "../viewport.js";

export function updateMenuScreen({ state, input, canvas, cam, playSound, applyMusic }) {
  if (!input.pointer.justDown) return;

  const pointer = uiPointer(input.pointer, canvas, UI);
  if (hit(menuBounds.play, pointer.x, pointer.y)) {
    playSound(audios.click);
    startMenuGame(state, cam);
  } else if (hit(menuBounds.hs, pointer.x, pointer.y)) {
    playSound(audios.click);
    openHighscores(state);
  } else if (hit(menuBounds.help, pointer.x, pointer.y)) {
    playSound(audios.click);
    preloadHelpImages(0, 2);
    openHelp(state);
  } else if (hit(menuBounds.sound, pointer.x, pointer.y)) {
    playSound(audios.click);
    toggleSound(state);
    applyMusic();
  }
}

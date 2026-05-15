import { audios, ensureHelpImage, preloadHelpImages } from "../assets.js";
import { advanceHelp } from "../app-state.js";
import { UI, navButtonBounds } from "../config/ui-config.js";
import { hit } from "../utils.js";
import { uiPointer } from "../viewport.js";

export function updateHelpScreen({ state, input, canvas, helps, playSound }) {
  preloadHelpImages(state.helpIdx, 2);
  if (!input.pointer.justDown) return;

  const pointer = uiPointer(input.pointer, canvas, UI);
  if (!hit(navButtonBounds.next, pointer.x, pointer.y)) return;

  playSound(audios.click);
  if (!advanceHelp(state, helps.length)) return;

  ensureHelpImage(state.helpIdx);
}

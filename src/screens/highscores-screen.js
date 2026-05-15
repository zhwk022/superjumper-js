import { audios } from "../assets.js";
import { returnToMenu } from "../app-state.js";
import { UI, navButtonBounds } from "../config/ui-config.js";
import { hit } from "../utils.js";
import { uiPointer } from "../viewport.js";

export function updateHighscoresScreen({ state, input, canvas, playSound }) {
  if (!input.pointer.justDown) return;

  const pointer = uiPointer(input.pointer, canvas, UI);
  if (!hit(navButtonBounds.back, pointer.x, pointer.y)) return;

  playSound(audios.click);
  returnToMenu(state);
}

import { audios } from "../assets.js";
import { winStoryMessages } from "../config/story-config.js";
import { advanceWinStory } from "../app-state.js";

export function updateWinStoryScreen({ state, input, cam, playSound }) {
  if (!input.pointer.justDown) return;

  playSound(audios.click);
  advanceWinStory(state, cam, winStoryMessages.length);
}

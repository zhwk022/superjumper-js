import { ensureAudio } from "../assets.js";
import { audios } from "../asset-manifest.js";

export function createAudioController({ state }) {
  function play(audioKey) {
    if (!state.settings.soundEnabled) return;

    const audio = ensureAudio(audioKey);
    if (!audio) return;

    try {
      audio.currentTime = 0;
    } catch {}

    try {
      const result = audio.play();
      if (result?.catch) result.catch(() => {});
    } catch {}
  }

  function applyMusic() {
    const music = ensureAudio(audios.music);
    if (!music) return;

    if (!state.settings.soundEnabled) {
      music.pause();
      return;
    }

    if (!state.userInteracted) return;

    try {
      const result = music.play();
      if (result?.catch) result.catch(() => {});
    } catch {}
  }

  return { play, applyMusic };
}

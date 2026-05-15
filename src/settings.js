export const DEFAULT_HIGHSCORES = Object.freeze([100, 80, 50, 30, 10]);

export function createDefaultSettings() {
  return {
    soundEnabled: true,
    highscores: [...DEFAULT_HIGHSCORES],
  };
}

export function normalizeSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const highscores = Array.isArray(settings.highscores)
    ? settings.highscores.slice(0, 5).map((value) => Number(value) || 0)
    : [...DEFAULT_HIGHSCORES];

  while (highscores.length < 5) highscores.push(0);

  return {
    soundEnabled: settings.soundEnabled !== false,
    highscores,
  };
}

export function insertHighscore(highscores, score) {
  const nextHighscores = [...highscores];
  for (let i = 0; i < 5; i += 1) {
    if (nextHighscores[i] < score) {
      for (let j = 4; j > i; j -= 1) {
        nextHighscores[j] = nextHighscores[j - 1];
      }
      nextHighscores[i] = score;
      return { highscores: nextHighscores, inserted: true };
    }
  }

  return { highscores: nextHighscores, inserted: false };
}

const DEFAULT_HIGHSCORES = [100, 80, 50, 30, 10];

function defaultSettings() {
  return {
    soundEnabled: true,
    highscores: [...DEFAULT_HIGHSCORES],
  };
}

export function loadSettings(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultSettings();

    const obj = JSON.parse(raw);
    const highscores = Array.isArray(obj.highscores)
      ? obj.highscores.slice(0, 5).map((n) => Number(n) || 0)
      : [...DEFAULT_HIGHSCORES];

    while (highscores.length < 5) highscores.push(0);

    return {
      soundEnabled: Boolean(obj.soundEnabled),
      highscores,
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(storageKey, settings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function addHighscore(settings, score, onChange = () => {}) {
  for (let i = 0; i < 5; i += 1) {
    if (settings.highscores[i] < score) {
      for (let j = 4; j > i; j -= 1) {
        settings.highscores[j] = settings.highscores[j - 1];
      }
      settings.highscores[i] = score;
      onChange();
      return true;
    }
  }
  return false;
}

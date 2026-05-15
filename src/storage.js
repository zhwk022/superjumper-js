import { createDefaultSettings, insertHighscore, normalizeSettings } from "./settings.js";

export function loadSettings(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createDefaultSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(storageKey, settings) {
  localStorage.setItem(storageKey, JSON.stringify(normalizeSettings(settings)));
}

export function addHighscore(settings, score, onChange = () => {}) {
  const { highscores, inserted } = insertHighscore(settings.highscores, score);
  if (!inserted) return false;

  settings.highscores = highscores;
  onChange();
  return true;
}

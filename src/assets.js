const DATA_BASE_URL = new URL("../assets/data/", import.meta.url);
const HELP_IMAGE_COUNT = 5;

export function dataUrl(path) {
  return new URL(path, DATA_BASE_URL).href;
}

export const criticalAssets = {
  status: "loading",
  total: 2,
  loaded: 0,
  error: null,
  startedAt: 0,
};

export const images = {
  bg: new Image(),
  items: new Image(),
  helps: Array.from({ length: HELP_IMAGE_COUNT }, () => new Image()),
};

const helpImageRequested = Array.from({ length: HELP_IMAGE_COUNT }, () => false);

function loadImage(img, src, label, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let done = false;
    let timer = null;

    const onLoad = () => {
      if (done) return;
      criticalAssets.loaded += 1;
      finish();
    };
    const onError = () => {
      if (done) return;
      finish({ type: "error", label, src });
    };

    const cleanup = () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };

    const finish = (err) => {
      if (done) return;
      done = true;
      cleanup();
      if (timer) clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };

    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);

    timer = setTimeout(() => finish({ type: "timeout", label, src }), timeoutMs);
    img.src = src;
  });
}

export function beginCriticalAssetLoading() {
  criticalAssets.status = "loading";
  criticalAssets.loaded = 0;
  criticalAssets.error = null;
  criticalAssets.startedAt = performance.now();

  const bgSrc = dataUrl("background.png");
  const itemsSrc = dataUrl("items.png");

  Promise.all([
    loadImage(images.bg, bgSrc, "background.png"),
    loadImage(images.items, itemsSrc, "items.png"),
  ])
    .then(() => {
      criticalAssets.status = "ready";
    })
    .catch((err) => {
      criticalAssets.status = "error";
      criticalAssets.error = err;
    });
}

export function ensureHelpImage(index) {
  const img = images.helps[index];
  if (!img || helpImageRequested[index]) return img;

  helpImageRequested[index] = true;
  img.decoding = "async";
  img.src = dataUrl(`help${index + 1}.png`);
  return img;
}

export function preloadHelpImages(startIndex, count = 2) {
  for (let i = startIndex; i < Math.min(images.helps.length, startIndex + count); i += 1) {
    ensureHelpImage(i);
  }
}

export const audios = {
  jump: "jump",
  highJump: "highJump",
  hit: "hit",
  coin: "coin",
  click: "click",
  music: "music",
};

const audioElements = {
  jump: null,
  highJump: null,
  hit: null,
  coin: null,
  click: null,
  music: null,
};

const audioConfig = {
  jump: { file: "jump.wav", volume: 0.7, loop: false },
  highJump: { file: "highjump.wav", volume: 0.7, loop: false },
  hit: { file: "hit.wav", volume: 0.7, loop: false },
  coin: { file: "coin.wav", volume: 0.7, loop: false },
  click: { file: "click.wav", volume: 0.7, loop: false },
  music: { file: "music.mp3", volume: 0.45, loop: true },
};

export function ensureAudio(key) {
  if (audioElements[key]) return audioElements[key];

  const config = audioConfig[key];
  if (!config) return null;

  const audio = new Audio(dataUrl(config.file));
  audio.volume = config.volume;
  audio.loop = config.loop;
  audio.preload = "none";
  audioElements[key] = audio;
  return audio;
}

export function ensureMusicAudio() {
  if (audioElements.music) return audioElements.music;

  const music = new Audio(dataUrl("music.m4a"));
  music.volume = audioConfig.music.volume;
  music.loop = audioConfig.music.loop;
  music.preload = "none";
  audioElements.music = music;
  return music;
}

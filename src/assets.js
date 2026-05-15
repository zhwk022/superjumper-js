import { audioManifest, audios, criticalImageAssets, helpImageFiles } from "./asset-manifest.js";

const DATA_BASE_URL = new URL("../assets/data/", import.meta.url);

export function dataUrl(path) {
  return new URL(path, DATA_BASE_URL).href;
}

export { audios };

export const criticalAssets = {
  status: "loading",
  total: criticalImageAssets.length,
  loaded: 0,
  error: null,
  startedAt: 0,
};

export const images = {
  bg: new Image(),
  items: new Image(),
  helps: Array.from({ length: helpImageFiles.length }, () => new Image()),
};

const helpImageRequested = Array.from({ length: helpImageFiles.length }, () => false);

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

  Promise.all(
    criticalImageAssets.map(({ key, file }) => loadImage(images[key], dataUrl(file), file)),
  )
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
  img.src = dataUrl(helpImageFiles[index]);
  return img;
}

export function preloadHelpImages(startIndex, count = 2) {
  for (let i = startIndex; i < Math.min(images.helps.length, startIndex + count); i += 1) {
    ensureHelpImage(i);
  }
}

const audioElements = {
  jump: null,
  highJump: null,
  hit: null,
  coin: null,
  click: null,
  music: null,
};

export function ensureAudio(key) {
  if (audioElements[key]) return audioElements[key];

  const config = audioManifest[key];
  if (!config) return null;

  const audio = new Audio(dataUrl(config.sources[0]));
  if (config.sources.length > 1) {
    audio.innerHTML = config.sources
      .map((source) => `<source src="${dataUrl(source)}" />`)
      .join("");
  }
  audio.volume = config.volume;
  audio.loop = config.loop;
  audio.preload = "none";
  audioElements[key] = audio;
  return audio;
}

const DATA_BASE_URL = new URL("../assets/data/", import.meta.url);

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
  helps: [1, 2, 3, 4, 5].map((index) => {
    const img = new Image();
    img.src = dataUrl(`help${index}.png`);
    return img;
  }),
};

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

export const audios = {
  jump: new Audio(dataUrl("jump.wav")),
  highJump: new Audio(dataUrl("highjump.wav")),
  hit: new Audio(dataUrl("hit.wav")),
  coin: new Audio(dataUrl("coin.wav")),
  click: new Audio(dataUrl("click.wav")),
  music: new Audio(dataUrl("music.mp3")),
};

audios.music.loop = true;
audios.music.volume = 0.45;
for (const key of ["jump", "highJump", "hit", "coin", "click"]) {
  audios[key].volume = 0.7;
}

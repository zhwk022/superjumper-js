export const criticalImageAssets = Object.freeze([
  { key: "bg", file: "background.png" },
  { key: "items", file: "items.png" },
]);

export const helpImageFiles = Object.freeze(["help1.png", "help2.png", "help3.png", "help4.png", "help5.png"]);

export const audioManifest = Object.freeze({
  jump: { sources: ["jump.wav"], volume: 0.7, loop: false },
  highJump: { sources: ["highjump.wav"], volume: 0.7, loop: false },
  hit: { sources: ["hit.wav"], volume: 0.7, loop: false },
  coin: { sources: ["coin.wav"], volume: 0.7, loop: false },
  click: { sources: ["click.wav"], volume: 0.7, loop: false },
  music: {
    sources: ["music.m4a", "music.mp3"],
    volume: 0.45,
    loop: true,
    buildSource: "music.mp3",
    optimizedFile: "music.m4a",
    fallbackFile: "music.mp3",
  },
});

export const audios = Object.freeze(
  Object.fromEntries(Object.keys(audioManifest).map((key) => [key, key])),
);

import { createAppState } from "./app-state.js";
import { audios, beginCriticalAssetLoading, criticalAssets, ensureAudio, ensureMusicAudio, images } from "./assets.js";
import { FRUSTUM_HEIGHT, FRUSTUM_WIDTH, UI, winStoryMessages } from "./config.js";
import { renderApp } from "./renderer.js";
import { updateScreens } from "./screens.js";
import { attachViewportListeners } from "./viewport.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

attachViewportListeners(canvas, UI);
beginCriticalAssetLoading();

const helps = images.helps;
const input = { keys: new Set(), pointer: { x: 0, y: 0, down: false, justDown: false } };
const cam = { x: FRUSTUM_WIDTH / 2, y: FRUSTUM_HEIGHT / 2 };

const state = createAppState();
let last = performance.now();
let deltaSec = 0;

window.addEventListener("keydown", (e) => {
  input.keys.add(e.code);
  state.userInteracted = true;
  applyMusic();
});
window.addEventListener("keyup", (e) => input.keys.delete(e.code));
canvas.addEventListener("pointerdown", (e) => {
  setPointer(e);
  input.pointer.down = true;
  input.pointer.justDown = true;
  state.userInteracted = true;
  applyMusic();
});
canvas.addEventListener("pointermove", setPointer);
canvas.addEventListener("pointerup", () => (input.pointer.down = false));
canvas.addEventListener("pointercancel", () => (input.pointer.down = false));

function setPointer(e) {
  const rect = canvas.getBoundingClientRect();
  input.pointer.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  input.pointer.y = canvas.height - ((e.clientY - rect.top) / rect.height) * canvas.height;
}

function play(audioKey) {
  if (!state.settings.soundEnabled) return;
  const audio = ensureAudio(audioKey);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function applyMusic() {
  if (!state.settings.soundEnabled) {
    audios.music?.pause();
    return;
  }
  if (state.userInteracted) ensureMusicAudio().play().catch(() => {});
}

function update() {
  updateScreens({ state, input, canvas, cam, deltaSec, helps, playSound: play, applyMusic });
}

function draw() {
  renderApp({
    ctx,
    canvas,
    app: state.app,
    game: state.game,
    settings: state.settings,
    helpIdx: state.helpIdx,
    helps,
    winStoryIdx: state.winStoryIdx,
    winStoryMessages,
    images,
    criticalAssets,
    cam,
    ui: UI,
  });
}

function loop(now) {
  deltaSec = Math.min(0.1, (now - last) / 1000);
  last = now;
  update();
  draw();
  input.pointer.justDown = false;
  requestAnimationFrame(loop);
}

requestAnimationFrame((t) => {
  last = t;
  requestAnimationFrame(loop);
});

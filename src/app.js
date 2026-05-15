import { createAppState, markUserInteracted } from "./app-state.js";
import { beginCriticalAssetLoading, criticalAssets, images } from "./assets.js";
import { createAudioController } from "./app/audio-controller.js";
import { createInputController } from "./app/input-controller.js";
import { startGameLoop } from "./app/game-loop.js";
import { FRUSTUM_HEIGHT, FRUSTUM_WIDTH } from "./config/world-config.js";
import { UI } from "./config/ui-config.js";
import { winStoryMessages } from "./config/story-config.js";
import { renderApp } from "./renderer.js";
import { updateScreens } from "./screens.js";
import { attachViewportListeners } from "./viewport.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

attachViewportListeners(canvas, UI);
beginCriticalAssetLoading();

const helps = images.helps;
const cam = { x: FRUSTUM_WIDTH / 2, y: FRUSTUM_HEIGHT / 2 };
const state = createAppState();
const { play, applyMusic } = createAudioController({ state });
const input = createInputController({
  canvas,
  onInteraction: () => {
    markUserInteracted(state);
    applyMusic();
  },
});

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

startGameLoop({
  update: (deltaSec) => updateScreens({ state, input, canvas, cam, deltaSec, helps, playSound: play, applyMusic }),
  draw,
  afterFrame: () => {
    input.pointer.justDown = false;
  },
});

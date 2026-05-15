import { beginCriticalAssetLoading, criticalAssets } from "./assets.js";
import { APP } from "./config/app-config.js";
import { updateGameScreen } from "./screens/game-screen.js";
import { updateHelpScreen } from "./screens/help-screen.js";
import { updateHighscoresScreen } from "./screens/highscores-screen.js";
import { updateMenuScreen } from "./screens/menu-screen.js";
import { updateWinStoryScreen } from "./screens/win-story-screen.js";

export function updateScreens({ state, input, canvas, cam, deltaSec, helps, playSound, applyMusic }) {
  if (criticalAssets.status !== "ready") {
    if (criticalAssets.status === "error" && input.pointer.justDown) beginCriticalAssetLoading();
    return;
  }

  if (state.app === APP.menu) {
    updateMenuScreen({ state, input, canvas, cam, playSound, applyMusic });
    return;
  }

  if (state.app === APP.help) {
    updateHelpScreen({ state, input, canvas, helps, playSound });
    return;
  }

  if (state.app === APP.highscores) {
    updateHighscoresScreen({ state, input, canvas, playSound });
    return;
  }

  if (state.app === APP.winStory) {
    updateWinStoryScreen({ state, input, cam, playSound });
    return;
  }

  if (state.app !== APP.game) return;
  updateGameScreen({ state, input, canvas, cam, deltaSec, playSound });
}

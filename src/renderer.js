import { drawCriticalOverlay } from "./rendering/overlay-renderer.js";
import { drawBg } from "./rendering/render-utils.js";
import { renderAppScreen, renderGameUi } from "./rendering/ui-renderer.js";
import { renderGameWorld } from "./rendering/world-renderer.js";

export function renderApp({
  ctx,
  canvas,
  app,
  game,
  settings,
  helpIdx,
  helps,
  winStoryIdx,
  winStoryMessages,
  images,
  criticalAssets,
  cam,
  ui,
}) {
  drawBg(ctx, canvas, images);

  if (criticalAssets.status !== "ready") {
    drawCriticalOverlay(ctx, canvas, criticalAssets);
    return;
  }

  if (
    renderAppScreen({ ctx, canvas, app, settings, helpIdx, helps, winStoryIdx, winStoryMessages, images, ui })
  ) {
    return;
  }

  renderGameWorld({ ctx, canvas, game, images, cam });
  renderGameUi({ ctx, canvas, game, images, ui });
}

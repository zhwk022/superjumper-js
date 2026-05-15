import { FRUSTUM_HEIGHT, FRUSTUM_WIDTH } from "../config/world-config.js";

const RENDER_MARGIN = 2;

export function isVisibleY(y, h, cam) {
  const minY = cam.y - FRUSTUM_HEIGHT / 2 - h / 2 - RENDER_MARGIN;
  const maxY = cam.y + FRUSTUM_HEIGHT / 2 + h / 2 + RENDER_MARGIN;
  return y >= minY && y <= maxY;
}

export function drawRegion(ctx, images, region, x, y, w, h, flipX = false) {
  if (!images.items.complete) return;
  const [sx, sy, sw, sh] = region;

  if (flipX) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(images.items, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
    return;
  }

  ctx.drawImage(images.items, sx, sy, sw, sh, x, y, w, h);
}

export function drawUi(ctx, images, ui, region, x, y, w, h, flipX = false) {
  const dx = ui.x + x * ui.scale;
  const dy = ui.y + (ui.h - y - h) * ui.scale;
  drawRegion(ctx, images, region, dx, dy, w * ui.scale, h * ui.scale, flipX);
}

export function drawWorld(ctx, canvas, images, cam, region, x, y, w, h, flipX = false) {
  const screenX = ((x - cam.x + FRUSTUM_WIDTH / 2) / FRUSTUM_WIDTH) * canvas.width;
  const screenY = canvas.height - ((y - cam.y + FRUSTUM_HEIGHT / 2) / FRUSTUM_HEIGHT) * canvas.height;
  const screenWidth = (w / FRUSTUM_WIDTH) * canvas.width;
  const screenHeight = (h / FRUSTUM_HEIGHT) * canvas.height;
  drawRegion(ctx, images, region, screenX - screenWidth / 2, screenY - screenHeight / 2, screenWidth, screenHeight, flipX);
}

export function drawFullscreenCroppedImage(ctx, canvas, image) {
  const overscan = Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, 320, 480, -overscan, -overscan, canvas.width + overscan * 2, canvas.height + overscan * 2);
  ctx.restore();
}

export function drawBg(ctx, canvas, images) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (images.bg.complete) {
    drawFullscreenCroppedImage(ctx, canvas, images.bg);
    return;
  }

  ctx.fillStyle = "#2f9cf5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

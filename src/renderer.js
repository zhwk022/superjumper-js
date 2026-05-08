import { APP, atlas, FRUSTUM_HEIGHT, FRUSTUM_WIDTH, GAME, PLATFORM } from "./config.js";
import { frame } from "./utils.js";

function worldToScreen(x, y, cam, canvas) {
  return {
    x: ((x - cam.x + FRUSTUM_WIDTH / 2) / FRUSTUM_WIDTH) * canvas.width,
    y: canvas.height - ((y - cam.y + FRUSTUM_HEIGHT / 2) / FRUSTUM_HEIGHT) * canvas.height,
  };
}

function drawRegion(ctx, images, region, x, y, w, h, flipX = false) {
  if (!images.items.complete) return;
  const [sx, sy, sw, sh] = region;

  ctx.save();
  if (flipX) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(images.items, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(images.items, sx, sy, sw, sh, x, y, w, h);
  }
  ctx.restore();
}

function drawUi(ctx, canvas, images, ui, region, x, y, w, h, flipX = false) {
  const dx = ui.x + x * ui.scale;
  const dy = ui.y + (ui.h - y - h) * ui.scale;
  drawRegion(ctx, images, region, dx, dy, w * ui.scale, h * ui.scale, flipX);
}

function drawWorld(ctx, canvas, images, cam, region, x, y, w, h, flipX = false) {
  const point = worldToScreen(x, y, cam, canvas);
  const screenWidth = (w / FRUSTUM_WIDTH) * canvas.width;
  const screenHeight = (h / FRUSTUM_HEIGHT) * canvas.height;
  drawRegion(ctx, images, region, point.x - screenWidth / 2, point.y - screenHeight / 2, screenWidth, screenHeight, flipX);
}

function drawBg(ctx, canvas, images) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (images.bg.complete) {
    // Match libGDX: only the 320x480 active content area should be rendered.
    const overscan = Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2));
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      images.bg,
      0,
      0,
      320,
      480,
      -overscan,
      -overscan,
      canvas.width + overscan * 2,
      canvas.height + overscan * 2
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "#2f9cf5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawCriticalOverlay(ctx, canvas, criticalAssets) {
  ctx.save();
  ctx.fillStyle = "#000b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxW = Math.min(300, canvas.width - 40);
  const boxH = criticalAssets.status === "error" ? 220 : 110;
  const x = (canvas.width - boxW) / 2;
  const y = (canvas.height - boxH) / 2;

  ctx.fillStyle = "#111c";
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = "#ffffff33";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, boxW - 2, boxH - 2);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";

  if (criticalAssets.status === "loading") {
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("加载中...", canvas.width / 2, y + 44);
    ctx.font = "16px sans-serif";
    ctx.fillText(`正在加载关键资源 (${criticalAssets.loaded}/${criticalAssets.total})`, canvas.width / 2, y + 74);
    ctx.font = "14px sans-serif";
    ctx.fillText("请稍候", canvas.width / 2, y + 96);
    ctx.restore();
    return;
  }

  const err = criticalAssets.error || {};
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#ffdddd";
  ctx.fillText("资源加载失败", canvas.width / 2, y + 36);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "start";
  ctx.font = "13px sans-serif";
  const lines = [
    `失败资源：${err.label || "未知"}`,
    `地址：${err.src || "未知"}`,
    "排查建议：",
    "1) 打开浏览器 Network/Console 看是否 404/CORS",
    "2) 确认部署 base 路径/静态资源路径配置正确",
    "3) 确认文件名大小写一致（items.png/background.png）",
    "4) 尝试强制刷新或清理缓存后重试",
    "点击任意位置重试",
  ];
  let textY = y + 62;
  const textX = x + 14;
  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += 18;
  }

  ctx.restore();
}

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

  if (app === APP.menu) {
    drawUi(ctx, canvas, images, ui, atlas.logo, 23, 328, 274, 142);
    drawUi(ctx, canvas, images, ui, atlas.mainMenu, 10, 145, 300, 110);
    drawUi(ctx, canvas, images, ui, settings.soundEnabled ? atlas.soundOn : atlas.soundOff, 0, 0, 64, 64);
    return;
  }

  if (app === APP.help) {
    if (helps[helpIdx]?.complete) {
      ctx.drawImage(helps[helpIdx], ui.x, ui.y, ui.w * ui.scale, ui.h * ui.scale);
    }
    drawUi(ctx, canvas, images, ui, atlas.arrow, 256, 0, 64, 64, true);
    return;
  }

  if (app === APP.highscores) {
    drawUi(ctx, canvas, images, ui, atlas.highTitle, 10, 344, 300, 33);
    drawUi(ctx, canvas, images, ui, atlas.arrow, 0, 0, 64, 64);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(12, Math.round(24 * ui.scale))}px monospace`;
    let textY = 160;
    for (let i = 4; i >= 0; i--) {
      ctx.fillText(`${i + 1}. ${settings.highscores[i]}`, ui.x + 94 * ui.scale, ui.y + textY * ui.scale);
      textY += 30;
    }
    return;
  }

  if (app === APP.winStory) {
    drawUi(ctx, canvas, images, ui, atlas.castle, 60, 120, 200, 200);
    drawUi(ctx, canvas, images, ui, atlas.bobFall[0], 120, 200, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.max(12, Math.round(18 * ui.scale))}px sans-serif`;
    ctx.fillText(winStoryMessages[winStoryIdx], ui.x + (ui.w * ui.scale) / 2, ui.y + 90 * ui.scale);
    ctx.font = `${Math.max(10, Math.round(14 * ui.scale))}px sans-serif`;
    ctx.fillText("点击继续", ui.x + (ui.w * ui.scale) / 2, ui.y + 430 * ui.scale);
    ctx.textAlign = "start";
    return;
  }

  const world = game.world;
  for (const platform of world.platforms) {
    const region = platform.state === "pulverizing" ? frame(atlas.breakPlatform, platform.stateTime, 0.2, false) : atlas.platform;
    drawWorld(ctx, canvas, images, cam, region, platform.x, platform.y, PLATFORM.width, PLATFORM.height);
  }
  for (const spring of world.springs) drawWorld(ctx, canvas, images, cam, atlas.spring, spring.x, spring.y, 1, 1);
  for (const coin of world.coins) drawWorld(ctx, canvas, images, cam, frame(atlas.coin, coin.stateTime, 0.2, true), coin.x, coin.y, 1, 1);
  for (const squirrel of world.squirrels) {
    drawWorld(ctx, canvas, images, cam, frame(atlas.squirrel, squirrel.stateTime, 0.2, true), squirrel.x, squirrel.y, 1, 1, squirrel.vx < 0);
  }
  drawWorld(ctx, canvas, images, cam, atlas.castle, world.castle.x, world.castle.y, 2, 2);

  const bob = world.bob;
  const bobRegion =
    bob.state === "jump"
      ? frame(atlas.bobJump, bob.stateTime, 0.2, true)
      : bob.state === "fall"
        ? frame(atlas.bobFall, bob.stateTime, 0.2, true)
        : atlas.bobHit;
  drawWorld(ctx, canvas, images, cam, bobRegion, bob.x, bob.y, 1, 1, bob.vx < 0);

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(12, Math.round(20 * ui.scale))}px sans-serif`;
  ctx.fillText(game.scoreLabel, ui.x + 16 * ui.scale, ui.y + 28 * ui.scale);

  if (game.state === GAME.ready) drawUi(ctx, canvas, images, ui, atlas.ready, 64, 224, 192, 32);
  if (game.state === GAME.running) drawUi(ctx, canvas, images, ui, atlas.pause, 256, 416, 64, 64);
  if (game.state === GAME.paused) drawUi(ctx, canvas, images, ui, atlas.pauseMenu, 64, 192, 192, 96);
  if (game.state === GAME.over) drawUi(ctx, canvas, images, ui, atlas.gameOver, 80, 192, 160, 96);
  if (game.state === GAME.win) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "start";
    ctx.font = `bold ${Math.max(12, Math.round(24 * ui.scale))}px sans-serif`;
    ctx.fillText("YOU WIN!", ui.x + 104 * ui.scale, ui.y + 220 * ui.scale);
    ctx.font = `${Math.max(10, Math.round(16 * ui.scale))}px sans-serif`;
    ctx.fillText("点击返回主菜单", ui.x + 104 * ui.scale, ui.y + 250 * ui.scale);
  }
}

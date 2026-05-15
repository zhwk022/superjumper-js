import { APP, GAME } from "../config/app-config.js";
import { atlas } from "../config/atlas-config.js";
import { drawFullscreenCroppedImage, drawUi } from "./render-utils.js";

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export function renderAppScreen({ ctx, canvas, app, settings, helpIdx, helps, winStoryIdx, winStoryMessages, images, ui }) {
  if (app === APP.menu) {
    drawUi(ctx, images, ui, atlas.logo, 23, 328, 274, 142);
    drawUi(ctx, images, ui, atlas.mainMenu, 10, 145, 300, 110);
    drawUi(ctx, images, ui, settings.soundEnabled ? atlas.soundOn : atlas.soundOff, 0, 0, 64, 64);
    return true;
  }

  if (app === APP.help) {
    if (helps[helpIdx]?.naturalWidth > 0) {
      drawFullscreenCroppedImage(ctx, canvas, helps[helpIdx]);
    }
    drawUi(ctx, images, ui, atlas.arrow, 256, 0, 64, 64, true);
    return true;
  }

  if (app === APP.highscores) {
    drawUi(ctx, images, ui, atlas.highTitle, 10, 344, 300, 33);
    drawUi(ctx, images, ui, atlas.arrow, 0, 0, 64, 64);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(12, Math.round(24 * ui.scale))}px monospace`;
    let textY = 160;
    for (let i = 4; i >= 0; i--) {
      ctx.fillText(`${i + 1}. ${settings.highscores[i]}`, ui.x + 94 * ui.scale, ui.y + textY * ui.scale);
      textY += 30;
    }
    return true;
  }

  if (app === APP.winStory) {
    const centerX = ui.x + (ui.w * ui.scale) / 2;
    const dialogueWidth = 240 * ui.scale;
    const dialogueTop = ui.y + 64 * ui.scale;
    const lineHeight = Math.max(18, Math.round(24 * ui.scale));

    drawUi(ctx, images, ui, atlas.castle, 60, 120, 200, 200);
    drawUi(ctx, images, ui, atlas.bobFall[0], 120, 200, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.max(12, Math.round(18 * ui.scale))}px sans-serif`;
    for (const [index, line] of wrapText(ctx, winStoryMessages[winStoryIdx], dialogueWidth).entries()) {
      ctx.fillText(line, centerX, dialogueTop + index * lineHeight);
    }
    ctx.font = `${Math.max(10, Math.round(14 * ui.scale))}px sans-serif`;
    ctx.fillText("点击继续", centerX, ui.y + 438 * ui.scale);
    ctx.textAlign = "start";
    return true;
  }

  return false;
}

export function renderGameUi({ ctx, canvas, game, images, ui }) {
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(12, Math.round(20 * ui.scale))}px sans-serif`;
  ctx.fillText(game.scoreLabel, ui.x + 16 * ui.scale, ui.y + 28 * ui.scale);

  if (game.state === GAME.ready) drawUi(ctx, images, ui, atlas.ready, 64, 224, 192, 32);
  if (game.state === GAME.running) drawUi(ctx, images, ui, atlas.pause, 256, 416, 64, 64);
  if (game.state === GAME.paused) drawUi(ctx, images, ui, atlas.pauseMenu, 64, 192, 192, 96);
  if (game.state === GAME.over) drawUi(ctx, images, ui, atlas.gameOver, 80, 192, 160, 96);
  if (game.state !== GAME.win) return;

  ctx.fillStyle = "#0009";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "start";
  ctx.font = `bold ${Math.max(12, Math.round(24 * ui.scale))}px sans-serif`;
  ctx.fillText("YOU WIN!", ui.x + 104 * ui.scale, ui.y + 220 * ui.scale);
  ctx.font = `${Math.max(10, Math.round(16 * ui.scale))}px sans-serif`;
  ctx.fillText("点击返回主菜单", ui.x + 104 * ui.scale, ui.y + 250 * ui.scale);
}

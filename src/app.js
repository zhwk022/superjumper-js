import { audios, beginCriticalAssetLoading, criticalAssets, images } from "./assets.js";
import {
  APP,
  atlas,
  BOB,
  CASTLE,
  COIN,
  FRUSTUM_HEIGHT,
  FRUSTUM_WIDTH,
  GAME,
  GRAVITY,
  menuBounds,
  pauseBtn,
  PLATFORM,
  quitBtn,
  resumeBtn,
  SPRING,
  SQUIRREL,
  STORAGE_KEY,
  UI,
  winStoryMessages,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config.js";
import { addHighscore, loadSettings, saveSettings } from "./storage.js";
import { bounds, frame, hit, overlap, rnd } from "./utils.js";
import { attachViewportListeners, uiPointer } from "./viewport.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

attachViewportListeners(canvas, UI);

beginCriticalAssetLoading();

const helps = images.helps;
const input = { keys: new Set(), pointer: { x: 0, y: 0, down: false, justDown: false } };
const cam = { x: FRUSTUM_WIDTH / 2, y: FRUSTUM_HEIGHT / 2 };

let userInteracted = false;
let settings = loadSettings(STORAGE_KEY);
let app = APP.menu;
let helpIdx = 0;
let winStoryIdx = 0;
let game = createGame();
let last = performance.now();

window.addEventListener("keydown", (e) => {
  input.keys.add(e.code);
  userInteracted = true;
  applyMusic();
});
window.addEventListener("keyup", (e) => input.keys.delete(e.code));
canvas.addEventListener("pointerdown", (e) => {
  setPointer(e);
  input.pointer.down = true;
  input.pointer.justDown = true;
  userInteracted = true;
  applyMusic();
});
canvas.addEventListener("pointermove", setPointer);
canvas.addEventListener("pointerup", () => (input.pointer.down = false));
canvas.addEventListener("pointercancel", () => (input.pointer.down = false));

function setPointer(e) {
  const r = canvas.getBoundingClientRect();
  input.pointer.x = ((e.clientX - r.left) / r.width) * canvas.width;
  input.pointer.y = canvas.height - ((e.clientY - r.top) / r.height) * canvas.height;
}
function play(audio) {
  if (!settings.soundEnabled) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function applyMusic() {
  if (!settings.soundEnabled) {
    audios.music.pause();
    return;
  }
  if (userInteracted) audios.music.play().catch(() => {});
}

function saveCurrentSettings() {
  saveSettings(STORAGE_KEY, settings);
}

function createGame() {
  const bob = { x: 5, y: 1, w: BOB.width, h: BOB.height, vx: 0, vy: 0, state: "fall", stateTime: 0, bounds: bounds(5, 1, BOB.width, BOB.height) };
  const platforms = [];
  const springs = [];
  const squirrels = [];
  const coins = [];

  let y = PLATFORM.height / 2;
  const maxJump = (BOB.jumpVelocity * BOB.jumpVelocity) / (2 * -GRAVITY.y);
  while (y < WORLD_HEIGHT - WORLD_WIDTH / 2) {
    const moving = rnd() > 0.8;
    const x = rnd() * (WORLD_WIDTH - PLATFORM.width) + PLATFORM.width / 2;
    const p = {
      x, y, w: PLATFORM.width, h: PLATFORM.height, bounds: bounds(x, y, PLATFORM.width, PLATFORM.height),
      vx: moving ? PLATFORM.velocity : 0, moving, state: "normal", stateTime: 0,
    };
    platforms.push(p);
    if (rnd() > 0.9 && !moving) {
      const sy = y + PLATFORM.height / 2 + SPRING.height / 2;
      springs.push({ x, y: sy, w: SPRING.width, h: SPRING.height, bounds: bounds(x, sy, SPRING.width, SPRING.height) });
    }
    if (y > WORLD_HEIGHT / 3 && rnd() > 0.8) {
      const sx = x + rnd();
      const sy = y + SQUIRREL.height + rnd() * 2;
      squirrels.push({ x: sx, y: sy, w: SQUIRREL.width, h: SQUIRREL.height, vx: SQUIRREL.velocity, stateTime: 0, bounds: bounds(sx, sy, SQUIRREL.width, SQUIRREL.height) });
    }
    if (rnd() > 0.6) {
      const cx = x + rnd();
      const cy = y + COIN.height + rnd() * 3;
      coins.push({ x: cx, y: cy, w: COIN.width, h: COIN.height, stateTime: 0, bounds: bounds(cx, cy, COIN.width, COIN.height) });
    }
    y += maxJump - 0.5;
    y -= rnd() * (maxJump / 3);
  }
  const castle = { x: WORLD_WIDTH / 2, y, w: CASTLE.width, h: CASTLE.height, bounds: bounds(WORLD_WIDTH / 2, y, CASTLE.width, CASTLE.height) };
  return { world: { bob, platforms, springs, squirrels, coins, castle, score: 0, height: 0 }, state: GAME.ready, scoreLabel: "SCORE: 0", handledOver: false };
}
function resetGame() {
  game = createGame();
  cam.y = FRUSTUM_HEIGHT / 2;
}
function enterWinStory() {
  game.state = GAME.win;
  winStoryIdx = 0;
  app = APP.winStory;
}

function updateRunning(dt) {
  const w = game.world;
  const bob = w.bob;
  let accelX = 0;
  if (input.keys.has("ArrowLeft")) accelX = 5;
  if (input.keys.has("ArrowRight")) accelX = -5;
  if (!input.keys.has("ArrowLeft") && !input.keys.has("ArrowRight") && input.pointer.down) accelX = input.pointer.x < canvas.width / 2 ? 5 : -5;

  if (bob.state !== "hit" && bob.y <= 0.5) {
    bob.vy = BOB.jumpVelocity;
    bob.state = "jump";
    bob.stateTime = 0;
  }
  if (bob.state !== "hit") bob.vx = (-accelX / 10) * BOB.moveVelocity;
  bob.vy += GRAVITY.y * dt;
  bob.x += bob.vx * dt;
  bob.y += bob.vy * dt;
  if (bob.vy > 0 && bob.state !== "hit") bob.state = "jump";
  if (bob.vy < 0 && bob.state !== "hit") bob.state = "fall";
  if (bob.x < 0) bob.x = WORLD_WIDTH;
  if (bob.x > WORLD_WIDTH) bob.x = 0;
  bob.stateTime += dt;
  bob.bounds.x = bob.x - bob.w / 2;
  bob.bounds.y = bob.y - bob.h / 2;
  w.height = Math.max(w.height, bob.y);

  for (let i = w.platforms.length - 1; i >= 0; i--) {
    const p = w.platforms[i];
    if (p.moving) {
      p.x += p.vx * dt;
      if (p.x < PLATFORM.width / 2 || p.x > WORLD_WIDTH - PLATFORM.width / 2) p.vx = -p.vx;
      p.x = Math.max(PLATFORM.width / 2, Math.min(WORLD_WIDTH - PLATFORM.width / 2, p.x));
      p.bounds.x = p.x - p.w / 2;
    }
    p.stateTime += dt;
    if (p.state === "pulverizing" && p.stateTime > PLATFORM.pulverizeTime) w.platforms.splice(i, 1);
  }

  for (const s of w.squirrels) {
    s.x += s.vx * dt;
    if (s.x < SQUIRREL.width / 2 || s.x > WORLD_WIDTH - SQUIRREL.width / 2) s.vx = -s.vx;
    s.x = Math.max(SQUIRREL.width / 2, Math.min(WORLD_WIDTH - SQUIRREL.width / 2, s.x));
    s.bounds.x = s.x - s.w / 2;
    s.stateTime += dt;
  }
  for (const c of w.coins) c.stateTime += dt;

  if (bob.vy <= 0) {
    for (const p of w.platforms) {
      if (bob.y > p.y && overlap(bob.bounds, p.bounds)) {
        bob.vy = BOB.jumpVelocity;
        bob.state = "jump";
        bob.stateTime = 0;
        play(audios.jump);
        if (rnd() > 0.5) {
          p.state = "pulverizing";
          p.stateTime = 0;
          p.vx = 0;
        }
        break;
      }
    }
    for (const s of w.springs) {
      if (bob.y > s.y && overlap(bob.bounds, s.bounds)) {
        bob.vy = BOB.jumpVelocity * 1.5;
        bob.state = "jump";
        bob.stateTime = 0;
        play(audios.highJump);
        break;
      }
    }
  }

  for (const s of w.squirrels) {
    if (overlap(bob.bounds, s.bounds)) {
      bob.vx = 0;
      bob.vy = 0;
      bob.state = "hit";
      play(audios.hit);
    }
  }
  for (let i = w.coins.length - 1; i >= 0; i--) {
    if (overlap(bob.bounds, w.coins[i].bounds)) {
      w.coins.splice(i, 1);
      w.score += COIN.score;
      play(audios.coin);
    }
  }

  if (overlap(bob.bounds, w.castle.bounds)) {
    enterWinStory();
    return;
  }
  if (w.height - FRUSTUM_HEIGHT / 2 > bob.y) game.state = GAME.over;
  if (bob.y > cam.y) cam.y = bob.y;
  game.scoreLabel = `SCORE: ${w.score}`;
}

function update() {
  if (criticalAssets.status !== "ready") {
    if (criticalAssets.status === "error" && input.pointer.justDown) beginCriticalAssetLoading();
    return;
  }

  if (app === APP.menu) {
    if (!input.pointer.justDown) return;
    const p = uiPointer(input.pointer, canvas, UI);
    if (hit(menuBounds.play, p.x, p.y)) {
      play(audios.click);
      resetGame();
      app = APP.game;
    } else if (hit(menuBounds.hs, p.x, p.y)) {
      play(audios.click);
      app = APP.highscores;
    } else if (hit(menuBounds.help, p.x, p.y)) {
      play(audios.click);
      helpIdx = 0;
      app = APP.help;
    } else if (hit(menuBounds.sound, p.x, p.y)) {
      play(audios.click);
      settings.soundEnabled = !settings.soundEnabled;
      saveCurrentSettings();
      applyMusic();
    }
    return;
  }

  if (app === APP.help) {
    if (input.pointer.justDown) {
      const p = uiPointer(input.pointer, canvas, UI);
      if (hit({ x: 256, y: 0, w: 64, h: 64 }, p.x, p.y)) {
        play(audios.click);
        helpIdx += 1;
        if (helpIdx >= helps.length) app = APP.menu;
      }
    }
    return;
  }

  if (app === APP.highscores) {
    if (input.pointer.justDown) {
      const p = uiPointer(input.pointer, canvas, UI);
      if (hit({ x: 0, y: 0, w: 64, h: 64 }, p.x, p.y)) {
        play(audios.click);
        app = APP.menu;
      }
    }
    return;
  }

  if (app === APP.winStory) {
    if (input.pointer.justDown) {
      play(audios.click);
      winStoryIdx += 1;
      if (winStoryIdx >= winStoryMessages.length) {
        app = APP.menu;
        resetGame();
      }
    }
    return;
  }

  if (app === APP.game) {
    if (game.state === GAME.ready) {
      if (input.pointer.justDown) game.state = GAME.running;
      return;
    }
    if (game.state === GAME.running) {
      if (input.pointer.justDown) {
        const p = uiPointer(input.pointer, canvas, UI);
        if (hit(pauseBtn, p.x, p.y)) {
          play(audios.click);
          game.state = GAME.paused;
          return;
        }
      }
      updateRunning(deltaSec);
      if (game.state === GAME.over && !game.handledOver) {
        game.handledOver = true;
        const isNew = addHighscore(settings, game.world.score, saveCurrentSettings);
        if (isNew) game.scoreLabel = `NEW HIGHSCORE: ${game.world.score}`;
      }
      return;
    }
    if (game.state === GAME.paused) {
      if (!input.pointer.justDown) return;
      const p = uiPointer(input.pointer, canvas, UI);
      if (hit(resumeBtn, p.x, p.y)) {
        play(audios.click);
        game.state = GAME.running;
      } else if (hit(quitBtn, p.x, p.y)) {
        play(audios.click);
        app = APP.menu;
        resetGame();
      }
      return;
    }
    if ((game.state === GAME.over || game.state === GAME.win) && input.pointer.justDown) {
      app = APP.menu;
      resetGame();
    }
  }
}

function worldToScreen(x, y) {
  return {
    x: ((x - cam.x + FRUSTUM_WIDTH / 2) / FRUSTUM_WIDTH) * canvas.width,
    y: canvas.height - ((y - cam.y + FRUSTUM_HEIGHT / 2) / FRUSTUM_HEIGHT) * canvas.height,
  };
}
function drawRegion(region, x, y, w, h, flipX = false) {
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
function drawUi(region, x, y, w, h, flipX = false) {
  const dx = UI.x + x * UI.scale;
  const dy = UI.y + (UI.h - y - h) * UI.scale;
  drawRegion(region, dx, dy, w * UI.scale, h * UI.scale, flipX);
}
function drawWorld(region, x, y, w, h, flipX = false) {
  const p = worldToScreen(x, y);
  const sw = (w / FRUSTUM_WIDTH) * canvas.width;
  const sh = (h / FRUSTUM_HEIGHT) * canvas.height;
  drawRegion(region, p.x - sw / 2, p.y - sh / 2, sw, sh, flipX);
}
function drawBg() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (images.bg.complete) {
    // Match libGDX: Assets.backgroundRegion uses only the 320x480 content area
    // from the 512x512 texture. Drawing the whole texture shows unused padding.
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

function drawCriticalOverlay() {
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
  let ty = y + 62;
  const tx = x + 14;
  for (const line of lines) {
    ctx.fillText(line, tx, ty);
    ty += 18;
  }

  ctx.restore();
}

function draw() {
  drawBg();

  if (criticalAssets.status !== "ready") {
    drawCriticalOverlay();
    return;
  }

  if (app === APP.menu) {
    drawUi(atlas.logo, 23, 328, 274, 142);
    drawUi(atlas.mainMenu, 10, 145, 300, 110);
    drawUi(settings.soundEnabled ? atlas.soundOn : atlas.soundOff, 0, 0, 64, 64);
    return;
  }

  if (app === APP.help) {
    if (helps[helpIdx]?.complete) {
      ctx.drawImage(helps[helpIdx], UI.x, UI.y, UI.w * UI.scale, UI.h * UI.scale);
    }
    drawUi(atlas.arrow, 256, 0, 64, 64, true);
    return;
  }

  if (app === APP.highscores) {
    drawUi(atlas.highTitle, 10, 344, 300, 33);
    drawUi(atlas.arrow, 0, 0, 64, 64);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(12, Math.round(24 * UI.scale))}px monospace`;
    let y = 160;
    for (let i = 4; i >= 0; i--) {
      ctx.fillText(`${i + 1}. ${settings.highscores[i]}`, UI.x + 94 * UI.scale, UI.y + y * UI.scale);
      y += 30;
    }
    return;
  }

  if (app === APP.winStory) {
    drawUi(atlas.castle, 60, 120, 200, 200);
    drawUi(atlas.bobFall[0], 120, 200, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.max(12, Math.round(18 * UI.scale))}px sans-serif`;
    const msg = winStoryMessages[winStoryIdx];
    ctx.fillText(msg, UI.x + (UI.w * UI.scale) / 2, UI.y + 90 * UI.scale);
    ctx.font = `${Math.max(10, Math.round(14 * UI.scale))}px sans-serif`;
    ctx.fillText("点击继续", UI.x + (UI.w * UI.scale) / 2, UI.y + 430 * UI.scale);
    ctx.textAlign = "start";
    return;
  }

  const w = game.world;
  for (const p of w.platforms) {
    const r = p.state === "pulverizing" ? frame(atlas.breakPlatform, p.stateTime, 0.2, false) : atlas.platform;
    drawWorld(r, p.x, p.y, PLATFORM.width, PLATFORM.height);
  }
  for (const s of w.springs) drawWorld(atlas.spring, s.x, s.y, 1, 1);
  for (const c of w.coins) drawWorld(frame(atlas.coin, c.stateTime, 0.2, true), c.x, c.y, 1, 1);
  for (const s of w.squirrels) drawWorld(frame(atlas.squirrel, s.stateTime, 0.2, true), s.x, s.y, 1, 1, s.vx < 0);
  drawWorld(atlas.castle, w.castle.x, w.castle.y, 2, 2);

  const b = w.bob;
  const br = b.state === "jump" ? frame(atlas.bobJump, b.stateTime, 0.2, true) : b.state === "fall" ? frame(atlas.bobFall, b.stateTime, 0.2, true) : atlas.bobHit;
  drawWorld(br, b.x, b.y, 1, 1, b.vx < 0);

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(12, Math.round(20 * UI.scale))}px sans-serif`;
  ctx.fillText(game.scoreLabel, UI.x + 16 * UI.scale, UI.y + 28 * UI.scale);

  if (game.state === GAME.ready) drawUi(atlas.ready, 64, 224, 192, 32);
  if (game.state === GAME.running) drawUi(atlas.pause, 256, 416, 64, 64);
  if (game.state === GAME.paused) drawUi(atlas.pauseMenu, 64, 192, 192, 96);
  if (game.state === GAME.over) drawUi(atlas.gameOver, 80, 192, 160, 96);
  if (game.state === GAME.win) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "start";
    ctx.font = `bold ${Math.max(12, Math.round(24 * UI.scale))}px sans-serif`;
    ctx.fillText("YOU WIN!", UI.x + 104 * UI.scale, UI.y + 220 * UI.scale);
    ctx.font = `${Math.max(10, Math.round(16 * UI.scale))}px sans-serif`;
    ctx.fillText("点击返回主菜单", UI.x + 104 * UI.scale, UI.y + 250 * UI.scale);
  }
}

let deltaSec = 0;
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

const WORLD_WIDTH = 10;
const WORLD_HEIGHT = 15 * 20;
const FRUSTUM_WIDTH = 10;
const FRUSTUM_HEIGHT = 15;
const GRAVITY = { x: 0, y: -12 };
const STORAGE_KEY = "superjumper_settings_v1";

const BOB = { width: 0.8, height: 0.8, jumpVelocity: 11, moveVelocity: 20 };
const PLATFORM = { width: 2, height: 0.5, velocity: 2, pulverizeTime: 0.8 };
const COIN = { width: 0.5, height: 0.8, score: 10 };
const SPRING = { width: 0.3, height: 0.3 };
const SQUIRREL = { width: 1, height: 0.6, velocity: 3 };
const CASTLE = { width: 1.7, height: 1.7 };

const APP = { menu: "menu", help: "help", highscores: "highscores", game: "game", winStory: "win_story" };
const GAME = { ready: "ready", running: "running", paused: "paused", over: "over", win: "win" };

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const viewport = window.visualViewport;
  const rawWidth = Math.max(
    viewport ? viewport.width : 0,
    window.innerWidth || 0,
    document.documentElement.clientWidth || 0
  );
  const rawHeight = Math.max(
    viewport ? viewport.height : 0,
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0
  );
  const cssWidth = Math.max(1, Math.ceil(rawWidth));
  const cssHeight = Math.max(1, Math.ceil(rawHeight));
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const nextWidth = Math.ceil(cssWidth * dpr);
  const nextHeight = Math.ceil(cssHeight * dpr);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  // Add 1 CSS px overdraw to hide fractional viewport seams in mobile webviews.
  canvas.style.width = `${cssWidth + 1}px`;
  canvas.style.height = `${cssHeight + 1}px`;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);

const DATA_BASE_URL = new URL("../assets/data/", import.meta.url);
function dataUrl(path) {
  return new URL(path, DATA_BASE_URL).href;
}

let bg;
let items;

const criticalAssets = { status: "loading", total: 2, loaded: 0, error: null, startedAt: 0 };

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

function beginCriticalAssetLoading() {
  criticalAssets.status = "loading";
  criticalAssets.loaded = 0;
  criticalAssets.error = null;
  criticalAssets.startedAt = performance.now();

  bg = new Image();
  items = new Image();

  const bgSrc = dataUrl("background.png");
  const itemsSrc = dataUrl("items.png");

  Promise.all([
    loadImage(bg, bgSrc, "background.png"),
    loadImage(items, itemsSrc, "items.png"),
  ]).then(() => {
    criticalAssets.status = "ready";
  }).catch((err) => {
    criticalAssets.status = "error";
    criticalAssets.error = err;
  });
}

beginCriticalAssetLoading();
const helps = [1, 2, 3, 4, 5].map((i) => {
  const img = new Image();
  img.src = dataUrl(`help${i}.png`);
  return img;
});

const atlas = {
  mainMenu: [0, 224, 300, 110],
  pauseMenu: [224, 128, 192, 96],
  ready: [320, 224, 192, 32],
  gameOver: [352, 256, 160, 96],
  highTitle: [0, 257, 300, 33],
  logo: [0, 352, 274, 142],
  soundOff: [0, 0, 64, 64],
  soundOn: [64, 0, 64, 64],
  arrow: [0, 64, 64, 64],
  pause: [64, 64, 64, 64],
  spring: [128, 0, 32, 32],
  castle: [128, 64, 64, 64],
  coin: [
    [128, 32, 32, 32],
    [160, 32, 32, 32],
    [192, 32, 32, 32],
    [160, 32, 32, 32],
  ],
  bobJump: [
    [0, 128, 32, 32],
    [32, 128, 32, 32],
  ],
  bobFall: [
    [64, 128, 32, 32],
    [96, 128, 32, 32],
  ],
  bobHit: [128, 128, 32, 32],
  squirrel: [
    [0, 160, 32, 32],
    [32, 160, 32, 32],
  ],
  platform: [64, 160, 64, 16],
  breakPlatform: [
    [64, 160, 64, 16],
    [64, 176, 64, 16],
    [64, 192, 64, 16],
    [64, 208, 64, 16],
  ],
};

const audios = {
  jump: new Audio(dataUrl("jump.wav")),
  highJump: new Audio(dataUrl("highjump.wav")),
  hit: new Audio(dataUrl("hit.wav")),
  coin: new Audio(dataUrl("coin.wav")),
  click: new Audio(dataUrl("click.wav")),
  music: new Audio(dataUrl("music.mp3")),
};
audios.music.loop = true;
audios.music.volume = 0.45;
for (const k of ["jump", "highJump", "hit", "coin", "click"]) audios[k].volume = 0.7;

const input = { keys: new Set(), pointer: { x: 0, y: 0, down: false, justDown: false } };
let userInteracted = false;

const menuBounds = {
  sound: { x: 0, y: 0, w: 64, h: 64 },
  play: { x: 10, y: 218, w: 300, h: 36 },
  hs: { x: 10, y: 182, w: 300, h: 36 },
  help: { x: 10, y: 146, w: 300, h: 36 },
};
const pauseBtn = { x: 256, y: 416, w: 64, h: 64 };
const resumeBtn = { x: 64, y: 240, w: 192, h: 36 };
const quitBtn = { x: 64, y: 204, w: 192, h: 36 };

let settings = loadSettings();
let app = APP.menu;
let helpIdx = 0;
let winStoryIdx = 0;
const winStoryMessages = [
  "Princess: Oh dear! What have you done?",
  "Bob: I came to rescue you!",
  "Princess: You are mistaken. I need no rescuing.",
  "Bob: So all this work for nothing?",
  "Princess: I have cake and tea! Would you like some?",
  "Bob: It would be my pleasure!",
  "And they ate cake and drank tea happily ever after.",
];
let game = createGame();
const cam = { x: FRUSTUM_WIDTH / 2, y: FRUSTUM_HEIGHT / 2 };
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
function hit(b, x, y) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}
function rnd() {
  return Math.random();
}
function bounds(x, y, w, h) {
  return { x: x - w / 2, y: y - h / 2, w, h };
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function frame(frames, t, d, loop) {
  let i = Math.floor(t / d);
  i = loop ? i % frames.length : Math.min(frames.length - 1, i);
  return frames[i];
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
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { soundEnabled: true, highscores: [100, 80, 50, 30, 10] };
    const obj = JSON.parse(raw);
    const highs = Array.isArray(obj.highscores) ? obj.highscores.slice(0, 5).map((n) => Number(n) || 0) : [100, 80, 50, 30, 10];
    while (highs.length < 5) highs.push(0);
    return { soundEnabled: Boolean(obj.soundEnabled), highscores: highs };
  } catch {
    return { soundEnabled: true, highscores: [100, 80, 50, 30, 10] };
  }
}
function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
function addHighscore(score) {
  for (let i = 0; i < 5; i++) {
    if (settings.highscores[i] < score) {
      for (let j = 4; j > i; j--) settings.highscores[j] = settings.highscores[j - 1];
      settings.highscores[i] = score;
      saveSettings();
      return true;
    }
  }
  return false;
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
    const p = input.pointer;
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
      saveSettings();
      applyMusic();
    }
    return;
  }

  if (app === APP.help) {
    if (input.pointer.justDown && hit({ x: 256, y: 0, w: 64, h: 64 }, input.pointer.x, input.pointer.y)) {
      play(audios.click);
      helpIdx += 1;
      if (helpIdx >= helps.length) app = APP.menu;
    }
    return;
  }

  if (app === APP.highscores) {
    if (input.pointer.justDown && hit({ x: 0, y: 0, w: 64, h: 64 }, input.pointer.x, input.pointer.y)) {
      play(audios.click);
      app = APP.menu;
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
      if (input.pointer.justDown && hit(pauseBtn, input.pointer.x, input.pointer.y)) {
        play(audios.click);
        game.state = GAME.paused;
      } else {
        updateRunning(deltaSec);
      }
      if (game.state === GAME.over && !game.handledOver) {
        game.handledOver = true;
        const isNew = addHighscore(game.world.score);
        if (isNew) game.scoreLabel = `NEW HIGHSCORE: ${game.world.score}`;
      }
      return;
    }
    if (game.state === GAME.paused) {
      if (!input.pointer.justDown) return;
      if (hit(resumeBtn, input.pointer.x, input.pointer.y)) {
        play(audios.click);
        game.state = GAME.running;
      } else if (hit(quitBtn, input.pointer.x, input.pointer.y)) {
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
  if (!items.complete) return;
  const [sx, sy, sw, sh] = region;
  ctx.save();
  if (flipX) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(items, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(items, sx, sy, sw, sh, x, y, w, h);
  }
  ctx.restore();
}
function drawUi(region, x, y, w, h, flipX = false) {
  drawRegion(region, x, canvas.height - y - h, w, h, flipX);
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
  if (bg.complete) {
    const imgRatio = bg.width / bg.height;
    const canvasRatio = canvas.width / canvas.height;
    const overscan = Math.max(2, Math.ceil(Math.max(canvas.width, canvas.height) * 0.01));
    let sx = 0;
    let sy = 0;
    let sw = bg.width;
    let sh = bg.height;

    if (imgRatio > canvasRatio) {
      sw = bg.height * canvasRatio;
      sx = (bg.width - sw) / 2;
    } else {
      sh = bg.width / canvasRatio;
      sy = (bg.height - sh) / 2;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      bg,
      sx,
      sy,
      sw,
      sh,
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
    if (helps[helpIdx]?.complete) ctx.drawImage(helps[helpIdx], 0, 0, canvas.width, canvas.height);
    drawUi(atlas.arrow, 256, 0, 64, 64, true);
    return;
  }

  if (app === APP.highscores) {
    drawUi(atlas.highTitle, 10, 344, 300, 33);
    drawUi(atlas.arrow, 0, 0, 64, 64);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    let y = 160;
    for (let i = 4; i >= 0; i--) {
      ctx.fillText(`${i + 1}. ${settings.highscores[i]}`, 94, y);
      y += 30;
    }
    return;
  }

  if (app === APP.winStory) {
    drawUi(atlas.castle, 60, 120, 200, 200);
    drawUi(atlas.bobFall[0], 120, 200, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 18px sans-serif";
    const msg = winStoryMessages[winStoryIdx];
    ctx.fillText(msg, canvas.width / 2, 90);
    ctx.font = "14px sans-serif";
    ctx.fillText("点击继续", canvas.width / 2, 430);
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
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(game.scoreLabel, 16, 28);

  if (game.state === GAME.ready) drawUi(atlas.ready, 64, 224, 192, 32);
  if (game.state === GAME.running) drawUi(atlas.pause, 256, 416, 64, 64);
  if (game.state === GAME.paused) drawUi(atlas.pauseMenu, 64, 192, 192, 96);
  if (game.state === GAME.over) drawUi(atlas.gameOver, 80, 192, 160, 96);
  if (game.state === GAME.win) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("YOU WIN!", 104, 220);
    ctx.font = "16px sans-serif";
    ctx.fillText("点击返回主菜单", 104, 250);
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

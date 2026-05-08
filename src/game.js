// Legacy prototype retained for reference. The active entry point is `src/app.js`.
const WORLD_WIDTH = 10;
const WORLD_HEIGHT = 15 * 20;
const FRUSTUM_WIDTH = 10;
const FRUSTUM_HEIGHT = 15;
const GRAVITY = { x: 0, y: -12 };

const BOB = {
  width: 0.8,
  height: 0.8,
  jumpVelocity: 11,
  moveVelocity: 20,
  state: {
    jump: "jump",
    fall: "fall",
    hit: "hit",
  },
};

const PLATFORM = {
  width: 2,
  height: 0.5,
  velocity: 2,
  pulverizeTime: 0.8,
  type: {
    static: "static",
    moving: "moving",
  },
  state: {
    normal: "normal",
    pulverizing: "pulverizing",
  },
};

const COIN = {
  width: 0.5,
  height: 0.8,
  score: 10,
};

const SPRING = {
  width: 0.3,
  height: 0.3,
};

const SQUIRREL = {
  width: 1,
  height: 0.6,
  velocity: 3,
};

const CASTLE = {
  width: 1.7,
  height: 1.7,
};

const GAME_STATE = {
  ready: "ready",
  running: "running",
  gameOver: "game_over",
  win: "win",
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const DATA_BASE_URL = new URL("../assets/data/", import.meta.url);
function dataUrl(path) {
  return new URL(path, DATA_BASE_URL).href;
}

const backgroundImg = new Image();
backgroundImg.src = dataUrl("background.png");

const itemsImg = new Image();
itemsImg.src = dataUrl("items.png");

const atlas = {
  ready: { x: 320, y: 224, w: 192, h: 32 },
  gameOver: { x: 352, y: 256, w: 160, h: 96 },
  spring: { x: 128, y: 0, w: 32, h: 32 },
  castle: { x: 128, y: 64, w: 64, h: 64 },
  coin: [
    { x: 128, y: 32, w: 32, h: 32 },
    { x: 160, y: 32, w: 32, h: 32 },
    { x: 192, y: 32, w: 32, h: 32 },
    { x: 160, y: 32, w: 32, h: 32 },
  ],
  bobJump: [
    { x: 0, y: 128, w: 32, h: 32 },
    { x: 32, y: 128, w: 32, h: 32 },
  ],
  bobFall: [
    { x: 64, y: 128, w: 32, h: 32 },
    { x: 96, y: 128, w: 32, h: 32 },
  ],
  bobHit: { x: 128, y: 128, w: 32, h: 32 },
  squirrel: [
    { x: 0, y: 160, w: 32, h: 32 },
    { x: 32, y: 160, w: 32, h: 32 },
  ],
  platform: { x: 64, y: 160, w: 64, h: 16 },
  breakingPlatform: [
    { x: 64, y: 160, w: 64, h: 16 },
    { x: 64, y: 176, w: 64, h: 16 },
    { x: 64, y: 192, w: 64, h: 16 },
    { x: 64, y: 208, w: 64, h: 16 },
  ],
};

const sounds = {
  jump: new Audio(dataUrl("jump.wav")),
  highJump: new Audio(dataUrl("highjump.wav")),
  hit: new Audio(dataUrl("hit.wav")),
  coin: new Audio(dataUrl("coin.wav")),
  music: new Audio(dataUrl("music.mp3")),
};
sounds.music.loop = true;
sounds.music.volume = 0.4;
for (const key of ["jump", "highJump", "hit", "coin"]) {
  sounds[key].volume = 0.7;
}

const input = {
  keys: new Set(),
  touchDir: 0,
  startRequested: false,
};

window.addEventListener("keydown", (e) => {
  input.keys.add(e.code);
  if (e.code === "Space") {
    input.startRequested = true;
  }
});

window.addEventListener("keyup", (e) => {
  input.keys.delete(e.code);
});

function pointerToDir(clientX) {
  const rect = canvas.getBoundingClientRect();
  const localX = ((clientX - rect.left) / rect.width) * canvas.width;
  return localX < canvas.width / 2 ? -1 : 1;
}

canvas.addEventListener("pointerdown", (e) => {
  input.touchDir = pointerToDir(e.clientX);
  input.startRequested = true;
});
canvas.addEventListener("pointermove", (e) => {
  if ((e.buttons & 1) === 1) {
    input.touchDir = pointerToDir(e.clientX);
  }
});
canvas.addEventListener("pointerup", () => {
  input.touchDir = 0;
});
canvas.addEventListener("pointercancel", () => {
  input.touchDir = 0;
});

function rnd() {
  return Math.random();
}

function makeBounds(x, y, w, h) {
  return { x: x - w / 2, y: y - h / 2, w, h };
}

function updateBounds(obj) {
  obj.bounds.x = obj.x - obj.w / 2;
  obj.bounds.y = obj.y - obj.h / 2;
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function frameOf(frames, stateTime, frameDuration, looping) {
  let idx = Math.floor(stateTime / frameDuration);
  if (looping) {
    idx = idx % frames.length;
  } else {
    idx = Math.min(frames.length - 1, idx);
  }
  return frames[idx];
}

function createWorld() {
  const bob = {
    x: 5,
    y: 1,
    w: BOB.width,
    h: BOB.height,
    bounds: makeBounds(5, 1, BOB.width, BOB.height),
    vx: 0,
    vy: 0,
    state: BOB.state.fall,
    stateTime: 0,
  };

  const platforms = [];
  const springs = [];
  const squirrels = [];
  const coins = [];

  let y = PLATFORM.height / 2;
  const maxJumpHeight =
    (BOB.jumpVelocity * BOB.jumpVelocity) / (2 * -GRAVITY.y);

  while (y < WORLD_HEIGHT - WORLD_WIDTH / 2) {
    const type =
      rnd() > 0.8 ? PLATFORM.type.moving : PLATFORM.type.static;
    const x = rnd() * (WORLD_WIDTH - PLATFORM.width) + PLATFORM.width / 2;

    const p = {
      x,
      y,
      w: PLATFORM.width,
      h: PLATFORM.height,
      bounds: makeBounds(x, y, PLATFORM.width, PLATFORM.height),
      vx: type === PLATFORM.type.moving ? PLATFORM.velocity : 0,
      type,
      state: PLATFORM.state.normal,
      stateTime: 0,
    };
    platforms.push(p);

    if (rnd() > 0.9 && type !== PLATFORM.type.moving) {
      const sy = p.y + PLATFORM.height / 2 + SPRING.height / 2;
      const s = {
        x: p.x,
        y: sy,
        w: SPRING.width,
        h: SPRING.height,
        bounds: makeBounds(p.x, sy, SPRING.width, SPRING.height),
      };
      springs.push(s);
    }

    if (y > WORLD_HEIGHT / 3 && rnd() > 0.8) {
      const sq = {
        x: p.x + rnd(),
        y: p.y + SQUIRREL.height + rnd() * 2,
        w: SQUIRREL.width,
        h: SQUIRREL.height,
        bounds: makeBounds(
          p.x,
          p.y + SQUIRREL.height,
          SQUIRREL.width,
          SQUIRREL.height
        ),
        vx: SQUIRREL.velocity,
        vy: 0,
        stateTime: 0,
      };
      updateBounds(sq);
      squirrels.push(sq);
    }

    if (rnd() > 0.6) {
      const c = {
        x: p.x + rnd(),
        y: p.y + COIN.height + rnd() * 3,
        w: COIN.width,
        h: COIN.height,
        bounds: makeBounds(
          p.x + rnd(),
          p.y + COIN.height,
          COIN.width,
          COIN.height
        ),
        stateTime: 0,
      };
      updateBounds(c);
      coins.push(c);
    }

    y += maxJumpHeight - 0.5;
    y -= rnd() * (maxJumpHeight / 3);
  }

  const castle = {
    x: WORLD_WIDTH / 2,
    y,
    w: CASTLE.width,
    h: CASTLE.height,
    bounds: makeBounds(WORLD_WIDTH / 2, y, CASTLE.width, CASTLE.height),
  };

  return {
    bob,
    platforms,
    springs,
    squirrels,
    coins,
    castle,
    score: 0,
    heightSoFar: 0,
    state: GAME_STATE.running,
  };
}

function playSound(sound) {
  try {
    sound.currentTime = 0;
    sound.play();
  } catch (_e) {
    // ignore autoplay issues before user interaction
  }
}

const camera = {
  x: FRUSTUM_WIDTH / 2,
  y: FRUSTUM_HEIGHT / 2,
};

let world = createWorld();
let gameState = GAME_STATE.ready;
let lastTime = performance.now();
let musicStarted = false;

function restart() {
  world = createWorld();
  camera.y = FRUSTUM_HEIGHT / 2;
  gameState = GAME_STATE.ready;
  input.startRequested = false;
}

function updateBob(dt, accelX) {
  const bob = world.bob;
  if (bob.state !== BOB.state.hit && bob.y <= 0.5) {
    bob.vy = BOB.jumpVelocity;
    bob.state = BOB.state.jump;
    bob.stateTime = 0;
  }
  if (bob.state !== BOB.state.hit) {
    bob.vx = (-accelX / 10) * BOB.moveVelocity;
  }

  bob.vx += GRAVITY.x * dt;
  bob.vy += GRAVITY.y * dt;
  bob.x += bob.vx * dt;
  bob.y += bob.vy * dt;

  if (bob.vy > 0 && bob.state !== BOB.state.hit && bob.state !== BOB.state.jump) {
    bob.state = BOB.state.jump;
    bob.stateTime = 0;
  }
  if (bob.vy < 0 && bob.state !== BOB.state.hit && bob.state !== BOB.state.fall) {
    bob.state = BOB.state.fall;
    bob.stateTime = 0;
  }

  if (bob.x < 0) bob.x = WORLD_WIDTH;
  if (bob.x > WORLD_WIDTH) bob.x = 0;

  bob.stateTime += dt;
  updateBounds(bob);
  world.heightSoFar = Math.max(world.heightSoFar, bob.y);
}

function updatePlatforms(dt) {
  for (let i = world.platforms.length - 1; i >= 0; i--) {
    const p = world.platforms[i];
    if (p.type === PLATFORM.type.moving) {
      p.x += p.vx * dt;
      if (p.x < PLATFORM.width / 2) {
        p.x = PLATFORM.width / 2;
        p.vx = -p.vx;
      }
      if (p.x > WORLD_WIDTH - PLATFORM.width / 2) {
        p.x = WORLD_WIDTH - PLATFORM.width / 2;
        p.vx = -p.vx;
      }
      updateBounds(p);
    }
    p.stateTime += dt;
    if (p.state === PLATFORM.state.pulverizing && p.stateTime > PLATFORM.pulverizeTime) {
      world.platforms.splice(i, 1);
    }
  }
}

function updateSquirrels(dt) {
  for (const s of world.squirrels) {
    s.x += s.vx * dt;
    if (s.x < SQUIRREL.width / 2) {
      s.x = SQUIRREL.width / 2;
      s.vx = SQUIRREL.velocity;
    }
    if (s.x > WORLD_WIDTH - SQUIRREL.width / 2) {
      s.x = WORLD_WIDTH - SQUIRREL.width / 2;
      s.vx = -SQUIRREL.velocity;
    }
    s.stateTime += dt;
    updateBounds(s);
  }
}

function updateCoins(dt) {
  for (const c of world.coins) {
    c.stateTime += dt;
  }
}

function checkPlatformCollisions() {
  const bob = world.bob;
  if (bob.vy > 0) return;

  for (const p of world.platforms) {
    if (bob.y > p.y && overlaps(bob.bounds, p.bounds)) {
      bob.vy = BOB.jumpVelocity;
      bob.state = BOB.state.jump;
      bob.stateTime = 0;
      playSound(sounds.jump);
      if (rnd() > 0.5) {
        p.state = PLATFORM.state.pulverizing;
        p.stateTime = 0;
        p.vx = 0;
      }
      break;
    }
  }
}

function checkSquirrelCollisions() {
  const bob = world.bob;
  for (const s of world.squirrels) {
    if (overlaps(bob.bounds, s.bounds)) {
      bob.vx = 0;
      bob.vy = 0;
      bob.state = BOB.state.hit;
      bob.stateTime = 0;
      playSound(sounds.hit);
      break;
    }
  }
}

function checkItemCollisions() {
  const bob = world.bob;
  for (let i = world.coins.length - 1; i >= 0; i--) {
    if (overlaps(bob.bounds, world.coins[i].bounds)) {
      world.coins.splice(i, 1);
      world.score += COIN.score;
      playSound(sounds.coin);
    }
  }

  if (bob.vy > 0) return;
  for (const s of world.springs) {
    if (bob.y > s.y && overlaps(bob.bounds, s.bounds)) {
      bob.vy = BOB.jumpVelocity * 1.5;
      bob.state = BOB.state.jump;
      bob.stateTime = 0;
      playSound(sounds.highJump);
      break;
    }
  }
}

function checkCastleCollision() {
  if (overlaps(world.bob.bounds, world.castle.bounds)) {
    gameState = GAME_STATE.win;
  }
}

function checkGameOver() {
  if (world.heightSoFar - FRUSTUM_HEIGHT / 2 > world.bob.y) {
    gameState = GAME_STATE.gameOver;
  }
}

function updateWorld(dt) {
  let accelX = 0;
  if (input.keys.has("ArrowLeft")) accelX = 5;
  if (input.keys.has("ArrowRight")) accelX = -5;
  if (input.touchDir < 0) accelX = 5;
  if (input.touchDir > 0) accelX = -5;

  updateBob(dt, accelX);
  updatePlatforms(dt);
  updateSquirrels(dt);
  updateCoins(dt);

  if (world.bob.state !== BOB.state.hit) {
    checkPlatformCollisions();
    checkSquirrelCollisions();
    checkItemCollisions();
    checkCastleCollision();
  }
  checkGameOver();

  if (world.bob.y > camera.y) {
    camera.y = world.bob.y;
  }
}

function worldToScreen(x, y) {
  const sx = ((x - camera.x + FRUSTUM_WIDTH / 2) / FRUSTUM_WIDTH) * canvas.width;
  const sy =
    canvas.height -
    ((y - camera.y + FRUSTUM_HEIGHT / 2) / FRUSTUM_HEIGHT) * canvas.height;
  return { x: sx, y: sy };
}

function drawAtlasRegion(region, dx, dy, dw, dh, flipX = false) {
  if (!itemsImg.complete) return;
  ctx.save();
  if (flipX) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(
      itemsImg,
      region.x,
      region.y,
      region.w,
      region.h,
      0,
      0,
      dw,
      dh
    );
  } else {
    ctx.drawImage(
      itemsImg,
      region.x,
      region.y,
      region.w,
      region.h,
      dx,
      dy,
      dw,
      dh
    );
  }
  ctx.restore();
}

function drawAtlasInWorld(region, x, y, w, h, flipX = false) {
  const p = worldToScreen(x, y);
  const sw = (w / FRUSTUM_WIDTH) * canvas.width;
  const sh = (h / FRUSTUM_HEIGHT) * canvas.height;
  const dx = p.x - sw / 2;
  const dy = p.y - sh / 2;
  drawAtlasRegion(region, dx, dy, sw, sh, flipX);
}

function drawBackground() {
  if (backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#2f9cf5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawWorld() {
  drawBackground();

  for (const p of world.platforms) {
    let region = atlas.platform;
    if (p.state === PLATFORM.state.pulverizing) {
      region = frameOf(atlas.breakingPlatform, p.stateTime, 0.2, false);
    }
    drawAtlasInWorld(region, p.x, p.y, PLATFORM.width, PLATFORM.height);
  }

  for (const s of world.springs) {
    drawAtlasInWorld(atlas.spring, s.x, s.y, 1, 1);
  }

  for (const c of world.coins) {
    const region = frameOf(atlas.coin, c.stateTime, 0.2, true);
    drawAtlasInWorld(region, c.x, c.y, 1, 1);
  }

  for (const s of world.squirrels) {
    const region = frameOf(atlas.squirrel, s.stateTime, 0.2, true);
    drawAtlasInWorld(region, s.x, s.y, 1, 1, s.vx < 0);
  }

  drawAtlasInWorld(atlas.castle, world.castle.x, world.castle.y, 2, 2);

  const bob = world.bob;
  let bobRegion = atlas.bobHit;
  if (bob.state === BOB.state.jump) {
    bobRegion = frameOf(atlas.bobJump, bob.stateTime, 0.2, true);
  } else if (bob.state === BOB.state.fall) {
    bobRegion = frameOf(atlas.bobFall, bob.stateTime, 0.2, true);
  }
  drawAtlasInWorld(bobRegion, bob.x, bob.y, 1, 1, bob.vx < 0);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`SCORE: ${world.score}`, 12, 28);
}

function drawOverlay() {
  if (gameState === GAME_STATE.ready) {
    const w = 192;
    const h = 32;
    const x = (canvas.width - w) / 2;
    const y = canvas.height / 2 - h / 2;
    if (itemsImg.complete) {
      drawAtlasRegion(atlas.ready, x, y, w, h);
    } else {
      ctx.fillStyle = "#000a";
      ctx.fillRect(40, 210, 240, 60);
      ctx.fillStyle = "#fff";
      ctx.font = "22px sans-serif";
      ctx.fillText("点击开始", 110, 248);
    }
  }

  if (gameState === GAME_STATE.gameOver) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (itemsImg.complete) {
      drawAtlasRegion(
        atlas.gameOver,
        (canvas.width - 160) / 2,
        (canvas.height - 96) / 2,
        160,
        96
      );
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`SCORE: ${world.score}`, 95, 85);
    ctx.font = "16px sans-serif";
    ctx.fillText("点击重新开始", 112, 420);
  }

  if (gameState === GAME_STATE.win) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("YOU WIN!", 108, 210);
    ctx.font = "18px sans-serif";
    ctx.fillText(`SCORE: ${world.score}`, 106, 250);
    ctx.font = "16px sans-serif";
    ctx.fillText("点击重新开始", 112, 420);
  }
}

function tick(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.1) dt = 0.1;

  if (input.startRequested) {
    if (!musicStarted) {
      musicStarted = true;
      sounds.music.play().catch(() => {});
    }
    if (gameState === GAME_STATE.ready) {
      gameState = GAME_STATE.running;
    } else if (gameState === GAME_STATE.gameOver || gameState === GAME_STATE.win) {
      restart();
      gameState = GAME_STATE.running;
    }
    input.startRequested = false;
  }

  if (gameState === GAME_STATE.running) {
    updateWorld(dt);
  }

  drawWorld();
  drawOverlay();

  requestAnimationFrame(tick);
}

requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(tick);
});

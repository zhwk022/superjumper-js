import {
  BOB,
  CASTLE,
  COIN,
  FRUSTUM_HEIGHT,
  GAME,
  GRAVITY,
  PLATFORM,
  SPRING,
  SQUIRREL,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config.js";
import { bounds, overlap, rnd } from "./utils.js";

export function createGame() {
  const bob = {
    x: 5,
    y: 1,
    w: BOB.width,
    h: BOB.height,
    vx: 0,
    vy: 0,
    state: "fall",
    stateTime: 0,
    bounds: bounds(5, 1, BOB.width, BOB.height),
  };
  const platforms = [];
  const springs = [];
  const squirrels = [];
  const coins = [];

  let y = PLATFORM.height / 2;
  const maxJump = (BOB.jumpVelocity * BOB.jumpVelocity) / (2 * -GRAVITY.y);
  while (y < WORLD_HEIGHT - WORLD_WIDTH / 2) {
    const moving = rnd() > 0.8;
    const x = rnd() * (WORLD_WIDTH - PLATFORM.width) + PLATFORM.width / 2;
    const platform = {
      x,
      y,
      w: PLATFORM.width,
      h: PLATFORM.height,
      bounds: bounds(x, y, PLATFORM.width, PLATFORM.height),
      vx: moving ? PLATFORM.velocity : 0,
      moving,
      state: "normal",
      stateTime: 0,
    };
    platforms.push(platform);

    if (rnd() > 0.9 && !moving) {
      const springY = y + PLATFORM.height / 2 + SPRING.height / 2;
      springs.push({
        x,
        y: springY,
        w: SPRING.width,
        h: SPRING.height,
        bounds: bounds(x, springY, SPRING.width, SPRING.height),
      });
    }

    if (y > WORLD_HEIGHT / 3 && rnd() > 0.8) {
      const squirrelX = x + rnd();
      const squirrelY = y + SQUIRREL.height + rnd() * 2;
      squirrels.push({
        x: squirrelX,
        y: squirrelY,
        w: SQUIRREL.width,
        h: SQUIRREL.height,
        vx: SQUIRREL.velocity,
        stateTime: 0,
        bounds: bounds(squirrelX, squirrelY, SQUIRREL.width, SQUIRREL.height),
      });
    }

    if (rnd() > 0.6) {
      const coinX = x + rnd();
      const coinY = y + COIN.height + rnd() * 3;
      coins.push({
        x: coinX,
        y: coinY,
        w: COIN.width,
        h: COIN.height,
        stateTime: 0,
        bounds: bounds(coinX, coinY, COIN.width, COIN.height),
      });
    }

    y += maxJump - 0.5;
    y -= rnd() * (maxJump / 3);
  }

  const castle = {
    x: WORLD_WIDTH / 2,
    y,
    w: CASTLE.width,
    h: CASTLE.height,
    bounds: bounds(WORLD_WIDTH / 2, y, CASTLE.width, CASTLE.height),
  };

  return {
    world: { bob, platforms, springs, squirrels, coins, castle, score: 0, height: 0 },
    state: GAME.ready,
    scoreLabel: "SCORE: 0",
    handledOver: false,
  };
}

export function updateRunning({ game, input, canvas, cam, deltaSec, audios, playSound, enterWinStory }) {
  const world = game.world;
  const bob = world.bob;
  let accelX = 0;

  if (input.keys.has("ArrowLeft")) accelX = 5;
  if (input.keys.has("ArrowRight")) accelX = -5;
  if (!input.keys.has("ArrowLeft") && !input.keys.has("ArrowRight") && input.pointer.down) {
    accelX = input.pointer.x < canvas.width / 2 ? 5 : -5;
  }

  if (bob.state !== "hit" && bob.y <= 0.5) {
    bob.vy = BOB.jumpVelocity;
    bob.state = "jump";
    bob.stateTime = 0;
  }

  if (bob.state !== "hit") bob.vx = (-accelX / 10) * BOB.moveVelocity;
  bob.vy += GRAVITY.y * deltaSec;
  bob.x += bob.vx * deltaSec;
  bob.y += bob.vy * deltaSec;

  if (bob.vy > 0 && bob.state !== "hit") bob.state = "jump";
  if (bob.vy < 0 && bob.state !== "hit") bob.state = "fall";
  if (bob.x < 0) bob.x = WORLD_WIDTH;
  if (bob.x > WORLD_WIDTH) bob.x = 0;

  bob.stateTime += deltaSec;
  bob.bounds.x = bob.x - bob.w / 2;
  bob.bounds.y = bob.y - bob.h / 2;
  world.height = Math.max(world.height, bob.y);

  for (let i = world.platforms.length - 1; i >= 0; i--) {
    const platform = world.platforms[i];
    if (platform.moving) {
      platform.x += platform.vx * deltaSec;
      if (platform.x < PLATFORM.width / 2 || platform.x > WORLD_WIDTH - PLATFORM.width / 2) {
        platform.vx = -platform.vx;
      }
      platform.x = Math.max(PLATFORM.width / 2, Math.min(WORLD_WIDTH - PLATFORM.width / 2, platform.x));
      platform.bounds.x = platform.x - platform.w / 2;
    }

    platform.stateTime += deltaSec;
    if (platform.state === "pulverizing" && platform.stateTime > PLATFORM.pulverizeTime) {
      world.platforms.splice(i, 1);
    }
  }

  for (const squirrel of world.squirrels) {
    squirrel.x += squirrel.vx * deltaSec;
    if (squirrel.x < SQUIRREL.width / 2 || squirrel.x > WORLD_WIDTH - SQUIRREL.width / 2) {
      squirrel.vx = -squirrel.vx;
    }
    squirrel.x = Math.max(SQUIRREL.width / 2, Math.min(WORLD_WIDTH - SQUIRREL.width / 2, squirrel.x));
    squirrel.bounds.x = squirrel.x - squirrel.w / 2;
    squirrel.stateTime += deltaSec;
  }

  for (const coin of world.coins) coin.stateTime += deltaSec;

  if (bob.vy <= 0) {
    for (const platform of world.platforms) {
      if (bob.y > platform.y && overlap(bob.bounds, platform.bounds)) {
        bob.vy = BOB.jumpVelocity;
        bob.state = "jump";
        bob.stateTime = 0;
        playSound(audios.jump);
        if (rnd() > 0.5) {
          platform.state = "pulverizing";
          platform.stateTime = 0;
          platform.vx = 0;
        }
        break;
      }
    }

    for (const spring of world.springs) {
      if (bob.y > spring.y && overlap(bob.bounds, spring.bounds)) {
        bob.vy = BOB.jumpVelocity * 1.5;
        bob.state = "jump";
        bob.stateTime = 0;
        playSound(audios.highJump);
        break;
      }
    }
  }

  for (const squirrel of world.squirrels) {
    if (overlap(bob.bounds, squirrel.bounds)) {
      bob.vx = 0;
      bob.vy = 0;
      bob.state = "hit";
      playSound(audios.hit);
    }
  }

  for (let i = world.coins.length - 1; i >= 0; i--) {
    if (overlap(bob.bounds, world.coins[i].bounds)) {
      world.coins.splice(i, 1);
      world.score += COIN.score;
      playSound(audios.coin);
    }
  }

  if (overlap(bob.bounds, world.castle.bounds)) {
    enterWinStory();
    return;
  }

  if (world.height - FRUSTUM_HEIGHT / 2 > bob.y) game.state = GAME.over;
  if (bob.y > cam.y) cam.y = bob.y;
  game.scoreLabel = `SCORE: ${world.score}`;
}

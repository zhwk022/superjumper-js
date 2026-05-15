import { BOB, GRAVITY, PLATFORM, SQUIRREL, WORLD_WIDTH } from "../config/world-config.js";

export function resolveHorizontalInput(input, canvas) {
  if (input.keys.has("ArrowLeft")) return 5;
  if (input.keys.has("ArrowRight")) return -5;
  if (!input.keys.has("ArrowLeft") && !input.keys.has("ArrowRight") && input.pointer.down) {
    return input.pointer.x < canvas.width / 2 ? 5 : -5;
  }
  return 0;
}

export function updateBob(world, input, canvas, deltaSec) {
  const bob = world.bob;
  const accelX = resolveHorizontalInput(input, canvas);

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
}

export function updatePlatforms(world, deltaSec) {
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
}

export function updateSquirrels(world, deltaSec) {
  for (const squirrel of world.squirrels) {
    squirrel.x += squirrel.vx * deltaSec;
    if (squirrel.x < SQUIRREL.width / 2 || squirrel.x > WORLD_WIDTH - SQUIRREL.width / 2) {
      squirrel.vx = -squirrel.vx;
    }
    squirrel.x = Math.max(SQUIRREL.width / 2, Math.min(WORLD_WIDTH - SQUIRREL.width / 2, squirrel.x));
    squirrel.bounds.x = squirrel.x - squirrel.w / 2;
    squirrel.stateTime += deltaSec;
  }
}

export function updateCoins(world, deltaSec) {
  for (const coin of world.coins) coin.stateTime += deltaSec;
}

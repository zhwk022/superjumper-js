import { BOB, COIN } from "../config/world-config.js";
import { overlap, rnd } from "../utils.js";

const PLATFORM_SCAN_MARGIN = 4;
const ENTITY_SCAN_MARGIN = 2;

function isWithinYWindow(entityY, bobY, margin) {
  return Math.abs(entityY - bobY) <= margin;
}

export function handleBounceCollisions(world, audios, playSound) {
  const bob = world.bob;
  if (bob.vy > 0) return;

  for (const platform of world.platforms) {
    if (!isWithinYWindow(platform.y, bob.y, PLATFORM_SCAN_MARGIN)) continue;
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
    if (!isWithinYWindow(spring.y, bob.y, PLATFORM_SCAN_MARGIN)) continue;
    if (bob.y > spring.y && overlap(bob.bounds, spring.bounds)) {
      bob.vy = BOB.jumpVelocity * 1.5;
      bob.state = "jump";
      bob.stateTime = 0;
      playSound(audios.highJump);
      break;
    }
  }
}

export function handleEntityCollisions(world, audios, playSound, enterWinStory) {
  const bob = world.bob;
  let scoreChanged = false;

  for (const squirrel of world.squirrels) {
    if (!isWithinYWindow(squirrel.y, bob.y, ENTITY_SCAN_MARGIN)) continue;
    if (overlap(bob.bounds, squirrel.bounds)) {
      bob.vx = 0;
      bob.vy = 0;
      bob.state = "hit";
      playSound(audios.hit);
    }
  }

  for (let i = world.coins.length - 1; i >= 0; i--) {
    if (!isWithinYWindow(world.coins[i].y, bob.y, ENTITY_SCAN_MARGIN)) continue;
    if (overlap(bob.bounds, world.coins[i].bounds)) {
      world.coins.splice(i, 1);
      world.score += COIN.score;
      scoreChanged = true;
      playSound(audios.coin);
    }
  }

  if (isWithinYWindow(world.castle.y, bob.y, ENTITY_SCAN_MARGIN) && overlap(bob.bounds, world.castle.bounds)) {
    enterWinStory();
    return { scoreChanged, didWin: true };
  }

  return { scoreChanged, didWin: false };
}

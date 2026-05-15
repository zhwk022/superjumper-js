import {
  BOB,
  CASTLE,
  COIN,
  GRAVITY,
  PLATFORM,
  SPRING,
  SQUIRREL,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config/world-config.js";
import { GAME } from "./config/app-config.js";
import { handleBounceCollisions, handleEntityCollisions } from "./game-logic/collision-system.js";
import { finalizeRunningStep } from "./game-logic/outcome.js";
import { updateBob, updateCoins, updatePlatforms, updateSquirrels } from "./game-logic/world-update.js";
import { bounds, rnd } from "./utils.js";

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
  updateBob(world, input, canvas, deltaSec);
  updatePlatforms(world, deltaSec);
  updateSquirrels(world, deltaSec);
  updateCoins(world, deltaSec);
  handleBounceCollisions(world, audios, playSound);

  const { scoreChanged, didWin } = handleEntityCollisions(world, audios, playSound, enterWinStory);
  if (didWin) return;

  finalizeRunningStep(game, cam, scoreChanged);
}

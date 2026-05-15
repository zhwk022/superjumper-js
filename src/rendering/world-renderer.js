import { atlas } from "../config/atlas-config.js";
import { PLATFORM } from "../config/world-config.js";
import { frame } from "../utils.js";
import { drawWorld, isVisibleY } from "./render-utils.js";

export function renderGameWorld({ ctx, canvas, game, images, cam }) {
  const world = game.world;
  for (const platform of world.platforms) {
    if (!isVisibleY(platform.y, PLATFORM.height, cam)) continue;
    const region = platform.state === "pulverizing" ? frame(atlas.breakPlatform, platform.stateTime, 0.2, false) : atlas.platform;
    drawWorld(ctx, canvas, images, cam, region, platform.x, platform.y, PLATFORM.width, PLATFORM.height);
  }

  for (const spring of world.springs) {
    if (!isVisibleY(spring.y, 1, cam)) continue;
    drawWorld(ctx, canvas, images, cam, atlas.spring, spring.x, spring.y, 1, 1);
  }

  for (const coin of world.coins) {
    if (!isVisibleY(coin.y, 1, cam)) continue;
    drawWorld(ctx, canvas, images, cam, frame(atlas.coin, coin.stateTime, 0.2, true), coin.x, coin.y, 1, 1);
  }

  for (const squirrel of world.squirrels) {
    if (!isVisibleY(squirrel.y, 1, cam)) continue;
    drawWorld(ctx, canvas, images, cam, frame(atlas.squirrel, squirrel.stateTime, 0.2, true), squirrel.x, squirrel.y, 1, 1, squirrel.vx < 0);
  }

  if (isVisibleY(world.castle.y, 2, cam)) {
    drawWorld(ctx, canvas, images, cam, atlas.castle, world.castle.x, world.castle.y, 2, 2);
  }

  const bob = world.bob;
  const bobRegion =
    bob.state === "jump"
      ? frame(atlas.bobJump, bob.stateTime, 0.2, true)
      : bob.state === "fall"
        ? frame(atlas.bobFall, bob.stateTime, 0.2, true)
        : atlas.bobHit;
  drawWorld(ctx, canvas, images, cam, bobRegion, bob.x, bob.y, 1, 1, bob.vx < 0);
}

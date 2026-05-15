import { GAME } from "../config/app-config.js";
import { FRUSTUM_HEIGHT } from "../config/world-config.js";

export function finalizeRunningStep(game, cam, scoreChanged) {
  const world = game.world;
  const bob = world.bob;

  if (world.height - FRUSTUM_HEIGHT / 2 > bob.y) game.state = GAME.over;
  if (bob.y > cam.y) cam.y = bob.y;
  if (scoreChanged) game.scoreLabel = `SCORE: ${world.score}`;
}

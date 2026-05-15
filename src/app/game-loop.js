export function startGameLoop({ update, draw, afterFrame }) {
  let last = performance.now();
  let deltaSec = 0;

  function loop(now) {
    deltaSec = Math.min(0.1, (now - last) / 1000);
    last = now;
    update(deltaSec);
    draw();
    afterFrame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    last = time;
    requestAnimationFrame(loop);
  });
}

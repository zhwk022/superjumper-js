export function hit(bounds, x, y) {
  return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
}

export function rnd() {
  return Math.random();
}

export function bounds(x, y, w, h) {
  return { x: x - w / 2, y: y - h / 2, w, h };
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function frame(frames, time, duration, loop) {
  let index = Math.floor(time / duration);
  index = loop ? index % frames.length : Math.min(frames.length - 1, index);
  return frames[index];
}

export function createInputController({ canvas, onInteraction }) {
  const input = { keys: new Set(), pointer: { x: 0, y: 0, down: false, justDown: false } };

  const setPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.pointer.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.pointer.y = canvas.height - ((event.clientY - rect.top) / rect.height) * canvas.height;
  };

  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);
    onInteraction();
  });
  window.addEventListener("keyup", (event) => input.keys.delete(event.code));
  canvas.addEventListener("pointerdown", (event) => {
    setPointer(event);
    input.pointer.down = true;
    input.pointer.justDown = true;
    onInteraction();
  });
  canvas.addEventListener("pointermove", setPointer);
  canvas.addEventListener("pointerup", () => (input.pointer.down = false));
  canvas.addEventListener("pointercancel", () => (input.pointer.down = false));

  return input;
}

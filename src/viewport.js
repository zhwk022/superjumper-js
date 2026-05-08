export function updateUiViewport(canvas, ui) {
  const scale = Math.min(canvas.width / ui.w, canvas.height / ui.h);
  ui.scale = scale;
  ui.x = (canvas.width - ui.w * scale) / 2;
  ui.y = (canvas.height - ui.h * scale) / 2;
}

export function uiPointer(pointer, canvas, ui) {
  const px = pointer.x;
  const pyTop = canvas.height - pointer.y;
  let ux = (px - ui.x) / ui.scale;
  let uyTop = (pyTop - ui.y) / ui.scale;

  if (!Number.isFinite(ux) || !Number.isFinite(uyTop) || ui.scale <= 0) {
    return { x: 0, y: 0 };
  }

  ux = Math.max(0, Math.min(ui.w, ux));
  uyTop = Math.max(0, Math.min(ui.h, uyTop));
  return { x: ux, y: ui.h - uyTop };
}

export function resizeCanvas(canvas, ui) {
  // Use actual rendered size as the single source of truth to avoid CSS/JS drift.
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const rect = canvas.getBoundingClientRect();
  const nextWidth = Math.max(1, Math.ceil(rect.width * dpr));
  const nextHeight = Math.max(1, Math.ceil(rect.height * dpr));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  updateUiViewport(canvas, ui);
}

export function attachViewportListeners(canvas, ui) {
  const handleResize = () => resizeCanvas(canvas, ui);

  handleResize();
  window.addEventListener("resize", handleResize);
  window.visualViewport?.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
  }
}

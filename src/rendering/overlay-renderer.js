export function drawCriticalOverlay(ctx, canvas, criticalAssets) {
  ctx.save();
  ctx.fillStyle = "#000b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxW = Math.min(300, canvas.width - 40);
  const boxH = criticalAssets.status === "error" ? 220 : 110;
  const x = (canvas.width - boxW) / 2;
  const y = (canvas.height - boxH) / 2;

  ctx.fillStyle = "#111c";
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = "#ffffff33";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, boxW - 2, boxH - 2);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";

  if (criticalAssets.status === "loading") {
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("加载中...", canvas.width / 2, y + 44);
    ctx.font = "16px sans-serif";
    ctx.fillText(`正在加载关键资源 (${criticalAssets.loaded}/${criticalAssets.total})`, canvas.width / 2, y + 74);
    ctx.font = "14px sans-serif";
    ctx.fillText("请稍候", canvas.width / 2, y + 96);
    ctx.restore();
    return;
  }

  const err = criticalAssets.error || {};
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#ffdddd";
  ctx.fillText("资源加载失败", canvas.width / 2, y + 36);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "start";
  ctx.font = "13px sans-serif";
  const lines = [
    `失败资源：${err.label || "未知"}`,
    `地址：${err.src || "未知"}`,
    "排查建议：",
    "1) 打开浏览器 Network/Console 看是否 404/CORS",
    "2) 确认部署 base 路径/静态资源路径配置正确",
    "3) 确认文件名大小写一致（items.png/background.png）",
    "4) 尝试强制刷新或清理缓存后重试",
    "点击任意位置重试",
  ];
  let textY = y + 62;
  const textX = x + 14;
  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += 18;
  }

  ctx.restore();
}

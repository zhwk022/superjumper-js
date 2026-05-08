# SuperJumper HTML5

基于 libGDX 开源示例 SuperJumper（Doodle Jump 风格）做的 HTML5 Canvas 版实现，复用了原项目素材并重建了核心玩法与 UI 流程。

## 在线体验

- GitHub Pages: `https://<你的用户名>.github.io/superjumper-js/`

> 线上建议直接发布 `docs/` 目录中的压缩构建产物，源码继续保留在 `src/` 和 `assets/` 里进行编辑。

## 功能

- 核心玩法：跳跃、平台、弹簧、松鼠、金币、城堡终点
- 界面流程：主菜单、帮助页（5 页）、高分榜、游戏内暂停
- 结尾页：过关后剧情对白（点击推进）
- 本地存档：声音开关 + 前 5 名高分（`localStorage`）

## 本地开发

源码开发模式继续直接运行未压缩文件，在项目根目录启动静态服务：

```bash
python3 -m http.server 8080
```

浏览器打开：

```text
http://localhost:8080/
```

## 操作说明

- 触摸/点击屏幕左右半边：左右移动
- 键盘 `ArrowLeft` / `ArrowRight`：左右移动
- 菜单中可点击：
  - `Play` 开始
  - `Highscores` 高分榜
  - `Help` 帮助页
  - 左下角音量图标切换声音

## 生产构建

首次使用先安装依赖：

```bash
npm install
```

构建压缩后的发布产物：

```bash
npm run build
```

构建结果输出到：

```text
docs/
```

构建后：

- `src/` 中源码仍保持未压缩，便于继续编辑
- `docs/assets/app.min.js` 为压缩后的线上脚本
- `docs/assets/style.min.css` 为压缩后的线上样式
- `docs/assets/data/` 为发布用素材副本，PNG 会做无损/近无损优化

## GitHub Pages 发布

1. 推送代码到 `main` 分支：

```bash
git init
git add .
git commit -m "init superjumper html5"
git branch -M main
git remote add origin https://github.com/zhwk022/superjumper-js.git
git push -u origin main
```

2. 在仓库中打开 `Settings -> Pages`
3. `Source` 选择 `Deploy from a branch`
4. `Branch` 选择 `main`，目录选择 `/ (root)`，保存
5. 在仓库中打开 `Settings -> Pages`
6. `Source` 选择 `Deploy from a branch`
7. `Branch` 选择 `main`，目录改为 `/docs`
8. 等待部署完成后访问：

```text
https://<你的用户名>.github.io/superjumper-js/
```

## 项目结构

```text
.
├── index.html
├── docs/             # 生产构建产物（压缩后，供 GitHub Pages 使用）
├── scripts/
│   └── build.mjs     # 构建压缩脚本
├── src/
│   ├── app.js        # 当前源码入口（未压缩）
│   ├── app-state.js
│   ├── game-logic.js
│   ├── renderer.js
│   ├── screens.js
│   ├── game.js       # 早期核心玩法版本（保留）
│   └── style.css
├── assets/
│   └── data/         # 原始素材（源码开发使用）
└── ANALYSIS.md       # 源码分析文档
```

## 素材与版权说明

- 素材来源：`libgdx-demo-superjumper-master/android/assets/data`
- 原项目许可证：Apache License 2.0
- 本仓库建议保留原作者与许可证信息，并仅在遵守原许可证条件下分发

## 发布附录

- 发布检查清单：`RELEASE_CHECKLIST.md`
- 许可证文件：`LICENSE`

## 后续计划

- 排行榜云端化（而非仅本地 `localStorage`）
- 移动端自适应与高清渲染优化
- 分享成绩海报与社交传播入口

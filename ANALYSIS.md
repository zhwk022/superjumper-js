# SuperJumper 源码分析与 HTML5 映射

## 1. 原版源码结构

开源目录中最关键的是 `core/src/com/badlogicgames/superjumper`：

- `World.java`：世界数据与规则主循环（生成关卡、更新、碰撞、结算）。
- `Bob.java`：主角运动状态（跳跃/下落/受击）。
- `Platform.java`：平台逻辑（静态/移动/碎裂）。
- `Squirrel.java`、`Spring.java`、`Coin.java`、`Castle.java`：敌人/道具/终点。
- `WorldRenderer.java`：摄像机与渲染顺序。
- `GameScreen.java`：输入、状态机（ready/running/pause/gameover）和 UI。
- `Assets.java`：素材加载与图集切片坐标定义。

## 2. 玩法核心机制（原版）

### 2.1 世界参数

- 世界宽度固定 `10`，总高度 `15 * 20 = 300`。
- 摄像机可见窗口 `10 x 15`（frustum）。
- 重力向下 `-12`。
- 主角最大跳跃高度由公式推导：`v^2 / (2g)`，用于控制平台间距随机生成上限。

### 2.2 关卡生成（`World.generateLevel()`）

- 从底部开始按“可达跳跃高度”逐段往上放平台。
- 平台类型：80% 静态，20% 移动。
- 非移动平台有概率生成弹簧（高跳）。
- 中高空后会随机生成松鼠（左右飞行障碍）。
- 大部分平台附近会生成金币。
- 最高处放置城堡（关卡终点）。

### 2.3 主角与碰撞

- Bob 受重力影响并持续积分更新位置。
- 下落时与平台碰撞触发普通跳跃；与弹簧碰撞触发 1.5 倍跳跃。
- 与松鼠碰撞进入 `HIT` 状态（速度清零）。
- 吃金币加分（每个 10 分）。
- 到达城堡进入过关状态。
- 若 `heightSoFar - 7.5 > bobY`（主角跌出屏幕下沿）则判定 game over。

### 2.4 渲染与状态机

- 摄像机只在主角上升超过当前中心时向上跟随。
- 渲染顺序：背景 -> Bob/平台/道具/敌人/城堡 -> UI。
- `GameScreen` 负责 `READY -> RUNNING -> GAME_OVER/LEVEL_END` 切换。

## 3. HTML5 实现映射

HTML5 版本位于当前项目：

- `index.html`：页面和 Canvas 容器。
- `src/style.css`：显示样式。
- `src/game.js`：完整游戏逻辑（世界、物理、碰撞、渲染、输入、音频）。
- `assets/data`：直接复用原版素材（图片 + 音频）。

### 3.1 世界与对象映射

- 保持原版常量：
  - 世界尺寸 `10 x 300`
  - 可见窗口 `10 x 15`
  - 重力 `-12`
  - Bob/Platform/Spring/Squirrel/Coin/Castle 尺寸与速度参数一致
- 关卡生成逻辑按 `World.java` 同步实现。

### 3.2 渲染映射

- 使用原版 `items.png` 切片坐标（来自 `Assets.java`）：
  - Bob 跳/落/受击帧
  - 平台与碎裂动画
  - 松鼠、金币动画、弹簧、城堡
  - READY 与 GAME OVER UI 贴图
- 世界坐标通过 `worldToScreen()` 投影到 Canvas 像素坐标。

### 3.3 输入映射

- 键盘：`ArrowLeft/ArrowRight`。
- 触摸：按下画面左半/右半控制左右。
- `Space` 或点击开始游戏，且首次交互后启动背景音乐（浏览器自动播放限制）。

### 3.4 状态映射

- `ready`：等待开始。
- `running`：正常游戏循环。
- `game_over`：失败展示，点击重开。
- `win`：碰到城堡后展示胜利，点击重开。

## 4. 与原版的差异说明

- 原版有完整菜单、帮助页、高分榜、暂停菜单；当前 HTML5 版本聚焦核心游玩环节。
- 文本渲染使用浏览器字体，而非 libGDX BitmapFont。
- 音频策略基于浏览器限制，需一次用户交互后才会稳定播放。

## 5. 后续可扩展项

- 增加暂停菜单与按钮命中区（对齐 `GameScreen`）。
- 增加本地高分存档（`localStorage` 对齐 `Settings.java`）。
- 适配手机横竖屏与 DPR 高清渲染。
- 补充触摸摇杆/重力传感器控制模式。

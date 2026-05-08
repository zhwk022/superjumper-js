# GitHub Pages 资源加载与兜底提示 Spec

## Why
当前部署到 GitHub Pages 后可能出现“只有蓝屏/无任何元素”的情况，通常由资源路径解析或加载失败导致。需要让资源路径在子路径部署下稳定，并在资源未就绪/失败时给出明确提示。

## What Changes
- 统一资源 URL 生成逻辑，确保在 GitHub Pages 子路径下也能正确加载 `assets/data/*`
- 增加启动加载态：关键资源未加载完成前显示 Loading
- 增加失败兜底：关键资源加载失败时显示错误信息与排查提示（避免只看到蓝屏）
- **BREAKING**（可选）：将所有资源路径改为基于模块文件的 URL 计算方式（例如基于 `import.meta.url`），不再依赖手写相对路径字符串

## Impact
- Affected specs: 资源加载稳定性｜部署体验｜可观测性（用户可见提示）
- Affected code: `src/app.js`（主要）｜`index.html`（如需 base 处理则修改）｜可选 `src/game.js`（保持一致性）

## ADDED Requirements
### Requirement: 稳定资源路径
系统 SHALL 在 GitHub Pages（子路径）与本地静态服务器环境下都能正确解析并加载所有游戏资源（图片/音频）。

#### Scenario: GitHub Pages 子路径
- **WHEN** 页面 URL 形如 `https://<user>.github.io/<repo>/`
- **THEN** `assets/data/*` 资源请求应返回 200，游戏界面可正常显示

### Requirement: 启动加载态
系统 SHALL 在关键资源（至少 `background.png` 与 `items.png`）未完成加载前显示 Loading 画面。

#### Scenario: 资源仍在下载
- **WHEN** 页面首次打开且资源未完成加载
- **THEN** 画面显示 Loading 文案（或进度），不会显示纯色蓝屏误导用户

### Requirement: 加载失败兜底
系统 SHALL 在关键资源加载失败时显示可读错误提示，并提示用户检查路径/部署配置。

#### Scenario: 资源 404/网络错误
- **WHEN** `items.png` 或 `background.png` 加载失败
- **THEN** 显示错误提示与建议（例如：检查 GitHub Pages 路径、强制刷新、查看 Network 404）

## MODIFIED Requirements
### Requirement: 正常渲染
系统 SHALL 在资源加载完成后渲染主菜单/游戏画面，并保持现有交互与玩法不变。

## REMOVED Requirements
（无）

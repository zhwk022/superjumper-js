# Tasks

- [x] Task 1: 统一资源 URL 解析
  - [x] 将 `src/app.js` 中所有资源路径收敛到单一函数（基于模块路径生成 URL）
  - [x]（可选）同步更新 `src/game.js`，避免两套路径策略

- [x] Task 2: 增加启动加载态
  - [x] 定义“关键资源就绪”判定（至少背景图与图集）
  - [x] 在未就绪时渲染 Loading 覆盖层

- [x] Task 3: 增加加载失败兜底提示
  - [x] 捕获图片加载失败事件并记录失败原因
  - [x] 渲染错误覆盖层：提示“资源加载失败”与排查步骤

- [x] Task 4: 验证与发布校验
  - [x] 本地 `http.server` 验证：菜单可见、可开始游戏、无蓝屏
  - [x] GitHub Pages 环境验证：资源 200、无 404、可正常游玩

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3

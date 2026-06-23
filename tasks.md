# Tasks

- [x] Task 1: 梳理现有单页结构并清理旧太阳系体验
  - [x] SubTask 1.1: 确认 `index.html` 中旧的画布、星球数据、轨道控制、HUD 和图例逻辑范围
  - [x] SubTask 1.2: 移除或替换与粤语学习 App 无关的 DOM、CSS 和脚本
  - [x] SubTask 1.3: 保留静态页面可直接预览的基本 HTML 结构

- [x] Task 2: 搭建粤语翻译学习 App 的页面结构
  - [x] SubTask 2.1: 创建顶部品牌区，说明 App 用途和使用方式
  - [x] SubTask 2.2: 创建文本输入区，包含输入框、字数提示、清空按钮和翻译按钮
  - [x] SubTask 2.3: 创建示例短句区，支持一键填入输入框
  - [x] SubTask 2.4: 创建结果区，展示粤语表达、表达拆解、跟读建议和操作按钮
  - [x] SubTask 2.5: 创建最近练习记录区，展示当前会话中的历史结果

- [x] Task 3: 设计并实现地道粤语转换逻辑
  - [x] SubTask 3.1: 定义常见普通话到粤语的词汇映射，至少覆盖 12 个常见表达
  - [x] SubTask 3.2: 实现常见句式和语气词的轻量改写规则
  - [x] SubTask 3.3: 为每条命中规则生成对应的学习说明
  - [x] SubTask 3.4: 为规则未充分命中的输入提供保守兜底表达和参考提示
  - [x] SubTask 3.5: 确保专有名词、数字、时间等关键信息尽量保留

- [x] Task 4: 实现语音示例与跟读交互
  - [x] SubTask 4.1: 检测浏览器是否支持 `speechSynthesis`
  - [x] SubTask 4.2: 优先选择粤语或香港中文语音，找不到时使用最接近的中文语音
  - [x] SubTask 4.3: 实现播放、停止和防重叠朗读逻辑
  - [x] SubTask 4.4: 在无可用语音能力时展示降级提示
  - [x] SubTask 4.5: 展示“听一遍、慢读、完整跟读”的练习步骤

- [x] Task 5: 完成复制、清空和练习记录功能
  - [x] SubTask 5.1: 实现复制粤语结果到剪贴板
  - [x] SubTask 5.2: 实现清空输入与重置当前结果
  - [x] SubTask 5.3: 将每次有效翻译加入最近练习记录
  - [x] SubTask 5.4: 限制记录数量，避免界面过长

- [ ] Task 6: 完成视觉设计与响应式适配
  - [ ] SubTask 6.1: 采用明确的粤语学习主题视觉风格，例如港式街牌、夜间霓虹和学习卡片
  - [x] SubTask 6.2: 优化桌面首屏布局，使输入、结果和播放操作路径清晰
  - [x] SubTask 6.3: 适配移动端单列布局，确保按钮、输入框和结果卡片不溢出
  - [x] SubTask 6.4: 添加明确的焦点态、按钮状态和错误提示样式

- [x] Task 7: 验证核心流程与浏览器兼容性
  - [x] SubTask 7.1: 验证空输入、示例输入、普通输入和长文本输入
  - [x] SubTask 7.2: 验证翻译结果、表达拆解、跟读建议和练习记录是否正确更新
  - [x] SubTask 7.3: 验证语音播放、连续点击播放、停止和不支持语音的降级路径
  - [x] SubTask 7.4: 验证复制按钮的成功和失败反馈
  - [x] SubTask 7.5: 使用本地静态预览确认页面可直接运行

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 2.
- Task 4 depends on Task 2 and can run in parallel with Task 3 after result区结构确定.
- Task 5 depends on Task 2 and Task 3.
- Task 6 depends on Task 2 and can与 Task 3、Task 4 部分并行.
- Task 7 depends on Task 3, Task 4, Task 5 and Task 6.
- Task 8 depends on Task 6.

# Progress Notes
- 2026-06-23: 已完成并核对 Task 1-5，对应实现已落地到 `index.html`，任务勾选状态保持为已完成。
- 2026-06-23: 按 checklist 复核 Task 6。确认桌面布局、移动端单列、焦点态与错误态样式已具备；但页面主视觉仍为通用浅色后台风格，未达到“港式街牌 / 夜间霓虹 / 学习卡片”的主题要求，因此将 Task 6 与 SubTask 6.1 回退为未完成，并追加修复任务。

- [ ] Task 8: 修复 Task 6 视觉主题验证失败项
  - [ ] SubTask 8.1: 将顶部品牌区、主背景和卡片样式改造成更明确的粤语学习主题视觉
  - [ ] SubTask 8.2: 为按钮、标签和结果区补充与主题一致的高对比强调元素
  - [ ] SubTask 8.3: 修复后重新执行 Task 6 验证并同步 checklist 状态

## deploy-github-pages-hybrid

- [x] Task 1: 前端支持可配置的云端代理地址
  - [x] SubTask 1.1: 在页面设置区新增云端代理地址输入、保存和恢复本地默认入口
  - [x] SubTask 1.2: 代理地址持久化到 `localStorage`，并支持通过 URL 参数 `?proxy=` 注入
  - [x] SubTask 1.3: 本地预览默认继续使用同源 `/api/*`，GitHub Pages 环境未配置时给出明确提示
  - [x] SubTask 1.4: 健康检查、翻译请求和错误提示统一切换为当前生效的代理地址

- [x] Task 2: 增加 GitHub Pages 自动部署工作流
  - [x] SubTask 2.1: 新增 `.github/workflows/deploy-github-pages.yml`
  - [x] SubTask 2.2: 工作流在 `main` 或 `master` 推送时发布静态 `index.html`
  - [x] SubTask 2.3: 发布产物包含 `.nojekyll`，避免 Pages 忽略以下划线开头目录

- [x] Task 3: 增加 Render 后端部署配置
  - [x] SubTask 3.1: 新增 `render.yaml`，以 Blueprint 方式部署 `proxy_server.py`
  - [x] SubTask 3.2: 明确 `HOST`、`PORT`、模型与 API Key 等环境变量入口
  - [x] SubTask 3.3: 将健康检查路径配置为 `/api/health`

- [x] Task 4: 为 Render 后端补充跨域支持
  - [x] SubTask 4.1: 为 `/api/health`、`/api/translate` 和预检请求增加 CORS 响应头
  - [x] SubTask 4.2: 使用 `CORS_ALLOWED_ORIGINS` 环境变量控制允许来源，支持逗号分隔白名单和 `*`
  - [x] SubTask 4.3: 保持本地同源预览可用，不影响现有 `start_preview.command`

- [x] Task 5: 补充混合部署文档与验收说明
  - [x] SubTask 5.1: 在项目目录新增 `deploy.md`，写清 GitHub Pages + Render 的部署顺序与操作步骤
  - [x] SubTask 5.2: 在文档中说明 Render 环境变量、CORS 白名单与健康检查验证方式
  - [x] SubTask 5.3: 在文档中说明 GitHub Pages 工作流启用方式、前端代理地址填写方法与常见问题排查

- 2026-06-23: 已完成 `deploy-github-pages-hybrid` Task 1-5。对应产物为 `index.html` 的代理配置能力、`.github/workflows/deploy-github-pages.yml`、`render.yaml`、`proxy_server.py` 的 CORS 白名单支持，以及项目目录下的 `deploy.md` 混合部署说明文档。

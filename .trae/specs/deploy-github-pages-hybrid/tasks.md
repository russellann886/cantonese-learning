# Tasks

- [x] Task 1: 评估当前项目的云端部署边界
  - [x] SubTask 1.1: 确认哪些文件属于纯静态前端，哪些文件属于必须单独运行的后端代理
  - [x] SubTask 1.2: 明确 GitHub Pages 无法直接运行 `proxy_server.py` 的部署限制

- [x] Task 2: 让前端适配 GitHub Pages
  - [x] SubTask 2.1: 增加前端可配置的 API Base URL，而不是固定依赖本地同源代理
  - [x] SubTask 2.2: 确认页面在 GitHub Pages 项目路径下的资源访问方式正常
  - [x] SubTask 2.3: 添加或调整 GitHub Pages 发布配置

- [x] Task 3: 让后端适配独立云端托管
  - [x] SubTask 3.1: 为 Python 代理补齐最小部署配置，例如依赖与启动命令
  - [x] SubTask 3.2: 确定云端环境变量名称与优先级，保持 `OPENROUTER_API_KEY` 优先、`GEMINI_API_KEY` 兜底
  - [x] SubTask 3.3: 处理 GitHub Pages 到云端代理的访问方式，例如 CORS

- [x] Task 4: 梳理 GitHub 仓库上线步骤
  - [x] SubTask 4.1: 明确仓库需要新增或修改的文件
  - [x] SubTask 4.2: 明确 GitHub Pages 的启用步骤
  - [x] SubTask 4.3: 明确后端平台的部署与环境变量配置步骤

- [x] Task 5: 验证混合部署方案
  - [x] SubTask 5.1: 验证前端在 GitHub Pages 模式下的访问路径
  - [x] SubTask 5.2: 验证前端请求云端代理而不是 `localhost`
  - [x] SubTask 5.3: 验证代理健康检查和翻译接口可被前端访问

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 1.
- Task 4 depends on Task 2 and Task 3.
- Task 5 depends on Task 2, Task 3, and Task 4.

# Progress Notes
- 2026-06-23: 已完成 `deploy-github-pages-hybrid` Task 1-5。对应产物包括前端云端代理地址配置、GitHub Pages 工作流 `.github/workflows/deploy-github-pages.yml`、Render 部署配置 `render.yaml`、带 CORS 支持的 `proxy_server.py`，以及项目目录中的部署说明文档 `deploy.md`。
- 2026-06-23: 部署方案已明确为“GitHub Pages 托管前端 + Render 托管 Python 代理”的混合部署；前端支持通过输入框、`localStorage` 与 `?proxy=` 参数配置线上代理地址。
- 2026-06-23: 按 checklist 复核 `粤语翻译/index.html`、`粤语翻译/proxy_server.py`、`粤语翻译/render.yaml` 与 `粤语翻译/.github/workflows/deploy-github-pages.yml`。确认前端代理地址切换、Pages 发布配置、Render 部署配置、环境变量读取优先级与 CORS 支持均已落地。
- 2026-06-23: 通过本地运行 `proxy_server.py` 验证 `GET /api/health`、`OPTIONS /api/translate` 与 `POST /api/translate` 的跨域响应行为。未配置密钥时 `/api/translate` 返回 `503 server_not_configured`，说明接口路径与浏览器访问链路可用，但真实翻译成功仍依赖云端环境变量。
- 2026-06-23: 项目目录已新增 `deploy.md`，补齐了 GitHub Pages 与 Render 的实操步骤、环境变量配置、前端代理地址填写方式和常见问题排查，因此部署文档验收项已完成。

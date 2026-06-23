- [x] GitHub Pages 仅用于托管静态前端，而不是直接运行 Python 代理
- [x] 前端支持配置云端代理地址，不再固定依赖本地 `localhost`
- [x] GitHub Pages 项目站点路径下的页面资源访问不会出现 404
- [x] 仓库中包含用于 GitHub Pages 发布的必要配置
- [x] 仓库中包含用于 Python 代理云端部署的必要配置
- [x] 云端代理通过环境变量读取 `OPENROUTER_API_KEY` / `GEMINI_API_KEY`
- [x] 云端代理保持 `OPENROUTER_API_KEY` 优先、`GEMINI_API_KEY` 兜底的逻辑
- [x] GitHub Pages 前端可以访问云端 `/api/health`
- [x] GitHub Pages 前端可以访问云端 `/api/translate`
- [x] 文档中明确列出了需要修改或新增的文件以及部署步骤

## 验证记录

- 2026-06-23: 静态检查确认 GitHub Pages 工作流只发布 `index.html` 与 `.nojekyll`，未尝试在 Pages 上运行 Python 进程；对应文件为 `粤语翻译/.github/workflows/deploy-github-pages.yml`。
- 2026-06-23: 前端已支持通过输入框、`localStorage` 与 `?proxy=` 参数配置云端代理地址；本地环境默认回退到 `window.location.origin`；对应文件为 `粤语翻译/index.html`。
- 2026-06-23: 页面资源全部内联在单个 `index.html` 中，Pages 项目站点下不存在额外静态资源前缀问题，因此未发现仓库子路径导致的 404 风险。
- 2026-06-23: `render.yaml` 已提供 Python Web Service 部署配置、启动命令、健康检查路径与环境变量入口；`proxy_server.py` 通过环境变量读取 `OPENROUTER_API_KEY` / `GEMINI_API_KEY`，并保持 OpenRouter 优先。
- 2026-06-23: 本地启动 `proxy_server.py` 并设置 `CORS_ALLOWED_ORIGINS=https://example.github.io` 后，`GET /api/health` 返回 `200` 且包含 `Access-Control-Allow-Origin`；`OPTIONS /api/translate` 返回 `204`；`POST /api/translate` 在未配置密钥时返回 `503 server_not_configured`，证明前端访问路径与跨域响应已具备。
- 2026-06-23: 项目目录已新增 `deploy.md`，其中明确列出需要修改或新增的文件、GitHub Pages 启用步骤、Render 部署与环境变量配置步骤，补齐了首次部署与后续排障所需信息。

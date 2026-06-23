# GitHub Pages 混合部署 Spec

## Why
当前项目已经不再是纯静态网页，而是“前端页面 + Python 翻译代理”的双层结构。GitHub Pages 只能托管静态 HTML、CSS 和 JavaScript 文件，不能直接运行 `proxy_server.py`，因此若要把网页发布到云端，必须明确区分前端静态托管与后端代理部署。

## What Changes
- 将前端页面部署到 GitHub Pages。
- 将 Python 翻译代理部署到独立的后端平台，而不是 GitHub Pages 本身。
- 前端增加可配置的 API Base URL，用于区分本地代理地址与云端代理地址。
- 为 GitHub 仓库添加 Pages 部署工作流或发布配置。
- 为后端代理补齐部署所需的最小运行配置，例如依赖、启动命令和环境变量说明。
- 为云端代理增加适当的 CORS 或同源访问策略，使 GitHub Pages 页面可以调用翻译接口。
- **BREAKING**：线上部署后，默认翻译请求不再依赖本地 `localhost` 代理地址，而是依赖部署后的云端代理 URL。

## Impact
- Affected specs: 前端运行时配置、后端部署方式、跨域访问、云端环境变量管理、上线验证方式。
- Affected code: `粤语翻译/index.html`、`粤语翻译/proxy_server.py`、`粤语翻译/start_preview.command`，以及新增的 GitHub Pages 部署配置文件和后端平台部署配置文件。
- Affected runtime: 运行形态将从本地单机预览变为“GitHub Pages 前端 + 独立云端代理服务”的混合部署。

## ADDED Requirements

### Requirement: 前端部署到 GitHub Pages
The system SHALL allow the static frontend to be published on GitHub Pages.

#### Scenario: GitHub Pages 发布
- **WHEN** 用户将仓库推送到 GitHub 并启用 Pages 发布
- **THEN** 页面静态资源应能从 GitHub Pages 正常加载

#### Scenario: 项目站点路径
- **WHEN** 页面作为 GitHub Pages 项目站点部署
- **THEN** 页面资源路径应与 `/<repository-name>/` 子路径兼容，避免静态资源 404

### Requirement: 后端代理独立部署
The system SHALL deploy the translation proxy to a separate backend hosting platform.

#### Scenario: Pages 不承载后端
- **WHEN** 用户尝试将当前全栈结构直接部署到 GitHub Pages
- **THEN** 方案应明确指出 GitHub Pages 只能承载静态前端，不能运行 Python 后端

#### Scenario: 后端平台选择
- **WHEN** 用户按推荐方案部署
- **THEN** 应采用一个可运行 Python Web 服务并支持环境变量的平台，作为翻译代理的线上宿主

### Requirement: 云端环境变量管理
The system SHALL keep upstream translation keys in backend platform environment variables.

#### Scenario: 上游密钥配置
- **WHEN** 后端服务部署到云端
- **THEN** `OPENROUTER_API_KEY` 或 `GEMINI_API_KEY` 应在云端平台环境变量中配置，而不是写入仓库

#### Scenario: 多上游优先级保持一致
- **WHEN** 云端环境同时配置 `OPENROUTER_API_KEY` 和 `GEMINI_API_KEY`
- **THEN** 后端仍应优先使用 OpenRouter，与本地实现保持一致

### Requirement: 前端 API Base URL 可配置
The system SHALL support a configurable backend base URL for local and cloud environments.

#### Scenario: 本地环境
- **WHEN** 用户在本地预览
- **THEN** 前端应继续默认请求本地代理地址

#### Scenario: 云端环境
- **WHEN** 页面部署到 GitHub Pages
- **THEN** 前端应能改为请求云端代理地址，而不是硬编码 `localhost`

### Requirement: GitHub Pages 与云端代理联通
The system SHALL allow the GitHub Pages frontend to access the deployed backend proxy.

#### Scenario: 跨域调用
- **WHEN** GitHub Pages 域名请求云端代理
- **THEN** 后端应返回允许的跨域头，或采用等效方式保证请求可达

#### Scenario: 健康检查
- **WHEN** 前端加载页面并检查代理状态
- **THEN** 前端应能访问云端 `/api/health` 并正确展示当前代理 provider 和配置状态

### Requirement: 可重复的部署流程
The system SHALL provide a concrete, repeatable deployment process using GitHub as the source of truth.

#### Scenario: 首次部署
- **WHEN** 用户首次将项目部署到云端
- **THEN** 应有明确的仓库准备、Pages 配置、后端部署、环境变量设置和域名访问步骤

#### Scenario: 后续更新
- **WHEN** 用户修改代码后再次推送
- **THEN** 前端应可通过 GitHub Pages 发布更新，后端应通过所选平台重新部署或自动部署更新

## MODIFIED Requirements

### Requirement: 前端默认运行地址从本地同源代理扩展为本地与云端双模式
现有前端默认通过本地同源 `/api/translate` 访问翻译代理。修改后应支持两种模式：本地开发继续使用本地代理地址，云端部署时使用可配置的线上代理 URL。

### Requirement: 本地预览脚本不再是唯一启动方式
现有项目主要依赖 `start_preview.command` 启动本地预览。修改后其角色应明确为本地开发辅助入口，而不是云端部署唯一入口；线上环境需要独立的 Pages 和后端部署配置。

## REMOVED Requirements

### Requirement: 假设单个平台可以同时直接承载当前前端与 Python 代理
**Reason**: GitHub Pages 是静态站点托管，不支持直接运行 Python Web 服务。
**Migration**: 改为“GitHub Pages 托管前端 + 独立平台托管后端代理”的混合部署。

## 技术决策
- 前端托管：GitHub Pages。
- 后端托管：选择一个支持 Python 进程、环境变量和公开 HTTP 服务的平台。
- 前端发布方式：优先使用 GitHub Actions 或 GitHub Pages 原生发布流程。
- 后端部署方式：提供最小配置，保证 `proxy_server.py` 能在云端启动。
- 云端 Secrets：使用后端平台环境变量保存 `OPENROUTER_API_KEY` / `GEMINI_API_KEY`。
- 当前阶段不建议把代理也迁移成纯前端方案，因为那会重新暴露密钥。

## 非目标
- 本次不实现自定义域名、CDN 优化或多环境发布矩阵。
- 本次不实现数据库、用户系统或运维监控体系。
- 本次不把 Python 代理重写成 Serverless 或 Edge Runtime，除非部署平台明确需要。

## 验收标准
- 前端可以通过 GitHub Pages 正常打开。
- 页面在云端不再请求 `localhost`，而是请求可配置的线上代理地址。
- 云端代理能正确读取服务端环境变量中的翻译密钥。
- 云端代理允许 GitHub Pages 前端访问翻译接口与健康检查接口。
- 用户能按文档完成首次部署，并在代码更新后重复发布。

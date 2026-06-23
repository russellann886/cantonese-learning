# 部署说明

本文档说明如何部署当前项目。仓库现已支持 `Cloudflare Pages + Functions` 同源代理，也保留了 `GitHub Pages + Render` 的旧方案。

## Cloudflare Pages + Functions（推荐）

当前仓库已经包含：

- `build-cloudflare-pages.sh`：生成 Cloudflare Pages 的静态产物到 `dist/`
- `wrangler.toml`：声明 Cloudflare Pages 静态输出目录
- `_routes.json`：仅让 `/api/*` 进入 Functions
- `functions/api/health.js`：健康检查接口
- `functions/api/translate.js`：翻译代理接口
- `functions/_utils/translator.js`：Functions 共享上游请求逻辑

### 架构说明

- `Cloudflare Pages`：托管 `index.html`
- `Cloudflare Pages Functions`：在同源路径下提供 `/api/health` 与 `/api/translate`
- 浏览器端：默认直接请求当前站点 `/api/*`，不再需要额外填写 Cloudflare 自己的代理地址

### Pages 项目配置

如果当前 Git 仓库的根目录不是本项目目录，请在 Cloudflare Pages 后台把 `Root directory` 设为：

```text
粤语翻译
```

建议的构建配置：

- `Framework preset`：`None`
- `Build command`：`./build-cloudflare-pages.sh`
- `Build output directory`：`dist`
- `Deploy command`：留空，不要填写 `npx wrangler deploy`

`Deploy command` 必须留空。Cloudflare Pages 会在构建完成后自动部署 `dist` 和 `functions`，如果额外填写 `npx wrangler deploy`，Wrangler 会把整个仓库当成 Workers 静态资源目录上传，可能连 `node_modules` 一起扫描并触发 `Asset too large`。

如果 Cloudflare 的 `Root directory` 留空，则使用仓库根目录兼容配置：

```text
Build command: npm run build
Build output directory: dist
Deploy command: 留空
```

根目录的 `npm run build` 会把 `粤语翻译/dist` 同步到根目录 `dist`，并把 `粤语翻译/functions` 同步到根目录 `functions`，用于兼容 Cloudflare 当前按仓库根目录构建的设置。

仓库根目录还包含一个兜底用的 `wrangler.toml`。如果 Cloudflare 后台仍然执行了 `npx wrangler deploy`，Wrangler 会从该配置读取：

```toml
[assets]
directory = "./dist"
```

这可以避免 Wrangler 把整个仓库 `/opt/buildhome/repo` 当作静态资源目录上传，从而规避 `node_modules/workerd` 超过 25 MiB 的错误。不过推荐配置仍然是把 `Deploy command` 留空，让 Cloudflare Pages 自动部署构建产物。

如果使用 `wrangler` 本地或 CI 构建，仓库里的 `wrangler.toml` 已包含：

```toml
compatibility_date = "2026-06-23"
pages_build_output_dir = "dist"
```

### 需要配置的环境变量

在 Cloudflare Pages 项目的 `Settings -> Environment variables` 中配置以下变量：

- `OPENROUTER_API_KEY=<你的密钥>`
- 或 `GEMINI_API_KEY=<你的密钥>`
- 可选：`OPENROUTER_MODEL=openrouter/free`
- 可选：`CORS_ALLOWED_ORIGINS=<允许跨域访问 Functions 的来源>`

说明：

- `OPENROUTER_API_KEY` 和 `GEMINI_API_KEY` 二选一即可；两者都存在时，当前逻辑优先使用 `OPENROUTER_API_KEY`
- 页面本身走同源请求时不依赖 CORS
- 只有在你希望把这个 Functions 代理给别的站点跨域调用时，才需要配置 `CORS_ALLOWED_ORIGINS`

### 部署后验证

部署完成后，直接访问：

```text
https://<your-pages-domain>/api/health
```

预期返回类似：

```json
{"ok":true,"configured":true,"provider":"openrouter","message":"proxy_ready"}
```

然后打开首页验证：

1. 页面加载后应自动检查同源 `/api/health`
2. 输入一条普通话并点击翻译
3. 浏览器应直接请求同源 `/api/translate`
4. 如果 Functions 已部署且密钥可用，页面无需填写任何代理地址

### 外部代理覆盖

前端仍保留“自定义代理地址”输入框，作用变为可选覆盖：

- 默认留空：走当前站点同源 `/api/*`
- 填入地址：改走外部代理，例如你自己的 Render 服务
- 点击“改回同源 /api”：恢复默认的 Cloudflare Pages Functions / 本地预览入口

## 旧方案：GitHub Pages + Render

## 部署架构

- `GitHub Pages`：托管静态页面 `index.html`
- `Render`：运行 `proxy_server.py`，代理前端请求到上游翻译模型
- 浏览器端：只保存 Render 代理地址，不保存 `OPENROUTER_API_KEY` 或 `GEMINI_API_KEY`

推荐原因：

- 前端静态资源适合直接走 Pages，成本低，发布简单
- API Key 留在 Render 服务端，避免暴露在浏览器
- 本地预览仍可继续使用 `start_preview.command` 的同源 `/api/*` 代理

## 目录内相关文件

- `index.html`：前端页面，支持填写并持久化云端代理地址
- `.github/workflows/deploy-github-pages.yml`：GitHub Pages 自动部署工作流
- `render.yaml`：Render Blueprint 配置
- `proxy_server.py`：Render 和本地预览共用的 Python 代理服务
- `start_preview.command`：本地启动同源预览服务

## 前置准备

部署前请先准备：

1. 一个 GitHub 仓库，并将当前项目推送到 `main` 或 `master`
2. 一个 Render 账号
3. 至少一个可用的上游模型密钥：
   - `OPENROUTER_API_KEY`
   - 或 `GEMINI_API_KEY`
4. 你的 GitHub Pages 域名或计划使用的最终页面地址，后面会写入 Render 的跨域白名单

## 第一步：部署 Render 后端

### 1. 连接仓库

1. 登录 Render
2. 选择 `New` -> `Blueprint`
3. 选择当前 GitHub 仓库
4. Render 会自动读取仓库根目录下的 `render.yaml`

当前仓库的 `render.yaml` 已定义：

- 服务类型：`web`
- 运行环境：`python`
- 启动命令：`python3 proxy_server.py`
- 健康检查：`/api/health`

### 2. 配置环境变量

在 Render 服务里补齐或确认以下环境变量：

- `HOST=0.0.0.0`
- `PORT=10000`
- `OPENROUTER_MODEL=openrouter/free`
- `CORS_ALLOWED_ORIGINS=<你的 GitHub Pages 来源>`
- `OPENROUTER_API_KEY=<你的密钥>`

如果你改用 Gemini，则可以配置：

- `GEMINI_API_KEY=<你的密钥>`

说明：

- `OPENROUTER_API_KEY` 和 `GEMINI_API_KEY` 二选一即可；若两者都填，代码当前优先使用 `OPENROUTER_API_KEY`
- `CORS_ALLOWED_ORIGINS` 支持逗号分隔多个来源，也支持 `*`
- 生产环境建议填写明确来源，不建议长期使用 `*`

`CORS_ALLOWED_ORIGINS` 示例：

```text
https://<github-username>.github.io
```

如果 Pages 部署在仓库子路径下，浏览器请求的来源仍然通常是域名级别，例如：

```text
https://<github-username>.github.io
```

如果你还需要本地页面直接访问 Render，也可以写成：

```text
https://<github-username>.github.io,http://localhost:8080
```

### 3. 部署并记录服务地址

Render 首次部署完成后，记录服务外网地址，例如：

```text
https://cantonese-translator-proxy.onrender.com
```

用以下地址确认服务可用：

```text
https://cantonese-translator-proxy.onrender.com/api/health
```

预期返回类似：

```json
{"ok":true,"configured":true,"provider":"openrouter","message":"proxy_ready"}
```

如果 `configured` 为 `false`，说明服务已启动但尚未配置可用密钥。

## 第二步：启用 GitHub Pages 前端发布

### 1. 检查工作流文件

仓库已经包含 `.github/workflows/deploy-github-pages.yml`，行为如下：

- 在 `main` 或 `master` 分支收到推送时自动执行
- 将 `index.html` 复制到 `dist/index.html`
- 生成 `dist/.nojekyll`
- 通过官方 Pages Action 发布到 GitHub Pages

### 2. 在 GitHub 仓库开启 Pages

1. 打开 GitHub 仓库
2. 进入 `Settings` -> `Pages`
3. 在 `Build and deployment` 中选择 `GitHub Actions`

完成后，只要向 `main` 或 `master` 推送代码，就会触发自动发布。

### 3. 等待工作流完成

进入仓库的 `Actions` 页面，确认 `Deploy GitHub Pages` 工作流成功。

成功后，Pages 地址通常类似：

```text
https://<github-username>.github.io/<repo-name>/
```

## 第三步：在前端页面填写 Render 代理地址

部署完成后，打开 GitHub Pages 页面，在页面顶部的代理设置区域填入 Render 服务地址，例如：

```text
https://cantonese-translator-proxy.onrender.com
```

保存后，前端会：

- 将该地址持久化到 `localStorage`
- 后续把健康检查和翻译请求发到：
  - `https://cantonese-translator-proxy.onrender.com/api/health`
  - `https://cantonese-translator-proxy.onrender.com/api/translate`

也可以通过 URL 参数临时注入代理地址：

```text
https://<github-username>.github.io/<repo-name>/?proxy=https://cantonese-translator-proxy.onrender.com
```

页面上的“恢复本地默认入口”仅适用于本地同源预览。放在 GitHub Pages 环境下时，如果没有填写云端代理地址，页面会给出明确提示。

## 第四步：验收部署结果

建议按下面顺序检查：

1. 打开 Render 的 `/api/health`，确认服务在线
2. 打开 GitHub Pages 页面，填入 Render 地址并保存
3. 在页面输入一条普通话文本，执行翻译
4. 确认页面返回粤语结果，而不是代理连接错误
5. 刷新页面，确认代理地址仍能从本地存储恢复

## 本地预览方式

本地仍然建议使用：

```bash
./start_preview.command
```

它会：

- 启动 `proxy_server.py`
- 默认监听 `http://localhost:8080/`
- 在同源路径下提供 `/api/health` 和 `/api/translate`

本地预览时需要在当前 shell 环境中提供：

```bash
export OPENROUTER_API_KEY="your-key"
```

或：

```bash
export GEMINI_API_KEY="your-key"
```

## 常见问题

### 1. GitHub Pages 页面提示未配置代理地址

原因：

- 这是预期行为。GitHub Pages 只负责静态页面，不会自动提供 `/api/*`

处理：

- 在页面中填写 Render 服务地址并保存

### 2. 页面无法连接 Render

优先检查：

1. Render 服务是否已成功部署
2. `https://<render-domain>/api/health` 是否能访问
3. 前端填写的是服务根地址，而不是少了协议的裸域名
4. `CORS_ALLOWED_ORIGINS` 是否包含你的 GitHub Pages 来源

### 3. Render 健康检查正常，但翻译失败

优先检查：

1. 是否已配置 `OPENROUTER_API_KEY` 或 `GEMINI_API_KEY`
2. 密钥是否有效
3. 上游模型是否可访问或是否被限流

### 4. GitHub Pages 没有自动更新

优先检查：

1. 代码是否推送到了 `main` 或 `master`
2. 仓库 `Settings` -> `Pages` 是否已切换到 `GitHub Actions`
3. `Actions` 页面里的 `Deploy GitHub Pages` 工作流是否执行成功

## 建议的上线顺序

1. 先部署 Render，并确认 `/api/health` 正常
2. 再启用 GitHub Pages
3. 最后在 Pages 页面中填入 Render 地址并做一次真实翻译验证

这样可以避免前端已经上线，但后端代理还不可用的空窗期。

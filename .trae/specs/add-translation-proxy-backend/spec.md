# 新增翻译后端代理 Spec

## Why
当前网页把翻译上游 API Key 保存在浏览器本地并由前端直接发请求，这只适合临时测试，不适合长期安全使用。用户现在明确希望增加一个简单后端接口，让服务端保管密钥并代为转发翻译请求，从而降低前端泄露 API Key 的风险；随后又实际提供了一把 OpenRouter API Key，并要求优先将该接口接入当前网页。

## What Changes
- 为现有粤语翻译网页新增一个轻量后端代理服务，用于安全保存翻译上游密钥并转发翻译请求。
- 将前端翻译主路径从“浏览器直接请求 Gemini”改为“前端请求本地后端，后端再请求上游翻译模型”。
- 后端对外提供最小必要接口，优先只暴露翻译代理能力，不开放通用任意转发。
- 前端移除或停用“用户手动输入 API Key”的默认使用路径，改为依赖后端环境变量配置。
- 更新本地启动方式，使用户能同时启动静态页面和后端代理，或由单个本地服务统一提供前端与 API。
- 当前实现默认优先使用 `OPENROUTER_API_KEY` 对接 OpenRouter；若未提供，则回退到 `GEMINI_API_KEY` 对接 Gemini。
- **BREAKING**：翻译功能不再依赖浏览器本地保存的 API Key；默认运行方式变为需要本地后端进程和服务端环境变量。

## Impact
- Affected specs: 翻译请求链路、密钥管理方式、本地运行方式、错误反馈方式。
- Affected code: `粤语翻译/index.html`、`粤语翻译/start_preview.command`，以及新增的后端服务文件与必要的依赖/配置文件。
- Affected runtime: 本地预览将从纯静态页面模式变为“静态前端 + 本地后端代理”模式，或统一由后端托管静态资源；代理会根据环境变量决定使用 OpenRouter 还是 Gemini。

## ADDED Requirements

### Requirement: 服务端保管翻译上游 API Key
The system SHALL keep translation-provider API keys on the server side instead of exposing them in the browser.

#### Scenario: 后端读取密钥
- **WHEN** 后端服务启动
- **THEN** 应从环境变量读取上游密钥，而不是从前端请求体、前端存储或源码常量中读取

#### Scenario: 未配置服务端密钥
- **WHEN** 服务端未配置任何可用上游密钥
- **THEN** 后端应返回明确错误，前端应展示可理解的“服务未完成配置”提示

#### Scenario: 多上游优先级
- **WHEN** 后端同时具备 `OPENROUTER_API_KEY` 和 `GEMINI_API_KEY`
- **THEN** 应优先使用 OpenRouter 作为当前翻译主路径

### Requirement: 最小翻译代理接口
The system SHALL provide a minimal backend endpoint for translation forwarding only.

#### Scenario: 正常翻译请求
- **WHEN** 前端向后端发送普通话文本
- **THEN** 后端应校验输入、拼装上游请求、转发到当前选中的翻译提供方，并将结构化翻译结果返回给前端

#### Scenario: 非法输入
- **WHEN** 前端发送空文本、超长文本或缺少必要字段
- **THEN** 后端应拒绝请求并返回明确的 4xx 错误，而不是继续调用上游接口

#### Scenario: 非通用代理
- **WHEN** 外部请求试图把后端当作任意 URL 转发器使用
- **THEN** 后端接口不应支持任意目标地址，只允许固定的 Gemini 翻译调用路径

### Requirement: 前后端职责重新划分
The system SHALL move translation authorization and upstream calling logic to the backend, while keeping rendering logic in the frontend.

#### Scenario: 前端发起翻译
- **WHEN** 用户点击“翻译成粤语”
- **THEN** 前端应调用本地后端接口，而不是直接请求 OpenRouter 或 Gemini 官方地址

#### Scenario: 前端移除本地 Key 依赖
- **WHEN** 页面加载或翻译时
- **THEN** 前端不应再要求用户在浏览器中输入 Gemini API Key 作为默认主流程

### Requirement: 统一错误透传与状态反馈
The system SHALL provide stable error handling across frontend, backend, and upstream API failures.

#### Scenario: 上游认证失败
- **WHEN** OpenRouter 或 Gemini 的服务端密钥无效、失效或权限不足
- **THEN** 后端应返回可识别的认证错误，前端应展示简洁的失败说明

#### Scenario: 上游限流或网络异常
- **WHEN** 当前翻译上游返回限流、服务不可用或网络超时
- **THEN** 后端应统一归一化错误响应，前端不直接暴露原始上游细节堆栈

#### Scenario: 后端内部异常
- **WHEN** 后端自身抛出未预期异常
- **THEN** 响应应避免泄露敏感信息，并返回可调试但不过度暴露实现细节的错误消息

### Requirement: 本地运行与预览支持
The system SHALL remain easy to run locally for a single developer.

#### Scenario: 本地启动
- **WHEN** 用户运行项目的预览启动方式
- **THEN** 应能同时启动前端页面和翻译代理服务，或由一个本地服务同时提供页面和 API

#### Scenario: 静态资源访问
- **WHEN** 用户打开本地页面
- **THEN** 页面应能正常加载并访问到同源或已允许跨域的代理接口

#### Scenario: 预览服务状态展示
- **WHEN** 用户打开本地页面且代理已启动
- **THEN** 页面应能通过健康检查接口展示当前已接入的上游提供方，例如 OpenRouter 或 Gemini

### Requirement: 兼容现有翻译结果结构
The system SHALL preserve the existing frontend result contract where practical.

#### Scenario: 翻译响应结构
- **WHEN** 后端完成 Gemini 转发并返回结果
- **THEN** 返回结构应继续包含前端已经使用的 `cantonese`、`tone_note` 和 `reading_version` 字段，减少前端改动范围

## MODIFIED Requirements

### Requirement: API Key 配置方式从浏览器本地存储切换到服务端环境变量
现有网页通过浏览器 `localStorage` 保存 API Key 并直接从前端发起请求，修改后应以服务端环境变量作为唯一主配置方式。浏览器本地 Key 输入逻辑不再是默认生产路径，必要时最多仅能保留为开发调试备用。

### Requirement: 翻译请求从前端直连上游切换为本地代理转发
现有前端直接请求翻译上游接口，修改后前端应只请求本地后端提供的翻译接口，由后端负责上游请求、认证、错误归一化与响应结构整理。

## REMOVED Requirements

### Requirement: 用户在页面右上角手动输入 API Key 才能使用翻译
**Reason**: 将密钥暴露给浏览器端不符合“安全处理 API Key”的目标，也不适合长期使用。
**Migration**: 改为后端从环境变量读取密钥；前端只负责调用代理接口和展示状态。

## 技术决策
- 推荐后端形态：一个简单的本地服务，优先选择容易读写和调试的轻量实现。
- 推荐接口形式：`POST /api/translate`，请求体仅包含待翻译文本和必要上下文。
- 当前实现的上游优先级：优先读取服务端环境变量 `OPENROUTER_API_KEY`，若不存在则回退读取 `GEMINI_API_KEY`。
- 当前实现的 OpenRouter 默认模型：`openrouter/free`，以适配免费路由和低门槛测试。
- 推荐健康检查接口：`GET /api/health`，用于返回代理是否就绪、是否已配置上游密钥以及当前 provider。
- 推荐返回结构：保持与现有前端结果字段兼容，减少 UI 层重写。
- 推荐安全边界：不做通用代理，不把上游错误原样暴露给前端，不把密钥写入仓库或前端源码。
- 当前实现说明：前端结果区和代理状态区文案已从“固定指向 Gemini”调整为更通用的“翻译上游”描述；当代理使用 OpenRouter 时，页面会显示当前上游为 OpenRouter。

## 非目标
- 本次不实现用户鉴权、会话体系或多租户 API Key 管理。
- 本次不实现完整生产级网关、限流中间件或审计系统。
- 本次不实现部署到云端的平台化后端，仅以单开发者本地可运行为目标。

## 验收标准
- 前端翻译主路径已改为调用本地后端接口，而不是直连 OpenRouter 或 Gemini。
- `OPENROUTER_API_KEY` 或 `GEMINI_API_KEY` 仅存在于服务端环境变量中，不再要求用户在前端手动输入。
- 后端接口能正确转发翻译请求，并返回前端当前可用的结构化结果。
- 当同时存在多种服务端密钥时，后端会优先使用 OpenRouter。
- 页面健康检查能显示代理已启动以及当前使用的上游提供方。
- 缺失 Key、认证失败、限流、网络失败时，前后端都有可理解的错误反馈。
- 在接入 OpenRouter 实际密钥后，本地代理可以返回真实翻译结果，结构保持 `cantonese`、`tone_note`、`reading_version`。
- 本地预览方式可以同时运行页面与代理接口。

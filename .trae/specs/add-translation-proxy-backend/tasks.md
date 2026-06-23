# Tasks

- [x] Task 1: 设计并搭建最小后端代理骨架
  - [x] SubTask 1.1: 确认当前前端直连 Gemini 的代码边界与返回结构
  - [x] SubTask 1.2: 选择并创建轻量后端服务入口
  - [x] SubTask 1.3: 约定 `POST /api/translate` 的请求与响应结构

- [x] Task 2: 实现 Gemini 翻译转发接口
  - [x] SubTask 2.1: 从服务端环境变量读取 `GEMINI_API_KEY`
  - [x] SubTask 2.2: 校验输入文本并转发到 Gemini
  - [x] SubTask 2.3: 将 Gemini 返回结果整理为前端现有可用结构
  - [x] SubTask 2.4: 处理缺失 Key、认证失败、限流、网络失败和内部异常

- [x] Task 3: 前端切换到后端代理链路
  - [x] SubTask 3.1: 将前端翻译请求改为调用本地代理接口
  - [x] SubTask 3.2: 移除或停用前端手动输入 API Key 的默认主流程
  - [x] SubTask 3.3: 适配新的错误提示与状态文案

- [x] Task 4: 更新本地运行方式
  - [x] SubTask 4.1: 调整预览启动方式，使页面与后端代理可同时运行
  - [x] SubTask 4.2: 确认本地访问路径和同源/跨域设置合理

- [x] Task 5: 验证后端代理工作流
  - [x] SubTask 5.1: 验证未配置 `GEMINI_API_KEY` 时的错误路径
  - [x] SubTask 5.2: 验证正常翻译请求可通过代理返回结构化结果
  - [x] SubTask 5.3: 验证认证失败、限流或网络异常时的统一错误反馈
  - [x] SubTask 5.4: 验证本地预览方式可直接运行

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 2.
- Task 4 depends on Task 2 and can partially overlap with Task 3.
- Task 5 depends on Task 2, Task 3, and Task 4.

# Progress Notes
- 2026-06-23: 已完成 Task 5 验证。通过 `start_preview.command` 启动本地预览并确认页面与代理同服运行，`GET /api/health` 返回 `configured: false`，未配置 `GEMINI_API_KEY` 时 `POST /api/translate` 返回 `503 server_not_configured`。
- 2026-06-23: 通过受控模拟验证 `POST /api/translate` 的成功、认证失败、限流、网络异常、内部异常和超长输入路径；确认返回结构保持 `cantonese`、`tone_note`、`reading_version`，错误码归一化为 `auth_failed`、`rate_limited`、`network_error`、`internal_error`、`validation_failed`。

# 接入 AI 翻译接口并重构极简蓝白界面 Spec

## Why
当前网页的粤语翻译依赖本地硬编码规则，覆盖面窄、语感生硬，已经无法满足“普通话转地道粤语表达”的核心目标。同时，现有页面视觉元素、提示文案和上下排布都偏重，影响输入与结果对照效率。

## What Changes
- 用外部免费模型接口替代现有本地规则翻译逻辑，默认接入 Gemini API 免费层级完成普通话到地道粤语的翻译。
- 在纯静态网页约束下，引入“本地配置 API Key”的接入方式，不将密钥硬编码进页面源码。
- 将主交互改为左侧输入普通话、右侧输出粤语结果的双栏布局。
- 将整体界面重设计为极简蓝白风格，减少高饱和装饰、霓虹效果和多余模块提示文案。
- 精简页面文案，只保留必要的状态反馈、错误提示和关键操作说明。
- 保留语音播放能力，但将其作为结果区的辅助功能，而非页面主视觉重点。
- **BREAKING**：默认翻译能力不再依赖本地规则直接可用；未配置可用 API Key 时，翻译按钮将提示先完成接口配置。

## Impact
- Affected specs: 粤语翻译能力、接口配置能力、双栏交互布局、极简视觉规范、提示文案规范。
- Affected code: `粤语翻译/index.html` 为主要改造文件；`粤语翻译/start_preview.command` 仅保留静态预览职责。
- Affected runtime: 翻译请求将从纯本地规则执行变为前端发起外部 API 调用；语音播放仍优先使用浏览器本地语音能力。
- Affected UX: 页面从“学习卡片 + 说明较多”的信息组织，调整为“输入与结果并列”的编辑器式布局。

## ADDED Requirements

### Requirement: 外部翻译接口接入
The system SHALL use an external AI translation model API as the primary translation engine for Mandarin-to-Cantonese conversion.

#### Scenario: 默认翻译引擎选型
- **WHEN** 系统首次实现外部翻译能力
- **THEN** 应默认使用 Gemini API 免费层级作为主翻译接口，并在规格与界面文案中明确这是当前默认方案

#### Scenario: 翻译请求成功
- **WHEN** 用户已配置有效 API Key 并提交普通话文本
- **THEN** 系统应调用外部模型接口，返回更自然、口语化、贴近日常粤语的表达

#### Scenario: 模型输出格式约束
- **WHEN** 系统向模型发送翻译请求
- **THEN** 应通过系统指令或等效提示明确要求输出包含粤语结果、简短语气说明和可跟读版本，避免冗长解释

### Requirement: 本地 API Key 配置
The system SHALL provide a local-only API Key configuration flow suitable for a static web page.

#### Scenario: 首次配置接口
- **WHEN** 用户首次使用需要外部翻译的功能
- **THEN** 页面应允许用户输入并保存 Gemini API Key 到本地浏览器存储，而不是将密钥写死在源码中

#### Scenario: 未配置 API Key
- **WHEN** 用户未配置可用 API Key 就点击翻译
- **THEN** 页面应展示简洁明确的提示，引导用户完成接口配置

#### Scenario: 配置更新
- **WHEN** 用户修改或清除已保存的 API Key
- **THEN** 新配置应立即生效，并且不需要刷新页面才能重新发起翻译

### Requirement: 翻译交互与状态管理
The system SHALL provide clear loading, success, and failure states for AI-powered translation.

#### Scenario: 翻译进行中
- **WHEN** 用户发起翻译请求
- **THEN** 翻译按钮应进入加载态，并避免重复提交

#### Scenario: 翻译失败
- **WHEN** 外部接口返回错误、超时、限流或认证失败
- **THEN** 页面应展示简洁、可执行的错误信息，而不是保留旧结果假装成功

#### Scenario: 保留关键上下文
- **WHEN** 用户输入含有专有名词、数字、时间、地点或引用内容
- **THEN** 提示词和结果处理应优先保留这些关键信息，避免被模型随意改写

### Requirement: 左右双栏主交互
The system SHALL present source input and translation output in a left-right side-by-side layout on desktop screens.

#### Scenario: 桌面双栏
- **WHEN** 用户在桌面端访问页面
- **THEN** 左侧应为普通话输入区，右侧应为粤语输出区与辅助操作区，用户可直接横向对照

#### Scenario: 移动端降级
- **WHEN** 用户在窄屏设备访问页面
- **THEN** 双栏布局应折叠为纵向排列，但信息层级仍保持“输入在前，输出在后”

### Requirement: 极简蓝白视觉系统
The system SHALL use a consistent minimalist visual design with blue and white as the primary palette.

#### Scenario: 视觉风格统一
- **WHEN** 页面完成改版
- **THEN** 主色应以蓝、白为基调，减少高饱和霓虹色、复杂背景纹理和无关视觉噪声

#### Scenario: 组件一致性
- **WHEN** 用户查看按钮、输入框、输出卡片和设置区域
- **THEN** 它们应采用统一的圆角、描边、留白和层级规范，而不是多个风格混用

### Requirement: 提示文案精简
The system SHALL remove non-essential explanatory copy and keep only concise, task-relevant text.

#### Scenario: 首页信息密度控制
- **WHEN** 页面首屏加载完成
- **THEN** 页面不应出现大量教学性提示、装饰性说明或重复引导，只保留标题、副标题和必要操作反馈

#### Scenario: 结果区提示
- **WHEN** 翻译成功或失败
- **THEN** 文案应简短直达，不应输出多段模板化解释

### Requirement: 语音播放辅助保留
The system SHALL retain pronunciation playback as a secondary capability for the AI-generated Cantonese result.

#### Scenario: 翻译成功后播放
- **WHEN** 用户获得粤语翻译结果并点击播放
- **THEN** 系统应继续优先使用浏览器本地语音能力朗读结果

#### Scenario: 语音与翻译解耦
- **WHEN** 外部翻译接口可用但浏览器语音能力不可用
- **THEN** 页面仍应允许用户完成翻译和复制，只对语音能力做局部降级提示

## MODIFIED Requirements

### Requirement: 翻译引擎从本地规则切换为外部 AI 模型
现有网页的主翻译能力应从本地 `rules` / `sentenceRules` 的静态替换逻辑修改为“外部 AI 模型接口 + 明确提示词约束”的动态翻译方案。本地规则不再承担默认主翻译职责；若保留，也仅可作为无网或调试场景的有限备用逻辑。

### Requirement: 页面主布局从上下信息堆叠切换为左右对照
现有页面以输入区、历史区和结果区上下/块状组织为主，修改后桌面首屏应采用左右对照布局：左侧聚焦输入与提交，右侧聚焦结果、语音与复制等输出操作，使用户能直接对照普通话原句与粤语结果。

### Requirement: 视觉风格从霓虹夜景切换为极简蓝白
现有页面的深色霓虹、渐变光效和港风街牌视觉应修改为更克制的极简蓝白风格。保留现代感，但避免炫技式背景、强对比发光和过量装饰。

## REMOVED Requirements

### Requirement: 以本地规则库作为默认翻译主路径
**Reason**: 本地规则替换过于死板，无法满足自然粤语表达的质量需求。
**Migration**: 主路径改为外部 AI 翻译接口；如保留本地规则，仅作为不可用状态下的开发兜底，不再面向默认用户路径展示。

### Requirement: 大量学习说明型文案与强调性提示模块
**Reason**: 当前页面提示过多，干扰翻译主任务，也与极简蓝白风格不一致。
**Migration**: 仅保留必要标题、简短副标题、状态反馈、错误提示与最少量操作说明。

## 技术决策
- 默认翻译提供方：Gemini API 免费层级。
- 选型理由：官方免费额度明确、文本能力稳定、对中文改写质量更适合本任务、接入文档完整。
- 当前阶段不选 OpenRouter 作为默认主方案：其免费模型可用性与日限额更容易随账户信用状态变化，且免费模型路由稳定性不如直接接官方接口。
- 当前阶段不引入自建后端：项目仍保持静态页面运行方式，因此接口密钥由用户本地输入并存入 `localStorage`，不写入仓库源码。
- 翻译请求建议使用结构化输出或稳定格式约束，避免模型输出大段解释污染结果区。

## 非目标
- 本次不实现用户账号、服务端密钥托管或配额管理后台。
- 本次不实现多提供方自由切换的复杂配置中心。
- 本次不追求专业 CAT 工具级别术语库、术语记忆或批量文档翻译。

## 验收标准
- 页面主翻译默认通过 Gemini API 免费层级完成，不再以本地规则为默认结果来源。
- 未配置 API Key 时，翻译入口给出清晰且简洁的配置引导。
- 桌面端为左输入、右输出的双栏布局；移动端正常折叠。
- 视觉基调为蓝白极简，旧霓虹重装饰风格被移除。
- 页面多余提示文案明显减少，首屏不再堆叠多段说明。
- 翻译成功、失败、加载中三种状态都有明确反馈。

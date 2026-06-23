# 地道粤语翻译学习网页 App Spec

## Why
用户希望输入一段普通中文或其他中文语体文本后，快速获得更自然、口语化、地道的粤语表达，并通过语音示例进行跟读学习。当前项目是一个单页网页，适合改造成无需复杂后端依赖的轻量学习工具，先交付可运行的核心体验。

## What Changes
- 将现有单页界面改造成“粤语翻译与跟读学习”网页 App。
- 提供文本输入、粤语翻译结果、表达拆解、语音示例播放、跟读提示和学习记录反馈。
- 优先实现浏览器端可用方案：内置一套常见表达转换规则与示例语料，结合 Web Speech API 进行语音朗读；若浏览器不支持粤语语音，则提供清晰降级提示。
- 提供适合学习场景的视觉设计：突出输入、翻译结果、发音操作和学习提示，避免与现有太阳系主题无关的视觉元素残留。
- 保持单文件部署友好，继续支持通过本地静态服务器预览。

## Impact
- Affected specs: 新增“粤语翻译学习 App”能力。
- Affected code: `index.html` 将作为主要实现文件；`start_preview.command` 可能保留现有静态预览能力，仅在需要改名日志或提示时调整。
- Affected UX: 从 3D 太阳系演示切换为语言学习工具，页面主题、控件、交互流程会整体变化。
- Affected technical dependencies: 计划不新增构建系统；优先使用原生 HTML/CSS/JavaScript 与浏览器语音能力。

## ADDED Requirements

### Requirement: 文本输入与输入辅助
The system SHALL provide a clear text input area where users can enter source text for Cantonese localization.

#### Scenario: 用户输入待翻译文本
- **WHEN** 用户在输入框中输入一段文字
- **THEN** 页面应显示当前字数、可执行翻译操作，并保留输入内容直到用户主动清空

#### Scenario: 空输入保护
- **WHEN** 用户未输入有效文本并点击翻译
- **THEN** 页面应提示用户先输入内容，而不是生成空结果或报错

#### Scenario: 示例快捷填充
- **WHEN** 用户点击预设示例
- **THEN** 输入框应填入示例文本，并允许用户继续编辑后再翻译

### Requirement: 地道粤语翻译结果
The system SHALL convert source text into a natural Cantonese-style expression suitable for conversational learning.

#### Scenario: 常见表达转换
- **WHEN** 用户输入包含常见普通话表达的句子
- **THEN** 系统应输出更贴近粤语口语的表述，例如语气词、词汇和句式自然化

#### Scenario: 无法完全转换
- **WHEN** 输入内容超出内置规则覆盖范围
- **THEN** 系统应尽力保留原意，并明确展示“这是参考表达”，避免伪装成权威翻译

#### Scenario: 保留用户上下文
- **WHEN** 输入文本包含称呼、时间、地点或专有名词
- **THEN** 翻译结果应尽量保留这些核心信息，不应随意删除

### Requirement: 表达拆解与学习提示
The system SHALL explain useful Cantonese words, particles, or sentence patterns from the generated expression.

#### Scenario: 展示重点词汇
- **WHEN** 翻译结果生成完成
- **THEN** 页面应展示至少一组重点词汇或语气说明，例如“唔该”“咗”“啦”“呀”等

#### Scenario: 展示学习建议
- **WHEN** 用户查看翻译结果
- **THEN** 页面应提供简短跟读建议，例如停顿、语气、适合场景或礼貌程度

### Requirement: 语音示例播放
The system SHALL provide an audio example for the Cantonese expression when browser capabilities allow it.

#### Scenario: 浏览器支持粤语朗读
- **WHEN** 用户点击播放语音
- **THEN** 系统应使用可用的 `zh-HK`、`yue-HK` 或最接近的中文语音朗读翻译结果

#### Scenario: 浏览器不支持合适语音
- **WHEN** 没有可用粤语或中文语音
- **THEN** 系统应展示降级说明，并仍保留翻译结果、拼读提示和学习内容

#### Scenario: 防止语音重叠
- **WHEN** 用户连续点击播放
- **THEN** 系统应停止上一段朗读并播放最新内容，避免多个语音叠加

### Requirement: 跟读学习体验
The system SHALL help users practice pronunciation after listening to the example.

#### Scenario: 跟读步骤提示
- **WHEN** 翻译结果展示后
- **THEN** 页面应提供“听一遍、慢读、完整跟读”的练习流程提示

#### Scenario: 复制结果
- **WHEN** 用户点击复制按钮
- **THEN** 系统应复制粤语结果，并反馈复制成功或失败

#### Scenario: 最近练习记录
- **WHEN** 用户完成多次翻译
- **THEN** 页面应显示最近若干条练习记录，方便用户回看

### Requirement: 视觉与可访问性
The system SHALL provide a polished, readable, responsive interface for desktop-first use and acceptable mobile use.

#### Scenario: 桌面使用
- **WHEN** 用户在桌面浏览器打开页面
- **THEN** 主要输入区、结果区、语音控制和学习提示应清晰分区，首屏即可理解操作路径

#### Scenario: 移动端使用
- **WHEN** 用户在窄屏设备打开页面
- **THEN** 页面布局应变为单列，输入、结果和按钮不应溢出屏幕

#### Scenario: 键盘与读屏可用
- **WHEN** 用户使用键盘操作
- **THEN** 主要按钮和输入框应可聚焦，并具备可理解的标签文本

### Requirement: 本地预览与静态部署
The system SHALL remain runnable as a static web page without requiring a build step.

#### Scenario: 本地预览
- **WHEN** 用户运行现有预览脚本或通过静态服务器打开 `index.html`
- **THEN** App 应能正常加载并完成输入、翻译、播放和复制等核心交互

## MODIFIED Requirements

### Requirement: 现有单页演示转换为语言学习 App
当前 `index.html` 的主要用户价值应从“太阳系 3D 运行轨迹展示”修改为“地道粤语翻译与跟读学习”。完整页面结构、样式和脚本应围绕语言学习任务重新组织，旧的星球、轨道、画布交互、太阳系图例和相关 HUD 信息不再作为主要功能保留。

## REMOVED Requirements

### Requirement: 太阳系 3D 可视化演示
**Reason**: 用户的新目标是开发粤语翻译学习网页 App，太阳系模拟与该目标无关，会干扰学习任务。
**Migration**: 可在实现前备份或通过版本控制保留历史；新实现中移除相关视觉和交互逻辑，只保留静态网页运行方式。

## 非目标
- 不在第一版中接入付费大模型、第三方翻译 API 或真实粤语 TTS 服务。
- 不在第一版中实现用户账号、云端同步、课程体系或发音评分。
- 不承诺机器翻译达到专业人工翻译水平；第一版定位为学习辅助与常见表达练习工具。

## 推荐实现方案
- 技术形态：单文件 `index.html`，包含结构、样式和原生 JavaScript。
- 翻译策略：建立轻量规则引擎，包含常见普通话到粤语词汇映射、语气词补全、常见句式改写和示例兜底。
- 语音策略：使用 `window.speechSynthesis` 获取浏览器语音列表，优先选择 `yue-HK`、`zh-HK`、`zh_TW`、`zh-CN` 等可用语音；播放前先取消当前朗读。
- 学习内容：基于翻译结果命中的规则生成“表达拆解”，未命中时展示通用粤语学习提示。
- 数据存储：使用内存状态保存当前会话的最近练习记录；如需要持久化，可后续扩展到 `localStorage`。
- 视觉方向：建议采用“港式街牌 / 夜间霓虹 / 学习卡片”的设计语言，使用清晰排版和高对比按钮，突出声音与跟读动作。

## 主要用户流程
1. 用户打开网页，看到 App 标题、简短说明、输入框和示例短句。
2. 用户输入一段文字，或点击示例填充。
3. 用户点击“翻译成粤语”。
4. 页面展示地道粤语参考表达、重点词汇拆解和跟读建议。
5. 用户点击“播放语音示例”收听朗读。
6. 用户按提示跟读，并可复制结果或查看最近练习记录。

## 验收标准
- 空输入、普通输入、示例输入都能得到明确反馈。
- 至少覆盖 12 个常见中文表达到粤语表达的转换规则。
- 翻译结果区域必须同时包含粤语表达、学习提示和至少一个重点说明。
- 播放按钮在支持 Web Speech API 的浏览器中可以触发朗读；不支持时有降级提示。
- 页面在桌面和移动视口下均可读、可点、无明显布局溢出。
- 不依赖构建步骤或外部服务即可本地预览。

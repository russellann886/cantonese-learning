# Tasks

- [x] Task 1: 评估并替换现有翻译主路径
  - [x] SubTask 1.1: 确认 `粤语翻译/index.html` 中本地规则翻译、结果渲染与错误提示的现有实现边界
  - [x] SubTask 1.2: 移除本地规则作为默认主翻译路径的依赖
  - [x] SubTask 1.3: 设计面向“普通话转地道粤语”的 Gemini 翻译提示词与返回格式约束
  - [x] SubTask 1.4: 接入 Gemini API 免费层级请求逻辑，完成翻译成功、失败与加载中状态处理

- [x] Task 2: 实现静态网页可用的接口配置方案
  - [x] SubTask 2.1: 新增本地 API Key 配置入口，不将密钥写死在源码中
  - [x] SubTask 2.2: 将 API Key 保存到浏览器本地存储，并支持读取、更新与清除
  - [x] SubTask 2.3: 在未配置 Key、认证失败、限流或网络失败时给出简洁错误反馈

- [x] Task 3: 重构主交互为左右双栏
  - [x] SubTask 3.1: 将桌面端主布局改为左侧普通话输入、右侧粤语输出
  - [x] SubTask 3.2: 保留语音播放、复制等结果操作，但收敛为结果区次级功能
  - [x] SubTask 3.3: 在移动端将双栏折叠为纵向布局，保持输入在前、输出在后

- [x] Task 4: 统一 UI 为极简蓝白风格
  - [x] SubTask 4.1: 移除现有高饱和霓虹、强发光和复杂背景装饰
  - [x] SubTask 4.2: 建立统一的蓝白色板、按钮、卡片、输入框和边框规范
  - [x] SubTask 4.3: 调整留白、字号、分区层级和组件间距，使页面更克制

- [x] Task 5: 清理多余提示文案
  - [x] SubTask 5.1: 删除首屏与模块中重复、冗长、装饰性的说明文本
  - [x] SubTask 5.2: 保留必要标题、副标题、状态反馈与错误提示
  - [x] SubTask 5.3: 确保翻译结果区不出现模型返回的冗长解释污染主结果

- [x] Task 6: 验证翻译流程与界面改造结果
  - [x] SubTask 6.1: 验证未配置 Key、已配置 Key、接口失败和成功翻译的完整路径
  - [x] SubTask 6.2: 验证桌面双栏与移动端折叠布局均正常工作
  - [x] SubTask 6.3: 验证蓝白极简风格是否贯彻到主要组件
  - [x] SubTask 6.4: 验证语音播放与复制功能在新布局中仍可正常使用
  - [x] SubTask 6.5: 使用本地静态预览确认页面仍可直接运行

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 1 and can overlap with Task 2 after主要状态定义完成.
- Task 4 depends on Task 3.
- Task 5 depends on Task 3 and can partially overlap with Task 4.
- Task 6 depends on Task 2, Task 3, Task 4, and Task 5.

# Kimi GUI

面向中文新手的 Kimi 编码桌面工作台。

[![CI](https://github.com/WilliamClifton-dev/kimi-gui/actions/workflows/ci.yml/badge.svg)](https://github.com/WilliamClifton-dev/kimi-gui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Kimi GUI 希望让不熟悉命令行的用户，也能直观地完成 Kimi 配置、创建编码会话、执行常见任务，并在运行失败时看懂发生了什么。它不是一个普通聊天壳，而是一个围绕 Kimi Code 工作流设计的本地桌面产品。

![Kimi GUI 首页](docs/assets/homepage.png)

## 适合谁

- 完全不懂命令行，但希望使用 AI 辅助编程的中文用户
- 会一点开发，但不熟悉 CLI、环境变量和模型配置的用户
- 希望保留 Kimi 原生工作流，同时获得可视化操作体验的用户

## 当前版本

`v0.1.0` 是首个可公开使用的 MVP，目前已经支持：

- 中文优先的首次配置与错误提示
- Kimi SDK 驱动的真实流式会话
- 运行活动日志和 GUI 审批操作
- 五个适合新手的常用编码任务模板
- 可展开、可复制的诊断报告
- Kimi、OpenAI、DeepSeek、Anthropic、Gemini 提供方配置界面
- CI、发布检查和密钥泄露扫描

需要注意：当前只有 Kimi 提供方接入了真实运行时，其他兼容提供方暂时仍返回演示结果。

## 为什么做这个项目

Kimi 的编码能力很强，但 CLI 形态会让很多新用户在第一次成功会话前，就卡在命令、API Key、Base URL、模型选择和报错信息上。

Kimi GUI 的目标是降低第一次使用的门槛，同时保留 Kimi Code 风格的工具调用、审批、运行日志，以及未来扩展 MCP 和插件能力的空间。

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- npm
- Windows、macOS 或 Linux
- 使用真实 Kimi 会话时，需要本机安装并登录 Kimi CLI

### 安装与运行

```bash
git clone https://github.com/WilliamClifton-dev/kimi-gui.git
cd kimi-gui
npm install
npm run electron:dev
```

只启动浏览器界面预览：

```bash
npm run dev
```

## 使用流程

1. 在首次配置区域选择提供方。
2. 填写 API Key、默认模型和 Base URL。
3. 保存配置并创建新会话。
4. 选择快捷任务，或输入自己的 Prompt。
5. 查看 Kimi 的流式回复和运行活动。
6. Kimi 请求执行敏感操作时，在界面中批准或拒绝。
7. 遇到问题时打开诊断信息，并将报告复制到 GitHub Issue。

## 常见问题

### 没有找到 Kimi CLI

请先在本机安装 Kimi CLI，并确认命令行可以直接运行 `kimi`。

### Kimi CLI 已安装，但仍提示需要登录

先在本地完成 Kimi 登录，再重新打开或刷新 Kimi GUI。

### DeepSeek、OpenAI 等提供方只返回演示内容

这是当前版本的预期行为。真实运行时目前只接入了 `kimi` 提供方，其他提供方仍处于兼容模式占位阶段。

### 会话中出现审批面板

说明运行时正在等待你的决定。检查操作内容后，选择“批准”或“拒绝”即可继续。

### 如何提交有效的问题报告

在会话中展开“诊断信息”，复制结构化报告，并将它粘贴到 GitHub Issue。报告不会包含完整 API Key。

## 开发命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动 Vite 浏览器界面 |
| `npm run electron:dev` | 启动 Electron 桌面应用 |
| `npm run test` | 运行测试 |
| `npm run typecheck` | 运行 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint |
| `npm run build` | 构建 renderer 和 Electron main |
| `npm run audit:publish` | 检查本地文件、构建产物和潜在密钥泄露 |

## 项目结构

```text
.github/      Issue、PR 和 CI 配置
docs/
  adr/        架构决策记录
  specs/      产品与技术规格
  roadmap.md  近期路线
src/          React renderer 界面
src-main/     Electron 主进程、存储与运行时适配层
tasks/        实现计划与任务列表
tests/        单元测试和集成测试
```

## 架构原则

- renderer 不直接绑定上游 CLI 命令语法
- 所有执行能力都通过 runtime adapter 隔离
- Kimi 使用 SDK 优先、受控 CLI 回退的策略
- 提供方使用 profile 建模，不把产品退化成单一 API Key 输入框
- 兼容提供方不承诺完整的 Kimi 原生能力
- 优先交付小而完整的垂直切片，避免一次性大改

## 路线方向

- 完善 Kimi 配置桥接与登录引导
- 扩展运行时事件和审批选项覆盖
- 为兼容提供方接入真实执行路径
- 增加高级模式、MCP 和插件管理界面
- 加入正式的 `zh-CN / en` 语言切换

## 关键文档

- [MVP 规格](docs/specs/kimi-gui-mvp.md)
- [产品方向 ADR](docs/adr/0001-product-direction.md)
- [运行时集成 ADR](docs/adr/0002-runtime-integration.md)
- [桌面壳层 ADR](docs/adr/0003-desktop-shell.md)
- [提供方配置 ADR](docs/adr/0004-provider-profiles.md)
- [路线图](docs/roadmap.md)
- [发布检查清单](docs/release-checklist.md)
- [v0.1.0 发布说明](docs/releases/v0.1.0.md)

## 参与贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。欢迎提交 Bug、中文文案改进、新手体验建议和运行时适配相关 PR。

## 许可证

[MIT](LICENSE)

## 参考项目

- [Claude Code](https://github.com/anthropics/claude-code)
- [Kimi Code](https://github.com/MoonshotAI/kimi-code)
- [Kimi Agent SDK](https://github.com/MoonshotAI/kimi-agent-sdk)
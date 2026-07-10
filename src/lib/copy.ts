import type { AppInfo, ProviderMode, RuntimeStatus } from "../shared/contracts";

export const runtimeStatusLabels: Record<RuntimeStatus, string> = {
  idle: "空闲",
  validating: "正在检查配置",
  ready: "已就绪",
  streaming: "响应生成中",
  awaiting_approval: "等待审批",
  completed: "已完成",
  failed: "失败"
};

export const messageRoleLabels = {
  user: "用户",
  assistant: "Kimi",
  system: "系统"
} as const;

export const providerModeLabels: Record<ProviderMode, string> = {
  "kimi-native": "Kimi 原生模式",
  compatible: "兼容模式"
};

export const integrationModeLabels: Record<AppInfo["integrationMode"], string> = {
  "sdk-first": "SDK 优先"
};

export const desktopShellLabels: Record<AppInfo["desktopShell"], string> = {
  electron: "Electron 桌面端"
};

export const runtimeCopy = {
  requestFailedTitle: "运行请求失败",
  approvalRequiredTitle: "需要审批",
  approvalRequiredDetail: (description?: string | null) =>
    description
      ? `Kimi 已暂停，需要你确认：${description}`
      : "Kimi 已暂停，需要你的确认后才能继续。",
  approvalRequiredLog: (description?: string | null) =>
    description ? `需要审批：${description}` : "运行时需要审批后才能继续。",
  approvalDefaultDescription: "运行时需要你的确认后才能继续。",
  emptyResponse: "Kimi 返回了空文本回复，请重试或检查模型配置。",
  requestCompletedTitle: "运行完成",
  requestCompletedDetail: "已收到当前运行时适配器返回的回复。",
  sessionReadyTitle: "会话已就绪",
  sessionReadyDetail: "准备好后就可以发送第一条 Prompt。",
  sessionCreatedMessage: "会话已创建，可以开始向 Kimi 提问。",
  requestInProgressTitle: "正在处理请求",
  requestInProgressDetail: "Kimi 正在生成回复。",
  approvalSentTitle: "审批结果已发送",
  approvalApprovedDetail: "已批准这项操作，Kimi 会继续运行。",
  approvalRejectedDetail: "已拒绝这项操作，正在等待 Kimi 返回后续结果。",
  placeholderResponse: (providerLabel: string) =>
    `这是 ${providerLabel} 的演示回复。当前已完成运行时适配层，后续会接入真实执行能力。`,
  browserSessionCreated: "这是本地会话预览。桌面运行时会提供完整的 Kimi 执行能力。",
  browserPlaceholderResponse:
    "这是浏览器预览模式的演示回复。请启动桌面端以使用真实的 Kimi 运行时。",
  browserRuntimeCompleted: "浏览器预览模式已完成这次本地演示回复。",
  stepStarted: (stepNumber?: number | null) =>
    stepNumber ? `开始执行第 ${stepNumber} 步。` : "开始执行新的运行步骤。",
  toolRunning: (toolName?: string | null) =>
    toolName ? `正在运行工具：${toolName}。` : "正在运行工具。",
  compactionStarted: "正在压缩上下文，以便会话继续运行。",
  compactionFinished: "上下文压缩已完成。",
  sessionNotFound: "没有找到对应的会话。",
  pendingApprovalNotFound: "当前会话没有待处理的审批请求。"
} as const;

export const appCopy = {
  currentLocale: "zh-CN",
  hero: {
    eyebrow: "Kimi 工作台",
    highlightsLabel: "产品亮点",
    beginnerBadge: "新手优先",
    nativeBadge: "Kimi 原生",
    localBadge: "本地桌面端",
    title: "先用上 Kimi Code，再慢慢学命令行",
    lede:
      "这是一个面向中文新手的本地桌面工作台，帮你更直观地完成 Kimi 配置、发起会话，并在出错时看懂发生了什么。",
    startSetup: "开始配置",
    refreshSetup: "刷新配置",
    currentState: "当前状态",
    previewLabel: "预览摘要",
    workflowDirectionLabel: "产品方向",
    workflowDirectionTitle: "先解决上手门槛，再逐步补深度能力",
    workflowDirectionBody:
      "首个版本优先帮助新用户完成配置、启动第一轮会话，并理解应用正在做什么。",
    defaultShell: "桌面壳层",
    runtimeMode: "运行模式",
    focus: "当前重点",
    focusValue: "首次配置",
    provider: "当前提供方",
    kimiCli: "Kimi CLI",
    kimiCliReady: "可用",
    kimiCliLoginRequired: "已安装，需登录",
    kimiCliMissing: "未找到"
  },
  overview: {
    whatAppDoesTitle: "这个应用能做什么",
    whatAppDoesBody:
      "它帮助新手完成配置、创建会话，并在不先学习 `kimi-cli` 语法的前提下看懂错误和运行状态。",
    featureList: ["首次配置引导", "Kimi 原生工作流方向", "面向新手的诊断信息"],
    runtimeStatesTitle: "运行状态",
    runtimeStatesBody: "会话和配置状态都先用类型化契约建模，再逐步接入完整运行时流程。",
    appStatusTitle: "应用状态",
    appConnected: (productName: string, desktopShell: string) =>
      `已连接到 ${productName}，当前运行在 ${desktopShell} 桌面壳层中。`,
    appWaiting: "正在等待主进程桥接...",
    version: "版本",
    mode: "模式",
    currentState: "当前状态"
  },
  showcase: {
    struggleEyebrow: "为什么新手容易卡住",
    struggleTitle: "很多人还没用上 Kimi 的价值，先被 CLI 阻力劝退",
    struggleBody:
      "模型选择、Base URL、密钥格式和报错含义，往往在第一次成功会话之前就先把用户拦住了。",
    productEyebrow: "这个产品保留什么",
    productTitle: "保留 Kimi 工作流，而不只是接一个模型接口",
    productBody:
      "目标不是做个普通聊天壳，而是尽量保留 Kimi Code 风格的工作流，以及未来 MCP、插件等扩展空间。",
    shipEyebrow: "首发版本先交付什么",
    shipTitle: "小而真能用的 MVP",
    shipBody:
      "先把首次引导、设置、会话框架和解释型界面做好，让产品从第一天看起来就像个真实工具。"
  },
  setup: {
    eyebrow: "首次配置",
    readyTitle: "你的配置已经准备好了",
    startTitle: "一分钟内接入 Kimi",
    intro:
      "先选提供方。Kimi 模式会尽量保留最完整的工作流；兼容模式可以先用，但部分高级能力会有差异。",
    bulletList: ["不需要手动敲终端命令", "设置仅保存在你的本机", "后续仍可查看高级日志辅助排错"],
    productState: "产品状态",
    setupComplete: "配置完成",
    waitingForConfiguration: "等待首次配置",
    nextMilestone: "下一阶段",
    nextMilestoneValue: "第一轮会话界面",
    providerMode: "提供方模式",
    runtimeReadyTitle: "Kimi 运行环境看起来已经就绪",
    runtimeLoginTitle: "Kimi CLI 已安装，但还需要先登录",
    runtimeMissingTitle: "没有找到 Kimi CLI",
    runtimeReadyDetail: (configuredModel: string | null) =>
      `检测到默认模型：${configuredModel ?? "未设置"}。`,
    runtimeLoginDetail: "请先在本地完成 Kimi 登录，再期待真实的 Kimi 运行结果。",
    runtimeMissingDetail: "请先在本机安装 Kimi CLI，这样真实的 Kimi 适配器才能运行。",
    provider: "提供方",
    apiKey: "API Key",
    apiKeyPlaceholder: (label: string) => `粘贴你的 ${label} API Key`,
    apiKeyHelp: "必填。密钥只会保存在这台机器上的本地应用数据里。",
    defaultModel: "默认模型",
    defaultModelHelp: "如果你还不确定要用哪个模型，先保留默认值即可。",
    baseUrl: "Base URL",
    baseUrlHelp: "只有在你的环境使用了不同接入地址时，才需要修改这里。",
    saving: "保存中...",
    updateSetup: "更新配置",
    saveSetup: "保存配置",
    canEditAnyTime: "这些设置之后可以随时再改。",
    onlyNeedOnce: "完成这一步后，你就能解锁整个工作台。",
    saveSuccess: "配置已保存。你现在可以开始第一轮 Kimi 会话了。"
  },
  sessions: {
    eyebrow: "会话",
    title: "第一轮会话流程",
    creating: "创建中...",
    newSession: "新建会话",
    emptyTitle: "还没有会话。",
    emptyBody: "先创建一个，预览接下来 Kimi 对话的完整流程。",
    conversationEyebrow: "对话区",
    createFirstSession: "先创建你的第一轮会话",
    notStarted: "尚未开始",
    quickStartsTitle: "快捷开始",
    quickStartsBody: "不用自己写 Prompt，直接运行一个常见编码任务。",
    templatesCount: (count: number) => `${count} 个模板`,
    runTemplate: "运行",
    runtimeActivity: "运行活动",
    diagnostics: "诊断信息",
    diagnosticsBody: "打开结构化报告，用于提 Issue 或进行高级排错。",
    hideReport: "隐藏报告",
    showReport: "显示报告",
    copyReport: "复制报告",
    diagnosticsCopied: "诊断报告已复制。",
    diagnosticsCopyFailed: "复制失败，你仍然可以手动选中并复制这份报告。",
    diagnosticsReportLabel: "诊断报告",
    approvalRequired: "需要审批",
    approvalAction: "操作",
    reject: "拒绝",
    approve: "批准",
    sending: "发送中...",
    messageCount: (count: number) => `${count} 条消息`,
    eventCount: (count: number) => `${count} 个事件`,
    emptyConversationTitle: "会话区域已准备好。",
    emptyConversationBody: "创建会话后，你就能看到消息布局和 Prompt 流程。",
    copySuccessAria: "诊断复制状态",
    guidedActionsLabel: "引导动作",
    approvalLabel: "审批请求",
    runtimeLogLabel: "运行活动",
    diagnosticsLabel: "诊断信息"
  },
  prompt: {
    placeholder: "让 Kimi 帮你处理一个编码任务……",
    chars: (count: number) => `${count} 个字符`,
    sendPrompt: "发送 Prompt",
    sendingPrompt: "发送中...",
    kimiReady:
      "Kimi 运行路径已启用。如果请求失败，会话区域会展示对应的运行时提示。",
    kimiLoginRequired: "已选择 Kimi 提供方，但本地还没有完成登录。",
    kimiCliMissing: "已选择 Kimi 提供方，但本机还没有安装 Kimi CLI。",
    compatiblePlaceholder: "兼容提供方当前仍走占位路径。",
    createSessionFirst: "请先创建会话，再解锁输入框。"
  },
  runtime: {
    requestInProgressTitle: "运行中的请求",
    requestInProgressDetail: "正在等待当前运行时适配器返回结果。",
    generatingResponse: "正在生成回复……",
    approvalSentTitle: "审批已发送",
    approvalApprovedDetail: "已将批准结果发送给 Kimi，会话会继续运行。",
    approvalRejectedDetail: "已将拒绝结果发送给 Kimi，等待运行时返回后续结果。"
  }
} as const;

export function getRuntimeStatusLabel(status: RuntimeStatus) {
  return runtimeStatusLabels[status];
}

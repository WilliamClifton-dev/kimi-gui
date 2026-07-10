import type { ActionTemplate, ProviderMode } from "../shared/contracts";

const KIMI_NATIVE_NOTE =
  "请用中文回答，保持内容实用、结构清晰，并尽量贴合 Kimi 编码工作流。";

const COMPATIBLE_NOTE =
  "请用中文回答，保持内容实用、结构清晰，并适合这款桌面工作台里的中文新手。";

function withProviderNote(basePrompt: string, providerMode: ProviderMode) {
  return `${basePrompt}\n\n${providerMode === "kimi-native" ? KIMI_NATIVE_NOTE : COMPATIBLE_NOTE}`;
}

export function getActionTemplates(providerMode: ProviderMode): ActionTemplate[] {
  return [
    {
      id: "explain-codebase",
      title: "解释这个项目",
      description: "用中文为新手梳理当前项目的结构、目标和入口文件。",
      prompt: withProviderNote(
        "请用中文为新手解释这个项目。覆盖应用的作用、关键目录，以及我第一次应该从哪里开始改代码。",
        providerMode
      )
    },
    {
      id: "find-change-point",
      title: "定位修改入口",
      description: "让 Kimi 帮你找到某个功能应该改哪些文件、函数和数据流。",
      prompt: withProviderNote(
        "请帮我找到这个项目里最适合改动的位置。指出我应该先查看的核心文件、函数和数据流。",
        providerMode
      )
    },
    {
      id: "debug-problem",
      title: "排查问题",
      description: "把模糊的 Bug 描述转成明确的排查步骤和可能根因。",
      prompt: withProviderNote(
        "我需要排查这个项目里的一个问题。请给我中文分步骤排查计划、最可能的根因，以及应该先收集哪些证据。",
        providerMode
      )
    },
    {
      id: "review-risk",
      title: "审查最近改动",
      description: "聚焦检查 Bug、行为回归和缺失测试。",
      prompt: withProviderNote(
        "请审查这个项目里相关的最近实现。重点关注 Bug、行为回归、脆弱假设和缺失测试。",
        providerMode
      )
    },
    {
      id: "plan-next-steps",
      title: "规划下一步",
      description: "让 Kimi 把当前工作拆成适合新手推进的小步骤。",
      prompt: withProviderNote(
        "请基于这个项目的当前状态，按顺序给出接下来适合新手推进的小实现步骤。要求中文、实用、易执行。",
        providerMode
      )
    }
  ];
}

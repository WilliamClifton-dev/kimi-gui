import type { ActionTemplate, ProviderMode } from "../shared/contracts";

const KIMI_NATIVE_NOTE =
  "Keep the reply practical, structured, and optimized for a Kimi coding workflow.";

const COMPATIBLE_NOTE =
  "Keep the reply practical, structured, and friendly for a beginner using this desktop workspace.";

function withProviderNote(basePrompt: string, providerMode: ProviderMode) {
  return `${basePrompt}\n\n${providerMode === "kimi-native" ? KIMI_NATIVE_NOTE : COMPATIBLE_NOTE}`;
}

export function getActionTemplates(providerMode: ProviderMode): ActionTemplate[] {
  return [
    {
      id: "explain-codebase",
      title: "Explain this codebase",
      description: "Get a beginner-readable walkthrough of the current project structure and purpose.",
      prompt: withProviderNote(
        "Explain this codebase for a beginner. Cover what the app does, the key folders, and where I should start editing first.",
        providerMode
      )
    },
    {
      id: "find-change-point",
      title: "Find where to change",
      description: "Ask Kimi to locate the exact files and functions for the feature you want to modify.",
      prompt: withProviderNote(
        "Help me find the best place to make a change in this project. Identify the main files, functions, and data flow I should inspect first.",
        providerMode
      )
    },
    {
      id: "debug-problem",
      title: "Debug a problem",
      description: "Turn a vague bug report into a concrete debugging plan with likely root causes.",
      prompt: withProviderNote(
        "I need help debugging a problem in this project. Give me a step-by-step debugging plan, the most likely root causes, and what evidence to collect first.",
        providerMode
      )
    },
    {
      id: "review-risk",
      title: "Review recent change",
      description: "Get a focused code review looking for bugs, regressions, and missing tests.",
      prompt: withProviderNote(
        "Review the relevant recent implementation in this project. Focus on bugs, behavior regressions, weak assumptions, and missing tests.",
        providerMode
      )
    },
    {
      id: "plan-next-steps",
      title: "Plan next steps",
      description: "Ask Kimi to break the current work into a small, beginner-friendly implementation sequence.",
      prompt: withProviderNote(
        "Based on the current state of this project, propose the next small implementation steps in order. Keep the plan beginner-friendly and practical.",
        providerMode
      )
    }
  ];
}

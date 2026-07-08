import { describe, expect, it } from "vitest";
import {
  placeholderRuntimeAdapter,
  runtimeAdapter
} from "../../src-main/integration/runtime-adapter";
import type { SessionDetail, SettingsRecord } from "../../src/shared/contracts";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz"].join("");

function makeSession(): SessionDetail {
  return {
    id: "session-1",
    title: "New session 1",
    status: "idle",
    updatedAt: "2026-07-09T00:00:00.000Z",
    providerLabel: "Kimi",
    model: "kimi-k2-0711-preview",
    runtimeLogs: [],
    messages: [
      {
        id: "system-1",
        role: "system",
        content: "Session created.",
        createdAt: "2026-07-09T00:00:00.000Z"
      }
    ]
  };
}

function makeSettings(overrides: Partial<SettingsRecord> = {}): SettingsRecord {
  return {
    providerType: "kimi",
    apiKey: kimiFixtureKey,
    defaultModel: "kimi-k2-0711-preview",
    baseUrl: "https://api.moonshot.cn/v1",
    providerMode: "kimi-native",
    hasCompletedOnboarding: true,
    ...overrides
  };
}

describe("placeholderRuntimeAdapter", () => {
  it("appends user and assistant messages", async () => {
    const result = await placeholderRuntimeAdapter.executePrompt({
      providerType: "kimi",
      session: makeSession(),
      prompt: "Help me review this file",
      workDir: "D:/Projects/kimicode-gui",
      settings: makeSettings()
    });

    expect(result.messages).toHaveLength(3);
    expect(result.messages[1]?.role).toBe("user");
    expect(result.messages[2]?.role).toBe("assistant");
    expect(result.status).toBe("completed");
    expect(result.runtimeLogs).toEqual([]);
  });

  it("changes assistant wording for compatible providers", async () => {
    const result = await placeholderRuntimeAdapter.executePrompt({
      providerType: "deepseek",
      session: makeSession(),
      prompt: "Summarize the architecture",
      workDir: "D:/Projects/kimicode-gui",
      settings: makeSettings({
        providerType: "deepseek",
        providerMode: "compatible",
        defaultModel: "deepseek-chat",
        baseUrl: "https://api.deepseek.com"
      })
    });

    expect(result.messages[2]?.content).toContain("deepseek compatible runtime");
  });

  it("keeps non-kimi providers on the placeholder path", async () => {
    const result = await runtimeAdapter.executePrompt({
      providerType: "openai",
      session: makeSession(),
      prompt: "Explain the state model",
      workDir: "D:/Projects/kimicode-gui",
      settings: makeSettings({
        providerType: "openai",
        providerMode: "compatible",
        defaultModel: "gpt-4.1",
        baseUrl: "https://api.openai.com/v1"
      })
    });

    expect(result.messages[2]?.content).toContain("openai compatible runtime");
  });
});

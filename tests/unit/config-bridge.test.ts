import { describe, expect, it } from "vitest";
import { buildRuntimeBridgeConfig } from "../../src-main/integration/config-bridge";
import type { SettingsRecord } from "../../src/shared/contracts";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz"].join("");

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

describe("buildRuntimeBridgeConfig", () => {
  it("maps Kimi settings into runtime env overrides", () => {
    expect(buildRuntimeBridgeConfig(makeSettings())).toEqual({
      env: {
        KIMI_API_KEY: kimiFixtureKey,
        KIMI_BASE_URL: "https://api.moonshot.cn/v1"
      },
      model: "kimi-k2-0711-preview"
    });
  });

  it("does not invent env overrides for compatible providers", () => {
    expect(
      buildRuntimeBridgeConfig(
        makeSettings({
          providerType: "deepseek",
          providerMode: "compatible",
          baseUrl: "https://api.deepseek.com",
          defaultModel: "deepseek-chat"
        })
      )
    ).toEqual({
      env: {},
      model: "deepseek-chat"
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  applyProviderDefaults,
  getProviderProfile,
  sanitizeSettingsDraft,
  validateSettingsDraft
} from "../../src/lib/settings";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz"].join("");

describe("sanitizeSettingsDraft", () => {
  it("trims all string fields", () => {
    expect(
      sanitizeSettingsDraft({
        providerType: "kimi",
        apiKey: `  ${kimiFixtureKey}  `,
        defaultModel: "  kimi-k2-0711-preview  ",
        baseUrl: "  https://api.moonshot.cn/v1  "
      })
    ).toEqual({
      providerType: "kimi",
      apiKey: kimiFixtureKey,
      defaultModel: "kimi-k2-0711-preview",
      baseUrl: "https://api.moonshot.cn/v1"
    });
  });
});

describe("validateSettingsDraft", () => {
  it("rejects incomplete beginner setup with Chinese field errors", () => {
    expect(
      validateSettingsDraft({
        providerType: "kimi",
        apiKey: "",
        defaultModel: "",
        baseUrl: "not-a-url"
      })
    ).toEqual({
      isValid: false,
      fieldErrors: {
        apiKey: "API Key 不能为空。",
        defaultModel: "请选择默认模型。",
        baseUrl: "Base URL 必须是有效的 URL。"
      }
    });
  });

  it("accepts a complete setup draft", () => {
    expect(
      validateSettingsDraft({
        providerType: "kimi",
        apiKey: kimiFixtureKey,
        defaultModel: "kimi-k2-0711-preview",
        baseUrl: "https://api.moonshot.cn/v1"
      })
    ).toEqual({
      isValid: true,
      fieldErrors: {}
    });
  });
});

describe("provider profiles", () => {
  it("applies DeepSeek defaults when switching provider", () => {
    expect(
      applyProviderDefaults("deepseek", {
        providerType: "kimi",
        apiKey: "",
        defaultModel: "",
        baseUrl: ""
      })
    ).toEqual({
      providerType: "deepseek",
      apiKey: "",
      defaultModel: "deepseek-chat",
      baseUrl: "https://api.deepseek.com"
    });
  });

  it("marks Kimi as native mode and OpenAI as compatible mode", () => {
    expect(getProviderProfile("kimi").providerMode).toBe("kimi-native");
    expect(getProviderProfile("openai").providerMode).toBe("compatible");
  });

  it("exposes Chinese help text for provider guidance", () => {
    expect(getProviderProfile("kimi").helpText).toContain("Kimi 原生工作流");
    expect(getProviderProfile("openai").helpText).toContain("兼容模式");
  });
});

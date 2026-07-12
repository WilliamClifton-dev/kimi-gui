import type {
  ProviderMode,
  ProviderType,
  SettingsDraft,
  SettingsRecord,
  SettingsValidation
} from "../shared/contracts.js";
import { validateApiKey } from "./validate-api-key.js";

export type ProviderProfile = {
  type: ProviderType;
  label: string;
  baseUrl: string;
  defaultModel: string;
  providerMode: ProviderMode;
  helpText: string;
};

export const PROVIDER_PROFILES: ProviderProfile[] = [
  {
    type: "kimi",
    label: "Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "kimi-k2-0711-preview",
    providerMode: "kimi-native",
    helpText: "最适合保留完整的 Kimi 原生工作流，以及未来的高级能力。"
  },
  {
    type: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1",
    providerMode: "compatible",
    helpText: "面向 OpenAI API 的兼容模式。部分 Kimi 特有能力会有所差异。"
  },
  {
    type: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    providerMode: "compatible",
    helpText: "面向 DeepSeek OpenAI 风格接口的兼容模式。"
  },
  {
    type: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    providerMode: "compatible",
    helpText: "面向 Anthropic 接口的兼容模式。"
  },
  {
    type: "gemini",
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-2.5-pro",
    providerMode: "compatible",
    helpText: "面向 Gemini 接口实验的兼容模式。"
  }
];

export function getProviderProfile(providerType: ProviderType) {
  return PROVIDER_PROFILES.find((item) => item.type === providerType) ?? PROVIDER_PROFILES[0];
}

export const DEFAULT_SETTINGS: SettingsRecord = {
  providerType: "kimi",
  apiKey: "",
  defaultModel: "kimi-k2-0711-preview",
  baseUrl: "https://api.moonshot.cn/v1",
  providerMode: "kimi-native",
  hasCompletedOnboarding: false
};

export function sanitizeSettingsDraft(draft: SettingsDraft): SettingsDraft {
  return {
    providerType: draft.providerType,
    apiKey: draft.apiKey.trim(),
    defaultModel: draft.defaultModel.trim(),
    baseUrl: draft.baseUrl.trim()
  };
}

export function applyProviderDefaults(providerType: ProviderType, draft: SettingsDraft): SettingsDraft {
  const profile = getProviderProfile(providerType);

  return {
    ...draft,
    providerType,
    defaultModel: profile.defaultModel,
    baseUrl: profile.baseUrl
  };
}

export function validateSettingsDraft(draft: SettingsDraft): SettingsValidation {
  const sanitized = sanitizeSettingsDraft(draft);
  const fieldErrors: SettingsValidation["fieldErrors"] = {};

  const apiKeyCheck = validateApiKey(sanitized.apiKey);
  if (apiKeyCheck.status === "invalid") {
    fieldErrors.apiKey = apiKeyCheck.reason;
  }

  if (!sanitized.defaultModel) {
    fieldErrors.defaultModel = "请选择默认模型。";
  }

  if (!sanitized.baseUrl) {
    fieldErrors.baseUrl = "Base URL 不能为空。";
  } else {
    try {
      const parsed = new URL(sanitized.baseUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        fieldErrors.baseUrl = "Base URL 必须以 http:// 或 https:// 开头。";
      }
    } catch {
      fieldErrors.baseUrl = "Base URL 必须是有效的 URL。";
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors
  };
}

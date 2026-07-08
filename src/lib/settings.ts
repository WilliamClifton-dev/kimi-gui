import type {
  ProviderMode,
  ProviderType,
  SettingsDraft,
  SettingsRecord,
  SettingsValidation
} from "../shared/contracts";
import { validateApiKey } from "./validate-api-key";

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
    helpText: "Best fit for the full Kimi-native workflow and future advanced capabilities."
  },
  {
    type: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1",
    providerMode: "compatible",
    helpText: "Compatible mode for OpenAI APIs. Some Kimi-specific features may differ."
  },
  {
    type: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    providerMode: "compatible",
    helpText: "Compatible mode for DeepSeek's OpenAI-style API surface."
  },
  {
    type: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    providerMode: "compatible",
    helpText: "Compatible mode for Anthropic-backed usage."
  },
  {
    type: "gemini",
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-2.5-pro",
    providerMode: "compatible",
    helpText: "Compatible mode for Gemini-backed experiments."
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
    fieldErrors.defaultModel = "Choose a default model.";
  }

  if (!sanitized.baseUrl) {
    fieldErrors.baseUrl = "Base URL is required.";
  } else {
    try {
      const parsed = new URL(sanitized.baseUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        fieldErrors.baseUrl = "Base URL must start with http:// or https://.";
      }
    } catch {
      fieldErrors.baseUrl = "Base URL must be a valid URL.";
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors
  };
}

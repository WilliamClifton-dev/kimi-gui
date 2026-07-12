import type { SettingsRecord } from "../../src/shared/contracts.js";

export type RuntimeBridgeConfig = {
  env: Record<string, string>;
  model: string;
};

export function buildRuntimeBridgeConfig(settings: SettingsRecord): RuntimeBridgeConfig {
  const env: Record<string, string> = {};

  if (settings.providerType === "kimi") {
    if (settings.apiKey) {
      env.KIMI_API_KEY = settings.apiKey;
    }

    if (settings.baseUrl) {
      env.KIMI_BASE_URL = settings.baseUrl;
    }
  }

  return {
    env,
    model: settings.defaultModel
  };
}

import type { CredentialCheck } from "../shared/contracts";

export function validateApiKey(input: string): CredentialCheck {
  const value = input.trim();

  if (!value) {
    return { status: "invalid", reason: "API Key 不能为空。" };
  }

  if (value.length < 20) {
    return {
      status: "invalid",
      reason: "API Key 看起来不完整。"
    };
  }

  return { status: "valid" };
}

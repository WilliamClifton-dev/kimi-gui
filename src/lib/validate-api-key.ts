import type { CredentialCheck } from "../shared/contracts";

export function validateApiKey(input: string): CredentialCheck {
  const value = input.trim();

  if (!value) {
    return { status: "invalid", reason: "API key is required." };
  }

  if (value.length < 20) {
    return {
      status: "invalid",
      reason: "API key format looks incomplete."
    };
  }

  return { status: "valid" };
}

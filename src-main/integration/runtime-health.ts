import { isLoggedIn, parseConfig } from "@moonshot-ai/kimi-agent-sdk";
import { spawnSync } from "node:child_process";

export type RuntimeHealth = {
  cliAvailable: boolean;
  loggedIn: boolean;
  configuredModel: string | null;
};

function isKimiCliAvailable() {
  const result = spawnSync("kimi", ["--version"], {
    encoding: "utf8",
    stdio: "pipe"
  });

  return result.status === 0;
}

export function getRuntimeHealth(): RuntimeHealth {
  const cliAvailable = isKimiCliAvailable();

  if (!cliAvailable) {
    return {
      cliAvailable: false,
      loggedIn: false,
      configuredModel: null
    };
  }

  try {
    const config = parseConfig();

    return {
      cliAvailable,
      loggedIn: isLoggedIn(),
      configuredModel: config.defaultModel
    };
  } catch {
    return {
      cliAvailable,
      loggedIn: false,
      configuredModel: null
    };
  }
}

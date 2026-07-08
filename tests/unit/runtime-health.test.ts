import { describe, expect, it } from "vitest";
import type { RuntimeHealth } from "../../src-main/integration/runtime-health";

describe("runtime health contract", () => {
  it("supports a ready Kimi runtime shape", () => {
    const health: RuntimeHealth = {
      cliAvailable: true,
      loggedIn: true,
      configuredModel: "kimi-k2-0711-preview"
    };

    expect(health.cliAvailable).toBe(true);
    expect(health.loggedIn).toBe(true);
    expect(health.configuredModel).toBe("kimi-k2-0711-preview");
  });

  it("supports a missing CLI shape", () => {
    const health: RuntimeHealth = {
      cliAvailable: false,
      loggedIn: false,
      configuredModel: null
    };

    expect(health.configuredModel).toBeNull();
  });
});

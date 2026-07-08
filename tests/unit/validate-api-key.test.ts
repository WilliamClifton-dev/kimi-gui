import { describe, expect, it } from "vitest";
import { validateApiKey } from "../../src/lib/validate-api-key";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz"].join("");

describe("validateApiKey", () => {
  it("rejects an empty value", () => {
    expect(validateApiKey("")).toEqual({
      status: "invalid",
      reason: "API key is required."
    });
  });

  it("rejects an obviously incomplete value", () => {
    expect(validateApiKey("short-key")).toEqual({
      status: "invalid",
      reason: "API key format looks incomplete."
    });
  });

  it("accepts a non-empty long token", () => {
    expect(validateApiKey(kimiFixtureKey)).toEqual({
      status: "valid"
    });
  });
});

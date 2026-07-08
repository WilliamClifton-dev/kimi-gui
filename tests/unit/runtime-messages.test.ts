import { describe, expect, it } from "vitest";
import { mapKimiRuntimeError } from "../../src-main/integration/runtime-messages";

describe("mapKimiRuntimeError", () => {
  it("maps CLI_NOT_FOUND to an install hint", () => {
    expect(mapKimiRuntimeError("CLI_NOT_FOUND")).toEqual({
      title: "Kimi CLI was not found",
      detail: "Install Kimi CLI locally and make sure the `kimi` command is available in your PATH."
    });
  });

  it("falls back to a generic runtime message", () => {
    expect(mapKimiRuntimeError("UNKNOWN")).toEqual({
      title: "Kimi runtime request failed",
      detail: "Make sure local Kimi CLI is installed and logged in before using the real adapter path."
    });
  });
});

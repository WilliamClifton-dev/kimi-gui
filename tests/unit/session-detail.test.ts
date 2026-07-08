import { describe, expect, it } from "vitest";
import type { SessionDetail } from "../../src/shared/contracts";

describe("session detail contract", () => {
  it("captures provider label and model metadata", () => {
    const session: SessionDetail = {
      id: "session-1",
      title: "Debug startup issue",
      status: "completed",
      updatedAt: "2026-07-09T00:00:00.000Z",
      providerLabel: "Kimi",
      model: "kimi-k2-0711-preview",
      messages: []
    };

    expect(session.providerLabel).toBe("Kimi");
    expect(session.model).toBe("kimi-k2-0711-preview");
  });
});

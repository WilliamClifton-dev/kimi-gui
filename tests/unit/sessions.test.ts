import { describe, expect, it } from "vitest";
import { formatSessionTitle, sortSessionsByUpdatedAt } from "../../src/lib/sessions";

describe("formatSessionTitle", () => {
  it("keeps the fallback title when there is no user message", () => {
    expect(
      formatSessionTitle(
        [
          {
            id: "system-1",
            role: "system",
            content: "hello",
            createdAt: "2026-07-08T00:00:00.000Z"
          }
        ],
        "New session"
      )
    ).toBe("New session");
  });

  it("uses the first user message as the title seed", () => {
    expect(
      formatSessionTitle(
        [
          {
            id: "user-1",
            role: "user",
            content: "Summarize this repository structure for me",
            createdAt: "2026-07-08T00:00:00.000Z"
          }
        ],
        "New session"
      )
    ).toBe("Summarize this repository structure for me");
  });
});

describe("sortSessionsByUpdatedAt", () => {
  it("sorts newest sessions first", () => {
    expect(
      sortSessionsByUpdatedAt([
        {
          id: "a",
          title: "Older",
          status: "idle",
          updatedAt: "2026-07-08T10:00:00.000Z"
        },
        {
          id: "b",
          title: "Newer",
          status: "completed",
          updatedAt: "2026-07-08T12:00:00.000Z"
        }
      ]).map((item) => item.id)
    ).toEqual(["b", "a"]);
  });
});

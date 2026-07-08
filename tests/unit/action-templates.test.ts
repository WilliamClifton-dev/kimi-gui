import { describe, expect, it } from "vitest";
import { getActionTemplates } from "../../src/lib/action-templates";

describe("getActionTemplates", () => {
  it("returns five beginner-friendly actions for kimi-native mode", () => {
    const templates = getActionTemplates("kimi-native");

    expect(templates).toHaveLength(5);
    expect(templates.map((template) => template.id)).toEqual([
      "explain-codebase",
      "find-change-point",
      "debug-problem",
      "review-risk",
      "plan-next-steps"
    ]);
    expect(templates.every((template) => template.prompt.trim().length > 0)).toBe(true);
  });

  it("adapts prompt guidance for compatible providers", () => {
    const templates = getActionTemplates("compatible");

    expect(templates[0]?.prompt).toContain("friendly for a beginner");
  });
});

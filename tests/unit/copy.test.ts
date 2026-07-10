import { describe, expect, it } from "vitest";
import { getRuntimeStatusLabel, integrationModeLabels, providerModeLabels } from "../../src/lib/copy";

describe("getRuntimeStatusLabel", () => {
  it("returns Chinese labels for runtime statuses", () => {
    expect(getRuntimeStatusLabel("idle")).toBe("空闲");
    expect(getRuntimeStatusLabel("validating")).toBe("正在检查配置");
    expect(getRuntimeStatusLabel("ready")).toBe("已就绪");
    expect(getRuntimeStatusLabel("streaming")).toBe("响应生成中");
    expect(getRuntimeStatusLabel("awaiting_approval")).toBe("等待审批");
    expect(getRuntimeStatusLabel("completed")).toBe("已完成");
    expect(getRuntimeStatusLabel("failed")).toBe("失败");
  });

  it("returns beginner-friendly Chinese labels for internal modes", () => {
    expect(providerModeLabels["kimi-native"]).toBe("Kimi 原生模式");
    expect(providerModeLabels.compatible).toBe("兼容模式");
    expect(integrationModeLabels["sdk-first"]).toBe("SDK 优先");
  });
});

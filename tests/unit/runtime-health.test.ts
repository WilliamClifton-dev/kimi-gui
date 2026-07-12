import { describe, expect, it, vi } from "vitest";
import { inspectKimiEnvironment } from "../../src-main/integration/runtime-health";

describe("inspectKimiEnvironment", () => {
  it("reports a ready runtime without exposing credentials", () => {
    const report = inspectKimiEnvironment({
      runVersionCheck: () => ({ status: 0, stdout: "kimi, version 1.25.0\n" }),
      readLoginState: () => true,
      readConfiguredModel: () => "kimi-k2.5"
    });

    expect(report).toEqual({
      status: "ready",
      cliAvailable: true,
      cliVersion: "1.25.0",
      loggedIn: true,
      configuredModel: "kimi-k2.5",
      summary: "Kimi Code 已准备好",
      nextAction: "选择一个项目，然后启动 Kimi Web。"
    });
    expect(JSON.stringify(report)).not.toContain("api_key");
  });

  it("explains how to recover when Kimi is missing", () => {
    const readLoginState = vi.fn();
    const report = inspectKimiEnvironment({
      runVersionCheck: () => ({ status: 1, stdout: "" }),
      readLoginState,
      readConfiguredModel: vi.fn()
    });

    expect(report.status).toBe("missing");
    expect(report.summary).toBe("尚未检测到 Kimi Code");
    expect(report.nextAction).toContain("安装");
    expect(readLoginState).not.toHaveBeenCalled();
  });

  it("reports setup required when login or config parsing fails", () => {
    const report = inspectKimiEnvironment({
      runVersionCheck: () => ({ status: 0, stdout: "kimi version 1.25.0" }),
      readLoginState: () => {
        throw new Error("bad config");
      },
      readConfiguredModel: vi.fn()
    });

    expect(report.status).toBe("setup_required");
    expect(report.loggedIn).toBe(false);
    expect(report.nextAction).toContain("登录");
  });
});

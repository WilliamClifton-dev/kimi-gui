import { describe, expect, it } from "vitest";
import { buildDiagnosticsReport } from "../../src/lib/diagnostics";
import type { BootstrapData, SessionDetail } from "../../src/shared/contracts";

function makeBootstrap(): BootstrapData {
  return {
    appInfo: {
      productName: "Kimi GUI",
      version: "0.1.0",
      desktopShell: "electron",
      integrationMode: "sdk-first"
    },
    settings: {
      providerType: "kimi",
      providerMode: "kimi-native",
      apiKey: "kimi_example",
      defaultModel: "kimi-k2-0711-preview",
      baseUrl: "https://api.moonshot.cn/v1",
      hasCompletedOnboarding: true
    },
    runtimeStatus: "ready",
    runtimeHealth: {
      cliAvailable: true,
      loggedIn: true,
      configuredModel: "kimi-k2-0711-preview"
    }
  };
}

function makeSession(): SessionDetail {
  return {
    id: "session-1",
    title: "Debug startup issue",
    status: "streaming",
    updatedAt: "2026-07-09T00:00:00.000Z",
    providerLabel: "Kimi",
    model: "kimi-k2-0711-preview",
    runtimeNote: {
      level: "info",
      title: "Runtime request in progress",
      detail: "Kimi is generating a response."
    },
    runtimeLogs: [
      {
        id: "log-1",
        level: "info",
        message: "Starting step 1.",
        createdAt: "2026-07-09T00:00:00.000Z"
      }
    ],
    pendingApproval: null,
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Explain this codebase",
        createdAt: "2026-07-09T00:00:00.000Z"
      }
    ]
  };
}

describe("buildDiagnosticsReport", () => {
  it("includes app, provider, session, and runtime log details", () => {
    const report = buildDiagnosticsReport({
      bootstrap: makeBootstrap(),
      session: makeSession()
    });

    expect(report).toContain('"provider": "kimi"');
    expect(report).toContain('"messageCount": 1');
    expect(report).toContain("Starting step 1.");
  });

  it("handles missing active session", () => {
    const report = buildDiagnosticsReport({
      bootstrap: makeBootstrap(),
      session: null
    });

    expect(report).toContain('"session": null');
    expect(report).toContain('"latestRuntimeLogs": []');
  });
});

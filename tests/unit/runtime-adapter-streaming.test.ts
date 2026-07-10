import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionDetail, SettingsRecord } from "../../src/shared/contracts";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz"].join("");

const closeMock = vi.fn(async () => undefined);
const approveMock = vi.fn(async (requestId: string, response: string) => {
  void requestId;
  void response;
});
let runtimeScenario: "stream" | "approval" = "stream";
let releaseApproval: (() => void) | null = null;

vi.mock("@moonshot-ai/kimi-agent-sdk", () => ({
  createSession: vi.fn(() => ({
    prompt: vi.fn(() => ({
      approve: vi.fn(async (requestId: string, response: string) => {
        await approveMock(requestId, response);
        releaseApproval?.();
      }),
      async *[Symbol.asyncIterator]() {
        if (runtimeScenario === "approval") {
          yield {
            type: "ApprovalRequest",
            payload: {
              id: "approval-1",
              action: "delete_file",
              description: "Delete temporary files"
            }
          };
          await new Promise<void>((resolve) => {
            releaseApproval = resolve;
          });
          yield {
            type: "ContentPart",
            payload: {
              type: "text",
              text: "Approved path"
            }
          };
          return;
        }

        yield {
          type: "StepBegin",
          payload: {
            n: 1
          }
        };
        yield {
          type: "ToolCall",
          payload: {
            function: {
              name: "read_file"
            }
          }
        };
        yield {
          type: "ContentPart",
          payload: {
            type: "text",
            text: "Hello"
          }
        };
        yield {
          type: "ContentPart",
          payload: {
            type: "text",
            text: " world"
          }
        };
      }
    })),
    close: closeMock
  })),
  isAgentSdkError: vi.fn(() => false),
  getErrorCode: vi.fn(() => "UNKNOWN")
}));

function makeSession(): SessionDetail {
  return {
    id: "session-1",
    title: "New session 1",
    status: "idle",
    updatedAt: "2026-07-09T00:00:00.000Z",
    providerLabel: "Kimi",
    model: "kimi-k2-0711-preview",
    runtimeLogs: [],
    pendingApproval: null,
    messages: [
      {
        id: "system-1",
        role: "system",
        content: "Session created.",
        createdAt: "2026-07-09T00:00:00.000Z"
      }
    ]
  };
}

function makeSettings(overrides: Partial<SettingsRecord> = {}): SettingsRecord {
  return {
    providerType: "kimi",
    apiKey: kimiFixtureKey,
    defaultModel: "kimi-k2-0711-preview",
    baseUrl: "https://api.moonshot.cn/v1",
    providerMode: "kimi-native",
    hasCompletedOnboarding: true,
    ...overrides
  };
}

describe("kimiRuntimeAdapter streaming", () => {
  beforeEach(() => {
    runtimeScenario = "stream";
    closeMock.mockClear();
    approveMock.mockClear();
    releaseApproval = null;
  });

  it("emits cumulative assistant text while the turn is streaming", async () => {
    const { kimiRuntimeAdapter } = await import("../../src-main/integration/runtime-adapter");
    const chunks: string[] = [];
    const logs: string[] = [];

    const result = await kimiRuntimeAdapter.executePrompt({
      providerType: "kimi",
      session: makeSession(),
      prompt: "Explain this repository",
      workDir: "D:/Projects/kimicode-gui",
      settings: makeSettings(),
      onAssistantText: (text) => {
        chunks.push(text);
      },
      onRuntimeLog: (entry) => {
        logs.push(entry.message);
      }
    });

    expect(chunks).toEqual(["Hello", "Hello world"]);
    expect(logs).toEqual(["开始执行第 1 步。", "正在运行工具：read_file。"]);
    expect(result.messages.at(-1)?.content).toBe("Hello world");
    expect(result.runtimeLogs?.map((entry) => entry.message)).toEqual(logs);
    expect(result.status).toBe("completed");
    expect(closeMock).toHaveBeenCalledOnce();
  });

  it("waits for approval and resumes after approval is resolved", async () => {
    runtimeScenario = "approval";
    const { kimiRuntimeAdapter, resolvePendingApproval } = await import("../../src-main/integration/runtime-adapter");
    const statuses: string[] = [];
    const approvals: Array<string | null | undefined> = [];

    const resultPromise = kimiRuntimeAdapter.executePrompt({
      providerType: "kimi",
      session: makeSession(),
      prompt: "Clean temporary files",
      workDir: "D:/Projects/kimicode-gui",
      settings: makeSettings(),
      onRuntimeLog: (_entry, meta) => {
        statuses.push(meta?.status ?? "streaming");
        approvals.push(meta?.pendingApproval?.description);
      }
    });

    await Promise.resolve();
    await Promise.resolve();

    await resolvePendingApproval("session-1", "approve");
    const result = await resultPromise;

    expect(approveMock).toHaveBeenCalledWith("approval-1", "approve");
    expect(statuses).toContain("awaiting_approval");
    expect(approvals).toContain("Delete temporary files");
    expect(result.messages.at(-1)?.content).toBe("Approved path");
    expect(result.pendingApproval).toBeNull();
  });
});

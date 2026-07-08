import {
  type ApprovalResponse,
  createSession,
  getErrorCode,
  isAgentSdkError
} from "@moonshot-ai/kimi-agent-sdk";
import { formatSessionTitle } from "../../src/lib/sessions";
import { mapKimiRuntimeError } from "./runtime-messages";
import { buildRuntimeBridgeConfig } from "./config-bridge";
import type {
  ProviderType,
  SessionDetail,
  SessionMessage,
  RuntimeLogEntry,
  PendingApproval,
  SettingsRecord
} from "../../src/shared/contracts";

export type RuntimeExecutionInput = {
  providerType: ProviderType;
  session: SessionDetail;
  prompt: string;
  workDir: string;
  settings: SettingsRecord;
  onAssistantText?: (text: string) => void;
  onRuntimeLog?: (
    log: RuntimeLogEntry,
    meta?: {
      status?: "streaming" | "awaiting_approval";
      runtimeNote?: SessionDetail["runtimeNote"];
      pendingApproval?: PendingApproval | null;
    }
  ) => void;
};

export type RuntimeAdapter = {
  executePrompt: (input: RuntimeExecutionInput) => Promise<SessionDetail>;
};

type ActiveApprovalRequest = {
  approve: (response: ApprovalResponse) => Promise<void>;
};

const activeApprovalRequests = new Map<string, ActiveApprovalRequest>();

function isTextContentEvent(
  event: unknown
): event is { type: "ContentPart"; payload: { type: "text"; text: string } } {
  if (!event || typeof event !== "object") {
    return false;
  }

  const maybeEvent = event as {
    type?: unknown;
    payload?: { type?: unknown; text?: unknown };
  };

  return (
    maybeEvent.type === "ContentPart" &&
    maybeEvent.payload?.type === "text" &&
    typeof maybeEvent.payload.text === "string"
  );
}

function buildPlaceholderAssistantMessage(providerType: ProviderType) {
  const providerLabel = providerType === "kimi" ? "Kimi runtime" : `${providerType} compatible runtime`;

  return `Placeholder response from the ${providerLabel}. The runtime adapter boundary is now in place, and the next milestone swaps this implementation for a real execution path.`;
}

function appendRuntimeLog(logs: RuntimeLogEntry[], level: RuntimeLogEntry["level"], message: string) {
  const entry: RuntimeLogEntry = {
    id: `runtime-log-${Date.now()}-${logs.length + 1}`,
    level,
    message,
    createdAt: new Date().toISOString()
  };
  logs.push(entry);
  return entry;
}

function readEventType(event: unknown) {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as { type?: unknown };
  return typeof maybeEvent.type === "string" ? maybeEvent.type : null;
}

function readStepNumber(event: unknown) {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as { payload?: { n?: unknown } };
  return typeof maybeEvent.payload?.n === "number" ? maybeEvent.payload.n : null;
}

function readToolName(event: unknown) {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as { payload?: { function?: { name?: unknown } } };
  return typeof maybeEvent.payload?.function?.name === "string"
    ? maybeEvent.payload.function.name
    : null;
}

function readApprovalDescription(event: unknown) {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as { payload?: { description?: unknown; action?: unknown } };
  if (typeof maybeEvent.payload?.description === "string" && maybeEvent.payload.description.trim()) {
    return maybeEvent.payload.description;
  }

  return typeof maybeEvent.payload?.action === "string" ? maybeEvent.payload.action : null;
}

function readApprovalRequest(event: unknown): PendingApproval | null {
  if (!event || typeof event !== "object") {
    return null;
  }

  const maybeEvent = event as {
    payload?: {
      id?: unknown;
      description?: unknown;
      action?: unknown;
    };
  };

  if (typeof maybeEvent.payload?.id !== "string") {
    return null;
  }

  return {
    id: maybeEvent.payload.id,
    action: typeof maybeEvent.payload.action === "string" ? maybeEvent.payload.action : "approval",
    description: readApprovalDescription(event) ?? "Approval required before the runtime can continue."
  };
}

export async function resolvePendingApproval(sessionId: string, response: ApprovalResponse) {
  const pending = activeApprovalRequests.get(sessionId);

  if (!pending) {
    throw new Error("No pending approval request was found for this session.");
  }

  await pending.approve(response);
}

export const placeholderRuntimeAdapter: RuntimeAdapter = {
  async executePrompt({ providerType, session, prompt }) {
    const trimmedPrompt = prompt.trim();
    const now = new Date().toISOString();

    const userMessage: SessionMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      createdAt: now
    };

    const assistantMessage: SessionMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: buildPlaceholderAssistantMessage(providerType),
      createdAt: new Date().toISOString()
    };

    const messages = [...session.messages, userMessage, assistantMessage];

    return {
      ...session,
      title: formatSessionTitle(messages, session.title),
      status: "completed",
      updatedAt: new Date().toISOString(),
      messages
    };
  }
};

function appendFailureMessage(session: SessionDetail, prompt: string, reason: string): SessionDetail {
  const now = new Date().toISOString();
  const userMessage: SessionMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: prompt.trim(),
    createdAt: now
  };
  const assistantMessage: SessionMessage = {
    id: `assistant-${Date.now() + 1}`,
    role: "assistant",
    content: reason,
    createdAt: new Date().toISOString()
  };
  const messages = [...session.messages, userMessage, assistantMessage];

  return {
    ...session,
    title: formatSessionTitle(messages, session.title),
    status: "failed",
    updatedAt: new Date().toISOString(),
    runtimeNote: {
      level: "error",
      title: "Runtime request failed",
      detail: reason
    },
    messages
  };
}

export const kimiRuntimeAdapter: RuntimeAdapter = {
  async executePrompt({ session, prompt, workDir, settings, onAssistantText, onRuntimeLog }) {
    const bridgeConfig = buildRuntimeBridgeConfig(settings);
    const sdkSession = createSession({
      workDir,
      sessionId: session.id,
      model: bridgeConfig.model,
      env: bridgeConfig.env
    });

    let assistantText = "";
    const runtimeLogs = [...(session.runtimeLogs ?? [])];
    let pendingApproval: PendingApproval | null = null;

    try {
      const turn = sdkSession.prompt(prompt.trim());

      for await (const event of turn) {
        const eventType = readEventType(event);

        if (isTextContentEvent(event)) {
          assistantText += event.payload.text;
          onAssistantText?.(assistantText);
          continue;
        }

        if (eventType === "StepBegin") {
          const stepNumber = readStepNumber(event);
          const log = appendRuntimeLog(
            runtimeLogs,
            "info",
            stepNumber ? `Starting step ${stepNumber}.` : "Starting a new runtime step."
          );
          onRuntimeLog?.(log, { status: "streaming" });
          continue;
        }

        if (eventType === "ToolCall") {
          const toolName = readToolName(event);
          const log = appendRuntimeLog(
            runtimeLogs,
            "info",
            toolName ? `Running tool: ${toolName}.` : "Running a tool."
          );
          onRuntimeLog?.(log, { status: "streaming" });
          continue;
        }

        if (eventType === "CompactionBegin") {
          const log = appendRuntimeLog(
            runtimeLogs,
            "info",
            "Context compaction started to keep the session moving."
          );
          onRuntimeLog?.(log, { status: "streaming" });
          continue;
        }

        if (eventType === "CompactionEnd") {
          const log = appendRuntimeLog(
            runtimeLogs,
            "info",
            "Context compaction finished."
          );
          onRuntimeLog?.(log, { status: "streaming" });
          continue;
        }

        if (eventType === "ApprovalRequest") {
          pendingApproval = readApprovalRequest(event);
          if (pendingApproval) {
            const approvalRequest = pendingApproval;
            activeApprovalRequests.set(session.id, {
              approve: (response) => turn.approve(approvalRequest.id, response)
            });
          }

          const description = pendingApproval?.description ?? readApprovalDescription(event);
          const log = appendRuntimeLog(
            runtimeLogs,
            "warn",
            description
              ? `Approval required: ${description}`
              : "Approval required before the runtime can continue."
          );
          onRuntimeLog?.(log, {
            status: "awaiting_approval",
            runtimeNote: {
              level: "warn",
              title: "Approval required",
              detail: description
                ? `Kimi paused and needs approval: ${description}`
                : "Kimi paused and needs approval before continuing."
            },
            pendingApproval
          });
          continue;
        }

        if (pendingApproval && eventType !== "ApprovalRequest") {
          pendingApproval = null;
          activeApprovalRequests.delete(session.id);
        }
      }

      activeApprovalRequests.delete(session.id);
      await sdkSession.close();

      const now = new Date().toISOString();
      const userMessage: SessionMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt.trim(),
        createdAt: now
      };
      const assistantMessage: SessionMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: assistantText.trim() || "Kimi returned an empty text response.",
        createdAt: new Date().toISOString()
      };
      const messages = [...session.messages, userMessage, assistantMessage];

      return {
        ...session,
        title: formatSessionTitle(messages, session.title),
        status: "completed",
        updatedAt: new Date().toISOString(),
        runtimeNote: {
          level: "info",
          title: "Runtime request completed",
          detail: "Response received from the active runtime adapter."
        },
        messages,
        runtimeLogs,
        pendingApproval: null
      };
    } catch (error) {
      activeApprovalRequests.delete(session.id);
      await sdkSession.close().catch(() => undefined);

      const code = isAgentSdkError(error) ? getErrorCode(error) : undefined;
      const mapped = mapKimiRuntimeError(code);

      const failedSession = appendFailureMessage(
        session,
        prompt,
        `${mapped.detail}${code ? ` (Code: ${code})` : ""}`
      );

      return {
        ...failedSession,
        runtimeNote: {
          level: "error",
          title: mapped.title,
          detail: `${mapped.detail}${code ? ` (Code: ${code})` : ""}`
        },
        runtimeLogs,
        pendingApproval: null
      };
    }
  }
};

export const runtimeAdapter: RuntimeAdapter = {
  async executePrompt(input) {
    if (input.settings.providerType === "kimi") {
      return kimiRuntimeAdapter.executePrompt(input);
    }

    return placeholderRuntimeAdapter.executePrompt(input);
  }
};

import type {
  BootstrapData,
  DesktopBridge,
  SessionDetail,
  SessionSummary,
  SettingsDraft,
  SettingsRecord
} from "../shared/contracts.js";
import { runtimeCopy } from "./copy.js";
import { DEFAULT_SETTINGS, getProviderProfile, sanitizeSettingsDraft } from "./settings.js";

const fallbackSessions: SessionDetail[] = [];

function makeSessionTitle(index: number) {
  return `新会话 ${index}`;
}

function toSummary(session: SessionDetail): SessionSummary {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    updatedAt: session.updatedAt
  };
}

const browserFallbackBridge: DesktopBridge = {
  async getBootstrapData(): Promise<BootstrapData> {
    return {
      appInfo: {
        productName: "Kimi GUI",
        version: "0.1.0",
        desktopShell: "electron",
        integrationMode: "sdk-first"
      },
      settings: DEFAULT_SETTINGS,
      runtimeStatus: "idle",
      runtimeHealth: {
        cliAvailable: false,
        loggedIn: false,
        configuredModel: null
      }
    };
  },
  async inspectKimiEnvironment() {
    return {
      status: "missing",
      cliAvailable: false,
      cliVersion: null,
      loggedIn: false,
      configuredModel: null,
      summary: "浏览器预览无法检测本机环境",
      nextAction: "请启动桌面版进行真实检测。"
    };
  },
  async selectProjectDirectory() {
    return "D:\\Projects\\示例项目";
  },
  async launchKimiWeb() {
    return {
      ok: false,
      message: "浏览器预览不会启动本机程序，请使用桌面版。"
    };
  },
  async saveSettings(draft: SettingsDraft): Promise<SettingsRecord> {
    return {
      ...sanitizeSettingsDraft(draft),
      providerMode: draft.providerType === "kimi" ? "kimi-native" : "compatible",
      hasCompletedOnboarding: true
    };
  },
  async listSessions() {
    return fallbackSessions.map(toSummary);
  },
  async createSession() {
    const now = new Date().toISOString();
    const session: SessionDetail = {
      id: `session-${fallbackSessions.length + 1}`,
      title: makeSessionTitle(fallbackSessions.length + 1),
      status: "idle",
      updatedAt: now,
      providerLabel: getProviderProfile(DEFAULT_SETTINGS.providerType).label,
      model: DEFAULT_SETTINGS.defaultModel,
      runtimeLogs: [],
      pendingApproval: null,
      messages: [
        {
          id: `${fallbackSessions.length + 1}-system`,
          role: "system",
          content: runtimeCopy.browserSessionCreated,
          createdAt: now
        }
      ]
    };
    fallbackSessions.unshift(session);
    return session;
  },
  async openSession(sessionId: string) {
    return fallbackSessions.find((session) => session.id === sessionId) ?? null;
  },
  async sendPrompt(sessionId: string, prompt: string) {
    const session = fallbackSessions.find((item) => item.id === sessionId);

    if (!session) {
      throw new Error(runtimeCopy.sessionNotFound);
    }

    const now = new Date().toISOString();
    session.status = "completed";
    session.updatedAt = now;
    session.messages.push({
      id: `${session.id}-user-${session.messages.length + 1}`,
      role: "user",
      content: prompt.trim(),
      createdAt: now
    });
    session.messages.push({
      id: `${session.id}-assistant-${session.messages.length + 1}`,
      role: "assistant",
      content:
        runtimeCopy.browserPlaceholderResponse,
      createdAt: new Date().toISOString()
    });
    session.runtimeLogs = [
      ...(session.runtimeLogs ?? []),
      {
        id: `${session.id}-runtime-log-${session.messages.length + 1}`,
        level: "info",
        message: runtimeCopy.browserRuntimeCompleted,
        createdAt: new Date().toISOString()
      }
    ];
    return session;
  },
  async resolveApproval() {
    return undefined;
  },
  onSessionStream() {
    return () => undefined;
  }
};

export function getDesktopBridge(): DesktopBridge {
  if (typeof window !== "undefined" && window.kimiDesktop) {
    return window.kimiDesktop;
  }

  return browserFallbackBridge;
}

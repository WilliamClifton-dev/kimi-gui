import type {
  BootstrapData,
  DesktopBridge,
  SessionDetail,
  SessionSummary,
  SettingsDraft,
  SettingsRecord
} from "../shared/contracts";
import { DEFAULT_SETTINGS, getProviderProfile, sanitizeSettingsDraft } from "./settings";

const fallbackSessions: SessionDetail[] = [];

function makeSessionTitle(index: number) {
  return `New session ${index}`;
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
          content: "This is a local session scaffold. Runtime integration comes next.",
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
      throw new Error("Session not found.");
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
        "This is a placeholder assistant response. The next milestone connects this surface to the real Kimi runtime.",
      createdAt: new Date().toISOString()
    });
    session.runtimeLogs = [
      ...(session.runtimeLogs ?? []),
      {
        id: `${session.id}-runtime-log-${session.messages.length + 1}`,
        level: "info",
        message: "Placeholder runtime completed this local browser-only response.",
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

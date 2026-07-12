import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SETTINGS, getProviderProfile, sanitizeSettingsDraft } from "../src/lib/settings.js";
import { runtimeCopy } from "../src/lib/copy.js";
import { resolvePendingApproval, runtimeAdapter } from "./integration/runtime-adapter.js";
import { getRuntimeHealth } from "./integration/runtime-health.js";
import { loadSettings, saveSettings } from "./storage/settings-store.js";
import { loadSessions, saveSessions, toSessionSummary } from "./storage/sessions-store.js";
import { getPackagedRendererPath } from "./window-paths.js";
import type {
  ApprovalDecision,
  AppInfo,
  BootstrapData,
  SessionDetail,
  SessionStreamUpdate,
  SettingsDraft,
  SettingsRecord
} from "../src/shared/contracts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: "Kimi GUI",
    backgroundColor: "#f4f1ea",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void win.loadFile(getPackagedRendererPath(__dirname));
}

function registerIpcHandlers() {
  ipcMain.handle("app:get-bootstrap-data", async () => {
    const appInfo: AppInfo = {
      productName: "Kimi GUI",
      version: app.getVersion(),
      desktopShell: "electron",
      integrationMode: "sdk-first"
    };

    const settings = await loadSettings(app);
    const data: BootstrapData = {
      appInfo,
      settings,
      runtimeStatus: settings.hasCompletedOnboarding ? "ready" : "idle",
      runtimeHealth: getRuntimeHealth()
    };

    return data;
  });

  ipcMain.handle("app:save-settings", async (_event, draft: SettingsDraft) => {
    const sanitized = sanitizeSettingsDraft(draft);
    const record: SettingsRecord = {
      ...DEFAULT_SETTINGS,
      ...sanitized,
      providerMode: getProviderProfile(sanitized.providerType).providerMode,
      hasCompletedOnboarding: true
    };

    await saveSettings(app, record);
    return record;
  });

  ipcMain.handle("sessions:list", async () => {
    const sessions = await loadSessions(app);
    return sessions.map(toSessionSummary).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  });

  ipcMain.handle("sessions:create", async () => {
    const sessions = await loadSessions(app);
    const settings = await loadSettings(app);
    const providerProfile = getProviderProfile(settings.providerType);
    const now = new Date().toISOString();
    const session: SessionDetail = {
      id: `session-${Date.now()}`,
      title: `新会话 ${sessions.length + 1}`,
      status: "idle",
      updatedAt: now,
      providerLabel: providerProfile.label,
      model: settings.defaultModel,
      runtimeNote: {
        level: "info",
        title: runtimeCopy.sessionReadyTitle,
        detail: runtimeCopy.sessionReadyDetail
      },
      runtimeLogs: [],
      pendingApproval: null,
      messages: [
        {
          id: `system-${Date.now()}`,
          role: "system",
          content: runtimeCopy.sessionCreatedMessage,
          createdAt: now
        }
      ]
    };
    const nextSessions = [session, ...sessions];
    await saveSessions(app, nextSessions);
    return session;
  });

  ipcMain.handle("sessions:open", async (_event, sessionId: string) => {
    const sessions = await loadSessions(app);
    return sessions.find((session) => session.id === sessionId) ?? null;
  });

  ipcMain.handle("sessions:send-prompt", async (event, sessionId: string, prompt: string) => {
    const sessions = await loadSessions(app);
    const settings = await loadSettings(app);
    const streamSender = event.sender;

    const nextSessions: SessionDetail[] = await Promise.all(sessions.map(async (session) => {
      if (session.id !== sessionId) {
        return session;
      }

      return runtimeAdapter.executePrompt({
        providerType: settings.providerType,
        session,
        prompt,
        workDir: process.cwd(),
        settings,
        onAssistantText: (assistantText) => {
          if (!streamSender || streamSender.isDestroyed()) {
            return;
          }

          const update: SessionStreamUpdate = {
            sessionId,
            status: "streaming",
            updatedAt: new Date().toISOString(),
            assistantText,
            runtimeNote: {
              level: "info",
              title: runtimeCopy.requestInProgressTitle,
              detail: runtimeCopy.requestInProgressDetail
            },
            pendingApproval: null
          };

          streamSender.send("sessions:stream-update", update);
        },
        onRuntimeLog: (runtimeLog, meta) => {
          if (!streamSender || streamSender.isDestroyed()) {
            return;
          }

          const update: SessionStreamUpdate = {
            sessionId,
            status: meta?.status ?? "streaming",
            updatedAt: runtimeLog.createdAt,
            runtimeLog,
            runtimeNote: meta?.runtimeNote,
            pendingApproval: meta?.pendingApproval ?? null
          };

          streamSender.send("sessions:stream-update", update);
        }
      });
    }));

    const updatedSession = nextSessions.find((session) => session.id === sessionId);
    if (!updatedSession) {
      throw new Error(runtimeCopy.sessionNotFound);
    }

    await saveSessions(app, nextSessions);
    return updatedSession;
  });

  ipcMain.handle("sessions:resolve-approval", async (event, sessionId: string, decision: ApprovalDecision) => {
    await resolvePendingApproval(sessionId, decision);

    if (event.sender.isDestroyed()) {
      return;
    }

    const update: SessionStreamUpdate = {
      sessionId,
      status: "streaming",
      updatedAt: new Date().toISOString(),
      runtimeNote: {
        level: "info",
        title: runtimeCopy.approvalSentTitle,
        detail: decision === "approve"
          ? runtimeCopy.approvalApprovedDetail
          : runtimeCopy.approvalRejectedDetail
      },
      pendingApproval: null
    };

    event.sender.send("sessions:stream-update", update);
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

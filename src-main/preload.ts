import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge, SessionStreamUpdate } from "../src/shared/contracts";

const bridge: DesktopBridge = {
  getBootstrapData: () => ipcRenderer.invoke("app:get-bootstrap-data"),
  saveSettings: (draft) => ipcRenderer.invoke("app:save-settings", draft),
  listSessions: () => ipcRenderer.invoke("sessions:list"),
  createSession: () => ipcRenderer.invoke("sessions:create"),
  openSession: (sessionId) => ipcRenderer.invoke("sessions:open", sessionId),
  sendPrompt: (sessionId, prompt) => ipcRenderer.invoke("sessions:send-prompt", sessionId, prompt),
  resolveApproval: (sessionId, decision) =>
    ipcRenderer.invoke("sessions:resolve-approval", sessionId, decision),
  onSessionStream: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, update: SessionStreamUpdate) => {
      listener(update);
    };

    ipcRenderer.on("sessions:stream-update", handler);
    return () => {
      ipcRenderer.removeListener("sessions:stream-update", handler);
    };
  }
};

contextBridge.exposeInMainWorld("kimiDesktop", bridge);

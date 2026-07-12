import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { App } from "electron";
import type { SessionDetail, SessionSummary } from "../../src/shared/contracts.js";

function getSessionsPath(app: App) {
  return path.join(app.getPath("userData"), "sessions.json");
}

export async function loadSessions(app: App): Promise<SessionDetail[]> {
  const filePath = getSessionsPath(app);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as SessionDetail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSessions(app: App, sessions: SessionDetail[]) {
  const filePath = getSessionsPath(app);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(sessions, null, 2), "utf8");
}

export function toSessionSummary(session: SessionDetail): SessionSummary {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    updatedAt: session.updatedAt
  };
}

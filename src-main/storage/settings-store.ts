import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { App } from "electron";
import { DEFAULT_SETTINGS } from "../../src/lib/settings.js";
import type { SettingsRecord } from "../../src/shared/contracts.js";

function getSettingsPath(app: App) {
  return path.join(app.getPath("userData"), "settings.json");
}

export async function loadSettings(app: App): Promise<SettingsRecord> {
  const filePath = getSettingsPath(app);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SettingsRecord>;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(app: App, settings: SettingsRecord) {
  const filePath = getSettingsPath(app);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(settings, null, 2), "utf8");
}

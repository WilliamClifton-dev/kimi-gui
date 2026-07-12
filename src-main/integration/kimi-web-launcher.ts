import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import type { KimiWebLaunchResult } from "../../src/shared/contracts.js";

type SpawnedProcess = {
  pid?: number;
  unref: () => void;
  once: (event: "spawn" | "error", listener: () => void) => unknown;
};

type LauncherDependencies = {
  isDirectory: (directoryPath: string) => boolean;
  spawnProcess: (
    command: string,
    arguments_: string[],
    options: {
      cwd: string;
      detached: boolean;
      shell: boolean;
      stdio: "ignore";
      windowsHide: boolean;
    }
  ) => SpawnedProcess;
};

const defaultDependencies: LauncherDependencies = {
  isDirectory: (directoryPath) => {
    try {
      return statSync(directoryPath).isDirectory();
    } catch {
      return false;
    }
  },
  spawnProcess: (command, arguments_, options) => spawn(command, arguments_, options)
};

export async function launchKimiWeb(
  projectPath: string,
  dependencies: LauncherDependencies = defaultDependencies
): Promise<KimiWebLaunchResult> {
  if (!projectPath || !dependencies.isDirectory(projectPath)) {
    return {
      ok: false,
      message: "找不到所选项目文件夹，请重新选择。"
    };
  }

  try {
    const child = dependencies.spawnProcess("kimi", ["web"], {
      cwd: projectPath,
      detached: true,
      shell: false,
      stdio: "ignore",
      windowsHide: true
    });
    return await new Promise((resolve) => {
      child.once("spawn", () => {
        child.unref();
        resolve({
          ok: true,
          message: "Kimi Web 正在浏览器中打开。"
        });
      });
      child.once("error", () => {
        resolve({
          ok: false,
          message: "无法启动 Kimi Web。请重新运行环境检测，确认 Kimi Code 已正确安装。"
        });
      });
    });
  } catch {
    return {
      ok: false,
      message: "无法启动 Kimi Web。请重新运行环境检测，确认 Kimi Code 已正确安装。"
    };
  }
}

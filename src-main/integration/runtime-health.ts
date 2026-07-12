import { isLoggedIn, parseConfig } from "@moonshot-ai/kimi-agent-sdk";
import { spawnSync } from "node:child_process";
import type { KimiEnvironmentReport } from "../../src/shared/contracts.js";

type VersionCheck = {
  status: number | null;
  stdout: string;
};

type EnvironmentDependencies = {
  runVersionCheck: () => VersionCheck;
  readLoginState: () => boolean;
  readConfiguredModel: () => string | null;
};

const defaultDependencies: EnvironmentDependencies = {
  runVersionCheck: () => {
    const result = spawnSync("kimi", ["--version"], {
      encoding: "utf8",
      stdio: "pipe",
      windowsHide: true
    });
    return {
      status: result.status,
      stdout: result.stdout ?? ""
    };
  },
  readLoginState: () => isLoggedIn(),
  readConfiguredModel: () => parseConfig().defaultModel
};

function parseVersion(output: string) {
  return output.match(/\d+\.\d+\.\d+(?:[-+][\w.-]+)?/)?.[0] ?? null;
}

export function inspectKimiEnvironment(
  dependencies: EnvironmentDependencies = defaultDependencies
): KimiEnvironmentReport {
  const versionCheck = dependencies.runVersionCheck();

  if (versionCheck.status !== 0) {
    return {
      status: "missing",
      cliAvailable: false,
      cliVersion: null,
      loggedIn: false,
      configuredModel: null,
      summary: "尚未检测到 Kimi Code",
      nextAction: "请先安装 Kimi Code，安装完成后重新检测。"
    };
  }

  const cliVersion = parseVersion(versionCheck.stdout);

  try {
    const loggedIn = dependencies.readLoginState();
    const configuredModel = dependencies.readConfiguredModel();

    if (!loggedIn || !configuredModel) {
      return {
        status: "setup_required",
        cliAvailable: true,
        cliVersion,
        loggedIn,
        configuredModel,
        summary: "Kimi Code 还需要完成配置",
        nextAction: "请先完成 Kimi Code 登录和模型配置，然后重新检测。"
      };
    }

    return {
      status: "ready",
      cliAvailable: true,
      cliVersion,
      loggedIn: true,
      configuredModel,
      summary: "Kimi Code 已准备好",
      nextAction: "选择一个项目，然后启动 Kimi Web。"
    };
  } catch {
    return {
      status: "setup_required",
      cliAvailable: true,
      cliVersion,
      loggedIn: false,
      configuredModel: null,
      summary: "Kimi Code 配置无法读取",
      nextAction: "请重新完成 Kimi Code 登录，然后再次检测。"
    };
  }
}

export type RuntimeHealth = Pick<
  KimiEnvironmentReport,
  "cliAvailable" | "loggedIn" | "configuredModel"
>;

export function getRuntimeHealth(): RuntimeHealth {
  const report = inspectKimiEnvironment();
  return {
    cliAvailable: report.cliAvailable,
    loggedIn: report.loggedIn,
    configuredModel: report.configuredModel
  };
}

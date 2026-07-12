import { useEffect, useState } from "react";
import { getDesktopBridge } from "../lib/desktop-bridge";
import type { KimiEnvironmentReport } from "../shared/contracts";

const bridge = getDesktopBridge();

function projectName(projectPath: string) {
  return projectPath.split(/[\\/]/).filter(Boolean).at(-1) ?? projectPath;
}

export function App() {
  const [environment, setEnvironment] = useState<KimiEnvironmentReport | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  async function inspectEnvironment() {
    setIsChecking(true);
    setLaunchMessage(null);
    try {
      setEnvironment(await bridge.inspectKimiEnvironment());
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    void inspectEnvironment();
  }, []);

  async function selectProject() {
    setIsSelecting(true);
    setLaunchMessage(null);
    try {
      const selected = await bridge.selectProjectDirectory();
      if (selected) {
        setProjectPath(selected);
      }
    } finally {
      setIsSelecting(false);
    }
  }

  async function startKimiWeb() {
    if (!projectPath || environment?.status !== "ready") {
      return;
    }

    setIsLaunching(true);
    setLaunchMessage(null);
    try {
      const result = await bridge.launchKimiWeb(projectPath);
      setLaunchMessage(result.message);
    } finally {
      setIsLaunching(false);
    }
  }

  const canLaunch = environment?.status === "ready" && Boolean(projectPath);

  return (
    <main className="companion-shell">
      <header className="companion-header">
        <div className="brand-mark" aria-hidden="true">
          <span>K</span>
          <i />
        </div>
        <div>
          <p className="companion-kicker">Kimi Code 新手助手</p>
          <h1>第一次使用，也不必先学命令行</h1>
          <p className="companion-intro">
            检查环境、选择项目，然后进入官方 Kimi Web。助手不接管对话，只帮你顺利开始。
          </p>
        </div>
        <span className="local-badge">仅在本机运行</span>
      </header>

      <section className="companion-workspace" aria-label="Kimi Code 启动流程">
        <ol className="step-rail">
          <li className={environment?.status === "ready" ? "step-complete" : "step-active"}>
            <span>1</span>
            <div><strong>检查环境</strong><small>安装、登录与模型</small></div>
          </li>
          <li className={projectPath ? "step-complete" : environment?.status === "ready" ? "step-active" : ""}>
            <span>2</span>
            <div><strong>选择项目</strong><small>无需输入 cd 命令</small></div>
          </li>
          <li className={canLaunch ? "step-active" : ""}>
            <span>3</span>
            <div><strong>启动工作</strong><small>使用官方 Kimi Web</small></div>
          </li>
        </ol>

        <div className="companion-main">
          <section className="doctor-panel">
            <div className="panel-heading">
              <div>
                <span className="section-number">01</span>
                <h2>环境体检</h2>
              </div>
              <button className="quiet-button" disabled={isChecking} type="button" onClick={() => void inspectEnvironment()}>
                {isChecking ? "检测中..." : "重新检测"}
              </button>
            </div>

            {isChecking ? (
              <div className="checking-state"><span /><p>正在检查本机 Kimi Code...</p></div>
            ) : environment ? (
              <div className={`health-result health-${environment.status}`}>
                <div className="health-summary">
                  <span className="health-dot" />
                  <div><strong>{environment.summary}</strong><p>{environment.nextAction}</p></div>
                </div>
                <dl className="health-facts">
                  <div><dt>Kimi Code</dt><dd>{environment.cliAvailable ? `已安装 ${environment.cliVersion ?? ""}` : "未检测到"}</dd></div>
                  <div><dt>账号状态</dt><dd>{environment.loggedIn ? "已登录" : "需要登录"}</dd></div>
                  <div><dt>当前模型</dt><dd>{environment.configuredModel ?? "尚未配置"}</dd></div>
                </dl>
              </div>
            ) : null}
          </section>

          <section className="launch-panel">
            <div className="panel-heading">
              <div><span className="section-number">02</span><h2>选择项目</h2></div>
            </div>
            <button className="project-picker" disabled={isSelecting} type="button" onClick={() => void selectProject()}>
              <span className="folder-symbol" aria-hidden="true" />
              <span className="project-picker-copy">
                <strong>{projectPath ? projectName(projectPath) : "选择一个项目文件夹"}</strong>
                <small>{projectPath ?? "Kimi 只会在你选择的文件夹中工作"}</small>
              </span>
              <span className="picker-action">{isSelecting ? "选择中..." : projectPath ? "更换" : "浏览"}</span>
            </button>

            <div className="launch-divider" />

            <div className="launch-copy">
              <div><span className="section-number">03</span><h2>开始使用 Kimi</h2></div>
              <p>点击后启动官方 `kimi web`。会话、审批、文件修改都由官方运行时处理。</p>
            </div>
            <button className="launch-button" disabled={!canLaunch || isLaunching} type="button" onClick={() => void startKimiWeb()}>
              {isLaunching ? "正在启动..." : "启动 Kimi Web"}
            </button>
            {launchMessage ? <p className="launch-message" role="status">{launchMessage}</p> : null}
          </section>
        </div>
      </section>

      <footer className="companion-footer">
        <span>助手不保存对话 · 不注入官方页面 · 不读取项目内容</span>
        <span>环境报告不会包含 API Key</span>
      </footer>
    </main>
  );
}

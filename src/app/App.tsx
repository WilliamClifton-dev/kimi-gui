import { useEffect, useMemo, useState } from "react";
import { getActionTemplates } from "../lib/action-templates";
import { getDesktopBridge } from "../lib/desktop-bridge";
import { buildDiagnosticsReport } from "../lib/diagnostics";
import { sortSessionsByUpdatedAt } from "../lib/sessions";
import {
  applyProviderDefaults,
  DEFAULT_SETTINGS,
  getProviderProfile,
  PROVIDER_PROFILES,
  sanitizeSettingsDraft,
  validateSettingsDraft
} from "../lib/settings";
import type {
  BootstrapData,
  SessionDetail,
  SessionMessage,
  SessionSummary,
  SettingsDraft,
  SettingsValidation,
  RuntimeStatus
} from "../shared/contracts";

const statusLabels: Record<RuntimeStatus, string> = {
  idle: "Idle",
  validating: "Validating setup",
  ready: "Ready",
  streaming: "Streaming",
  awaiting_approval: "Awaiting approval",
  completed: "Completed",
  failed: "Failed"
};

export function App() {
  const bridge = useMemo(() => getDesktopBridge(), []);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [validation, setValidation] = useState<SettingsValidation>({
    isValid: false,
    fieldErrors: {}
  });
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [isResolvingApproval, setIsResolvingApproval] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [diagnosticsCopyState, setDiagnosticsCopyState] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    bridge.getBootstrapData().then((data) => {
      setBootstrap(data);
      setDraft({
        providerType: data.settings.providerType,
        apiKey: data.settings.apiKey,
        defaultModel: data.settings.defaultModel,
        baseUrl: data.settings.baseUrl
      });
      setValidation(validateSettingsDraft(data.settings));
    });
    bridge.listSessions().then((items) => {
      setSessions(sortSessionsByUpdatedAt(items));
    });
  }, [bridge]);

  useEffect(() => {
    return bridge.onSessionStream((update) => {
      setActiveSession((current) => {
        if (!current || current.id !== update.sessionId) {
          return current;
        }

        const nextMessages = [...current.messages];
        const nextRuntimeLogs = current.runtimeLogs ? [...current.runtimeLogs] : [];
        const lastAssistantIndex = [...nextMessages]
          .reverse()
          .findIndex((message) => message.role === "assistant");

        if (typeof update.assistantText === "string" && lastAssistantIndex === -1) {
          const assistantMessage: SessionMessage = {
            id: `stream-assistant-${Date.now()}`,
            role: "assistant",
            content: update.assistantText,
            createdAt: update.updatedAt
          };

          nextMessages.push(assistantMessage);
        } else if (typeof update.assistantText === "string") {
          const targetIndex = nextMessages.length - 1 - lastAssistantIndex;
          nextMessages[targetIndex] = {
            ...nextMessages[targetIndex],
            content: update.assistantText
          };
        }

        if (update.runtimeLog && !nextRuntimeLogs.some((entry) => entry.id === update.runtimeLog?.id)) {
          nextRuntimeLogs.push(update.runtimeLog);
        }

        return {
          ...current,
          status: update.status,
          updatedAt: update.updatedAt,
          runtimeNote: update.runtimeNote ?? current.runtimeNote,
          messages: nextMessages,
          runtimeLogs: nextRuntimeLogs,
          pendingApproval: update.pendingApproval !== undefined
            ? update.pendingApproval
            : current.pendingApproval
        };
      });

      setSessions((current) =>
        sortSessionsByUpdatedAt(current.map((session) => (
          session.id === update.sessionId
            ? {
                ...session,
                status: update.status,
                updatedAt: update.updatedAt
              }
            : session
        )))
      );
    });
  }, [bridge]);

  function updateField<K extends keyof SettingsDraft>(field: K, value: SettingsDraft[K]) {
    const nextDraft = {
      ...draft,
      [field]: value
    };

    setDraft(nextDraft);
    setValidation(validateSettingsDraft(nextDraft));
    setSaveMessage(null);
  }

  async function handleSave() {
    const nextValidation = validateSettingsDraft(draft);
    setValidation(nextValidation);

    if (!nextValidation.isValid) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const saved = await bridge.saveSettings(sanitizeSettingsDraft(draft));
      setBootstrap((current) =>
        current
          ? {
              ...current,
              settings: saved,
              runtimeStatus: "ready"
            }
          : current
      );
      setDraft({
        providerType: saved.providerType,
        apiKey: saved.apiKey,
        defaultModel: saved.defaultModel,
        baseUrl: saved.baseUrl
      });
      setSaveMessage("Setup saved. You can start your first Kimi session next.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateSession() {
    setIsCreatingSession(true);

    try {
      const session = await bridge.createSession();
      setActiveSession(session);
      setSessions((current) => sortSessionsByUpdatedAt([session, ...current.filter((item) => item.id !== session.id)]));
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function handleOpenSession(sessionId: string) {
    const session = await bridge.openSession(sessionId);
    if (session) {
      setActiveSession(session);
    }
  }

  async function handleSendPrompt() {
    if (!activeSession || !prompt.trim()) {
      return;
    }

    await submitPrompt(prompt.trim());
  }

  async function submitPrompt(nextPrompt: string) {
    if (!activeSession || !nextPrompt.trim()) {
      return;
    }

    const pendingPrompt = nextPrompt.trim();
    const pendingTime = new Date().toISOString();

    const optimisticSession: SessionDetail = {
      ...activeSession,
      status: "streaming",
      updatedAt: pendingTime,
      runtimeNote: {
        level: "info",
        title: "Runtime request in progress",
        detail: "Waiting for the active runtime adapter to return a response."
      },
      messages: [
        ...activeSession.messages,
        {
          id: `pending-user-${Date.now()}`,
          role: "user",
          content: pendingPrompt,
          createdAt: pendingTime
        },
        {
          id: `pending-assistant-${Date.now() + 1}`,
          role: "assistant",
          content: "Generating response...",
          createdAt: pendingTime
        }
      ]
    };

    setActiveSession(optimisticSession);
    setSessions((current) =>
      sortSessionsByUpdatedAt([
        {
          id: optimisticSession.id,
          title: optimisticSession.title,
          status: optimisticSession.status,
          updatedAt: optimisticSession.updatedAt
        },
        ...current.filter((item) => item.id !== optimisticSession.id)
      ])
    );
    setIsSendingPrompt(true);

    try {
      const updatedSession = await bridge.sendPrompt(activeSession.id, pendingPrompt);
      setActiveSession(updatedSession);
      setSessions((current) =>
        sortSessionsByUpdatedAt([
          updatedSession,
          ...current.filter((item) => item.id !== updatedSession.id)
        ])
      );
      setPrompt("");
    } catch {
      setActiveSession(activeSession);
    } finally {
      setIsSendingPrompt(false);
    }
  }

  async function handleResolveApproval(decision: "approve" | "reject") {
    if (!activeSession?.pendingApproval) {
      return;
    }

    setIsResolvingApproval(true);

    try {
      await bridge.resolveApproval(activeSession.id, decision);
      setActiveSession((current) => (
        current
          ? {
              ...current,
              status: "streaming",
              pendingApproval: null,
              runtimeNote: {
                level: "info",
                title: "Approval sent",
                detail: decision === "approve"
                  ? "Approval sent to Kimi. The session is continuing."
                  : "Rejection sent to Kimi. Waiting for the runtime to respond."
              }
            }
          : current
      ));
    } finally {
      setIsResolvingApproval(false);
    }
  }

  async function handleCopyDiagnostics() {
    const report = buildDiagnosticsReport({
      bootstrap,
      session: activeSession
    });

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API unavailable.");
      }
      await navigator.clipboard.writeText(report);
      setDiagnosticsCopyState("Diagnostics copied.");
    } catch {
      setDiagnosticsCopyState("Copy failed. You can still select the report manually.");
    }
  }

  const hasCompletedOnboarding = bootstrap?.settings.hasCompletedOnboarding ?? false;
  const currentStateLabel = bootstrap ? statusLabels[bootstrap.runtimeStatus] : "Connecting";
  const currentProviderProfile = getProviderProfile(draft.providerType);
  const actionTemplates = getActionTemplates(currentProviderProfile.providerMode);
  const diagnosticsReport = buildDiagnosticsReport({
    bootstrap,
    session: activeSession
  });
  const messageCount = activeSession?.messages.length ?? 0;
  const runtimeHealth = bootstrap?.runtimeHealth;

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-topline">
          <p className="eyebrow">Kimi Workspace</p>
          <div className="hero-badges" aria-label="Product highlights">
            <span className="hero-badge">Beginner-first</span>
            <span className="hero-badge">Kimi-native</span>
            <span className="hero-badge">Local desktop</span>
          </div>
        </div>

        <div className="hero-layout">
          <div className="hero-copy">
            <h1>Use Kimi Code without learning the terminal first</h1>
            <p className="lede">
              A local desktop workspace for beginners who want Kimi-native coding
              workflows, clearer setup, and fewer command-line blockers.
            </p>

            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => void handleSave()}>
                {hasCompletedOnboarding ? "Refresh setup" : "Start setup"}
              </button>
              <span className="hero-note">
                Current state: <strong>{currentStateLabel}</strong>
              </span>
            </div>
          </div>

          <aside className="hero-preview" aria-label="Preview summary">
            <div className="preview-header">
              <span className="preview-dot preview-dot-active" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>

            <div className="preview-card">
              <p className="preview-label">Workflow direction</p>
              <h2>Onboarding first, runtime depth second</h2>
              <p>
                The first release helps new users configure Kimi, start their
                first session, and understand what the app is doing.
              </p>
            </div>

            <div className="preview-metrics">
              <div>
                <dt>Default shell</dt>
                <dd>Electron</dd>
              </div>
              <div>
                <dt>Runtime mode</dt>
                <dd>{bootstrap?.appInfo.integrationMode ?? "sdk-first"}</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>First-run setup</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{currentProviderProfile.label}</dd>
              </div>
              <div>
                <dt>Kimi CLI</dt>
                <dd>
                  {runtimeHealth?.cliAvailable
                    ? runtimeHealth.loggedIn
                      ? "Ready"
                      : "Installed, login needed"
                    : "Not found"}
                </dd>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>What this app does</h2>
          <p>
            It helps beginners finish setup, start sessions, and understand
            failures without needing to learn `kimi-cli` syntax first.
          </p>
          <ul className="mini-list">
            <li>first-run guidance</li>
            <li>Kimi-native workflow direction</li>
            <li>beginner-friendly diagnostics</li>
          </ul>
        </article>

        <article className="card">
          <h2>Runtime states</h2>
          <p>
            Session and setup states are modeled in typed contracts before we
            wire the full runtime flow.
          </p>
          <div className="status-list">
            {Object.entries(statusLabels).map(([status, label]) => (
              <span className="status-pill" key={status}>
                {label}
              </span>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>App status</h2>
          <p>
            {bootstrap
              ? `Connected to ${bootstrap.appInfo.productName} on ${bootstrap.appInfo.desktopShell}.`
              : "Waiting for main-process bridge..."}
          </p>
          {bootstrap ? (
            <dl className="meta">
              <div>
                <dt>Version</dt>
                <dd>{bootstrap.appInfo.version}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{bootstrap.appInfo.integrationMode}</dd>
              </div>
              <div>
                <dt>Current state</dt>
                <dd>{statusLabels[bootstrap.runtimeStatus]}</dd>
              </div>
            </dl>
          ) : null}
        </article>
      </section>

      <section className="showcase-grid">
        <article className="card feature-card">
          <p className="eyebrow">Why beginners struggle</p>
          <h2>CLI friction shows up before Kimi value does</h2>
          <p>
            New users hit setup, model selection, base URL confusion, and error
            messages before they ever reach their first successful session.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">What this product keeps</p>
          <h2>Kimi-native workflow, not just model access</h2>
          <p>
            The goal is to preserve Kimi Code style workflows and future plugin
            or MCP growth without making the first-run experience harder.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">What ships first</p>
          <h2>A small MVP that still feels like a real product</h2>
          <p>
            First-run guidance, settings, session-ready architecture, and a UI
            that already explains why the project exists.
          </p>
        </article>
      </section>

      <section className="setup-panel">
        <article className="setup-card">
          <div className="setup-copy">
            <p className="eyebrow">First-run setup</p>
            <h2>{hasCompletedOnboarding ? "Your setup is ready" : "Connect Kimi in under a minute"}</h2>
            <p>
              Choose a provider first. Kimi mode aims for the fullest workflow.
              Compatible providers can still work, but some advanced features may differ.
            </p>
            <ul className="setup-list">
              <li>No terminal commands required</li>
              <li>Settings stay local on your machine</li>
              <li>Advanced logs remain available later for debugging</li>
            </ul>

            <div className="setup-status-panel">
              <div>
                <dt>Product state</dt>
                <dd>{hasCompletedOnboarding ? "Setup complete" : "Waiting for first configuration"}</dd>
              </div>
              <div>
                <dt>Next milestone</dt>
                <dd>First session UI</dd>
              </div>
              <div>
                <dt>Provider mode</dt>
                <dd>{currentProviderProfile.providerMode}</dd>
              </div>
            </div>

            {draft.providerType === "kimi" && runtimeHealth ? (
              <div
                className={`runtime-health-panel ${
                  runtimeHealth.cliAvailable && runtimeHealth.loggedIn
                    ? "runtime-health-ok"
                    : "runtime-health-warning"
                }`}
              >
                <strong>
                  {runtimeHealth.cliAvailable
                    ? runtimeHealth.loggedIn
                      ? "Kimi runtime looks ready"
                      : "Kimi CLI is installed, but login is still required"
                    : "Kimi CLI was not found"}
                </strong>
                <p>
                  {runtimeHealth.cliAvailable
                    ? runtimeHealth.loggedIn
                      ? `Detected default model: ${runtimeHealth.configuredModel ?? "not set"}.`
                      : "Run local Kimi login before expecting real Kimi runtime responses."
                    : "Install Kimi CLI locally so the real Kimi adapter can run."}
                </p>
              </div>
            ) : null}
          </div>

          <form
            className="settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <label className="field">
              <span>Provider</span>
              <select
                className="field-select"
                name="providerType"
                value={draft.providerType}
                onChange={(event) => {
                  const nextDraft = applyProviderDefaults(
                    event.target.value as SettingsDraft["providerType"],
                    draft
                  );
                  setDraft(nextDraft);
                  setValidation(validateSettingsDraft(nextDraft));
                  setSaveMessage(null);
                }}
              >
                {PROVIDER_PROFILES.map((profile) => (
                  <option key={profile.type} value={profile.type}>
                    {profile.label}
                  </option>
                ))}
              </select>
              <small>{currentProviderProfile.helpText}</small>
            </label>

            <label className="field">
              <span>API key</span>
              <input
                autoComplete="off"
                name="apiKey"
                placeholder={`Paste your ${currentProviderProfile.label} API key`}
                type="password"
                value={draft.apiKey}
                onChange={(event) => updateField("apiKey", event.target.value)}
              />
              <small>Required. The key is stored locally for this app.</small>
              {validation.fieldErrors.apiKey ? (
                <strong className="error-text">{validation.fieldErrors.apiKey}</strong>
              ) : null}
            </label>

            <label className="field">
              <span>Default model</span>
              <input
                name="defaultModel"
                placeholder={currentProviderProfile.defaultModel}
                value={draft.defaultModel}
                onChange={(event) => updateField("defaultModel", event.target.value)}
              />
              <small>Keep the default unless you already know another model you need.</small>
              {validation.fieldErrors.defaultModel ? (
                <strong className="error-text">{validation.fieldErrors.defaultModel}</strong>
              ) : null}
            </label>

            <label className="field">
              <span>Base URL</span>
              <input
                name="baseUrl"
                placeholder={currentProviderProfile.baseUrl}
                value={draft.baseUrl}
                onChange={(event) => updateField("baseUrl", event.target.value)}
              />
              <small>Only change this if your environment uses a different endpoint.</small>
              {validation.fieldErrors.baseUrl ? (
                <strong className="error-text">{validation.fieldErrors.baseUrl}</strong>
              ) : null}
            </label>

            <div className="actions-row">
              <button className="primary-button" disabled={!validation.isValid || isSaving} type="submit">
                {isSaving ? "Saving..." : hasCompletedOnboarding ? "Update setup" : "Save setup"}
              </button>
              <span className="helper-text">
                {hasCompletedOnboarding
                  ? "You can edit these settings any time."
                  : "You only need this once to unlock the workspace."}
              </span>
            </div>

            {saveMessage ? <p className="success-text">{saveMessage}</p> : null}
          </form>
        </article>
      </section>

      <section className="session-shell">
        <aside className="session-sidebar card">
          <div className="session-sidebar-header">
            <div>
              <p className="eyebrow">Sessions</p>
              <h2>First session flow</h2>
            </div>
            <button className="secondary-button" disabled={isCreatingSession} type="button" onClick={() => void handleCreateSession()}>
              {isCreatingSession ? "Creating..." : "New session"}
            </button>
          </div>

          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="empty-state">
                <p>No sessions yet.</p>
                <span>Create one to preview the upcoming Kimi conversation flow.</span>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  className={`session-item${activeSession?.id === session.id ? " session-item-active" : ""}`}
                  type="button"
                  onClick={() => void handleOpenSession(session.id)}
                >
                  <strong>{session.title}</strong>
                  <span>{statusLabels[session.status]}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="session-main card">
          <div className="session-main-header">
            <div>
              <p className="eyebrow">Conversation</p>
              <h2>{activeSession ? activeSession.title : "Create your first session"}</h2>
              {activeSession ? (
                <div className="session-meta-row">
                  <span>{activeSession.providerLabel}</span>
                  <span>{activeSession.model}</span>
                  <span>{messageCount} messages</span>
                </div>
              ) : null}
            </div>
            <span className="session-state-pill">
              {activeSession ? statusLabels[activeSession.status] : "Not started"}
            </span>
          </div>

          <div className="message-list">
            {activeSession ? (
              <section className="action-template-panel" aria-label="Guided actions">
                <div className="action-template-header">
                  <div>
                    <strong>Quick starts</strong>
                    <p>Run a common coding action without writing the prompt yourself.</p>
                  </div>
                  <span>{actionTemplates.length} templates</span>
                </div>
                <div className="action-template-grid">
                  {actionTemplates.map((template) => (
                    <article className="action-template-card" key={template.id}>
                      <div>
                        <strong>{template.title}</strong>
                        <p>{template.description}</p>
                      </div>
                      <button
                        className="secondary-button"
                        disabled={isSendingPrompt || isResolvingApproval || activeSession.status === "awaiting_approval"}
                        type="button"
                        onClick={() => void submitPrompt(template.prompt)}
                      >
                        Run
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSession?.runtimeNote ? (
              <div className={`runtime-note runtime-note-${activeSession.runtimeNote.level}`}>
                <strong>{activeSession.runtimeNote.title}</strong>
                <p>{activeSession.runtimeNote.detail}</p>
              </div>
            ) : null}

            {activeSession?.pendingApproval ? (
              <section className="approval-panel" aria-label="Approval required">
                <div className="approval-copy">
                  <strong>Approval required</strong>
                  <p>{activeSession.pendingApproval.description}</p>
                  <span>Action: {activeSession.pendingApproval.action}</span>
                </div>
                <div className="approval-actions">
                  <button
                    className="secondary-button"
                    disabled={isResolvingApproval}
                    type="button"
                    onClick={() => void handleResolveApproval("reject")}
                  >
                    {isResolvingApproval ? "Sending..." : "Reject"}
                  </button>
                  <button
                    className="primary-button"
                    disabled={isResolvingApproval}
                    type="button"
                    onClick={() => void handleResolveApproval("approve")}
                  >
                    {isResolvingApproval ? "Sending..." : "Approve"}
                  </button>
                </div>
              </section>
            ) : null}

            {activeSession?.runtimeLogs?.length ? (
              <section className="runtime-log-panel" aria-label="Runtime activity">
                <div className="runtime-log-header">
                  <strong>Runtime activity</strong>
                  <span>{activeSession.runtimeLogs.length} events</span>
                </div>
                <div className="runtime-log-list">
                  {activeSession.runtimeLogs
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <article className={`runtime-log-card runtime-log-${entry.level}`} key={entry.id}>
                        <div className="runtime-log-meta">
                          <span>{entry.level}</span>
                          <time>
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </time>
                        </div>
                        <p>{entry.message}</p>
                      </article>
                    ))}
                </div>
              </section>
            ) : null}

            {activeSession ? (
              <section className="diagnostics-panel" aria-label="Diagnostics">
                <div className="diagnostics-header">
                  <div>
                    <strong>Diagnostics</strong>
                    <p>Open a structured report for issue filing and advanced troubleshooting.</p>
                  </div>
                  <div className="diagnostics-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        setIsDiagnosticsOpen((current) => !current);
                        setDiagnosticsCopyState(null);
                      }}
                    >
                      {isDiagnosticsOpen ? "Hide report" : "Show report"}
                    </button>
                    <button className="secondary-button" type="button" onClick={() => void handleCopyDiagnostics()}>
                      Copy report
                    </button>
                  </div>
                </div>
                {diagnosticsCopyState ? <span className="diagnostics-copy-state">{diagnosticsCopyState}</span> : null}
                {isDiagnosticsOpen ? (
                  <textarea
                    readOnly
                    aria-label="Diagnostics report"
                    className="diagnostics-report"
                    value={diagnosticsReport}
                  />
                ) : null}
              </section>
            ) : null}

            {activeSession ? (
              activeSession.messages.map((message) => (
                <article className={`message-card message-${message.role}`} key={message.id}>
                  <div className="message-header">
                    <span className="message-role">{message.role}</span>
                    <time className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </time>
                  </div>
                  <p>{message.content}</p>
                </article>
              ))
            ) : (
              <div className="empty-state empty-state-large">
                <p>Session area ready.</p>
                <span>Create a session to see the message layout and prompt flow.</span>
              </div>
            )}
          </div>

          <form
            className="prompt-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendPrompt();
            }}
          >
            <textarea
              className="prompt-input"
              disabled={!activeSession || isSendingPrompt}
              placeholder="Ask Kimi for help with a coding task..."
              rows={4}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="prompt-actions">
              <span className="helper-text">
                {activeSession
                  ? draft.providerType === "kimi"
                    ? runtimeHealth?.cliAvailable
                      ? runtimeHealth.loggedIn
                        ? "Kimi runtime path is enabled. If the request fails, the session will show a runtime note."
                        : "Kimi provider is selected, but local login is still required."
                      : "Kimi provider is selected, but local Kimi CLI is not installed."
                    : "Compatible providers still use the placeholder path for now."
                  : "Create a session first to unlock the prompt box."}
              </span>
              <div className="prompt-action-group">
                <span className="char-count">{prompt.trim().length} chars</span>
                <button
                  className="primary-button"
                  disabled={!activeSession || !prompt.trim() || isSendingPrompt}
                  type="submit"
                >
                  {isSendingPrompt ? "Sending..." : "Send prompt"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

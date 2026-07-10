import { useEffect, useMemo, useState } from "react";
import { getActionTemplates } from "../lib/action-templates";
import {
  appCopy,
  desktopShellLabels,
  getRuntimeStatusLabel,
  integrationModeLabels,
  messageRoleLabels,
  providerModeLabels,
  runtimeStatusLabels
} from "../lib/copy";
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
  SettingsValidation
} from "../shared/contracts";

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
      setSaveMessage(appCopy.setup.saveSuccess);
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
        title: appCopy.runtime.requestInProgressTitle,
        detail: appCopy.runtime.requestInProgressDetail
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
          content: appCopy.runtime.generatingResponse,
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
                title: appCopy.runtime.approvalSentTitle,
                detail: decision === "approve"
                  ? appCopy.runtime.approvalApprovedDetail
                  : appCopy.runtime.approvalRejectedDetail
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
      setDiagnosticsCopyState(appCopy.sessions.diagnosticsCopied);
    } catch {
      setDiagnosticsCopyState(appCopy.sessions.diagnosticsCopyFailed);
    }
  }

  const hasCompletedOnboarding = bootstrap?.settings.hasCompletedOnboarding ?? false;
  const currentStateLabel = bootstrap ? getRuntimeStatusLabel(bootstrap.runtimeStatus) : "连接中";
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
          <p className="eyebrow">{appCopy.hero.eyebrow}</p>
          <div className="hero-badges" aria-label={appCopy.hero.highlightsLabel}>
            <span className="hero-badge">{appCopy.hero.beginnerBadge}</span>
            <span className="hero-badge">{appCopy.hero.nativeBadge}</span>
            <span className="hero-badge">{appCopy.hero.localBadge}</span>
          </div>
        </div>

        <div className="hero-layout">
          <div className="hero-copy">
            <h1>{appCopy.hero.title}</h1>
            <p className="lede">{appCopy.hero.lede}</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => void handleSave()}>
                {hasCompletedOnboarding ? appCopy.hero.refreshSetup : appCopy.hero.startSetup}
              </button>
              <span className="hero-note">
                {appCopy.hero.currentState}：<strong>{currentStateLabel}</strong>
              </span>
            </div>
          </div>

          <aside className="hero-preview" aria-label={appCopy.hero.previewLabel}>
            <div className="preview-header">
              <span className="preview-dot preview-dot-active" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>

            <div className="preview-card">
              <p className="preview-label">{appCopy.hero.workflowDirectionLabel}</p>
              <h2>{appCopy.hero.workflowDirectionTitle}</h2>
              <p>{appCopy.hero.workflowDirectionBody}</p>
            </div>

            <div className="preview-metrics">
              <div>
                <dt>{appCopy.hero.defaultShell}</dt>
                <dd>Electron</dd>
              </div>
              <div>
                <dt>{appCopy.hero.runtimeMode}</dt>
                <dd>{integrationModeLabels[bootstrap?.appInfo.integrationMode ?? "sdk-first"]}</dd>
              </div>
              <div>
                <dt>{appCopy.hero.focus}</dt>
                <dd>{appCopy.hero.focusValue}</dd>
              </div>
              <div>
                <dt>{appCopy.hero.provider}</dt>
                <dd>{currentProviderProfile.label}</dd>
              </div>
              <div>
                <dt>{appCopy.hero.kimiCli}</dt>
                <dd>
                  {runtimeHealth?.cliAvailable
                    ? runtimeHealth.loggedIn
                      ? appCopy.hero.kimiCliReady
                      : appCopy.hero.kimiCliLoginRequired
                    : appCopy.hero.kimiCliMissing}
                </dd>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>{appCopy.overview.whatAppDoesTitle}</h2>
          <p>{appCopy.overview.whatAppDoesBody}</p>
          <ul className="mini-list">
            {appCopy.overview.featureList.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="card">
          <h2>{appCopy.overview.runtimeStatesTitle}</h2>
          <p>{appCopy.overview.runtimeStatesBody}</p>
          <div className="status-list">
            {Object.entries(runtimeStatusLabels).map(([status, label]) => (
              <span className="status-pill" key={status}>
                {label}
              </span>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>{appCopy.overview.appStatusTitle}</h2>
          <p>
            {bootstrap
              ? appCopy.overview.appConnected(
                  bootstrap.appInfo.productName,
                  desktopShellLabels[bootstrap.appInfo.desktopShell]
                )
              : appCopy.overview.appWaiting}
          </p>
          {bootstrap ? (
            <dl className="meta">
              <div>
                <dt>{appCopy.overview.version}</dt>
                <dd>{bootstrap.appInfo.version}</dd>
              </div>
              <div>
                <dt>{appCopy.overview.mode}</dt>
                <dd>{integrationModeLabels[bootstrap.appInfo.integrationMode]}</dd>
              </div>
              <div>
                <dt>{appCopy.overview.currentState}</dt>
                <dd>{getRuntimeStatusLabel(bootstrap.runtimeStatus)}</dd>
              </div>
            </dl>
          ) : null}
        </article>
      </section>

      <section className="showcase-grid">
        <article className="card feature-card">
          <p className="eyebrow">{appCopy.showcase.struggleEyebrow}</p>
          <h2>{appCopy.showcase.struggleTitle}</h2>
          <p>{appCopy.showcase.struggleBody}</p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">{appCopy.showcase.productEyebrow}</p>
          <h2>{appCopy.showcase.productTitle}</h2>
          <p>{appCopy.showcase.productBody}</p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">{appCopy.showcase.shipEyebrow}</p>
          <h2>{appCopy.showcase.shipTitle}</h2>
          <p>{appCopy.showcase.shipBody}</p>
        </article>
      </section>

      <section className="setup-panel">
        <article className="setup-card">
          <div className="setup-copy">
            <p className="eyebrow">{appCopy.setup.eyebrow}</p>
            <h2>{hasCompletedOnboarding ? appCopy.setup.readyTitle : appCopy.setup.startTitle}</h2>
            <p>{appCopy.setup.intro}</p>
            <ul className="setup-list">
              {appCopy.setup.bulletList.map((item) => <li key={item}>{item}</li>)}
            </ul>

            <div className="setup-status-panel">
              <div>
                <dt>{appCopy.setup.productState}</dt>
                <dd>{hasCompletedOnboarding ? appCopy.setup.setupComplete : appCopy.setup.waitingForConfiguration}</dd>
              </div>
              <div>
                <dt>{appCopy.setup.nextMilestone}</dt>
                <dd>{appCopy.setup.nextMilestoneValue}</dd>
              </div>
              <div>
                <dt>{appCopy.setup.providerMode}</dt>
                <dd>{providerModeLabels[currentProviderProfile.providerMode]}</dd>
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
                      ? appCopy.setup.runtimeReadyTitle
                      : appCopy.setup.runtimeLoginTitle
                    : appCopy.setup.runtimeMissingTitle}
                </strong>
                <p>
                  {runtimeHealth.cliAvailable
                    ? runtimeHealth.loggedIn
                      ? appCopy.setup.runtimeReadyDetail(runtimeHealth.configuredModel)
                      : appCopy.setup.runtimeLoginDetail
                    : appCopy.setup.runtimeMissingDetail}
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
              <span>{appCopy.setup.provider}</span>
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
              <span>{appCopy.setup.apiKey}</span>
              <input
                autoComplete="off"
                name="apiKey"
                placeholder={appCopy.setup.apiKeyPlaceholder(currentProviderProfile.label)}
                type="password"
                value={draft.apiKey}
                onChange={(event) => updateField("apiKey", event.target.value)}
              />
              <small>{appCopy.setup.apiKeyHelp}</small>
              {validation.fieldErrors.apiKey ? (
                <strong className="error-text">{validation.fieldErrors.apiKey}</strong>
              ) : null}
            </label>

            <label className="field">
              <span>{appCopy.setup.defaultModel}</span>
              <input
                name="defaultModel"
                placeholder={currentProviderProfile.defaultModel}
                value={draft.defaultModel}
                onChange={(event) => updateField("defaultModel", event.target.value)}
              />
              <small>{appCopy.setup.defaultModelHelp}</small>
              {validation.fieldErrors.defaultModel ? (
                <strong className="error-text">{validation.fieldErrors.defaultModel}</strong>
              ) : null}
            </label>

            <label className="field">
              <span>{appCopy.setup.baseUrl}</span>
              <input
                name="baseUrl"
                placeholder={currentProviderProfile.baseUrl}
                value={draft.baseUrl}
                onChange={(event) => updateField("baseUrl", event.target.value)}
              />
              <small>{appCopy.setup.baseUrlHelp}</small>
              {validation.fieldErrors.baseUrl ? (
                <strong className="error-text">{validation.fieldErrors.baseUrl}</strong>
              ) : null}
            </label>

            <div className="actions-row">
              <button className="primary-button" disabled={!validation.isValid || isSaving} type="submit">
                {isSaving ? appCopy.setup.saving : hasCompletedOnboarding ? appCopy.setup.updateSetup : appCopy.setup.saveSetup}
              </button>
              <span className="helper-text">
                {hasCompletedOnboarding
                  ? appCopy.setup.canEditAnyTime
                  : appCopy.setup.onlyNeedOnce}
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
              <p className="eyebrow">{appCopy.sessions.eyebrow}</p>
              <h2>{appCopy.sessions.title}</h2>
            </div>
            <button className="secondary-button" disabled={isCreatingSession} type="button" onClick={() => void handleCreateSession()}>
              {isCreatingSession ? appCopy.sessions.creating : appCopy.sessions.newSession}
            </button>
          </div>

          <div className="session-list">
            {sessions.length === 0 ? (
                <div className="empty-state">
                <p>{appCopy.sessions.emptyTitle}</p>
                <span>{appCopy.sessions.emptyBody}</span>
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
                  <span>{getRuntimeStatusLabel(session.status)}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="session-main card">
          <div className="session-main-header">
            <div>
              <p className="eyebrow">{appCopy.sessions.conversationEyebrow}</p>
              <h2>{activeSession ? activeSession.title : appCopy.sessions.createFirstSession}</h2>
              {activeSession ? (
                <div className="session-meta-row">
                  <span>{activeSession.providerLabel}</span>
                  <span>{activeSession.model}</span>
                  <span>{appCopy.sessions.messageCount(messageCount)}</span>
                </div>
              ) : null}
            </div>
            <span className="session-state-pill">
              {activeSession ? getRuntimeStatusLabel(activeSession.status) : appCopy.sessions.notStarted}
            </span>
          </div>

          <div className="message-list">
            {activeSession ? (
              <section className="action-template-panel" aria-label={appCopy.sessions.guidedActionsLabel}>
                <div className="action-template-header">
                  <div>
                    <strong>{appCopy.sessions.quickStartsTitle}</strong>
                    <p>{appCopy.sessions.quickStartsBody}</p>
                  </div>
                  <span>{appCopy.sessions.templatesCount(actionTemplates.length)}</span>
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
                        {appCopy.sessions.runTemplate}
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
              <section className="approval-panel" aria-label={appCopy.sessions.approvalLabel}>
                <div className="approval-copy">
                  <strong>{appCopy.sessions.approvalRequired}</strong>
                  <p>{activeSession.pendingApproval.description}</p>
                  <span>{appCopy.sessions.approvalAction}：{activeSession.pendingApproval.action}</span>
                </div>
                <div className="approval-actions">
                  <button
                    className="secondary-button"
                    disabled={isResolvingApproval}
                    type="button"
                    onClick={() => void handleResolveApproval("reject")}
                  >
                    {isResolvingApproval ? appCopy.sessions.sending : appCopy.sessions.reject}
                  </button>
                  <button
                    className="primary-button"
                    disabled={isResolvingApproval}
                    type="button"
                    onClick={() => void handleResolveApproval("approve")}
                  >
                    {isResolvingApproval ? appCopy.sessions.sending : appCopy.sessions.approve}
                  </button>
                </div>
              </section>
            ) : null}

            {activeSession?.runtimeLogs?.length ? (
              <section className="runtime-log-panel" aria-label={appCopy.sessions.runtimeLogLabel}>
                <div className="runtime-log-header">
                  <strong>{appCopy.sessions.runtimeActivity}</strong>
                  <span>{appCopy.sessions.eventCount(activeSession.runtimeLogs.length)}</span>
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
              <section className="diagnostics-panel" aria-label={appCopy.sessions.diagnosticsLabel}>
                <div className="diagnostics-header">
                  <div>
                    <strong>{appCopy.sessions.diagnostics}</strong>
                    <p>{appCopy.sessions.diagnosticsBody}</p>
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
                      {isDiagnosticsOpen ? appCopy.sessions.hideReport : appCopy.sessions.showReport}
                    </button>
                    <button className="secondary-button" type="button" onClick={() => void handleCopyDiagnostics()}>
                      {appCopy.sessions.copyReport}
                    </button>
                  </div>
                </div>
                {diagnosticsCopyState ? <span className="diagnostics-copy-state">{diagnosticsCopyState}</span> : null}
                {isDiagnosticsOpen ? (
                  <textarea
                    readOnly
                    aria-label={appCopy.sessions.diagnosticsReportLabel}
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
                    <span className="message-role">{messageRoleLabels[message.role]}</span>
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
                <p>{appCopy.sessions.emptyConversationTitle}</p>
                <span>{appCopy.sessions.emptyConversationBody}</span>
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
              placeholder={appCopy.prompt.placeholder}
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
                        ? appCopy.prompt.kimiReady
                        : appCopy.prompt.kimiLoginRequired
                      : appCopy.prompt.kimiCliMissing
                    : appCopy.prompt.compatiblePlaceholder
                  : appCopy.prompt.createSessionFirst}
              </span>
              <div className="prompt-action-group">
                <span className="char-count">{appCopy.prompt.chars(prompt.trim().length)}</span>
                <button
                  className="primary-button"
                  disabled={!activeSession || !prompt.trim() || isSendingPrompt}
                  type="submit"
                >
                  {isSendingPrompt ? appCopy.prompt.sendingPrompt : appCopy.prompt.sendPrompt}
                </button>
              </div>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

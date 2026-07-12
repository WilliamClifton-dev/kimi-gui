export type RuntimeStatus =
  | "idle"
  | "validating"
  | "ready"
  | "streaming"
  | "awaiting_approval"
  | "completed"
  | "failed";

export type CredentialCheck =
  | { status: "valid" }
  | { status: "invalid"; reason: string };

export type KimiEnvironmentReport = {
  status: "ready" | "missing" | "setup_required";
  cliAvailable: boolean;
  cliVersion: string | null;
  loggedIn: boolean;
  configuredModel: string | null;
  summary: string;
  nextAction: string;
};

export type KimiWebLaunchResult = {
  ok: boolean;
  message: string;
};

export type AppInfo = {
  productName: string;
  version: string;
  desktopShell: "electron";
  integrationMode: "sdk-first";
};

export type ProviderType =
  | "kimi"
  | "openai"
  | "deepseek"
  | "anthropic"
  | "gemini";

export type ProviderMode = "kimi-native" | "compatible";

export type SettingsDraft = {
  providerType: ProviderType;
  apiKey: string;
  defaultModel: string;
  baseUrl: string;
};

export type SettingsRecord = SettingsDraft & {
  providerMode: ProviderMode;
  hasCompletedOnboarding: boolean;
};

export type SettingsValidation = {
  isValid: boolean;
  fieldErrors: Partial<Record<keyof SettingsDraft, string>>;
};

export type BootstrapData = {
  appInfo: AppInfo;
  settings: SettingsRecord;
  runtimeStatus: RuntimeStatus;
  runtimeHealth: {
    cliAvailable: boolean;
    loggedIn: boolean;
    configuredModel: string | null;
  };
};

export type SessionSummary = {
  id: string;
  title: string;
  status: RuntimeStatus;
  updatedAt: string;
};

export type SessionMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type SessionDetail = SessionSummary & {
  providerLabel: string;
  model: string;
  runtimeNote?: {
    level: "info" | "warn" | "error";
    title: string;
    detail: string;
  };
  messages: SessionMessage[];
  runtimeLogs?: RuntimeLogEntry[];
  pendingApproval?: PendingApproval | null;
};

export type SessionStreamUpdate = {
  sessionId: string;
  status: Extract<RuntimeStatus, "streaming" | "awaiting_approval">;
  updatedAt: string;
  assistantText?: string;
  runtimeNote?: SessionDetail["runtimeNote"];
  runtimeLog?: RuntimeLogEntry;
  pendingApproval?: PendingApproval | null;
};

export type ActionTemplate = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

export type RuntimeLogEntry = {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
};

export type PendingApproval = {
  id: string;
  action: string;
  description: string;
};

export type ApprovalDecision = "approve" | "reject";

export type DesktopBridge = {
  getBootstrapData: () => Promise<BootstrapData>;
  inspectKimiEnvironment: () => Promise<KimiEnvironmentReport>;
  selectProjectDirectory: () => Promise<string | null>;
  launchKimiWeb: (projectPath: string) => Promise<KimiWebLaunchResult>;
  saveSettings: (draft: SettingsDraft) => Promise<SettingsRecord>;
  listSessions: () => Promise<SessionSummary[]>;
  createSession: () => Promise<SessionDetail>;
  openSession: (sessionId: string) => Promise<SessionDetail | null>;
  sendPrompt: (sessionId: string, prompt: string) => Promise<SessionDetail>;
  resolveApproval: (sessionId: string, decision: ApprovalDecision) => Promise<void>;
  onSessionStream: (listener: (update: SessionStreamUpdate) => void) => () => void;
};

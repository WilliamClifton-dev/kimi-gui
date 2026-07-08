import type { BootstrapData, SessionDetail } from "../shared/contracts";

export function buildDiagnosticsReport(input: {
  bootstrap: BootstrapData | null;
  session: SessionDetail | null;
}) {
  const { bootstrap, session } = input;

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      app: bootstrap?.appInfo ?? null,
      runtimeHealth: bootstrap?.runtimeHealth ?? null,
      provider: bootstrap?.settings.providerType ?? null,
      providerMode: bootstrap?.settings.providerMode ?? null,
      session: session
        ? {
            id: session.id,
            title: session.title,
            status: session.status,
            model: session.model,
            providerLabel: session.providerLabel,
            messageCount: session.messages.length,
            runtimeLogCount: session.runtimeLogs?.length ?? 0,
            pendingApproval: session.pendingApproval,
            runtimeNote: session.runtimeNote
          }
        : null,
      latestRuntimeLogs: session?.runtimeLogs?.slice(-10) ?? []
    },
    null,
    2
  );
}

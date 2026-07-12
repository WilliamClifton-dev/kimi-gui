import type { SessionDetail, SessionSummary } from "../shared/contracts.js";

export function formatSessionTitle(messages: SessionDetail["messages"], fallbackTitle: string) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return fallbackTitle;
  }

  return firstUserMessage.content.slice(0, 48) || fallbackTitle;
}

export function sortSessionsByUpdatedAt(sessions: SessionSummary[]) {
  return [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

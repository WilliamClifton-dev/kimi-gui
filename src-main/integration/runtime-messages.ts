export function mapKimiRuntimeError(code: string | undefined) {
  switch (code) {
    case "CLI_NOT_FOUND":
      return {
        title: "Kimi CLI was not found",
        detail: "Install Kimi CLI locally and make sure the `kimi` command is available in your PATH."
      };
    case "HANDSHAKE_TIMEOUT":
      return {
        title: "Kimi runtime did not start in time",
        detail: "The local Kimi process did not finish startup. Try again after confirming the CLI can launch normally."
      };
    case "LLM_NOT_SET":
      return {
        title: "No Kimi model is configured",
        detail: "Check your provider setup and confirm a valid Kimi model is selected."
      };
    case "CHAT_PROVIDER_ERROR":
      return {
        title: "The Kimi provider rejected the request",
        detail: "Check your API key, base URL, login state, or model configuration."
      };
    default:
      return {
        title: "Kimi runtime request failed",
        detail: "Make sure local Kimi CLI is installed and logged in before using the real adapter path."
      };
  }
}

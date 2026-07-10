export function mapKimiRuntimeError(code: string | undefined) {
  switch (code) {
    case "CLI_NOT_FOUND":
      return {
        title: "没有找到 Kimi CLI",
        detail: "请先在本机安装 Kimi CLI，并确认命令行可以直接运行 `kimi`。"
      };
    case "HANDSHAKE_TIMEOUT":
      return {
        title: "Kimi 运行时启动超时",
        detail: "本地 Kimi 进程没有及时完成启动。请先确认 Kimi CLI 能正常运行，然后重试。"
      };
    case "LLM_NOT_SET":
      return {
        title: "还没有配置 Kimi 模型",
        detail: "请检查提供方设置，并确认已经选择有效的 Kimi 模型。"
      };
    case "CHAT_PROVIDER_ERROR":
      return {
        title: "Kimi 提供方拒绝了请求",
        detail: "请检查 API Key、Base URL、登录状态和模型配置。"
      };
    default:
      return {
        title: "Kimi 运行请求失败",
        detail: "请确认本机已经安装 Kimi CLI 并完成登录，然后再重试。"
      };
  }
}
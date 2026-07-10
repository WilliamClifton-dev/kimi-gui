import { describe, expect, it } from "vitest";
import { mapKimiRuntimeError } from "../../src-main/integration/runtime-messages";

describe("mapKimiRuntimeError", () => {
  it("maps CLI_NOT_FOUND to an install hint", () => {
    expect(mapKimiRuntimeError("CLI_NOT_FOUND")).toEqual({
      title: "没有找到 Kimi CLI",
      detail: "请先在本机安装 Kimi CLI，并确认命令行可以直接运行 `kimi`。"
    });
  });

  it("falls back to a generic runtime message", () => {
    expect(mapKimiRuntimeError("UNKNOWN")).toEqual({
      title: "Kimi 运行请求失败",
      detail: "请确认本机已经安装 Kimi CLI 并完成登录，然后再重试。"
    });
  });
});

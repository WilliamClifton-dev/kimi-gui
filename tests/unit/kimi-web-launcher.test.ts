import { describe, expect, it, vi } from "vitest";
import { launchKimiWeb } from "../../src-main/integration/kimi-web-launcher";

describe("launchKimiWeb", () => {
  it("launches the official web UI in the selected directory without a shell", async () => {
    const unref = vi.fn();
    const spawnProcess = vi.fn(() => ({
      pid: 42,
      unref,
      once: (event: string, listener: () => void) => {
        if (event === "spawn") listener();
      }
    }));

    const result = await launchKimiWeb("D:\\Projects\\demo", {
      isDirectory: () => true,
      spawnProcess
    });

    expect(spawnProcess).toHaveBeenCalledWith("kimi", ["web"], {
      cwd: "D:\\Projects\\demo",
      detached: true,
      shell: false,
      stdio: "ignore",
      windowsHide: true
    });
    expect(result).toEqual({
      ok: true,
      message: "Kimi Web 正在浏览器中打开。"
    });
    expect(unref).toHaveBeenCalled();
  });

  it("rejects a missing directory before spawning", async () => {
    const spawnProcess = vi.fn();

    const result = await launchKimiWeb("D:\\missing", {
      isDirectory: () => false,
      spawnProcess
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("项目文件夹");
    expect(spawnProcess).not.toHaveBeenCalled();
  });

  it("returns beginner-readable guidance when launch emits an error", async () => {
    const result = await launchKimiWeb("D:\\Projects\\demo", {
      isDirectory: () => true,
      spawnProcess: () => ({
        unref: vi.fn(),
        once: (event: string, listener: () => void) => {
          if (event === "error") listener();
        }
      })
    });

    expect(result).toEqual({
      ok: false,
      message: "无法启动 Kimi Web。请重新运行环境检测，确认 Kimi Code 已正确安装。"
    });
  });
});

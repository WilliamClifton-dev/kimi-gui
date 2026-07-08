import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { hasBlockingPublishFindings, scanWorkspacePublishSafety } from "../../src-main/tools/publish-audit";

const openAiFixtureKey = ["sk-", "abcdefghijklmnopqrstuvwxyz_123456"].join("");
const ignoredNodeModulesFixtureKey = ["sk-", "should-not-be-scanned-because-node-modules-is-ignored"].join("");

const tempRoots: string[] = [];

async function createTempWorkspace() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "kimi-gui-publish-audit-"));
  tempRoots.push(rootDir);
  return rootDir;
}

describe("scanWorkspacePublishSafety", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map(async (rootDir) => {
      await import("node:fs/promises").then(({ rm }) =>
        rm(rootDir, { recursive: true, force: true })
      );
    }));
  });

  it("finds ignored local artifacts and likely secrets while skipping safe templates", async () => {
    const rootDir = await createTempWorkspace();

    await mkdir(path.join(rootDir, "dist-electron"), { recursive: true });
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await mkdir(path.join(rootDir, "node_modules", "demo"), { recursive: true });

    await writeFile(path.join(rootDir, ".env.local"), "KIMI_API_KEY=kimi_local_only");
    await writeFile(path.join(rootDir, ".env.example"), "KIMI_API_KEY=your-key-here");
    await writeFile(path.join(rootDir, ".tmp-vite-out.log"), "renderer output");
    await writeFile(path.join(rootDir, "dist-electron", "main.js"), "console.log('build')");
    await writeFile(
      path.join(rootDir, "src", "demo.ts"),
      `export const apiKey = '${openAiFixtureKey}';`
    );
    await writeFile(
      path.join(rootDir, "node_modules", "demo", "fixture.js"),
      `export const apiKey = '${ignoredNodeModulesFixtureKey}';`
    );

    const result = await scanWorkspacePublishSafety(rootDir);

    expect(result.ignoredArtifacts).toEqual([
      {
        path: ".env.local",
        reason: "Environment files may contain secrets."
      },
      {
        path: ".tmp-vite-out.log",
        reason: "Log files should stay local."
      },
      {
        path: "dist-electron/",
        reason: "Build output should not be committed."
      },
      {
        path: "node_modules/",
        reason: "Dependencies should not be committed."
      }
    ]);
    expect(result.secretFindings).toEqual([
      {
        path: "src/demo.ts",
        reason: "Possible secret detected in file content."
      }
    ]);
    expect(hasBlockingPublishFindings(result)).toBe(true);
  });

  it("reports warning-only status when only ignored local artifacts are present", async () => {
    const rootDir = await createTempWorkspace();

    await writeFile(path.join(rootDir, ".tmp-vite-err.log"), "renderer warning");

    const result = await scanWorkspacePublishSafety(rootDir);

    expect(result.secretFindings).toEqual([]);
    expect(result.ignoredArtifacts).toEqual([
      {
        path: ".tmp-vite-err.log",
        reason: "Log files should stay local."
      }
    ]);
    expect(hasBlockingPublishFindings(result)).toBe(false);
  });
});

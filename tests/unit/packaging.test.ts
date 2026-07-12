import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPackagedRendererPath } from "../../src-main/window-paths";

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
) as {
  main: string;
  scripts: Record<string, string>;
  build?: {
    appId?: string;
    files?: string[];
    win?: { target?: string[]; icon?: string };
    nsis?: { artifactName?: string };
    portable?: { artifactName?: string };
  };
};

describe("desktop packaging", () => {
  it("uses Node-compatible extensions in compiled main-process imports", () => {
    const sourceRoots = ["src-main", "src/lib"];
    const invalidImports = sourceRoots.flatMap((sourceRoot) => {
      const sourceFiles = fs
        .readdirSync(path.resolve(process.cwd(), sourceRoot), { recursive: true })
        .filter((file): file is string => typeof file === "string" && file.endsWith(".ts"));

      return sourceFiles.flatMap((file) => {
        const source = fs.readFileSync(path.resolve(process.cwd(), sourceRoot, file), "utf8");
        return [...source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)]
          .map((match) => `${sourceRoot}/${file}: ${match[1]}`)
          .filter((entry) => !entry.endsWith(".js"));
      });
    });

    expect(invalidImports).toEqual([]);
  });

  it("points Electron at the compiled main process entry", () => {
    expect(packageJson.main).toBe("dist-electron/src-main/main.js");
  });

  it("resolves the packaged renderer outside dist-electron", () => {
    const projectRoot = path.resolve(process.cwd(), ".tmp-packaging-project");
    const mainDirectory = path.join(projectRoot, "dist-electron", "src-main");

    expect(getPackagedRendererPath(mainDirectory))
      .toBe(path.join(projectRoot, "dist", "index.html"));
  });

  it("defines Windows installer and portable build targets", () => {
    expect(packageJson.scripts["dist:win"]).toContain("electron-builder");
    expect(packageJson.scripts["dist:win"]).toContain("--publish never");
    expect(packageJson.build?.appId).toBe("dev.williamclifton.kimigui");
    expect(packageJson.build?.files).toContain("dist/**/*");
    expect(packageJson.build?.files).toContain("dist-electron/**/*");
    expect(packageJson.build?.win?.target).toEqual(["nsis", "portable"]);
    expect(packageJson.build?.win?.icon).toBe("assets/icon.ico");
    expect(fs.existsSync(path.resolve(process.cwd(), "assets/icon.ico"))).toBe(true);
    expect(packageJson.build?.nsis?.artifactName).toContain("Setup");
    expect(packageJson.build?.portable?.artifactName).toContain("Portable");
  });
  it("publishes Windows artifacts through the manual release workflow", () => {
    const workflow = fs.readFileSync(
      path.resolve(process.cwd(), ".github/workflows/release-windows.yml"),
      "utf8"
    );

    const normalizedWorkflow = workflow.replaceAll("\r\n", "\n");

    expect(normalizedWorkflow).not.toContain("push:\n    tags:");
    expect(normalizedWorkflow).toContain("workflow_dispatch:");
    expect(normalizedWorkflow).toContain("version:");
    expect(workflow).toContain("npm run dist:win");
    expect(workflow).toContain("gh release create");
    expect(workflow).toContain("gh release upload");
  });
});

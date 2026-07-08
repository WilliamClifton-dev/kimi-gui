import { describe, expect, it } from "vitest";
import { auditPublishSafety } from "../../src/lib/publish-audit";

const kimiFixtureKey = ["kimi_", "abcdefghijklmnopqrstuvwxyz123456"].join("");

describe("auditPublishSafety", () => {
  it("flags files that should not be committed to a public repository", () => {
    const result = auditPublishSafety({
      paths: [
        "README.md",
        "dist-electron/main.js",
        ".env.local",
        ".tmp-vite-out.log",
        "src/app/App.tsx"
      ]
    });

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
        path: "dist-electron/main.js",
        reason: "Build output should not be committed."
      }
    ]);
  });

  it("does not flag safe template files such as .env.example", () => {
    const result = auditPublishSafety({
      paths: [".env.example", "docs/release-checklist.md"]
    });

    expect(result.ignoredArtifacts).toEqual([]);
  });

  it("flags likely real API keys in file contents", () => {
    const result = auditPublishSafety({
      paths: ["src/demo.ts", "docs/spec.md"],
      fileContents: {
        "src/demo.ts": `const key = '${kimiFixtureKey}';`,
        "docs/spec.md": "Use the API key field in settings."
      }
    });

    expect(result.secretFindings).toEqual([
      {
        path: "src/demo.ts",
        reason: "Possible secret detected in file content."
      }
    ]);
  });
});

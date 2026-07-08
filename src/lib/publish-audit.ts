export type PublishAuditFinding = {
  path: string;
  reason: string;
};

export type PublishAuditResult = {
  ignoredArtifacts: PublishAuditFinding[];
  secretFindings: PublishAuditFinding[];
};

type AuditInput = {
  paths: string[];
  fileContents?: Record<string, string>;
};

const PATH_RULES: Array<{
  matches: (path: string) => boolean;
  reason: string;
}> = [
  {
    matches: (path) =>
      path === "dist/" ||
      path.startsWith("dist/") ||
      path === "dist-electron/" ||
      path.startsWith("dist-electron/") ||
      path === "build/" ||
      path.startsWith("build/") ||
      path === "out/" ||
      path.startsWith("out/") ||
      path === "coverage/" ||
      path.startsWith("coverage/") ||
      path === "release/" ||
      path.startsWith("release/"),
    reason: "Build output should not be committed."
  },
  {
    matches: (path) => path === "node_modules/" || path.startsWith("node_modules/"),
    reason: "Dependencies should not be committed."
  },
  {
    matches: (path) => path === ".env" || (path.startsWith(".env.") && path !== ".env.example"),
    reason: "Environment files may contain secrets."
  },
  {
    matches: (path) => path.endsWith(".log"),
    reason: "Log files should stay local."
  }
];

const SECRET_PATTERNS = [
  /kimi_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/
];

export function auditPublishSafety(input: AuditInput): PublishAuditResult {
  const ignoredArtifacts: PublishAuditFinding[] = [];
  const secretFindings: PublishAuditFinding[] = [];

  for (const path of input.paths) {
    const normalized = path.replace(/\\/g, "/");
    const matchingRule = PATH_RULES.find((rule) => rule.matches(normalized));

    if (matchingRule) {
      ignoredArtifacts.push({
        path: normalized,
        reason: matchingRule.reason
      });
    }
  }

  for (const [path, content] of Object.entries(input.fileContents ?? {})) {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
      secretFindings.push({
        path: path.replace(/\\/g, "/"),
        reason: "Possible secret detected in file content."
      });
    }
  }

  return {
    ignoredArtifacts: ignoredArtifacts.sort((left, right) => left.path.localeCompare(right.path)),
    secretFindings: secretFindings.sort((left, right) => left.path.localeCompare(right.path))
  };
}

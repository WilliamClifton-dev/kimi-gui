import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditPublishSafety, type PublishAuditResult } from "../../src/lib/publish-audit.js";

const DIRECTORY_SKIP_NAMES = new Set([
  ".cache",
  ".git",
  ".tmp",
  "build",
  "coverage",
  "dist",
  "dist-electron",
  "node_modules",
  "out",
  "release",
  "tmp"
]);

const BINARY_EXTENSIONS = new Set([
  ".gif",
  ".ico",
  ".jpg",
  ".jpeg",
  ".node",
  ".pdf",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
  ".zip"
]);

const MAX_TEXT_FILE_BYTES = 1024 * 1024;

type WorkspaceAuditSnapshot = {
  paths: string[];
  fileContents: Record<string, string>;
};

function normalizeRelativePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function shouldSkipDirectory(relativePath: string, directoryName: string) {
  if (DIRECTORY_SKIP_NAMES.has(directoryName)) {
    return true;
  }

  return relativePath === "src-tauri/target";
}

async function collectWorkspaceAuditSnapshot(
  rootDir: string,
  currentRelativeDir = ""
): Promise<WorkspaceAuditSnapshot> {
  const entries = await readdir(path.join(rootDir, currentRelativeDir), { withFileTypes: true });
  const paths: string[] = [];
  const fileContents: Record<string, string> = {};

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = normalizeRelativePath(
      currentRelativeDir ? `${currentRelativeDir}/${entry.name}` : entry.name
    );

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(relativePath, entry.name)) {
        paths.push(`${relativePath}/`);
        continue;
      }

      const nestedSnapshot = await collectWorkspaceAuditSnapshot(rootDir, relativePath);
      paths.push(...nestedSnapshot.paths);
      Object.assign(fileContents, nestedSnapshot.fileContents);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    paths.push(relativePath);

    if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const absolutePath = path.join(rootDir, relativePath);
    const fileStat = await stat(absolutePath);
    if (fileStat.size > MAX_TEXT_FILE_BYTES) {
      continue;
    }

    fileContents[relativePath] = await readFile(absolutePath, "utf8");
  }

  return { paths, fileContents };
}

export async function scanWorkspacePublishSafety(rootDir: string): Promise<PublishAuditResult> {
  const snapshot = await collectWorkspaceAuditSnapshot(rootDir);
  return auditPublishSafety(snapshot);
}

export function hasBlockingPublishFindings(result: PublishAuditResult) {
  return result.secretFindings.length > 0;
}

export function formatPublishAuditReport(result: PublishAuditResult) {
  if (result.ignoredArtifacts.length === 0 && result.secretFindings.length === 0) {
    return "Publish safety audit is clean.";
  }

  const lines: string[] = [];

  if (result.ignoredArtifacts.length > 0) {
    lines.push("Ignored local artifacts:");
    for (const finding of result.ignoredArtifacts) {
      lines.push(`- ${finding.path}: ${finding.reason}`);
    }
  }

  if (result.secretFindings.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push("Blocking secret findings:");
    for (const finding of result.secretFindings) {
      lines.push(`- ${finding.path}: ${finding.reason}`);
    }
  }

  return lines.join("\n");
}

export async function runPublishAuditCli(rootDir: string) {
  const result = await scanWorkspacePublishSafety(rootDir);
  console.log(formatPublishAuditReport(result));
  return hasBlockingPublishFindings(result) ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const exitCode = await runPublishAuditCli(rootDir);
  process.exitCode = exitCode;
}

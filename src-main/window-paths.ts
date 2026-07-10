import path from "node:path";

export function getPackagedRendererPath(mainDirectory: string) {
  return path.resolve(mainDirectory, "../../dist/index.html");
}
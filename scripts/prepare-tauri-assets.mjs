import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist-tauri");

const entriesToCopy = [
  "index.html",
  "script.js",
  "css",
  "img"
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of entriesToCopy) {
  await cp(
    path.join(rootDir, entry),
    path.join(outputDir, entry),
    { recursive: true }
  );
}

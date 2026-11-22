import { bundle } from "@remotion/bundler";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Navigateur sans interface déjà présent sur la machine ; sinon Remotion télécharge le sien.
const candidates = [
  process.env.CHROME_BIN,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean);
export const browserExecutable = candidates.find((p) => existsSync(p)) ?? null;

export const makeBundle = () => bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });

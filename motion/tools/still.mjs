// Aperçus : node tools/still.mjs <id> <image> [<image> …] [--scale 0.5]
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { browserExecutable, makeBundle, root } from "./common.mjs";

const args = process.argv.slice(2);
const si = args.indexOf("--scale");
const scale = si >= 0 ? Number(args.splice(si, 2)[1]) : 0.5;
const [id, ...frames] = args;
const out = path.join(root, "out", "stills");
mkdirSync(out, { recursive: true });

const serveUrl = await makeBundle();
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
for (const fr of frames) {
  const frame = Math.min(Number(fr), composition.durationInFrames - 1);
  const output = path.join(out, `${id}-${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, scale, puppeteerInstance: browser, browserExecutable });
}
await browser.close({ silent: true });
console.log(`${frames.length} aperçus dans ${out}`);

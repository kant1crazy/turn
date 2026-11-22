// Rendu final : node tools/render.mjs <id>
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { browserExecutable, makeBundle, root } from "./common.mjs";

const id = process.argv[2];
if (!id) throw new Error("usage : node tools/render.mjs <id>");
mkdirSync(path.join(root, "out"), { recursive: true });

const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id, browserExecutable });
const outputLocation = path.join(root, "out", `${id}.mp4`);
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  crf: 18,
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  jpegQuality: 95,
  audioCodec: "aac",
  audioBitrate: "192k",
  outputLocation,
  browserExecutable,
  concurrency: Number(process.env.CONCURRENCY ?? 4),
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== last) console.log(`${pct} %`), (last = pct);
  },
});
console.log(outputLocation);

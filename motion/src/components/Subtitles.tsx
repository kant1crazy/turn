import React, { useMemo } from "react";
import { pop } from "../anim";
import { C, TEXT } from "../theme";
import type { Timeline, Word } from "../timeline";

type Chunk = { words: Word[]; start: number; end: number };

/** Regroupe les mots en blocs courts : césures manuelles (« / ») sinon 3 mots / 16 caractères. */
const buildChunks = (tl: Timeline): Chunk[] => {
  const chunks: Chunk[] = [];
  for (const line of tl.lines) {
    const manual = line.words.some((w) => w.b);
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) chunks.push({ words: cur, start: cur[0].s, end: cur[cur.length - 1].e });
      cur = [];
    };
    for (const w of line.words) {
      if (!manual) {
        const len = cur.reduce((n, x) => n + x.t.length + 1, 0) + w.t.length;
        if (cur.length >= 3 || (cur.length > 0 && len > 16)) flush();
      }
      cur.push(w);
      if (manual ? w.b : /[,.…!?:]$/.test(w.t)) flush();
    }
    flush();
  }
  // un bloc reste affiché jusqu'au suivant s'il enchaîne, sinon s'efface peu après la voix
  chunks.forEach((c, i) => {
    const next = chunks[i + 1];
    c.end = next && next.start - c.end < 0.3 ? next.start : c.end + 0.18;
  });
  return chunks;
};

export const Subtitles: React.FC<{ tl: Timeline; f: number; y?: number }> = ({ tl, f, y = 1345 }) => {
  const chunks = useMemo(() => buildChunks(tl), [tl]);
  const t = f / tl.fps;
  const chunk = chunks.find((c) => t >= c.start - 0.04 && t < c.end);
  if (!chunk) return null;

  const chars = chunk.words.reduce((n, w) => n + w.t.length + 1, -1);
  const size = chars <= 11 ? 96 : chars <= 15 ? 84 : chars <= 18 ? 74 : 66;
  const enter = pop(f, Math.round((chunk.start - 0.04) * tl.fps), { damping: 14, stiffness: 320, mass: 0.4 });

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        width: 860,
        top: y,
        transform: `translateY(-50%) scale(${0.82 + 0.18 * enter})`,
        textAlign: "center",
        fontFamily: TEXT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: -0.5,
      }}
    >
      {chunk.words.map((w, i) => {
        const active = t >= w.s && t < w.e;
        const spoken = t >= w.e;
        const kick = active ? pop(f, Math.round(w.s * tl.fps), { damping: 9, stiffness: 300, mass: 0.35 }) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 0.2em",
              color: active ? C.yellow : C.paper,
              opacity: active || spoken ? 1 : 0.92,
              transform: `translateY(${-size * 0.09 * kick}px) rotate(${active ? -2 : 0}deg)`,
              WebkitTextStroke: `${Math.round(size * 0.17)}px ${C.ink}`,
              paintOrder: "stroke fill",
              textShadow: `0 ${Math.round(size * 0.09)}px 0 ${C.ink}`,
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

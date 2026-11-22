import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, io, lerp, pop, prog } from "../anim";
import { C, DISPLAY, H, TEXT, W } from "../theme";

// ───────────── fonds ─────────────

type Pattern = "rays" | "dots" | "stripes" | "none";

const Rays: React.FC<{ f: number; tint: string; cx?: number; cy?: number }> = ({ f, tint, cx = 540, cy = 800 }) => {
  const n = 12;
  const R = 1800;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g transform={`translate(${cx} ${cy}) rotate(${f * 0.4})`}>
        {Array.from({ length: n }, (_, i) => {
          const a0 = (i * 2 * Math.PI) / n;
          const a1 = a0 + Math.PI / n;
          return (
            <path
              key={i}
              d={`M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} L${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`}
              fill={tint}
            />
          );
        })}
      </g>
    </svg>
  );
};

export const Backdrop: React.FC<{ color: string; f: number; pattern?: Pattern; tint?: string }> = ({
  color,
  f,
  pattern = "none",
  tint = "rgba(255,255,255,0.09)",
}) => (
  <AbsoluteFill style={{ backgroundColor: color, overflow: "hidden" }}>
    {pattern === "rays" && <Rays f={f} tint={tint} />}
    {pattern === "dots" && (
      <div
        style={{
          position: "absolute",
          inset: -100,
          backgroundImage: `radial-gradient(${tint} 7px, transparent 8px)`,
          backgroundSize: "80px 80px",
          transform: `translate(${(f * 1.1) % 80}px, ${(f * 1.1) % 80}px)`,
        }}
      />
    )}
    {pattern === "stripes" && (
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage: `repeating-linear-gradient(135deg, ${tint} 0 46px, transparent 46px 92px)`,
          transform: `translateX(${(f * 1.6) % 130.1}px)`,
        }}
      />
    )}
  </AbsoluteFill>
);

// ───────────── transitions ─────────────

export type WipeKind = "circle" | "up" | "down" | "left" | "diag" | "cut";

/** Révèle la scène entrante par-dessus la précédente. */
export const Wipe: React.FC<{ f: number; start: number; kind: WipeKind; children: React.ReactNode }> = ({
  f,
  start,
  kind,
  children,
}) => {
  const p = prog(f, start, 11, io);
  let clipPath: string | undefined;
  if (p < 1 && kind !== "cut") {
    if (kind === "circle") clipPath = `circle(${p * 125}% at 50% 62%)`;
    if (kind === "up") clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
    if (kind === "down") clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
    if (kind === "left") clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
    if (kind === "diag") clipPath = `polygon(0 0, ${p * 230}% 0, ${p * 230 - 110}% 100%, 0 100%)`;
  }
  return <AbsoluteFill style={{ clipPath }}>{children}</AbsoluteFill>;
};

export const Flash: React.FC<{ opacity: number; color?: string }> = ({ opacity, color = "#fff" }) =>
  opacity <= 0 ? null : <AbsoluteFill style={{ backgroundColor: color, opacity }} />;

/** Décale tout le contenu d'une scène (tremblement). */
export const Shaker: React.FC<{ s: { x: number; y: number }; children: React.ReactNode }> = ({ s, children }) => (
  <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>{children}</AbsoluteFill>
);

// ───────────── texte ─────────────

/**
 * Gros mot « autocollant » qui claque à l'écran, positionné par son centre.
 * À réserver au mot-clé d'une phrase : le sous-titre correspondant doit alors être masqué
 * (voir `hide` dans Subtitles) pour ne jamais afficher deux fois le même texte.
 */
export const BigWord: React.FC<{
  lines: string[];
  f: number;
  at: number;
  y: number;
  size: number;
  x?: number;
  color?: string;
  shadow?: string;
  rotate?: number;
  scale?: number;
  stroke?: number;
  /** Image à partir de laquelle le mot s'efface. */
  exitAt?: number;
}> = ({ lines, f, at, y, size, x = 540, color = C.paper, shadow = C.ink, rotate = -4, scale = 1, stroke = 0, exitAt }) => {
  const out = exitAt === undefined ? 0 : prog(f, exitAt, 5, Easing.in(Easing.cubic));
  if (f < at || out >= 1) return null;
  const p = pop(f, at, { damping: 10, stiffness: 230, mass: 0.6 });
  const s = lerp(2.3, 1, p) * scale * (1 - 0.4 * out);
  const off = size * 0.05;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: clamp((f - at + 1) / 2) * (1 - out),
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 0.98,
        color,
        textAlign: "center",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        textShadow: `${off}px ${off}px 0 ${shadow}`,
        WebkitTextStroke: stroke ? `${stroke}px ${shadow}` : undefined,
        paintOrder: "stroke fill",
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** Pastille « ? » pour les rares faits traités en devinette. */
export const Mystery: React.FC<{ f: number; at: number; until: number; x: number; y: number; size?: number }> = ({
  f,
  at,
  until,
  x,
  y,
  size = 170,
}) => {
  if (f < at || f >= until + 4) return null;
  const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
  const out = prog(f, until, 4, Easing.in(Easing.cubic));
  const pulse = 1 + 0.07 * Math.sin((f - at) * 0.45);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: C.yellow,
        border: `${size * 0.06}px solid ${C.ink}`,
        transform: `scale(${p * pulse * (1 - out)}) rotate(${Math.sin((f - at) * 0.2) * 8}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: DISPLAY,
        fontSize: size * 0.68,
        color: C.ink,
        boxSizing: "border-box",
      }}
    >
      ?
    </div>
  );
};

// ───────────── points ─────────────

export const POINTS = 8;
export const dotCenter = (i: number) => ({ x: 1003 - (POINTS - 1 - i) * 46, y: 240 });

/**
 * Bandeau permanent, volontairement discret : le thème à gauche, les points à droite.
 * Chaque point s'allume sur place (anneau + rebond) pour ne pas détourner le regard du centre.
 */
export const TopBar: React.FC<{ f: number; from: number; until: number; label: string; points: number[] }> = ({
  f,
  from,
  until,
  label,
  points,
}) => {
  if (f < from) return null;
  const inP = pop(f, from, { damping: 12 });
  const out = prog(f, until - 8, 8);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 206,
          height: 68,
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          background: C.ink,
          color: C.paper,
          border: "3px solid rgba(255,247,232,0.28)",
          borderRadius: 34,
          boxSizing: "border-box",
          fontFamily: TEXT,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 1,
          transform: `translateY(${(1 - inP) * -160}px)`,
        }}
      >
        {label}
      </div>
      {points.map((at, i) => {
        const c = dotCenter(i);
        const appear = pop(f, from + 3 + i * 2, { damping: 10, stiffness: 260, mass: 0.5 });
        const d = f - at;
        const filled = d >= 0;
        const bump = filled ? 1 + 1.1 * Math.exp(-d / 3.5) * Math.cos(d * 0.9) : 1;
        const ring = 34 + d * 9;
        return (
          <React.Fragment key={i}>
            {d >= 0 && d < 14 && (
              <div
                style={{
                  position: "absolute",
                  left: c.x - ring / 2,
                  top: c.y - ring / 2,
                  width: ring,
                  height: ring,
                  borderRadius: "50%",
                  border: `6px solid ${C.yellow}`,
                  boxSizing: "border-box",
                  opacity: 1 - d / 14,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: c.x - 17,
                top: c.y - 17,
                width: 34,
                height: 34,
                borderRadius: "50%",
                boxSizing: "border-box",
                background: filled ? C.yellow : "rgba(13,13,18,0.45)",
                border: `4px solid ${filled ? C.ink : "rgba(255,247,232,0.75)"}`,
                transform: `scale(${appear * bump})`,
              }}
            />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

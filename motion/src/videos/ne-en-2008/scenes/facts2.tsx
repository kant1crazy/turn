import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { At, Svg } from "./facts1";

// ───────────── 4. Among Us (devinette) ─────────────

const PAWNS = [C.sky, C.green, C.yellow, C.magenta, C.orange];

/** Cinq pions qui se regardent en coin, le nom du jeu, puis celui du milieu vire au rouge. */
export const Among: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("among");
  const B = q.c("among.b");
  const C2 = q.c("among.c");
  const toi = q.c("among.c#toi");
  const t = f - start;

  const hide = prog(f, B - 2, 4, Easing.in(Easing.cubic)) - prog(f, C2 - 2, 6);
  const caught = pop(f, toi, { damping: 9, stiffness: 240, mass: 0.5 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.indigo} f={f} pattern="dots" tint="rgba(255,255,255,0.1)" />
      <Shaker s={shakes(f, [[B, 22], [toi, 26]])}>
        {PAWNS.map((col, i) => {
          const me = i === 2;
          const inP = pop(f, start + 3 + i * 2, { damping: 10 });
          const flee = me ? 0 : caught * (i < 2 ? -1 : 1) * 46;
          const x = 180 + i * 180 + flee;
          const look = f >= toi ? (me ? 0 : (i < 2 ? 1 : -1) * 13) : Math.sin(t * 0.13 + i * 1.7) * 13;
          const s = 1.2 * inP * (1 - hide) * (me ? 1 + 0.42 * caught : 1 - 0.1 * caught);
          return (
            <At key={i} x={x} y={800 + Math.sin(t * 0.25 + i) * 8} s={s} r={me ? 0 : flee * 0.18}>
              <svg width={200} height={330} viewBox="-100 -180 200 330" style={{ position: "absolute", left: -100, top: -180, overflow: "visible" }}>
                <path d="M-40 -66 L40 -66 L72 96 Q0 128 -72 96 Z" fill={me && f >= toi ? C.red : col} stroke={C.ink} strokeWidth={11} strokeLinejoin="round" />
                <circle cy={-104} r={56} fill={me && f >= toi ? C.red : col} stroke={C.ink} strokeWidth={11} />
                <circle cx={-20 + look} cy={-108} r={10} fill={C.ink} />
                <circle cx={20 + look} cy={-108} r={10} fill={C.ink} />
              </svg>
            </At>
          );
        })}
        <Mystery f={f} at={start + 12} until={B} x={540} y={470} size={210} />
        <BigWord lines={["Among", "Us"]} f={f} at={B} x={525} y={760} size={320} rotate={-4} shadow={C.red} exitAt={C2 - 3} />
      </Shaker>
      <Flash opacity={flash(f, B) + flash(f, toi, 6, 0.6)} color={f >= toi ? C.red : "#fff"} />
    </AbsoluteFill>
  );
};

// ───────────── 5. Squid Game (dit directement) ─────────────

/** Rond, triangle, carré ; le titre ; la pastille « -16 » ; puis « 12 ou 13 ». */
export const Squid: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("squid");
  const B = q.c("squid.a#Squid");
  const dec = q.c("squid.b");
  const aux = q.c("squid.b#aux");
  const treize = q.c("squid.c#douze");

  const shapesOut = prog(f, B - 2, 4, Easing.in(Easing.cubic));
  const badgeOut = prog(f, treize - 3, 4, Easing.in(Easing.cubic));
  const sw = { fill: "none", stroke: C.paper, strokeWidth: 30, strokeLinejoin: "round" as const };

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="stripes" tint="rgba(13,13,18,0.08)" />
      <Shaker s={shakes(f, [[B, 24], [aux, 14], [treize, 26]])}>
        {shapesOut < 1 &&
          [0, 1, 2].map((i) => (
            <At key={i} x={230 + i * 300} y={760 + Math.sin((f - start) * 0.22 + i * 1.2) * 16} s={pop(f, start + 3 + i * 6, { damping: 9 }) * (1 - shapesOut)}>
              <Svg size={300}>
                {i === 0 && <circle r={150} {...sw} />}
                {i === 1 && <polygon points="0,-160 172,140 -172,140" {...sw} />}
                {i === 2 && <rect x={-146} y={-146} width={292} height={292} {...sw} />}
              </Svg>
            </At>
          ))}
        <BigWord lines={["Squid", "Game"]} f={f} at={B} x={525} y={760} size={310} rotate={-4} exitAt={dec - 2} />
        {f >= aux && badgeOut < 1 && (
          <At s={lerp(2.2, 1, pop(f, aux, { damping: 10, stiffness: 230, mass: 0.6 })) * (1 - badgeOut)} r={-6}>
            <div
              style={{
                position: "absolute",
                left: -270,
                top: -270,
                width: 540,
                height: 540,
                borderRadius: "50%",
                background: C.paper,
                border: `40px solid ${C.ink}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: DISPLAY,
                fontSize: 300,
                color: C.ink,
                paddingTop: 14,
                boxShadow: "16px 18px 0 rgba(13,13,18,0.3)",
              }}
            >
              -16
            </div>
          </At>
        )}
        <BigWord lines={["12", "ou 13"]} f={f} at={treize} x={525} y={760} size={330} color={C.yellow} rotate={5} />
      </Shaker>
      <Flash opacity={flash(f, B) + flash(f, treize, 6, 0.6)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. ChatGPT (dit directement) ─────────────

const sparkle = "M0 -60 C8 -16 16 -8 60 0 C16 8 8 16 0 60 C-8 16 -16 8 -60 0 C-16 -8 -8 -16 0 -60 Z";
const LINES = [0.92, 1, 0.84, 0.96, 1, 0.7, 0.9, 0.5];

/** La bulle qui « écrit… », le nom, puis la copie qui se rédige toute seule. */
export const Chatgpt: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("chatgpt");
  const B = q.c("chatgpt.a#ChatGPT");
  const depuis = q.c("chatgpt.b");
  const tes = q.c("chatgpt.b#tes");
  const bien = q.c("chatgpt.b#bien");

  const bubbleOut = prog(f, B - 2, 4, Easing.in(Easing.cubic));
  const sheet = pop(f, depuis, { damping: 11 });
  const per = (bien - tes) / LINES.length;

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="dots" tint="rgba(13,13,18,0.08)" />
      <Shaker s={shakes(f, [[B, 24], [bien, 12]])}>
        {bubbleOut < 1 && (
          <At s={pop(f, start + 3, { damping: 10 }) * (1 - bubbleOut)} r={-3} y={760 + Math.sin((f - start) * 0.2) * 10}>
            <Svg size={760}>
              <path d="M-180 -110 H180 A40 40 0 0 1 220 -70 V60 A40 40 0 0 1 180 100 H-70 L-150 172 V100 H-180 A40 40 0 0 1 -220 60 V-70 A40 40 0 0 1 -180 -110 Z" transform="scale(0.86)" fill={C.paper} stroke={C.ink} strokeWidth={14} strokeLinejoin="round" />
              {[-76, 0, 76].map((x, i) => {
                const u = Math.max(0, Math.sin((f - start) * 0.34 - i * 0.9));
                return <circle key={x} cx={x} cy={-4 - u * 22} r={24} fill={C.ink} opacity={0.45 + 0.55 * u} />;
              })}
            </Svg>
          </At>
        )}
        <BigWord lines={["ChatGPT"]} f={f} at={B} x={525} y={760} size={290} rotate={-4} exitAt={depuis - 4} />
        {f >= depuis && (
          <At s={sheet} r={-4} y={770}>
            <div style={{ position: "absolute", left: -270, top: -350, width: 540, height: 700, borderRadius: 30, background: C.paper, boxShadow: "18px 20px 0 rgba(13,13,18,0.28)" }}>
              <div style={{ position: "absolute", left: 96, top: 0, bottom: 0, width: 6, background: "rgba(255,77,77,0.5)" }} />
              {LINES.map((w, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 130,
                    top: 86 + i * 72,
                    width: 350 * w * prog(f, tes + i * per, per, Easing.linear),
                    height: 24,
                    borderRadius: 12,
                    background: C.ink,
                  }}
                />
              ))}
            </div>
            {[[-300, -330, 1.5, 0], [300, -190, 1.1, 4], [270, 300, 1.3, 8]].map(([x, y, s, d], i) => (
              <svg key={i} width={140} height={140} viewBox="-70 -70 140 140" style={{ position: "absolute", left: x - 70, top: y - 70, overflow: "visible", transform: `scale(${pop(f, bien + d, { damping: 8 }) * s}) rotate(${Math.sin((f - bien) * 0.2 + i) * 12}deg)` }}>
                <path d={sparkle} fill={C.yellow} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
              </svg>
            ))}
          </At>
        )}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. la Coupe du monde 2026 (dit directement) ─────────────

const BURSTS: [number, number, number, string][] = [
  [0, 540, 640, C.yellow],
  [15, 290, 840, C.coral],
  [28, 770, 780, C.paper],
  [42, 470, 930, C.yellow],
  [55, 660, 570, C.coral],
  [68, 330, 640, C.paper],
];

/** Le ballon qui rebondit, « 14 juillet », puis le feu d'artifice. */
export const Mondial: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("mondial");
  const sortis = q.c("mondial.b");
  const B = q.c("mondial.b#quatorze");
  const feu = q.c("mondial.c#le");
  const t = f - start;

  const bounce = Math.abs(Math.sin(t * 0.17));
  const ballOut = prog(f, sortis, 12, Easing.in(Easing.quad));
  const squash = 1 - 0.14 * Math.max(0, 1 - bounce * 5);

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="rays" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shake(f, B, 26)}>
        {ballOut < 1 && (
          <At s={pop(f, start + 2, { damping: 11 })} x={540 + ballOut * 900} y={930 - bounce * 330 - ballOut * 200}>
            <div style={{ position: "absolute", transform: `scaleY(${squash}) scaleX(${2 - squash})` }}>
              <Svg size={470}>
                <g transform={`rotate(${t * 5 + ballOut * 300})`}>
                  <circle r={190} fill={C.paper} stroke={C.ink} strokeWidth={14} />
                  <polygon points={Array.from({ length: 5 }, (_, i) => `${72 * Math.cos((i * 72 - 90) * Math.PI / 180)},${72 * Math.sin((i * 72 - 90) * Math.PI / 180)}`).join(" ")} fill={C.ink} />
                  {Array.from({ length: 5 }, (_, i) => {
                    const a = ((i * 72 - 90) * Math.PI) / 180;
                    return <line key={i} x1={72 * Math.cos(a)} y1={72 * Math.sin(a)} x2={184 * Math.cos(a)} y2={184 * Math.sin(a)} stroke={C.ink} strokeWidth={12} />;
                  })}
                </g>
              </Svg>
            </div>
          </At>
        )}
        <BigWord lines={["14", "juillet"]} f={f} at={B} x={525} y={760} size={300} color={C.paper} shadow={C.red} rotate={-4} exitAt={feu - 6} />
        {f >= feu - 2 &&
          BURSTS.map(([d, x, y, col], i) => {
            const at = feu + 6 + d;
            const k = f - at;
            if (k < -8 || k > 24) return null;
            if (k < 0) {
              const u = (k + 8) / 8;
              return <div key={i} style={{ position: "absolute", left: x - 6, top: lerp(1180, y, u), width: 12, height: 80, borderRadius: 6, background: col, opacity: 0.9 }} />;
            }
            const e = 1 - Math.pow(1 - k / 24, 2.4);
            return (
              <At key={i} x={x} y={y + e * 30} o={1 - Math.pow(k / 24, 2)}>
                <Svg size={400}>
                  {Array.from({ length: 14 }, (_, j) => {
                    const a = (j / 14) * Math.PI * 2;
                    const r0 = 20 + e * 210;
                    const r1 = r0 + 70 * (1 - e * 0.5);
                    return <line key={j} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={col} strokeWidth={20} strokeLinecap="round" />;
                  })}
                </Svg>
              </At>
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

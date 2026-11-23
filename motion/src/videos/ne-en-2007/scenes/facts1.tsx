import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { Ball, Strike } from "./parts";

// ───────────── 1. les bracelets en élastiques (devinette) ─────────────

const BAND_COLORS = [C.coral, C.yellow, C.green, C.sky, C.magenta, C.orange, C.violet];
const BANDS = 13;
const RINGS = [
  { x: 300, y: 650 },
  { x: 540, y: 610 },
  { x: 780, y: 650 },
  { x: 420, y: 880 },
  { x: 660, y: 880 },
];

/** Un bras en silhouette qui se couvre de bracelets jusqu'au coude ; ils prennent leurs couleurs à la réponse. */
export const Loom: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("loom");
  const B = q.c("loom.b");
  const C3 = q.c("loom.c");
  const offert = q.c("loom.c#offert");
  const famille = q.c("loom.c#famille");

  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 13, stiffness: 160 });
  const up = glide(f, B, 140) - glide(f, C3 - 2, 120);
  const away = prog(f, offert - 2, 8, Easing.in(Easing.cubic));
  const kick = revealed ? 1 + 0.12 * Math.exp(-(f - B) / 4) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="dots" tint="rgba(13,13,18,0.1)" />
      <Shaker s={shake(f, B, 22)}>
        {away < 1 && (
          <svg
            width={1080}
            height={500}
            viewBox="-540 -250 1080 500"
            style={{
              position: "absolute",
              left: (1 - enter) * -900 - away * 1300,
              top: lerp(760, 640, up) - 250,
              overflow: "visible",
              transform: `rotate(-9deg) scale(${kick})`,
            }}
          >
            {/* avant-bras et poing fermé */}
            <g fill={revealed ? C.paper : C.ink} stroke={C.ink} strokeWidth={12} strokeLinejoin="round">
              <ellipse cx={345} cy={-108} rx={74} ry={40} />
              <rect x={-900} y={-88} width={1180} height={176} rx={88} />
              <rect x={236} y={-116} width={236} height={232} rx={92} />
            </g>
            {revealed &&
              [-58, 0, 58].map((y) => (
                <line key={y} x1={400} y1={y} x2={462} y2={y} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
              ))}
            {Array.from({ length: BANDS }, (_, i) => {
              const at = Math.round(lerp(start + 8, B - 8, i / (BANDS - 1)));
              if (f < at) return null;
              const p = pop(f, at, { damping: 9, stiffness: 260, mass: 0.5 });
              const bump = revealed ? 1 + 0.25 * Math.exp(-(f - B - i * 0.6) / 3) * (f - B - i * 0.6 >= 0 ? 1 : 0) : 1;
              const x = 178 - i * 52;
              return (
                <g key={i} transform={`translate(${x} 0) scale(${p * bump})`}>
                  <rect
                    x={-20}
                    y={-102}
                    width={40}
                    height={204}
                    rx={18}
                    fill={revealed ? BAND_COLORS[i % BAND_COLORS.length] : "#39405C"}
                    stroke={C.ink}
                    strokeWidth={7}
                  />
                </g>
              );
            })}
          </svg>
        )}
        <Mystery f={f} at={start + 10} until={B} x={540} y={760} size={230} />
        <BigWord lines={["Bracelets", "élastiques"]} f={f} at={B} x={520} y={1065} size={150} rotate={-4} exitAt={C3 - 3} />

        {/* les bracelets offerts à toute la famille */}
        {f >= offert &&
          RINGS.map((r, i) => {
            const at = offert + i * 3;
            const p = pop(f, at, { damping: 8, stiffness: 240, mass: 0.5 });
            const bump = f >= famille ? 1 + 0.2 * Math.exp(-(f - famille) / 4) : 1;
            const col = BAND_COLORS[(i * 2) % BAND_COLORS.length];
            return (
              <svg
                key={i}
                width={240}
                height={240}
                viewBox="-120 -120 240 240"
                style={{
                  position: "absolute",
                  left: r.x - 120,
                  top: r.y - 120 + Math.sin((f - at) * 0.2 + i) * 10,
                  overflow: "visible",
                  transform: `scale(${p * bump}) rotate(${Math.sin((f - at) * 0.15 + i * 2) * 10}deg)`,
                }}
              >
                <circle r={84} fill="none" stroke={C.ink} strokeWidth={56} />
                <circle r={84} fill="none" stroke={col} strokeWidth={42} />
                <circle r={84} fill="none" stroke={C.ink} strokeOpacity={0.35} strokeWidth={8} strokeDasharray="14 30" />
              </svg>
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. la finale de l'Euro 2016 (dit directement) ─────────────

/** La cage, le ballon qui finit au fond, puis le score. */
export const Euro: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("euro");
  const perdu = q.c("euro.a#perdu");
  const B = q.c("euro.b");

  const enter = pop(f, start + 2, { damping: 12 });
  const out = prog(f, B - 4, 5, Easing.in(Easing.cubic));
  const shot = prog(f, perdu - 9, 9, Easing.in(Easing.quad));
  const d = f - perdu;
  const settle = d >= 0 ? Math.exp(-d / 5) : 0;
  const bx = lerp(600, 300, shot) - (d >= 0 ? (1 - settle) * 26 : 0);
  const by = lerp(1085, 905, shot) - Math.sin(shot * Math.PI) * 120 + (d >= 0 ? (1 - settle) * 12 : 0) + (shot === 0 ? Math.abs(Math.sin((f - start) * 0.3)) * -16 : 0);
  const br = lerp(118, 58, shot);
  const net = d >= 0 ? Math.sin(d * 0.9) * 14 * settle : 0;

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="stripes" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[perdu, 24], [B, 26]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `scale(${1 - 0.3 * out})`, opacity: 1 - out, transformOrigin: "540px 760px" }}>
            <svg
              width={900}
              height={560}
              viewBox="-450 -280 900 560"
              style={{ position: "absolute", left: 90, top: 760 - 280, overflow: "visible", transform: `scale(${enter})` }}
            >
              <g stroke={C.paper} strokeOpacity={0.4} strokeWidth={6}>
                {Array.from({ length: 12 }, (_, i) => {
                  const x = -330 + i * 60;
                  return <line key={`v${i}`} x1={x} y1={-190} x2={x + (x < 0 ? net : 0)} y2={200} />;
                })}
                {Array.from({ length: 6 }, (_, i) => {
                  const y = -130 + i * 60;
                  return <line key={`h${i}`} x1={-380} y1={y} x2={380} y2={y + net * 0.5} />;
                })}
              </g>
              <path d="M-390 210 V-210 H390 V210" fill="none" stroke={C.ink} strokeWidth={46} strokeLinejoin="round" strokeLinecap="round" />
              <path d="M-390 210 V-210 H390 V210" fill="none" stroke={C.paper} strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" />
              <line x1={-470} y1={216} x2={470} y2={216} stroke={C.paper} strokeWidth={14} strokeLinecap="round" />
            </svg>
            <Ball x={bx} y={by} r={br * enter} rot={(f - start) * (shot > 0 && d < 0 ? 30 : 0) + shot * 300} />
          </AbsoluteFill>
        )}
        <BigWord lines={["0 – 1"]} f={f} at={B} x={525} y={760} size={430} shadow={C.coral} rotate={-4} />
      </Shaker>
      <Flash opacity={flash(f, perdu, 6, 0.6) + flash(f, B, 5, 0.4)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. le bottle flip (dit directement) ─────────────

const GROUND = 1040;
const BH = 262; // demi-hauteur de la bouteille à l'écran
const BW = 86; // demi-largeur

/** Une bouteille lancée : ratée une fois, puis debout ; et encore une fois sur la table. */
export const Bottle: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("bottle");
  const lancais = q.c("bottle.a#lançais");
  const debout = q.c("bottle.a#debout");
  const B = q.c("bottle.b");
  const repas = q.c("bottle.b#repas");

  // trois lancers : [départ, arrivée, angle de départ, angle d'arrivée, hauteur]
  const mid = Math.round((lancais + debout) / 2) - 4;
  const throws: [number, number, number, number, number][] = [
    [lancais, mid - 4, 0, 450, 330],
    [debout - 17, debout, 450, 720, 360],
    [repas - 15, repas + 2, 720, 1080, 330],
  ];
  let rot = 0;
  let lift = 0;
  let landed = -1;
  for (const [a, b, r0, r1, h] of throws) {
    if (f < a) break;
    const p = clamp((f - a) / (b - a));
    rot = lerp(r0, r1, p);
    lift = 4 * h * p * (1 - p);
    landed = p >= 1 ? b : -1;
  }
  // centre de la bouteille : plus bas quand elle est couchée
  const lying = Math.abs(Math.sin((rot * Math.PI) / 180));
  const cy = GROUND - lerp(BH, BW, lying) - lift;
  const squash = landed >= 0 ? 1 - 0.14 * Math.exp(-(f - landed) / 2.5) : 1;
  const enter = pop(f, start + 2, { damping: 12 });
  const table = glide(f, B - 4, 160);

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="rays" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[throws[0][1], 12], [debout, 24], [repas + 2, 22]])}>
        {/* le sol, puis la table qui glisse dessous */}
        <div style={{ position: "absolute", left: 140, top: GROUND, width: 800, height: 16 + 26 * table, borderRadius: 10, background: C.paper }} />
        {[210, 834].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: GROUND + 30, width: 36, height: 190 * table, borderRadius: "0 0 12px 12px", background: C.paper }} />
        ))}
        <svg
          width={BW * 2}
          height={BH * 2}
          viewBox="-70 -214 140 428"
          style={{
            position: "absolute",
            left: 540 - BW,
            top: cy - BH,
            overflow: "visible",
            transform: `rotate(${rot}deg) scale(${enter}, ${enter * squash})`,
            transformOrigin: "50% 50%",
          }}
        >
          <rect x={-26} y={-212} width={52} height={48} rx={10} fill={C.coral} stroke={C.ink} strokeWidth={9} />
          <path d="M-24 -166 H24 L60 -112 V180 A30 30 0 0 1 30 210 H-30 A30 30 0 0 1 -60 180 V-112 Z" fill="rgba(255,255,255,0.45)" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
          <path d="M-55 96 H55 V180 A25 25 0 0 1 30 205 H-30 A25 25 0 0 1 -55 180 Z" fill="#7FD6FF" />
          <rect x={-60} y={-40} width={120} height={84} fill={C.paper} stroke={C.ink} strokeWidth={8} />
          <rect x={-36} y={-12} width={72} height={28} rx={14} fill={C.sky} />
        </svg>
      </Shaker>
      <Flash opacity={flash(f, debout, 6, 0.55)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. Musical.ly devient TikTok (devinette) ─────────────

/** Une appli sans nom qui bat la mesure, puis « Musical.ly » barré par « TikTok ». */
export const Tiktok: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("tiktok");
  const B = q.c("tiktok.b");
  const est = q.c("tiktok.b#est");
  const tk = q.c("tiktok.b#TikTok");

  const enter = pop(f, start + 2, { damping: 11 });
  const out = prog(f, B - 3, 5, Easing.in(Easing.cubic));
  const beat = 1 + 0.05 * Math.abs(Math.sin((f - start) * 0.42));

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="dots" tint="rgba(13,13,18,0.1)" />
      <Shaker s={shakes(f, [[B, 16], [tk, 30]])}>
        {out < 1 && (
          <>
            <svg
              width={560}
              height={560}
              viewBox="-280 -280 560 560"
              style={{
                position: "absolute",
                left: 540 - 280,
                top: 760 - 280,
                overflow: "visible",
                transform: `rotate(${-5 + Math.sin((f - start) * 0.1) * 3}deg) scale(${enter * beat * (1 - out)})`,
              }}
            >
              <rect x={-262} y={-250} width={540} height={540} rx={130} fill="rgba(13,13,18,0.25)" />
              <rect x={-270} y={-270} width={540} height={540} rx={130} fill={C.ink} />
              {/* égaliseur : l'appli fait de la musique, sans dire laquelle */}
              {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
                const h = 70 + 150 * Math.abs(Math.sin((f - start) * 0.33 + i * 1.3));
                return <rect key={i} x={i * 62 - 20} y={-h / 2} width={40} height={h} rx={20} fill="#39405C" />;
              })}
            </svg>
            <Mystery f={f} at={start + 10} until={B - 3} x={540} y={760} size={230} />
          </>
        )}
        <BigWord lines={["Musical.ly"]} f={f} at={B} y={690} size={176} shadow={C.ink} color={C.paper} rotate={-3} />
        <Strike f={f} at={est} y={700} color={C.ink} />
        <BigWord lines={["TikTok"]} f={f} at={tk} x={520} y={925} size={300} color={C.yellow} shadow={C.ink} rotate={5} />
      </Shaker>
      <Flash opacity={flash(f, tk)} />
    </AbsoluteFill>
  );
};

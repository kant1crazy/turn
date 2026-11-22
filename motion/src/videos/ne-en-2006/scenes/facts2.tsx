import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";

/** Trait qui barre un mot, tracé de gauche à droite. */
const Strike: React.FC<{ f: number; at: number; y: number; color: string; x?: number; width?: number; rotate?: number }> = ({
  f,
  at,
  y,
  color,
  x = 110,
  width = 860,
  rotate = -5,
}) =>
  f < at ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - 16,
        width: width * prog(f, at, 5),
        height: 32,
        borderRadius: 16,
        background: color,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: `${width / 2}px 16px`,
      }}
    />
  );

// ───────────── la relance ─────────────

const Padlock: React.FC<{ color: string }> = ({ color }) => (
  <svg width={52} height={62} viewBox="0 0 46 54">
    <path d="M11 24 V15 A12 12 0 0 1 35 15 V24" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
    <rect x={3} y={22} width={40} height={30} rx={8} fill={color} />
  </svg>
);

/** « Facile. » barré, puis les quatre cartes verrouillées. */
export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const facile = q.c("relance.a#facile");
  const B = q.c("relance.b");
  const joue = q.c("relance.b#joue");

  const out = prog(f, B - 2, 8, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.red} f={f} pattern="stripes" tint="rgba(13,13,18,0.09)" />
      <Shaker s={shakes(f, [[facile, 22], [joue, 14]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * -900}px)`, opacity: 1 - out }}>
            <BigWord lines={["Facile."]} f={f} at={facile} y={760} size={330} rotate={-3} />
            <Strike f={f} at={facile + 8} y={780} color={C.ink} />
          </AbsoluteFill>
        )}
        {f >= B &&
          [5, 6, 7, 8].map((n, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const bump = f >= joue ? 1 + 0.16 * Math.exp(-(f - joue) / 4) : 1;
            return (
              <div
                key={n}
                style={{
                  position: "absolute",
                  left: 214 + i * 212 - 95,
                  top: 760 - 145,
                  width: 190,
                  height: 290,
                  borderRadius: 34,
                  background: C.ink,
                  boxShadow: "10px 12px 0 rgba(13,13,18,0.3)",
                  transform: `scale(${p * bump}) rotate(${(i % 2 ? 4 : -4) + Math.sin((f - at) * 0.18 + i) * 2.5}deg)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <div style={{ fontFamily: DISPLAY, fontSize: 172, lineHeight: 1, color: C.yellow }}>{n}</div>
                <Padlock color={C.paper} />
              </div>
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, facile, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 5. le confinement (dit directement) ─────────────

const AVATARS = [C.sky, C.magenta, C.green, C.orange, C.yellow, C.violet];

/** La maison, puis « 15 jours » barré par « 2 mois », puis la visio aux caméras coupées. */
export const Confinement: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("confinement");
  const quinze = q.c("confinement.a#quinze");
  const B = q.c("confinement.b");
  const deux = q.c("confinement.b#deux");
  const pyjama = q.c("confinement.c");
  const camera = q.c("confinement.c#caméra");

  const houseOut = prog(f, quinze - 3, 5, Easing.in(Easing.cubic));
  const wordsOut = prog(f, pyjama - 4, 6, Easing.in(Easing.cubic));
  const puff = (k: number) => ((f - start) * 0.028 + k / 3) % 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.slate} f={f} pattern="dots" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[quinze, 14], [deux, 28]])}>
        {houseOut < 1 && (
          <svg
            width={560}
            height={616}
            viewBox="-200 -240 400 440"
            style={{
              position: "absolute",
              left: 540 - 280,
              top: 770 - 330,
              overflow: "visible",
              transform: `scale(${pop(f, start + 2, { damping: 11 }) * (1 - houseOut)})`,
            }}
          >
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={112 + Math.sin(puff(k) * 6) * 12} cy={-185 - puff(k) * 150} r={14 + puff(k) * 24} fill={C.paper} opacity={0.9 * (1 - puff(k))} />
            ))}
            <rect x={90} y={-170} width={44} height={90} fill={C.paper} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
            <rect x={-140} y={-40} width={280} height={220} rx={16} fill={C.paper} stroke={C.ink} strokeWidth={12} />
            <polygon points="-190,-30 0,-200 190,-30" fill={C.coral} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
            <rect x={-38} y={62} width={76} height={118} rx={10} fill={C.ink} />
            <rect x={-116} y={10} width={58} height={58} rx={8} fill={C.yellow} stroke={C.ink} strokeWidth={8} />
            <rect x={58} y={10} width={58} height={58} rx={8} fill={C.yellow} stroke={C.ink} strokeWidth={8} />
          </svg>
        )}

        {wordsOut < 1 && (
          <AbsoluteFill style={{ opacity: 1 - wordsOut, transform: `scale(${1 - 0.2 * wordsOut})`, transformOrigin: "540px 780px" }}>
            <BigWord lines={["15 jours"]} f={f} at={quinze} y={690} size={262} shadow={C.coral} rotate={-3} />
            <Strike f={f} at={B} y={705} color={C.coral} />
            <BigWord lines={["2 mois"]} f={f} at={deux} y={915} size={330} color={C.yellow} shadow={C.coral} rotate={5} />
          </AbsoluteFill>
        )}

        {f >= pyjama - 1 &&
          AVATARS.map((col, i) => {
            const cx = 248 + (i % 3) * 280;
            const cy = 650 + Math.floor(i / 3) * 228;
            const p = pop(f, pyjama - 1 + i * 2, { damping: 11, stiffness: 220 });
            const off = f >= camera + i * 1.5;
            const me = i === 4;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - 129,
                  top: cy - 103,
                  width: 258,
                  height: 206,
                  borderRadius: 28,
                  background: off ? "#0A0D17" : "#2B3452",
                  border: me ? `8px solid ${C.yellow}` : "8px solid transparent",
                  boxSizing: "border-box",
                  transform: `scale(${p})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {off ? (
                  <svg width={104} height={86} viewBox="0 0 96 80">
                    <rect x={6} y={18} width={56} height={44} rx={10} fill={C.paper} />
                    <path d="M62 34 L88 20 V60 L62 46 Z" fill={C.paper} />
                    <line x1={10} y1={72} x2={84} y2={8} stroke={C.coral} strokeWidth={10} strokeLinecap="round" />
                  </svg>
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: "50%", background: col, transform: `translateY(${Math.sin(f * 0.3 + i) * 4}px)` }} />
                )}
              </div>
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, deux)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. le brevet masqué (dit directement) ─────────────

const Face: React.FC<{ x: number; y: number; size: number; scale: number; t: number; mask: number | null }> = ({
  x,
  y,
  size,
  scale,
  t,
  mask,
}) => {
  const blink = t % 46 < 3 ? 0.12 : 1;
  const squint = mask === null ? 1 : 0.55;
  const look = Math.sin(t * 0.11) * 12;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-260 -260 520 520"
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, overflow: "visible", transform: `scale(${scale}) rotate(${Math.sin(t * 0.09) * 3}deg)` }}
    >
      <circle r={214} fill={C.yellow} stroke={C.ink} strokeWidth={13} />
      <ellipse cx={-74 + look} cy={-48} rx={24} ry={34 * blink * squint} fill={C.ink} />
      <ellipse cx={74 + look} cy={-48} rx={24} ry={34 * blink * squint} fill={C.ink} />
      <path d="M-62 62 Q0 112 62 62" fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
      {mask !== null && (
        <g transform={`translate(0 ${(1 - mask) * 330})`}>
          <path d="M-150 30 Q-214 0 -206 -40" fill="none" stroke={C.paper} strokeWidth={9} strokeLinecap="round" />
          <path d="M150 30 Q214 0 206 -40" fill="none" stroke={C.paper} strokeWidth={9} strokeLinecap="round" />
          <rect x={-156} y={2} width={312} height={178} rx={54} fill="#CFEFFF" stroke={C.ink} strokeWidth={11} />
          <line x1={-112} y1={62} x2={112} y2={62} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
          <line x1={-112} y1={104} x2={112} y2={104} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
          <line x1={-96} y1={144} x2={96} y2={144} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

/** Un visage, le masque qui arrive sur le mot, puis deux autres visages : la génération. */
export const Brevet: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("brevet");
  const B = q.c("brevet.a#masque");
  const gen = q.c("brevet.b#génération");
  const t = f - start;

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="rays" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shake(f, B, 22)}>
        {f >= gen && (
          <>
            <Face x={215} y={830} size={270} scale={pop(f, gen, { damping: 10 })} t={t + 17} mask={1} />
            <Face x={815} y={830} size={270} scale={pop(f, gen + 3, { damping: 10 })} t={t + 31} mask={1} />
          </>
        )}
        <Face
          x={525}
          y={750}
          size={660}
          scale={pop(f, start + 2, { damping: 12 })}
          t={t}
          mask={f >= B ? pop(f, B, { damping: 11, stiffness: 220 }) : null}
        />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. les 18 ans, l'été des JO de Paris (dit directement) ─────────────

const Sword: React.FC<{ side: 1 | -1; angle: number }> = ({ side, angle }) => (
  <g transform={`translate(${side * -170} 240) rotate(${side * angle})`}>
    <line x1={0} y1={0} x2={0} y2={-480} stroke={C.paper} strokeWidth={14} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={96} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
    <circle r={40} fill={C.yellow} stroke={C.ink} strokeWidth={10} />
  </g>
);

/** « 18 ans », puis la flamme olympique, puis les deux épées qui se croisent. */
export const Majorite: React.FC<SceneProps> = ({ f, q }) => {
  const dixhuit = q.c("majorite.a#tes");
  const ans = q.c("majorite.a#ans");
  const jeux = q.c("majorite.a#Jeux");
  const B = q.c("majorite.b");
  const escrime = q.c("majorite.b#escrime");

  const torchOut = prog(f, B - 4, 5, Easing.in(Easing.cubic));
  const flicker = 1 + 0.07 * Math.sin(f * 0.9) + 0.04 * Math.sin(f * 2.3);
  const clash = pop(f, escrime, { damping: 8, stiffness: 260, mass: 0.5 });
  const spark = f - escrime;

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="rays" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[dixhuit, 20], [jeux, 14], [escrime, 14]])}>
        <BigWord lines={["18"]} f={f} at={dixhuit} x={410} y={740} size={480} rotate={-4} exitAt={jeux - 5} />
        <BigWord lines={["ans"]} f={f} at={ans} x={775} y={815} size={200} color={C.yellow} rotate={-4} exitAt={jeux - 5} />

        {f >= jeux && torchOut < 1 && (
          <svg
            width={408}
            height={680}
            viewBox="0 0 120 200"
            style={{ position: "absolute", left: 540 - 204, top: 770 - 340, overflow: "visible", transform: `scale(${pop(f, jeux, { damping: 9 }) * (1 - torchOut)}) rotate(4deg)` }}
          >
            <g transform={`translate(60 92) scale(${2 - flicker} ${flicker}) translate(-60 -92)`}>
              <path d="M60 4 C92 40 98 62 84 82 C80 70 72 62 66 60 C70 78 60 92 60 92 C60 92 34 78 40 46 C24 60 22 76 30 90 C10 70 20 34 60 4 Z" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M60 46 C74 62 74 78 60 90 C48 80 48 64 60 46 Z" fill={C.orange} />
            </g>
            <path d="M34 98 H86 L72 192 H48 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            <rect x={26} y={90} width={68} height={16} rx={8} fill={C.ink} />
          </svg>
        )}

        {f >= B && (
          <svg
            width={700}
            height={700}
            viewBox="-350 -350 700 700"
            style={{ position: "absolute", left: 540 - 350, top: 760 - 350, overflow: "visible", transform: `scale(${pop(f, B, { damping: 10 }) * 1.15})` }}
          >
            <Sword side={1} angle={lerp(-6, 28, clash)} />
            <Sword side={-1} angle={lerp(-6, 28, clash)} />
            {spark >= 0 &&
              spark < 11 &&
              Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2 + 0.3;
                const r = 40 + spark * 16;
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * r}
                    y1={-80 + Math.sin(a) * r}
                    x2={Math.cos(a) * (r + 44)}
                    y2={-80 + Math.sin(a) * (r + 44)}
                    stroke={C.yellow}
                    strokeWidth={12}
                    strokeLinecap="round"
                    opacity={1 - spark / 11}
                  />
                );
              })}
          </svg>
        )}
      </Shaker>
      <Flash opacity={flash(f, dixhuit, 5, 0.45)} />
    </AbsoluteFill>
  );
};

// ───────────── 8. l'iPhone (devinette) ─────────────

const APPS = [C.green, C.sky, C.yellow, C.coral, C.violet, C.orange, C.magenta, C.teal, C.ink, C.green, C.coral, C.sky, C.yellow, C.violet, C.teal, C.orange];

/** Un téléphone éteint marqué « ? », qui s'allume à la réponse ; puis l'année. */
export const Iphone: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("iphone");
  const B = q.c("iphone.b");
  const an = q.c("iphone.c#2007");

  const phone = pop(f, start + 2, { damping: 11, stiffness: 220 });
  const lit = f >= B;
  const kick = lit ? 1 + 0.2 * Math.exp(-(f - B) / 4) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="dots" tint="rgba(13,13,18,0.08)" />
      <Shaker s={shakes(f, [[B, 24], [an, 18]])}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 700,
            width: 350,
            height: 640,
            marginLeft: -175,
            marginTop: -320,
            borderRadius: 60,
            background: C.ink,
            boxShadow: "16px 18px 0 rgba(13,13,18,0.22)",
            transform: `scale(${phone * kick}) rotate(${-6 + Math.sin((f - start) * 0.1) * 2}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: 130, top: 30, width: 90, height: 12, borderRadius: 6, background: "#3A3D49" }} />
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 70,
              bottom: 100,
              borderRadius: 12,
              background: lit ? "#F4F7FF" : "#23262F",
              overflow: "hidden",
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              gap: 18,
              padding: 24,
              boxSizing: "border-box",
            }}
          >
            {lit ? (
              APPS.map((c, i) => (
                <div key={i} style={{ width: 52, height: 52, borderRadius: 14, background: c, transform: `scale(${pop(f, B + 1 + i, { damping: 9, stiffness: 260, mass: 0.4 })})` }} />
              ))
            ) : (
              <div style={{ width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 250, lineHeight: 1.6, color: C.yellow, transform: `scale(${1 + 0.07 * Math.sin((f - start) * 0.45)})` }}>
                ?
              </div>
            )}
          </div>
          <div style={{ position: "absolute", left: 175 - 28, bottom: 22, width: 56, height: 56, borderRadius: "50%", border: "6px solid #5A5E6B", boxSizing: "border-box" }} />
        </div>
        <BigWord lines={["L'iPhone"]} f={f} at={B} x={515} y={1110} size={180} rotate={-4} exitAt={an - 3} />
        <BigWord lines={["2007"]} f={f} at={an} x={515} y={1105} size={250} color={C.yellow} rotate={-4} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};


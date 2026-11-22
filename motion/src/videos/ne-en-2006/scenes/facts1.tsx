import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY, TEXT } from "../../../theme";
import type { SceneProps } from "../../../timeline";

// ───────────── 1. le hand spinner (devinette) ─────────────

const LOBES = [-90, 30, 150].map((a) => ({
  x: 58 * Math.cos((a * Math.PI) / 180),
  y: 58 * Math.sin((a * Math.PI) / 180),
}));

const SpinnerShape: React.FC<{ angle: number; size: number; color: boolean }> = ({ angle, size, color }) => (
  <svg width={size} height={size} viewBox="-110 -110 220 220" style={{ overflow: "visible" }}>
    <g transform={`rotate(${angle})`}>
      {color && (
        <circle r={58} fill="none" stroke={C.paper} strokeOpacity={0.35} strokeWidth={56} strokeDasharray="46 75.47" strokeDashoffset={80} />
      )}
      {LOBES.map((l, i) => (
        <line key={`o${i}`} x1={0} y1={0} x2={l.x} y2={l.y} stroke={C.ink} strokeWidth={56} strokeLinecap="round" />
      ))}
      {LOBES.map((l, i) => (
        <circle key={`c${i}`} cx={l.x} cy={l.y} r={42} fill={C.ink} />
      ))}
      <circle r={38} fill={C.ink} />
      {color && (
        <>
          {LOBES.map((l, i) => (
            <line key={`b${i}`} x1={0} y1={0} x2={l.x} y2={l.y} stroke={C.paper} strokeWidth={44} strokeLinecap="round" />
          ))}
          {LOBES.map((l, i) => (
            <circle key={`d${i}`} cx={l.x} cy={l.y} r={36} fill={C.paper} />
          ))}
          <circle r={32} fill={C.paper} />
          {LOBES.map((l, i) => (
            <circle key={`e${i}`} cx={l.x} cy={l.y} r={20} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          ))}
          <circle r={19} fill={C.ink} />
          <circle r={7} fill={C.yellow} />
        </>
      )}
    </g>
  </svg>
);

export const Spinner: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("spinner");
  const tournait = q.c("spinner.a#tournait");
  const B = q.c("spinner.b");
  const mens = q.c("spinner.c");

  // vitesse de rotation par paliers : lente, plus rapide, puis lancée à fond à la révélation
  let angle = (Math.min(f, tournait) - start) * 5;
  if (f > tournait) angle += (Math.min(f, B) - tournait) * 13;
  if (f > B) {
    const d = f - B;
    angle += 18 * d + 16 * 12 * (1 - Math.exp(-d / 12));
  }
  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 12 });
  const kick = revealed ? 1 + 0.28 * Math.exp(-(f - B) / 4) : 1;
  // l'objet monte le temps que son nom s'affiche dessous, puis reprend le centre
  const up = glide(f, B, 140) - glide(f, mens - 2, 120);

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="dots" tint="rgba(13,13,18,0.1)" />
      <Shaker s={shake(f, B, 22)}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: lerp(760, 680, up),
            transform: `translate(-50%, -50%) scale(${enter * kick})`,
          }}
        >
          <SpinnerShape angle={angle} size={680} color={revealed} />
        </div>
        <Mystery f={f} at={start + 10} until={B} x={540} y={760} size={230} />
        <BigWord lines={["Hand spinner"]} f={f} at={B} x={512} y={1105} size={156} rotate={-4} exitAt={mens - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. Pokémon GO (dit directement) ─────────────

const Pin: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <svg
    width={70}
    height={92}
    viewBox="0 0 70 92"
    style={{ position: "absolute", left: x - 35, top: y - 92, transform: `scale(${s})`, transformOrigin: "50% 100%" }}
  >
    <path d="M35 90 C10 56 4 46 4 33 A31 31 0 1 1 66 33 C66 46 60 56 35 90 Z" fill={C.coral} stroke={C.ink} strokeWidth={6} />
    <circle cx={35} cy={33} r={11} fill={C.paper} />
  </svg>
);

export const Pokemon: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("pokemon");
  const B = q.c("pokemon.a#Pokémon");
  const bat = q.c("pokemon.b");
  const two = q.c("pokemon.b#2");

  const enter = pop(f, start + 2, { damping: 12 });
  const walk = f - start;
  const dead = prog(f, bat, 7);
  const bobY = Math.sin(walk * 0.55) * 10 * (1 - dead);
  const tilt = -5 + Math.sin(walk * 0.275) * 1.6;
  const scroll = (walk * 4.2) % 190;
  const revealed = f >= B;

  // la batterie se vide pendant la phrase, puis clignote
  const level = lerp(0.62, 0.03, prog(f, bat + 4, Math.max(6, two - bat - 4), Easing.inOut(Easing.cubic)));
  const low = level < 0.15;
  const blink = f >= two && Math.floor((f - two) / 4) % 2 === 1 ? 0.35 : 1;
  const hit = f >= two ? 1 + 0.22 * Math.exp(-(f - two) / 3) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[B, 22], [two, 12]])}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 770 + bobY,
            width: 460,
            height: 820,
            marginLeft: -230,
            marginTop: -410,
            borderRadius: 70,
            background: C.ink,
            transform: `rotate(${tilt}deg) scale(${enter})`,
            boxShadow: "18px 22px 0 rgba(13,13,18,0.22)",
          }}
        >
          <div style={{ position: "absolute", left: 18, top: 18, right: 18, bottom: 18, borderRadius: 54, overflow: "hidden", background: "#FFFDF4" }}>
            {/* la carte qui défile : on avance dans la rue */}
            <div style={{ position: "absolute", left: -45, top: -380 + scroll, width: 520, height: 1500 }}>
              {Array.from({ length: 8 * 3 }, (_, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const park = (row * 3 + col) % 5 === 2;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: col * 190 + (row % 2 ? 18 : 0),
                      top: row * 190,
                      width: 150,
                      height: 150,
                      borderRadius: 22,
                      background: park ? "#8ADDA8" : "#C9EFD6",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 205, top: 130, width: 14, height: 400, borderRadius: 7, background: "repeating-linear-gradient(180deg, rgba(47,107,255,0.55) 0 22px, transparent 22px 44px)" }} />
            <div
              style={{
                position: "absolute",
                left: 212 - 70,
                top: 570 - 70,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(47,107,255,0.22)",
                transform: `scale(${0.6 + 0.4 * ((walk % 24) / 24)})`,
                opacity: 1 - (walk % 24) / 24,
              }}
            />
            <div style={{ position: "absolute", left: 212 - 30, top: 570 - 30, width: 60, height: 60, borderRadius: "50%", background: "#2F6BFF", border: "9px solid #fff", boxSizing: "border-box", boxShadow: "0 6px 0 rgba(13,13,18,0.18)" }} />
            {revealed && (
              <>
                <Pin x={105} y={270} s={pop(f, B + 3, { damping: 8 })} />
                <Pin x={320} y={410} s={pop(f, B + 6, { damping: 8 })} />
                <Pin x={125} y={720} s={pop(f, B + 9, { damping: 8 })} />
              </>
            )}
            {/* l'écran s'éteint : il ne reste que la batterie */}
            {dead > 0 && (
              <div style={{ position: "absolute", inset: 0, background: "#10131C", opacity: dead, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 250, height: 130, border: `14px solid ${C.paper}`, borderRadius: 30, boxSizing: "border-box", opacity: blink, transform: `scale(${hit})` }}>
                  <div style={{ position: "absolute", left: 10, top: 10, bottom: 10, width: Math.max(14, 202 * level), borderRadius: 12, background: low ? C.coral : C.green }} />
                  <div style={{ position: "absolute", right: -36, top: 30, width: 16, height: 42, borderRadius: 8, background: C.paper }} />
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "absolute", left: 180, top: 30, width: 100, height: 14, borderRadius: 7, background: C.ink }} />
        </div>
        <BigWord lines={["Pokémon GO"]} f={f} at={B} x={530} y={760} size={186} rotate={-6} stroke={18} exitAt={bat - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. Fortnite (dit directement) ─────────────

const Dancer: React.FC<{ x: number; y: number; t: number; color: string; scale: number }> = ({ x, y, t, color, scale }) => {
  const sw = Math.sin(t);
  const hip = { x: 22 * sw, y: -120 };
  const sh = { x: 6 * sw, y: -215 };
  const head = { x: -sw, y: -263 };
  const arm = (off: number) => {
    const a = ((-sw * 62 + off) * Math.PI) / 180;
    return { x: sh.x + 108 * Math.sin(a), y: sh.y + 108 * Math.cos(a) };
  };
  const line = (p1: { x: number; y: number }, p2: { x: number; y: number }, k: string) => (
    <line key={k} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={18} strokeLinecap="round" />
  );
  return (
    <svg
      width={280}
      height={330}
      viewBox="-140 -310 280 330"
      style={{
        position: "absolute",
        left: x - 140,
        top: y - 310 - Math.abs(sw) * 12,
        overflow: "visible",
        transform: `scale(${scale})`,
        transformOrigin: "50% 94%",
      }}
    >
      {line(hip, { x: -40, y: 0 }, "l1")}
      {line(hip, { x: 40, y: 0 }, "l2")}
      {line(hip, sh, "t")}
      {line(sh, arm(15), "a1")}
      {line(sh, arm(-15), "a2")}
      <circle cx={head.x} cy={head.y} r={34} fill={color} />
    </svg>
  );
};

export const Fortnite: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("fortnite");
  const B = q.c("fortnite.a#Fortnite");
  const dance = q.c("fortnite.b");

  const cardIn = pop(f, start + 2, { damping: 11 });
  const fall = prog(f, B, 13, Easing.in(Easing.quad));

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shake(f, B, 26)}>
        {fall < 1 && (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 760 + fall * 1500,
              width: 500,
              height: 570,
              marginLeft: -250,
              marginTop: -285,
              borderRadius: 46,
              background: C.paper,
              overflow: "hidden",
              boxShadow: "16px 18px 0 rgba(13,13,18,0.28)",
              transform: `rotate(${-5 + Math.sin((f - start) * 0.12) * 2 + fall * 28}deg) scale(${cardIn})`,
            }}
          >
            <div style={{ height: 132, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TEXT, fontWeight: 800, fontSize: 58, color: C.paper, letterSpacing: 4 }}>
              RENTRÉE
            </div>
            <div style={{ textAlign: "center", fontFamily: DISPLAY, color: C.ink, lineHeight: 1, marginTop: 26 }}>
              <span style={{ fontSize: 376 }}>6</span>
              <span style={{ fontSize: 170, verticalAlign: "top", position: "relative", top: 28 }}>e</span>
            </div>
          </div>
        )}
        <BigWord lines={["Fortnite"]} f={f} at={B} y={760} size={262} color={C.yellow} rotate={-5} exitAt={dance - 5} />
        {f >= dance - 2 && (
          <>
            <div style={{ position: "absolute", left: 90, top: 1020, width: 800 * prog(f, dance - 2, 8), height: 14, borderRadius: 7, background: C.paper }} />
            {[220, 490, 760].map((x, i) => (
              <Dancer
                key={x}
                x={x}
                y={1020}
                t={(f - dance) * 0.62 + i * 0.5}
                color={i === 1 ? C.yellow : C.paper}
                scale={pop(f, dance - 1 + i * 3, { damping: 10 }) * 1.55}
              />
            ))}
          </>
        )}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. la Coupe du monde (devinette) ─────────────

const Star: React.FC<{ x: number; y: number; size: number; s: number; rot?: number }> = ({ x, y, size, s, rot = 0 }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 50 : 21;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return `${r * Math.cos(a)},${r * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${s}) rotate(${rot}deg)`, overflow: "visible" }}
    >
      <polygon points={pts} fill={C.yellow} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    </svg>
  );
};

const FAN_COLORS = [C.paper, C.yellow, C.coral, "#8FB4FF"];

/** La foule seule pendant la devinette, puis les deux étoiles pour la réponse. */
export const Mondial: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("mondial");
  const B = q.c("mondial.b");
  const champ = q.c("mondial.b#championne");
  const crie = q.c("mondial.c#crié");

  const wild = glide(f, crie, 200);
  // la foule occupe le centre pendant la devinette, puis descend pour laisser la place aux étoiles
  const down = glide(f, B - 2, 140);

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[B, 20], [champ, 28]])}>
        {Array.from({ length: 11 }, (_, i) => {
          const at = start + 4 + i;
          if (f < at) return null;
          const x = 80 + i * 78;
          const inP = pop(f, at, { damping: 11, stiffness: 180 });
          const amp = lerp(26, 52, wild) * (f >= B ? 1.35 : 1);
          const jump = Math.abs(Math.sin((f - start) * 0.42 + random(`fan${i}`) * 6)) * amp;
          const y = lerp(800, 985, down) - jump + (1 - inP) * 700;
          const col = FAN_COLORS[i % FAN_COLORS.length];
          const wave = Math.sin((f - start) * 0.5 + i) * 12;
          return (
            <svg
              key={i}
              width={120}
              height={230}
              viewBox="-60 -90 120 230"
              style={{ position: "absolute", left: x - 60, top: y - 90, overflow: "visible", transform: "scale(1.3)", transformOrigin: "50% 40%" }}
            >
              <line x1={-26} y1={36} x2={-44 + wave} y2={-62} stroke={col} strokeWidth={14} strokeLinecap="round" />
              <line x1={26} y1={36} x2={44 + wave} y2={-62} stroke={col} strokeWidth={14} strokeLinecap="round" />
              <rect x={-36} y={26} width={72} height={130} rx={30} fill={col} />
              <circle r={34} fill={col} stroke={C.blue} strokeWidth={6} />
            </svg>
          );
        })}

        {f >= B && (
          <>
            <Star x={370} y={540} size={330} s={pop(f, B, { damping: 9 })} rot={-8} />
            <Star x={710} y={540} size={330} s={f < champ ? 0 : lerp(3.2, 1, pop(f, champ, { damping: 11, stiffness: 240 }))} rot={8} />
          </>
        )}

        {/* confettis bleu-blanc-rouge */}
        {f >= B &&
          Array.from({ length: 54 }, (_, i) => {
            const d = f - B;
            const x = random(`cx${i}`) * 1080 + Math.sin(d * 0.12 + i) * 30;
            const y = -80 - random(`cy${i}`) * 900 + d * (11 + random(`cs${i}`) * 9);
            if (y < -60 || y > 1500) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 22,
                  height: 40,
                  borderRadius: 5,
                  background: [C.paper, C.coral, "#8FB4FF", C.yellow][i % 4],
                  transform: `rotate(${d * (6 + (i % 5) * 3) + i * 40}deg) scaleY(${Math.cos(d * 0.3 + i)})`,
                }}
              />
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, B) + flash(f, champ, 5, 0.5)} />
    </AbsoluteFill>
  );
};

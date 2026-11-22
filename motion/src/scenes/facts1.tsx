import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { flash, glide, lerp, pop, prog, shake, shakes } from "../anim";
import { Backdrop, BigWord, Flash, Kicker, Mystery, PlusOne, Shaker, Tag } from "../components/ui";
import { C, DISPLAY, TEXT } from "../theme";
import type { SceneProps } from "../timeline";

// ───────────── 1. le hand spinner ─────────────

const LOBES = [-90, 30, 150].map((a) => ({
  x: 58 * Math.cos((a * Math.PI) / 180),
  y: 58 * Math.sin((a * Math.PI) / 180),
}));

const SpinnerShape: React.FC<{ angle: number; size: number; color: boolean; blur: number }> = ({
  angle,
  size,
  color,
  blur,
}) => (
  <svg width={size} height={size} viewBox="-110 -110 220 220" style={{ overflow: "visible" }}>
    <g transform={`rotate(${angle})`}>
      {color && blur > 0 && (
        <circle
          r={58}
          fill="none"
          stroke={C.paper}
          strokeOpacity={0.35 * blur}
          strokeWidth={56}
          strokeDasharray="46 75.47"
          strokeDashoffset={80}
        />
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
  const pt = q.point("spinner");

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
  const up = glide(f, B, 140);
  const s = shake(f, B, 22);

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="dots" tint="rgba(13,13,18,0.1)" />
      <Shaker s={s}>
        <Kicker text="En CM2" f={f} at={start + 3} />
        <div
          style={{
            position: "absolute",
            left: 540,
            top: lerp(760, 690, up),
            transform: `translate(-50%, -50%) scale(${enter * kick})`,
          }}
        >
          <SpinnerShape angle={angle} size={600} color={revealed} blur={revealed ? 1 : 0} />
        </div>
        <Mystery f={f} at={start + 10} until={B} x={540} y={760} size={210} />
        <BigWord lines={["Hand spinner"]} f={f} at={B} x={512} y={1085} size={156} rotate={-4} />
        <Tag text="Ne mens pas." f={f} at={mens} x={735} y={455} size={50} rotate={6} />
        <PlusOne f={f} at={pt.at} index={pt.index} x={820} y={870} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. Pokémon GO ─────────────

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
  const tel = q.c("pokemon.a#téléphone");
  const B = q.c("pokemon.b");
  const sur = q.c("pokemon.b#sur");
  const pt = q.point("pokemon");

  const enter = pop(f, start + 2, { damping: 12 });
  const walk = f - start;
  const bobY = Math.sin(walk * 0.55) * 10;
  const tilt = -5 + Math.sin(walk * 0.275) * 1.6;
  const scroll = (walk * 4.2) % 190;
  const revealed = f >= B;
  const s = shake(f, B, 22);

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={s}>
        <Kicker text="Été 2016" f={f} at={start + 3} />
        <div
          style={{
            position: "absolute",
            left: 565,
            top: 805 + bobY,
            width: 430,
            height: 750,
            marginLeft: -215,
            marginTop: -375,
            borderRadius: 66,
            background: C.ink,
            transform: `rotate(${tilt}deg) scale(${enter})`,
            boxShadow: "18px 22px 0 rgba(13,13,18,0.22)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              right: 18,
              bottom: 18,
              borderRadius: 50,
              overflow: "hidden",
              background: "#FFFDF4",
            }}
          >
            {/* la carte qui défile : on avance dans la rue */}
            <div style={{ position: "absolute", left: -60, top: -380 + scroll, width: 520, height: 1500 }}>
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
            <div style={{ position: "absolute", left: 190, top: 120, width: 14, height: 380, borderRadius: 7, background: "repeating-linear-gradient(180deg, rgba(47,107,255,0.55) 0 22px, transparent 22px 44px)" }} />
            {/* le joueur */}
            <div
              style={{
                position: "absolute",
                left: 197 - 70,
                top: 540 - 70,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(47,107,255,0.22)",
                transform: `scale(${0.6 + 0.4 * ((walk % 24) / 24)})`,
                opacity: 1 - (walk % 24) / 24,
              }}
            />
            <div style={{ position: "absolute", left: 197 - 30, top: 540 - 30, width: 60, height: 60, borderRadius: "50%", background: "#2F6BFF", border: "9px solid #fff", boxSizing: "border-box", boxShadow: "0 6px 0 rgba(13,13,18,0.18)" }} />
            {revealed && (
              <>
                <Pin x={95} y={250} s={pop(f, B + 3, { damping: 8 })} />
                <Pin x={300} y={390} s={pop(f, B + 6, { damping: 8 })} />
                <Pin x={120} y={690} s={pop(f, B + 9, { damping: 8 })} />
              </>
            )}
          </div>
          <div style={{ position: "absolute", left: 165, top: 30, width: 100, height: 14, borderRadius: 7, background: C.ink }} />
        </div>
        <Mystery f={f} at={tel} until={B} x={770} y={500} size={190} />
        <BigWord lines={["Pokémon GO"]} f={f} at={B} x={530} y={720} size={186} rotate={-6} stroke={18} />
        <Tag text="Le téléphone de ta mère" f={f} at={sur} x={520} y={1150} bg={C.paper} fg={C.ink} size={44} rotate={3} />
        <PlusOne f={f} at={pt.at} index={pt.index} x={830} y={520} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. Fortnite ─────────────

const Dancer: React.FC<{ x: number; y: number; t: number; color: string; scale: number }> = ({ x, y, t, color, scale }) => {
  const sw = Math.sin(t);
  const hip = { x: 22 * sw, y: -120 };
  const sh = { x: 6 * sw, y: -215 };
  const head = { x: 6 * sw - 7 * sw, y: -263 };
  const arm = (off: number) => {
    const a = ((-sw * 62 + off) * Math.PI) / 180;
    return { x: sh.x + 108 * Math.sin(a), y: sh.y + 108 * Math.cos(a) };
  };
  const a1 = arm(15);
  const a2 = arm(-15);
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
        transform: `scale(${scale * 1.3})`,
        transformOrigin: "50% 94%",
      }}
    >
      {line(hip, { x: -40, y: 0 }, "l1")}
      {line(hip, { x: 40, y: 0 }, "l2")}
      {line(hip, sh, "t")}
      {line(sh, a1, "a1")}
      {line(sh, a2, "a2")}
      <circle cx={head.x} cy={head.y} r={34} fill={color} />
    </svg>
  );
};

export const Fortnite: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("fortnite");
  const pile = q.c("fortnite.a#pile");
  const B = q.c("fortnite.b");
  const dance = q.c("fortnite.c");
  const pt = q.point("fortnite");

  const cardIn = pop(f, start + 2, { damping: 11 });
  const fall = prog(f, B, 13, Easing.in(Easing.quad));
  const up = glide(f, dance - 3, 150);
  const s = shake(f, B, 26);

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={s}>
        <Kicker text="Septembre 2017" f={f} at={start + 3} />
        {fall < 1 && (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 760 + fall * 1500,
              width: 440,
              height: 500,
              marginLeft: -220,
              marginTop: -250,
              borderRadius: 40,
              background: C.paper,
              overflow: "hidden",
              boxShadow: "16px 18px 0 rgba(13,13,18,0.28)",
              transform: `rotate(${-5 + Math.sin((f - start) * 0.12) * 2 + fall * 28}deg) scale(${cardIn})`,
            }}
          >
            <div style={{ height: 116, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TEXT, fontWeight: 800, fontSize: 50, color: C.paper, letterSpacing: 4 }}>
              RENTRÉE
            </div>
            <div style={{ textAlign: "center", fontFamily: DISPLAY, color: C.ink, lineHeight: 1, marginTop: 22 }}>
              <span style={{ fontSize: 330 }}>6</span>
              <span style={{ fontSize: 150, verticalAlign: "top", position: "relative", top: 24 }}>e</span>
            </div>
          </div>
        )}
        <Mystery f={f} at={pile} until={B} x={760} y={520} size={190} />
        <BigWord
          lines={["Fortnite"]}
          f={f}
          at={B}
          y={lerp(760, 560, up)}
          size={252}
          color={C.yellow}
          rotate={-5}
          scale={lerp(1, 0.86, up)}
        />
        {f >= dance - 3 && (
          <>
            <div style={{ position: "absolute", left: 130, top: 1186, width: 780 * prog(f, dance - 3, 8), height: 12, borderRadius: 6, background: C.paper }} />
            {[250, 515, 780].map((x, i) => (
              <Dancer
                key={x}
                x={x}
                y={1186}
                t={(f - dance) * 0.62 + i * 0.5}
                color={i === 1 ? C.yellow : C.paper}
                scale={pop(f, dance - 2 + i * 3, { damping: 10 })}
              />
            ))}
          </>
        )}
        <PlusOne f={f} at={pt.at} index={pt.index} x={820} y={420} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. la Coupe du monde ─────────────

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
      <polygon points={pts} fill={C.yellow} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    </svg>
  );
};

const FAN_COLORS = [C.paper, C.yellow, C.coral, "#8FB4FF"];

export const Mondial: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("mondial");
  const monde = q.c("mondial.a#tout");
  const B = q.c("mondial.b");
  const champ = q.c("mondial.b#championne");
  const crie = q.c("mondial.c#crié");
  const pt = q.point("mondial");

  const s = shakes(f, [[B, 20], [champ, 26]]);
  const wild = glide(f, crie, 200);

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={s}>
        <Kicker text="Été 2018" f={f} at={start + 3} bg={C.paper} fg={C.ink} />
        <Mystery f={f} at={start + 8} until={B} x={540} y={680} size={300} />

        {/* la foule */}
        {Array.from({ length: 11 }, (_, i) => {
          if (f < monde + i) return null;
          const x = 95 + i * 76;
          const inP = pop(f, monde + i, { damping: 11, stiffness: 180 });
          const amp = lerp(22, 48, wild) * (f >= B ? 1.4 : 1);
          const jump = Math.abs(Math.sin((f - start) * 0.42 + random(`fan${i}`) * 6)) * amp;
          const y = 1095 - jump + (1 - inP) * 520;
          const col = FAN_COLORS[i % FAN_COLORS.length];
          const wave = Math.sin((f - start) * 0.5 + i) * 12;
          return (
            <svg key={i} width={120} height={230} viewBox="-60 -90 120 230" style={{ position: "absolute", left: x - 60, top: y - 90, overflow: "visible" }}>
              <line x1={-26} y1={36} x2={-44 + wave} y2={-62} stroke={col} strokeWidth={14} strokeLinecap="round" />
              <line x1={26} y1={36} x2={44 + wave} y2={-62} stroke={col} strokeWidth={14} strokeLinecap="round" />
              <rect x={-36} y={26} width={72} height={130} rx={30} fill={col} />
              <circle r={34} fill={col} stroke={C.blue} strokeWidth={6} />
            </svg>
          );
        })}

        {f >= B && (
          <>
            <Star x={470} y={452} size={180} s={pop(f, B, { damping: 9 })} rot={-8} />
            <Star x={730} y={452} size={180} s={f < champ ? 0 : lerp(3.2, 1, pop(f, champ, { damping: 11, stiffness: 240 }))} rot={8} />
            {[
              { x: 470, t: "1998", at: B + 3 },
              { x: 730, t: "2018", at: champ + 3 },
            ].map((l) => (
              <div
                key={l.t}
                style={{
                  position: "absolute",
                  left: l.x - 100,
                  width: 200,
                  top: 548,
                  textAlign: "center",
                  fontFamily: TEXT,
                  fontWeight: 800,
                  fontSize: 42,
                  color: C.paper,
                  transform: `scale(${pop(f, l.at)})`,
                }}
              >
                {l.t}
              </div>
            ))}
          </>
        )}
        <BigWord lines={["Champions", "du monde"]} f={f} at={B} y={775} size={176} rotate={-4} />

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
        <PlusOne f={f} at={pt.at} index={pt.index} x={850} y={640} />
      </Shaker>
      <Flash opacity={flash(f, B) + flash(f, champ, 5, 0.5)} />
    </AbsoluteFill>
  );
};



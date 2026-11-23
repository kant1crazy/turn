import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { clamp, flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { Tower } from "./facts1";

// ───────────── 5. le cube (devinette) ─────────────

const CubeShape: React.FC<{ size: number; glow: number; dark: boolean }> = ({ size, glow, dark }) => {
  const top = dark ? "#2A2140" : "#B48CFF";
  const left = dark ? "#1B1530" : "#7B3FF2";
  const right = dark ? "#120E22" : "#4E1FB8";
  return (
    <svg width={size} height={size} viewBox="-120 -125 240 250" style={{ overflow: "visible" }}>
      {!dark && <circle r={150} fill="#C9A6FF" opacity={0.28 * glow} />}
      <g stroke={C.ink} strokeWidth={7} strokeLinejoin="round">
        <path d="M0 -110 L100 -55 L0 0 L-100 -55 Z" fill={top} />
        <path d="M-100 -55 L0 0 V115 L-100 60 Z" fill={left} />
        <path d="M100 -55 L0 0 V115 L100 60 Z" fill={right} />
      </g>
    </svg>
  );
};

/** Une ombre dans le désert, puis le cube tombe ; son surnom s'affiche dessous. */
export const Cube: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("cube");
  const B = q.c("cube.b#cube");
  const kevin = q.c("cube.c#Kevin");

  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 12 });
  const kick = revealed ? 1 + 0.3 * Math.exp(-(f - B) / 4) : 1;
  const up = glide(f, kevin, 140);
  const glow = 0.5 + 0.5 * Math.sin((f - B) * 0.3);
  const dunes = [
    { x: 160, w: 700, h: 150, c: "#E0651A" },
    { x: 720, w: 800, h: 190, c: "#C9540F" },
    { x: 420, w: 900, h: 110, c: "#B6480A" },
  ];

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shake(f, B, 26)}>
        {dunes.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x - d.w / 2, top: 1130 - d.h, width: d.w, height: d.h * 2, borderRadius: "50%", background: d.c }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 1128, width: 1080, height: 800, background: "#B6480A" }} />
        <div
          style={{
            position: "absolute",
            left: 540,
            top: lerp(740, 650, up) + (revealed ? Math.sin((f - B) * 0.12) * 10 : 0),
            transform: `translate(-50%, -50%) scale(${enter * kick}) rotate(${revealed ? 0 : Math.sin(f * 0.1) * 3}deg)`,
          }}
        >
          <CubeShape size={640} glow={glow} dark={!revealed} />
        </div>
        <Mystery f={f} at={start + 10} until={B} x={540} y={740} size={230} />
        <BigWord lines={["Kevin"]} f={f} at={kevin} x={520} y={1125} size={230} color={C.paper} shadow="#4E1FB8" rotate={-4} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. le concert (dit directement) ─────────────

/** Un écran dans une chambre ; dedans, une scène, des faisceaux et une foule de points. */
export const Concert: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("concert");
  const chambre = q.c("concert.a#chambre");
  const B = q.c("concert.b");

  const enter = pop(f, start + 2, { damping: 12 });
  const on = f >= B;
  const beat = Math.abs(Math.sin((f - B) * 0.42));
  const kick = on ? 1 + 0.07 * Math.exp(-(f - B) / 4) : f >= chambre ? 1 + 0.05 * Math.exp(-(f - chambre) / 4) : 1;
  const W0 = 800;
  const H0 = 520;
  const beams = [-32, -12, 12, 32];
  const cols = [C.magenta, C.sky, C.yellow, C.magenta];

  return (
    <AbsoluteFill>
      <Backdrop color={C.indigo} f={f} pattern="dots" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shake(f, B, 20)}>
        <div style={{ position: "absolute", left: 540, top: 740, width: 0, height: 0, transform: `scale(${enter * kick}) rotate(-2deg)` }}>
          {/* le pied et la base */}
          <div style={{ position: "absolute", left: -45, top: H0 / 2, width: 90, height: 90, background: C.ink }} />
          <div style={{ position: "absolute", left: -190, top: H0 / 2 + 80, width: 380, height: 34, borderRadius: 17, background: C.ink }} />
          {/* l'écran */}
          <div style={{ position: "absolute", left: -W0 / 2, top: -H0 / 2, width: W0, height: H0, borderRadius: 36, background: C.ink, boxShadow: "16px 18px 0 rgba(13,13,18,0.3)" }}>
            <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, borderRadius: 20, overflow: "hidden", background: on ? "#23104F" : "#141826" }}>
              {on && (
                <>
                  <svg width={756} height={476} viewBox="0 0 756 476" style={{ position: "absolute", left: 0, top: 0 }}>
                    {beams.map((a, i) => (
                      <path
                        key={i}
                        d="M0 0 L-70 520 H70 Z"
                        fill={cols[i]}
                        opacity={0.5}
                        transform={`translate(${150 + i * 152} -20) rotate(${a * 0.5 + Math.sin((f - B) * 0.2 + i * 1.3) * 16})`}
                      />
                    ))}
                    {/* la scène */}
                    <rect x={228} y={250} width={300} height={74} rx={12} fill={C.paper} />
                    <rect x={258} y={214} width={240} height={46} rx={10} fill={C.yellow} />
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                      const h = 16 + 44 * Math.abs(Math.sin((f - B) * 0.5 + i * 1.1));
                      return <rect key={i} x={254 + i * 36} y={312 - h} width={22} height={h} rx={5} fill={C.magenta} />;
                    })}
                  </svg>
                  {/* la foule : des points qui sautent */}
                  {Array.from({ length: 22 }, (_, i) => {
                    const row = i % 2;
                    const hop = Math.abs(Math.sin((f - B) * 0.42 + i * 0.8)) * 22;
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: 6 + (i / 22) * 760 - 34,
                          top: 388 + row * 34 - hop,
                          width: 68,
                          height: 140,
                          borderRadius: 34,
                          background: row ? "#0D0D12" : "#1D1238",
                        }}
                      />
                    );
                  })}
                  <div style={{ position: "absolute", inset: 0, background: C.paper, opacity: 0.1 * beat }} />
                </>
              )}
              {!on && (
                <div style={{ position: "absolute", left: 378 - 46, top: 238 - 46, width: 92, height: 92, borderRadius: "50%", border: `12px solid ${C.paper}`, borderTopColor: "transparent", boxSizing: "border-box", transform: `rotate(${f * 14}deg)`, opacity: 0.8 }} />
              )}
            </div>
          </div>
        </div>
      </Shaker>
      <Flash opacity={flash(f, B, 6, 0.6)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. le volcan (dit directement) ─────────────

/** Le volcan gronde, crache, et la ville d'à côté s'enfonce. */
export const Volcan: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("volcan");
  const erupt = q.c("volcan.a#volcan");
  const boom = q.c("volcan.a#pulvérisé");
  const B = q.c("volcan.b");
  const GROUND = 1100;

  const enter = pop(f, start + 2, { damping: 13 });
  const sink = prog(f, boom + 6, Math.max(12, B - boom), Easing.in(Easing.quad));
  const bombs = Array.from({ length: 14 }, (_, i) => {
    const t0 = erupt + i * 4;
    const life = 30;
    const d = (((f - t0) % life) + life) % life;
    const live = f >= t0;
    const vx = (random(`bx${i}`) - 0.25) * 22;
    const vy = -26 - random(`by${i}`) * 10;
    return { live, x: 360 + vx * d, y: 560 + vy * d + 1.25 * d * d, r: 20 + random(`br${i}`) * 18, o: 1 - d / life };
  });

  return (
    <AbsoluteFill>
      <Backdrop color="#3A1420" f={f} pattern="stripes" tint="rgba(255,122,26,0.08)" />
      <Shaker s={shakes(f, [[erupt, 24], [boom, 32]])}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - enter) * 800}px)` }}>
          {/* la ville, à droite : elle s'enfonce */}
          <div style={{ position: "absolute", left: 600, top: GROUND - 520, width: 440, height: 520, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: -600, top: -(GROUND - 520), width: 1080, height: 1920, transform: `translateY(${sink * 520}px) rotate(${sink * 4}deg)`, transformOrigin: "820px 1100px" }}>
              <Tower x={690} y={GROUND} w={130} h={330} color={C.paper} />
              <Tower x={820} y={GROUND} w={130} h={470} color={C.sky} roof />
              <Tower x={945} y={GROUND} w={120} h={280} color={C.coral} />
            </div>
          </div>
          {bombs.map((b, i) =>
            b.live && b.y < GROUND - 10 ? (
              <div key={i} style={{ position: "absolute", left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: "50%", background: i % 2 ? C.orange : C.yellow, border: `6px solid ${C.ink}`, boxSizing: "border-box", opacity: clamp(b.o * 2) }} />
            ) : null,
          )}
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={`M40 ${GROUND} L290 590 H430 L680 ${GROUND} Z`} fill="#5B4A52" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
            <path d="M290 590 H430 L462 700 L420 660 L392 760 L352 670 L318 720 Z" fill={C.orange} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
            <ellipse cx={360} cy={590} rx={70} ry={16} fill={f >= erupt ? C.yellow : C.orange} stroke={C.ink} strokeWidth={8} />
          </svg>
          <div style={{ position: "absolute", left: 30, top: GROUND - 8, width: 1020, height: 22, borderRadius: 11, background: C.ink }} />
        </div>
      </Shaker>
      <Flash opacity={flash(f, boom, 7, 0.7)} color={C.orange} />
    </AbsoluteFill>
  );
};

// ───────────── 8. le trou noir (devinette) ─────────────

/** Une île vue de haut, aspirée ; à la place, le trou noir. */
export const Trou: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("trou");
  const gone = q.c("trou.a#disparu");
  const B = q.c("trou.b");
  const demi = q.c("trou.c");

  const enter = pop(f, start + 2, { damping: 12 });
  const suck = prog(f, gone - 4, 12, Easing.in(Easing.cubic));
  const hole = pop(f, B, { damping: 11, stiffness: 180 });
  const pulse = 1 + 0.035 * Math.sin((f - B) * 0.35) + (f >= demi ? 0.08 * Math.exp(-(f - demi) / 5) : 0);
  const night = prog(f, gone - 4, 12);
  const spots = [
    [-150, -120, C.yellow], [90, -160, C.coral], [170, 20, C.paper], [-40, 40, C.sky], [-190, 110, C.paper], [60, 180, C.yellow],
  ] as const;

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="dots" tint="rgba(255,255,255,0.12)" />
      <AbsoluteFill style={{ background: "#07070C", opacity: night }} />
      <Shaker s={shake(f, B, 28)}>
        {suck < 1 && (
          <svg
            width={760}
            height={760}
            viewBox="-380 -380 760 760"
            style={{ position: "absolute", left: 540 - 380, top: 760 - 380, transform: `scale(${enter * (1 - suck)}) rotate(${suck * suck * 540}deg)`, overflow: "visible" }}
          >
            <path d="M-260 -210 Q-120 -330 60 -290 Q250 -300 310 -120 Q360 40 270 190 Q190 320 10 300 Q-170 330 -280 190 Q-360 40 -260 -210 Z" fill="#3FBF6A" stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
            <path d="M-120 -250 Q-60 -90 -130 20 Q-170 130 -90 280" fill="none" stroke={C.sky} strokeWidth={26} strokeLinecap="round" />
            <ellipse cx={30} cy={-40} rx={70} ry={48} fill={C.sky} stroke={C.ink} strokeWidth={8} />
            <path d="M180 120 L230 40 L280 120 Z" fill="#8A7A6A" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
            {spots.map(([x, y, c], i) => (
              <rect key={i} x={x - 18} y={y - 18} width={36} height={36} rx={6} fill={c} stroke={C.ink} strokeWidth={6} />
            ))}
          </svg>
        )}
        <Mystery f={f} at={gone + 8} until={B} x={540} y={760} size={230} />
        {f >= B && (
          <div style={{ position: "absolute", left: 540, top: 760, width: 0, height: 0, transform: `scale(${hole * pulse})` }}>
            {[0, 1, 2].map((i) => {
              const s = 760 - i * 110;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: -s / 2,
                    top: -s / 2,
                    width: s,
                    height: s,
                    borderRadius: "50%",
                    background: `conic-gradient(from ${(f - B) * (5 + i * 3)}deg, rgba(42,165,255,0), ${["#2AA5FF", "#8FD4FF", "#FFF7E8"][i]}, rgba(42,165,255,0) 55%, ${["#6B3BFF", "#2AA5FF", "#8FD4FF"][i]}, rgba(42,165,255,0))`,
                    opacity: 0.55 + i * 0.2,
                  }}
                />
              );
            })}
            <div style={{ position: "absolute", left: -215, top: -215, width: 430, height: 430, borderRadius: "50%", background: "#000", boxShadow: "0 0 0 10px #FFF7E8, 0 0 70px 26px rgba(143,212,255,0.75)" }} />
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, B, 7, 0.8)} />
    </AbsoluteFill>
  );
};

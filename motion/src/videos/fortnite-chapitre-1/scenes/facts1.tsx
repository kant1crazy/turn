import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { clamp, flash, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";

// Illustrations volontairement génériques : formes simples, aucun élément repris du jeu.

/** Un immeuble stylisé, posé sur sa base (x = centre, y = sol). */
export const Tower: React.FC<{ x: number; y: number; w: number; h: number; color: string; lit?: string; roof?: boolean }> = ({
  x,
  y,
  w,
  h,
  color,
  lit = C.yellow,
  roof = false,
}) => {
  const cols = Math.max(2, Math.floor(w / 62));
  const rows = Math.max(2, Math.floor(h / 78));
  const gx = w / cols;
  const gy = (h - 30) / rows;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, background: color, border: `8px solid ${C.ink}`, boxSizing: "border-box", borderRadius: 10 }}>
      {roof && <div style={{ position: "absolute", left: w / 2 - 12, top: -62, width: 10, height: 56, background: C.ink }} />}
      {Array.from({ length: cols * rows }, (_, i) => {
        const on = random(`w-${x}-${i}`) > 0.42;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % cols) * gx + gx / 2 - 15 - 8,
              top: Math.floor(i / cols) * gy + 22,
              width: 30,
              height: 36,
              borderRadius: 4,
              background: on ? lit : "rgba(13,13,18,0.35)",
            }}
          />
        );
      })}
    </div>
  );
};

const CITY = [
  { x: 250, w: 170, h: 430, color: C.paper },
  { x: 425, w: 150, h: 620, color: C.sky, roof: true },
  { x: 600, w: 180, h: 500, color: C.coral },
  { x: 790, w: 170, h: 360, color: C.paper },
];

// ───────────── 1. Tilted Towers (dit directement) ─────────────

/** Une ville, un planeur qui descend dessus, « pouf », et il redescend. */
export const Tilted: React.FC<SceneProps> = ({ f, q }) => {
  const { start, end } = q.scene("tilted");
  const name = q.c("tilted.a#Tilted");
  const mort = q.c("tilted.b");
  const trente = q.c("tilted.b#trente");
  const retour = q.c("tilted.c");
  const GROUND = 1090;

  const rise = pop(f, start + 2, { damping: 13 });
  // premier saut : arrive sur le toit à « Mort en » ; second saut à la dernière phrase
  const d1 = prog(f, start + 6, Math.max(10, mort - start - 6), Easing.inOut(Easing.quad));
  const d2 = prog(f, retour + 4, Math.max(10, end - retour - 10), Easing.inOut(Easing.quad));
  const second = f >= retour;
  const p = second ? d2 : d1;
  const gx = second ? lerp(840, 610, p) : lerp(170, 425, p);
  const gy = second ? lerp(360, 560, p) : lerp(360, 440, p);
  const dead = !second && f >= mort;
  const boom = f - mort;

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="dots" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[name, 16], [mort, 24]])}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - rise) * 900}px)` }}>
          {CITY.map((t, i) => (
            <Tower key={i} {...t} y={GROUND} />
          ))}
          <div style={{ position: "absolute", left: 110, top: GROUND - 8, width: 820, height: 22, borderRadius: 11, background: C.ink }} />
        </div>

        {!dead && (
          <svg
            width={220}
            height={200}
            viewBox="-110 -70 220 200"
            style={{ position: "absolute", left: gx - 110, top: gy - 70, transform: `rotate(${Math.sin(f * 0.25) * 7 + (second ? -6 : 6)}deg)`, overflow: "visible" }}
          >
            <path d="M-100 0 Q0 -90 100 0 Q50 -22 0 -22 Q-50 -22 -100 0 Z" fill={C.yellow} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
            <path d="M-80 -6 L0 92 L80 -6" fill="none" stroke={C.ink} strokeWidth={6} />
            <circle cx={0} cy={100} r={22} fill={C.paper} stroke={C.ink} strokeWidth={8} />
          </svg>
        )}

        {dead && boom < 16 &&
          Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 40 + boom * 17;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 425 + Math.cos(a) * r - 16,
                  top: 470 + Math.sin(a) * r - 16,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: i % 2 ? C.yellow : C.paper,
                  opacity: 1 - boom / 16,
                }}
              />
            );
          })}
        {dead && (
          <div
            style={{
              position: "absolute",
              left: 425,
              top: 430,
              width: 0,
              height: 0,
              transform: `rotate(8deg) scale(${lerp(2.4, 1, pop(f, trente, { damping: 11 })) * (f >= trente ? 1 : 0)})`,
              filter: "drop-shadow(8px 8px 0 rgba(13,13,18,0.55))",
            }}
          >
            {[45, -45].map((a) => (
              <div key={a} style={{ position: "absolute", left: -130, top: -24, width: 260, height: 48, borderRadius: 24, background: C.coral, transform: `rotate(${a}deg)` }} />
            ))}
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, mort, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. la comète (devinette) ─────────────

const Warehouse: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <svg width={190} height={170} viewBox="0 0 190 170" style={{ position: "absolute", left: x - 95, top: y - 170 }}>
    <path d="M8 166 V70 L95 14 L182 70 V166 Z" fill={color} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <rect x={62} y={96} width={66} height={70} fill={C.ink} opacity={0.75} />
  </svg>
);

/** La comète vise la ville… et tombe sur les entrepôts d'à côté. */
export const Comete: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("comete");
  const B = q.c("comete.b");
  const hit = q.c("comete.b#Dusty");
  const GROUND = 1100;

  const enter = pop(f, start + 2, { damping: 13 });
  // elle plane au-dessus de la ville, puis file à droite
  const fall = prog(f, B, Math.max(6, hit - B), Easing.in(Easing.quad));
  const hover = f - start;
  const cx = lerp(300 + Math.sin(hover * 0.07) * 26, 770, fall);
  const cy = lerp(430 + Math.cos(hover * 0.09) * 18, GROUND - 70, fall);
  const landed = f >= hit;
  const d = f - hit;
  const tail = lerp(-38, 48, fall);
  const stars = Array.from({ length: 16 }, (_, i) => ({ x: 80 + random(`sx${i}`) * 900, y: 300 + random(`sy${i}`) * 520, r: 4 + random(`sr${i}`) * 6 }));

  return (
    <AbsoluteFill>
      <Backdrop color={C.slate} f={f} />
      <Shaker s={shake(f, hit, 34, 14)}>
        {stars.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: C.paper, opacity: 0.35 + 0.35 * Math.sin(f * 0.2 + i) }} />
        ))}
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - enter) * 700}px)` }}>
          {/* la ville, à gauche */}
          <Tower x={170} y={GROUND} w={130} h={300} color={C.paper} />
          <Tower x={300} y={GROUND} w={130} h={420} color={C.sky} roof />
          <Tower x={430} y={GROUND} w={130} h={340} color={C.coral} />
          {/* les entrepôts, à droite */}
          <Warehouse x={640} y={GROUND} color={C.orange} />
          {!landed && <Warehouse x={790} y={GROUND} color={C.teal} />}
          <Warehouse x={930} y={GROUND} color={C.orange} />
          {landed && (
            <svg width={230} height={90} viewBox="0 0 230 90" style={{ position: "absolute", left: 790 - 115, top: GROUND - 50, transform: `scale(${pop(f, hit, { damping: 10 })})` }}>
              <ellipse cx={115} cy={50} rx={105} ry={32} fill={C.ink} />
              <ellipse cx={115} cy={46} rx={70} ry={17} fill={C.coral} />
            </svg>
          )}
          <div style={{ position: "absolute", left: 70, top: GROUND - 8, width: 960, height: 22, borderRadius: 11, background: C.ink }} />
        </div>

        {!landed && (
          <svg width={520} height={520} viewBox="-260 -260 520 520" style={{ position: "absolute", left: cx - 260, top: cy - 260, transform: `rotate(${tail}deg) scale(${enter})`, overflow: "visible" }}>
            <path d="M0 -44 L-250 -8 L0 44 Z" fill={C.orange} opacity={0.9} transform="rotate(-180)" />
            <path d="M0 -26 L-170 -4 L0 26 Z" fill={C.yellow} transform="rotate(-180)" />
            <circle r={62} fill={C.sky} stroke={C.ink} strokeWidth={9} />
            <circle cx={-18} cy={-16} r={15} fill={C.paper} opacity={0.75} />
          </svg>
        )}
        {landed && d < 18 &&
          Array.from({ length: 12 }, (_, i) => {
            const a = Math.PI + (i / 11) * Math.PI;
            const r = 30 + d * 24;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 790 + Math.cos(a) * r - 18,
                  top: GROUND - 50 + Math.sin(a) * r - 18 + d * d * 0.5,
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: i % 3 ? C.orange : C.teal,
                  border: `5px solid ${C.ink}`,
                  boxSizing: "border-box",
                  opacity: 1 - d / 18,
                  transform: `rotate(${d * 20 + i * 30}deg)`,
                }}
              />
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, hit, 8, 0.85)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. le caddie (dit directement) ─────────────

const Cart: React.FC<{ spin: number }> = ({ spin }) => (
  <svg width={560} height={520} viewBox="0 0 560 520" style={{ overflow: "visible" }}>
    <path d="M30 70 H110 L170 330 H450" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M128 130 H520 L466 330 H172 Z" fill={C.paper} stroke={C.ink} strokeWidth={18} strokeLinejoin="round" />
    {[210, 290, 370, 450].map((x) => (
      <line key={x} x1={x} y1={136} x2={x - 14} y2={326} stroke={C.ink} strokeWidth={10} />
    ))}
    <line x1={144} y1={230} x2={494} y2={230} stroke={C.ink} strokeWidth={10} />
    {[210, 420].map((x) => (
      <g key={x} transform={`translate(${x} 420) rotate(${spin})`}>
        <circle r={54} fill={C.ink} />
        <circle r={22} fill={C.yellow} />
        <rect x={-6} y={-50} width={12} height={28} fill={C.yellow} />
      </g>
    ))}
    <path d="M190 330 L210 400 M440 330 L420 400" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
  </svg>
);

/** Le caddie roule, puis bascule et dévale. */
export const Caddie: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("caddie");
  const word = q.c("caddie.a#caddie");
  const B = q.c("caddie.b");
  const falaise = q.c("caddie.b#falaise");
  const land = falaise + 9;

  const enter = prog(f, start + 1, 12);
  const roll = f - start;
  // il part en avant, bascule dans le vide, retombe sur le toit
  const tip = prog(f, B, Math.max(6, falaise - B), Easing.in(Easing.cubic));
  const drop = prog(f, falaise, 9, Easing.in(Easing.quad));
  const x = lerp(-420, 0, enter) + tip * 60;
  const y = drop * 250 - (f >= land ? 40 * Math.exp(-(f - land) / 4) * Math.abs(Math.sin((f - land) * 0.6)) : 0);
  const rot = lerp(0, 38, tip) + drop * 142;
  const kick = f >= word ? 1 + 0.16 * Math.exp(-(f - word) / 4) : 1;
  const lines = f < B;

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[word, 14], [land, 30]])}>
        {lines &&
          [0, 1, 2].map((i) => {
            const u = ((roll * 26 + i * 300) % 900) / 900;
            return (
              <div key={i} style={{ position: "absolute", left: 960 - u * 900, top: 520 + i * 150, width: 150, height: 16, borderRadius: 8, background: C.paper, opacity: 0.55 * Math.sin(u * Math.PI) }} />
            );
          })}
        <div
          style={{
            position: "absolute",
            left: 540 + x,
            top: 720 + y + (lines ? Math.sin(roll * 0.9) * 5 : 0),
            width: 560,
            height: 520,
            marginLeft: -280,
            marginTop: -260,
            transform: `rotate(${rot}deg) scale(${kick})`,
          }}
        >
          <Cart spin={roll * 22} />
        </div>
        {f >= land &&
          f - land < 16 &&
          Array.from({ length: 9 }, (_, i) => {
            const d = f - land;
            const a = Math.PI + (i / 8) * Math.PI;
            const r = 200 + d * 18;
            return (
              <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r - 17, top: 1090 + Math.sin(a) * r * 0.5 - 17, width: 34, height: 34, borderRadius: "50%", background: C.paper, opacity: 0.9 * (1 - d / 16) }} />
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, land, 5, 0.45)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. la fusée (dit directement) ─────────────

/** La fusée attend, décolle, sort par le haut ; puis la faille s'ouvre. */
export const Fusee: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("fusee");
  const go = q.c("fusee.a#décoller");
  const B = q.c("fusee.b");
  const faille = q.c("fusee.b#faille");

  const enter = pop(f, start + 2, { damping: 13 });
  const up = prog(f, go, Math.max(10, B - go + 4), Easing.in(Easing.cubic));
  const y = 760 - up * 1500;
  const rumble = f < go ? Math.sin(f * 2.1) * 3 * clamp((f - start) / 40) : 0;
  const flame = f >= go ? 1.5 + 0.3 * Math.sin(f * 1.7) : 0.55 + 0.15 * Math.sin(f * 1.3);
  const crack = prog(f, faille, 7, Easing.out(Easing.cubic));
  const glow = 0.7 + 0.3 * Math.sin((f - faille) * 0.4);
  const PATH = "M560 300 L500 430 L590 520 L480 660 L600 760 L500 900 L575 1010 L520 1130";

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="dots" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[go, 14], [faille, 30]])}>
        {up < 1 && (
          <svg width={420} height={900} viewBox="-210 -330 420 900" style={{ position: "absolute", left: 540 - 210 + rumble, top: y - 330, transform: `scale(${enter})`, overflow: "visible" }}>
            <g transform={`translate(0 262) scale(1 ${flame})`}>
              <path d="M-70 0 Q0 300 70 0 Z" fill={C.orange} />
              <path d="M-36 0 Q0 170 36 0 Z" fill={C.yellow} />
            </g>
            <path d="M-78 150 L-170 290 L-78 262 Z M78 150 L170 290 L78 262 Z" fill={C.coral} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
            <path d="M0 -320 C105 -190 96 60 80 268 H-80 C-96 60 -105 -190 0 -320 Z" fill={C.paper} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
            <path d="M0 -320 C52 -256 78 -190 88 -120 H-88 C-78 -190 -52 -256 0 -320 Z" fill={C.coral} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
            <circle cx={0} cy={10} r={50} fill={C.sky} stroke={C.ink} strokeWidth={12} />
          </svg>
        )}
        {f >= faille && (
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={PATH} fill="none" stroke={C.ink} strokeWidth={74} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${crack} 1`} />
            <path d={PATH} fill="none" stroke={C.paper} strokeWidth={46} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${crack} 1`} opacity={glow} />
            <path d={PATH} fill="none" stroke={C.sky} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${crack} 1`} />
            {[[500, 430, 400, 400], [590, 520, 700, 470], [480, 660, 370, 720], [600, 760, 720, 800], [500, 900, 400, 950]].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={lerp(x1, x2, prog(f, faille + 4 + i, 6))} y2={lerp(y1, y2, prog(f, faille + 4 + i, 6))} stroke={C.paper} strokeWidth={12} strokeLinecap="round" />
            ))}
          </svg>
        )}
      </Shaker>
      <Flash opacity={flash(f, faille, 8, 0.8)} />
    </AbsoluteFill>
  );
};

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
  const vrais = q.c("relance.b#vrais");
  const out = prog(f, B - 2, 8, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.red} f={f} pattern="stripes" tint="rgba(13,13,18,0.09)" />
      <Shaker s={shakes(f, [[facile, 22], [vrais, 14]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * -900}px)`, opacity: 1 - out }}>
            <BigWord lines={["Facile."]} f={f} at={facile} y={760} size={330} rotate={-3} />
            {f >= facile + 8 && (
              <div style={{ position: "absolute", left: 110, top: 764, width: 860 * prog(f, facile + 8, 5), height: 32, borderRadius: 16, background: C.ink, transform: "rotate(-5deg)", transformOrigin: "430px 16px" }} />
            )}
          </AbsoluteFill>
        )}
        {f >= B &&
          [5, 6, 7, 8].map((n, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const bump = f >= vrais ? 1 + 0.16 * Math.exp(-(f - vrais) / 4) : 1;
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
    </AbsoluteFill>
  );
};

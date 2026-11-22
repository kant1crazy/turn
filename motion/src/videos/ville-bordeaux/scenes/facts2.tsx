import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { clamp, flash, glide, io, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C } from "../../../theme";
import type { SceneProps } from "../../../timeline";

// ───────────── la relance ─────────────

export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const mot = q.c("relance.a#l'échauffement");
  const B = q.c("relance.b");
  const vrais = q.c("relance.b#seuls");

  return (
    <AbsoluteFill>
      <Backdrop color={C.coral} f={f} pattern="stripes" tint="rgba(13,13,18,0.08)" />
      <Shaker s={shake(f, mot, 24)}>
        <BigWord lines={["Échauffement"]} f={f} at={mot} x={540} y={760} size={136} rotate={-4} exitAt={B - 3} />
        {f >= B &&
          Array.from({ length: 4 }, (_, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const lit = f >= vrais + i * 3;
            const bump = lit ? 1 + 0.4 * Math.exp(-(f - vrais - i * 3) / 3) : 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 165 + i * 250 - 95,
                  top: 760 - 95,
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: lit ? C.yellow : "rgba(13,13,18,0.25)",
                  border: `12px solid ${C.ink}`,
                  transform: `scale(${p * bump})`,
                }}
              />
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, mot)} />
    </AbsoluteFill>
  );
};

// ───────────── 5. le pont levant (devinette) ─────────────

const Tower: React.FC<{ x: number; lit: boolean }> = ({ x, lit }) => (
  <g>
    <path d={`M${x - 34} 250 L${x - 26} -330 Q${x} -356 ${x + 26} -330 L${x + 34} 250 Z`} fill={lit ? C.paper : C.ink} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    {lit && <rect x={x - 12} y={-300} width={24} height={500} rx={12} fill="#9EC9F2" />}
    <path d={`M${x - 62} 250 H${x + 62} L${x + 50} 300 H${x - 50} Z`} fill={lit ? "#B8C4D6" : C.ink} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
  </g>
);

const Ship: React.FC = () => (
  <g stroke={C.ink} strokeWidth={8} strokeLinejoin="round">
    <path d="M-250 150 L-210 232 H190 L262 150 Z" fill={C.paper} />
    <path d="M-242 168 H250" stroke={C.coral} strokeWidth={10} />
    <rect x={-190} y={96} width={370} height={56} rx={8} fill={C.paper} />
    <rect x={-150} y={46} width={290} height={52} rx={8} fill={C.paper} />
    <rect x={-104} y={2} width={196} height={46} rx={8} fill={C.paper} />
    {[-150, -100, -50, 0, 50, 100, 140].map((x) => (
      <rect key={x} x={x - 12} y={112} width={24} height={22} rx={5} fill="#22304F" strokeWidth={4} />
    ))}
    {[-110, -60, -10, 40, 90].map((x) => (
      <rect key={x} x={x - 12} y={61} width={24} height={22} rx={5} fill="#22304F" strokeWidth={4} />
    ))}
    <path d="M-36 2 L-28 -62 H28 L36 2 Z" fill={C.yellow} />
    <path d="M-31 -38 H31" strokeWidth={12} />
  </g>
);

export const Chaban: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("chaban");
  const leve = q.c("chaban.a#qui");
  const paquebot = q.c("chaban.a#laisser");
  const B = q.c("chaban.b");
  const Cc = q.c("chaban.c");
  const excuse = q.c("chaban.c#excuse");

  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 13 });
  const lift = prog(f, leve, Math.max(14, paquebot - leve + 6), io);
  const deckY = lerp(150, -190, lift);
  const sail = prog(f, paquebot, Math.max(40, Cc - paquebot + 30), Easing.inOut(Easing.quad));
  const shipX = lerp(-900, 60, sail);
  const up = glide(f, B, 140) - glide(f, Cc - 2, 120);
  const kick = revealed ? 1 + 0.14 * Math.exp(-(f - B) / 4) : 1;
  const bump = f >= excuse ? 1 + 0.08 * Math.exp(-(f - excuse) / 4) : 1;
  const t = f - start;
  const deck = revealed ? C.yellow : C.ink;
  const road = revealed ? "#B8C4D6" : C.ink;

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="dots" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shake(f, B, 22)}>
        <div style={{ position: "absolute", left: 540, top: lerp(770, 690, up), width: 0, height: 0, transform: `scale(${enter * kick * bump})` }}>
          <svg width={1080} height={900} viewBox="-540 -450 1080 900" style={{ position: "absolute", left: -540, top: -450, overflow: "visible" }}>
            <defs>
              <clipPath id="chabanWater">
                <rect x={-700} y={-500} width={1400} height={770} />
              </clipPath>
            </defs>
            {/* les pylônes du fond */}
            <Tower x={-210} lit={revealed} />
            <Tower x={210} lit={revealed} />
            {/* le paquebot passe dessous */}
            <g clipPath="url(#chabanWater)">
              <g transform={`translate(${shipX} ${42 + Math.sin(t * 0.14) * 5}) scale(${revealed ? 1 : 1})`} opacity={sail > 0 ? 1 : 0}>
                <Ship />
              </g>
            </g>
            {/* la Garonne */}
            <path
              d={`M-700 270 ${Array.from({ length: 15 }, (_, i) => `Q${-650 + i * 100 + ((t * 2) % 100)} ${i % 2 ? 250 : 290} ${-600 + i * 100 + ((t * 2) % 100)} 270`).join(" ")} V372 H-700 Z`}
              fill="#0B2A9C"
              stroke={C.ink}
              strokeWidth={8}
            />
            {/* les rampes fixes */}
            <rect x={-700} y={150} width={466} height={34} fill={road} stroke={C.ink} strokeWidth={9} />
            <rect x={234} y={150} width={466} height={34} fill={road} stroke={C.ink} strokeWidth={9} />
            {/* la travée qui monte */}
            <g transform={`translate(0 ${deckY})`}>
              <rect x={-236} y={0} width={472} height={40} rx={6} fill={deck} stroke={C.ink} strokeWidth={9} />
              {revealed && [-160, -80, 0, 80, 160].map((x) => <line key={x} x1={x - 16} y1={20} x2={x + 16} y2={20} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />)}
            </g>
            {/* les câbles */}
            {[-210, 210].map((x) => (
              <line key={x} x1={x} y1={-320} x2={x} y2={deckY} stroke={C.ink} strokeWidth={5} strokeDasharray="10 10" />
            ))}
          </svg>
        </div>
        <Mystery f={f} at={start + 10} until={B} x={540} y={360} size={190} />
        <BigWord lines={["Pont Chaban"]} f={f} at={B} x={520} y={1180} size={166} color={C.yellow} rotate={-4} exitAt={Cc - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. la rue Sainte-Catherine un samedi (dit directement) ─────────────

const HEADS = [C.yellow, C.paper, C.sky, C.magenta, C.green, C.orange, C.violet, C.teal];

export const Cath: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("cath");
  const B = q.c("cath.b");
  const Cc = q.c("cath.c");
  const passes = q.c("cath.c#passes");

  const enter = pop(f, start + 2, { damping: 14 });
  const dim = glide(f, B, 200) - glide(f, Cc - 2, 160);
  const t = f - start;
  const escape = prog(f, passes, 22, io);

  // la foule : des têtes de plus en plus petites vers le fond de la rue
  const crowd = Array.from({ length: 64 }, (_, i) => {
    const depth = random(`cd${i}`); // 0 = devant, 1 = au fond
    const half = lerp(300, 60, depth);
    const x = (random(`cx${i}`) * 2 - 1) * half * 0.86;
    const y = lerp(330, -150, depth);
    const r = lerp(50, 13, depth);
    return { x, y, r, depth, color: HEADS[i % HEADS.length], ph: random(`cp${i}`) * 6.28 };
  }).sort((a, b) => b.depth - a.depth);

  // toi : tu quittes la foule par la ruelle de gauche
  const me = { x: lerp(-70, -470, escape), y: lerp(250, 150, escape), r: lerp(50, 40, escape) };

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="none" />
      <Shaker s={shake(f, B, 22)}>
        <div style={{ position: "absolute", left: 540, top: 760, width: 0, height: 0, transform: `scale(${enter})`, opacity: 1 - 0.78 * dim }}>
          <svg width={1080} height={900} viewBox="-540 -450 1080 900" style={{ position: "absolute", left: -540, top: -450, overflow: "visible" }}>
            <g stroke={C.ink} strokeWidth={9} strokeLinejoin="round">
              {/* ciel au bout de la rue */}
              <path d="M-340 -430 H340 L62 -170 H-62 Z" fill={C.sky} />
              {/* le pavé */}
              <path d="M-62 -170 H62 L340 400 H-340 Z" fill="#F6E3BC" />
              {/* façades de droite */}
              <path d="M340 -430 L62 -170 L340 400 H460 V-430 Z" fill={C.paper} />
              {/* façades de gauche, coupées par une ruelle */}
              <path d="M-340 -430 L-62 -170 L-196 104 H-460 V-430 Z" fill={C.paper} />
              <path d="M-262 240 L-340 400 H-460 V240 Z" fill={C.paper} />
              <path d="M-460 104 H-196 L-262 240 H-460 Z" fill="#F6E3BC" />
            </g>
            {/* fenêtres en perspective */}
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => {
                const u = 0.12 + c * 0.2;
                const xr = lerp(340, 62, u) + 34;
                const top = lerp(-430, -170, u);
                const y = top + 70 + r * lerp(120, 40, u);
                const h = lerp(74, 24, u);
                const w = lerp(34, 12, u);
                return (
                  <g key={`${r}${c}`} fill="#22304F">
                    <rect x={xr} y={y} width={w} height={h} rx={3} />
                    {y + h < 80 && <rect x={-xr - w} y={y} width={w} height={h} rx={3} />}
                  </g>
                );
              }),
            )}
            {/* la foule */}
            {crowd.map((h, i) => (
              <circle key={i} cx={h.x} cy={h.y + Math.sin(t * 0.3 + h.ph) * h.r * 0.14} r={h.r} fill={h.color} stroke={C.ink} strokeWidth={lerp(8, 3, h.depth)} />
            ))}
            {/* toi */}
            {f >= Cc - 2 && (
              <g transform={`translate(${me.x} ${me.y})`}>
                <circle r={me.r + 16 + 8 * Math.sin(t * 0.5)} fill="none" stroke={C.coral} strokeWidth={9} opacity={0.9} />
                <circle r={me.r} fill={C.coral} stroke={C.ink} strokeWidth={9} />
              </g>
            )}
          </svg>
        </div>
        <BigWord lines={["1,2 km"]} f={f} at={B} x={520} y={760} size={350} color={C.paper} rotate={-4} exitAt={Cc - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. « on va au Bassin » (dit directement) ─────────────

const SAND = "#F5CF7F";

export const Bassin: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("bassin");
  const mot = q.c("bassin.a#au");
  const B = q.c("bassin.b");
  const lequel = q.c("bassin.b#lequel");
  const Cc = q.c("bassin.c");

  const enter = pop(f, start + 2, { damping: 13 });
  const up = glide(f, mot, 140) - glide(f, B - 2, 120);
  const t = f - start;
  const sunKick = f >= lequel ? 1 + 0.25 * Math.exp(-(f - lequel) / 4) : 1;
  // « tout Bordeaux a eu la même idée » : les parasols poussent partout sur le sable
  const crowd = clamp((f - Cc) / 26);

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="none" />
      <Shaker s={shakes(f, [[mot, 20]])}>
        <div style={{ position: "absolute", left: 540, top: lerp(770, 690, up), width: 0, height: 0, transform: `scale(${enter})` }}>
          <svg width={1080} height={900} viewBox="-540 -450 1080 900" style={{ position: "absolute", left: -540, top: -450, overflow: "visible" }}>
            <defs>
              <clipPath id="bassinFrame">
                <rect x={-440} y={-400} width={880} height={760} rx={70} />
              </clipPath>
            </defs>
            <rect x={-428} y={-384} width={880} height={760} rx={70} fill="rgba(13,13,18,0.22)" />
            <g clipPath="url(#bassinFrame)">
              <rect x={-440} y={-400} width={880} height={760} fill="#9ADCF7" />
              {/* le soleil */}
              <g transform={`translate(-240 -230) scale(${sunKick})`}>
                <g transform={`rotate(${t * 1.2})`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <rect key={i} x={-9} y={-148} width={18} height={44} rx={9} fill={C.yellow} stroke={C.ink} strokeWidth={6} transform={`rotate(${i * 36})`} />
                  ))}
                </g>
                <circle r={82} fill={C.yellow} stroke={C.ink} strokeWidth={9} />
              </g>
              {/* l'eau */}
              <path
                d={`M-460 60 ${Array.from({ length: 11 }, (_, i) => `Q${-430 + i * 90 - ((t * 1.5) % 90)} ${i % 2 ? 44 : 76} ${-380 + i * 90 - ((t * 1.5) % 90)} 60`).join(" ")} H560 V380 H-460 Z`}
                fill={C.teal}
                stroke={C.ink}
                strokeWidth={8}
              />
              {/* la cabane sur pilotis */}
              <g stroke={C.ink} strokeWidth={8} strokeLinejoin="round" transform="translate(-225 20)">
                {[-58, -20, 20, 58].map((x) => (
                  <line key={x} x1={x} y1={0} x2={x * 1.12} y2={104} strokeLinecap="round" />
                ))}
                <rect x={-80} y={-76} width={160} height={78} fill={C.paper} />
                <path d="M-102 -76 L0 -146 L102 -76 Z" fill={C.coral} />
                <rect x={-18} y={-52} width={36} height={54} fill="#22304F" strokeWidth={6} />
              </g>
              {/* la dune */}
              <path d="M-80 380 Q120 -250 330 -150 Q420 -110 460 -40 V380 Z" fill={SAND} stroke={C.ink} strokeWidth={9} />
              <path d="M330 -150 Q260 40 300 380" fill="none" stroke="#D9A94E" strokeWidth={9} strokeLinecap="round" />
              {/* les parasols de tout Bordeaux */}
              {[[110, 250, 0], [215, 120, 1], [360, 220, 2], [40, 330, 3], [285, 310, 4], [395, 60, 5], [160, 10, 6]].map(([x, y, i]) => {
                const p = pop(f, Cc + 2 + i * 3, { damping: 10, stiffness: 240, mass: 0.5 });
                if (crowd <= 0 || p <= 0) return null;
                const col = [C.coral, C.paper, C.magenta, C.violet, C.yellow, C.green, C.orange][i];
                return (
                  <g key={i} transform={`translate(${x} ${y}) scale(${p})`} stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
                    <line x1={0} y1={0} x2={0} y2={-62} strokeLinecap="round" />
                    <path d="M-50 -58 Q0 -112 50 -58 Z" fill={col} />
                  </g>
                );
              })}
            </g>
            <rect x={-440} y={-400} width={880} height={760} rx={70} fill="none" stroke={C.ink} strokeWidth={12} />
          </svg>
        </div>
        <BigWord lines={["Au Bassin"]} f={f} at={mot} x={520} y={1185} size={180} color={C.yellow} rotate={-4} exitAt={B - 3} />
      </Shaker>
      <Flash opacity={flash(f, mot)} />
    </AbsoluteFill>
  );
};

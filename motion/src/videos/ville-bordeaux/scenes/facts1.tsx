import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C } from "../../../theme";
import type { SceneProps } from "../../../timeline";

const CRUST = "#E9A23B";
const CRUST_DARK = "#C97B1E";
const CHOC = "#4A2410";

// ───────────── 1. la chocolatine (dit directement) ─────────────

/** La viennoiserie, avec un regard : il se fâche quand on prononce l'autre nom. */
const Pastry: React.FC<{ angry: number; size: number }> = ({ angry, size }) => (
  <svg width={size} height={size * 0.72} viewBox="-320 -230 640 460" style={{ overflow: "visible" }}>
    <rect x={-292} y={-176} width={600} height={380} rx={120} fill="rgba(13,13,18,0.22)" />
    {/* les deux barres de chocolat qui dépassent */}
    {[-1, 1].map((s) =>
      [-62, 62].map((y) => (
        <rect key={`${s}${y}`} x={s > 0 ? 262 : -306} y={y - 30} width={44} height={60} rx={16} fill={CHOC} stroke={C.ink} strokeWidth={9} />
      )),
    )}
    <rect x={-290} y={-190} width={580} height={380} rx={120} fill={CRUST} stroke={C.ink} strokeWidth={12} />
    {/* le feuilletage */}
    {[-190, -95, 95, 190].map((x) => (
      <path key={x} d={`M${x} -168 Q${x + 34} 0 ${x} 168`} fill="none" stroke={CRUST_DARK} strokeWidth={12} strokeLinecap="round" />
    ))}
    <path d="M-230 -120 Q0 -170 230 -120" fill="none" stroke="#F8CE7A" strokeWidth={14} strokeLinecap="round" />
    {/* le regard */}
    {[-52, 52].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={-14} rx={24} ry={30} fill={C.paper} stroke={C.ink} strokeWidth={8} />
        <circle cx={x + (x < 0 ? 5 : -5) * angry} cy={-10 + 4 * angry} r={11} fill={C.ink} />
        <line
          x1={x - 34} y1={-64 + (x < 0 ? -1 : 1) * 16 * angry - 6 * (1 - angry)}
          x2={x + 34} y2={-64 + (x < 0 ? 1 : -1) * 16 * angry - 6 * (1 - angry)}
          stroke={C.ink} strokeWidth={11} strokeLinecap="round"
        />
      </g>
    ))}
    <path
      d={`M-36 ${62 + 10 * angry} Q0 ${lerp(96, 40, angry)} 36 ${62 + 10 * angry}`}
      fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round"
    />
  </svg>
);

export const Choco: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("choco");
  const mot = q.c("choco.a#chocolatine");
  const B = q.c("choco.b");
  const pain = q.c("choco.b#pain");
  const reprends = q.c("choco.b#reprends");

  const enter = pop(f, start + 2, { damping: 12 });
  const up = glide(f, mot, 140) - glide(f, B - 2, 120);
  const angry = glide(f, pain, 200);
  const kick = 1 + 0.2 * Math.exp(-Math.max(0, f - mot) / 4) * (f >= mot ? 1 : 0) + (f >= reprends ? 0.25 * Math.exp(-(f - reprends) / 3) : 0);
  const wobble = Math.sin((f - start) * 0.16) * 2.5 + (f >= pain && f < reprends ? Math.sin(f * 1.5) * 2.5 : 0);

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="dots" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[mot, 20], [reprends, 22]])}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: lerp(760, 670, up),
            transform: `translate(-50%, -50%) rotate(${-5 + wobble}deg) scale(${enter * kick})`,
          }}
        >
          <Pastry angry={angry} size={760} />
        </div>
        <BigWord lines={["Chocolatine"]} f={f} at={mot} x={520} y={1105} size={168} color={C.yellow} rotate={-4} exitAt={B - 3} />
      </Shaker>
      <Flash opacity={flash(f, mot)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. le miroir d'eau (devinette) ─────────────

const STONE = "#F3DFB5";
const STONE_DARK = "#D8BC84";
const ROOF = "#4B5672";

/** Une façade classique générique : toit d'ardoise, arcades, fronton à horloge. Dessinée autour de (0,0), sol à y = 0. */
const Facade: React.FC<{ lit: boolean }> = ({ lit }) => {
  const wall = lit ? STONE : C.ink;
  const dark = lit ? STONE_DARK : C.ink;
  const roof = lit ? ROOF : C.ink;
  const hole = lit ? "#2B3350" : "#2A3550";
  return (
    <g stroke={C.ink} strokeWidth={8} strokeLinejoin="round">
      {/* toits */}
      <path d="M-400 -190 L-380 -250 L-150 -250 L-130 -190 Z" fill={roof} />
      <path d="M130 -190 L150 -250 L380 -250 L400 -190 Z" fill={roof} />
      <path d="M-140 -230 L-116 -322 L116 -322 L140 -230 Z" fill={roof} />
      {/* corps du bâtiment */}
      <rect x={-410} y={-190} width={820} height={190} fill={wall} />
      <rect x={-140} y={-232} width={280} height={232} fill={wall} />
      {/* fronton et horloge */}
      <path d="M-140 -232 L0 -296 L140 -232 Z" fill={dark} />
      <circle cx={0} cy={-248} r={22} fill={lit ? C.paper : hole} />
      {lit && <path d="M0 -262 V-248 L10 -242" fill="none" strokeWidth={6} strokeLinecap="round" />}
      {/* fenêtres hautes */}
      {[-355, -285, -215, -90, -30, 30, 90, 215, 285, 355].map((x) => (
        <rect key={x} x={x - 15} y={-166} width={30} height={52} rx={4} fill={hole} strokeWidth={6} />
      ))}
      {/* arcades */}
      {[-355, -285, -215, -90, -30, 30, 90, 215, 285, 355].map((x) => (
        <path key={x} d={`M${x - 20} 0 V-62 A20 20 0 0 1 ${x + 20} -62 V0 Z`} fill={hole} strokeWidth={6} />
      ))}
      <line x1={-410} y1={-100} x2={410} y2={-100} strokeWidth={6} />
    </g>
  );
};

export const Miroir: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("miroir");
  const B = q.c("miroir.b");
  const Cc = q.c("miroir.c");
  const brume = q.c("miroir.c#brume");

  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 13 });
  const kick = revealed ? 1 + 0.16 * Math.exp(-(f - B) / 4) : 1;
  const up = glide(f, B, 140) - glide(f, Cc - 2, 120);
  const mist = prog(f, brume, 26, Easing.out(Easing.quad));
  const t = f - start;
  // le reflet : la façade retournée, découpée en bandes qui ondulent
  const BANDS = 13;
  const bandH = 26;

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="none" />
      <Shaker s={shake(f, B, 22)}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: lerp(760, 690, up),
            width: 0,
            height: 0,
            transform: `scale(${enter * kick})`,
          }}
        >
          <svg width={920} height={760} viewBox="-460 -400 920 760" style={{ position: "absolute", left: -460, top: -400, overflow: "visible" }}>
            {/* la dalle d'eau */}
            <rect x={-455} y={0} width={910} height={340} rx={36} fill="#0E63B8" stroke={C.ink} strokeWidth={8} />
            <defs>
              {Array.from({ length: BANDS }, (_, i) => (
                <clipPath key={i} id={`mb${i}`}>
                  <rect x={-460} y={6 + i * bandH} width={920} height={bandH} />
                </clipPath>
              ))}
              <clipPath id="mslab">
                <rect x={-451} y={4} width={902} height={332} rx={32} />
              </clipPath>
            </defs>
            <g clipPath="url(#mslab)" opacity={revealed ? 0.42 : 0.4}>
              {Array.from({ length: BANDS }, (_, i) => (
                <g key={i} clipPath={`url(#mb${i})`}>
                  <g transform={`translate(${Math.sin(t * 0.22 + i * 0.9) * (3 + i * 1.3)} 6) scale(1 -1)`}>
                    <Facade lit={revealed} />
                  </g>
                </g>
              ))}
            </g>
            {/* reflets de lumière */}
            {[[-250, 120, 150], [120, 210, 190], [-80, 290, 120]].map(([x, y, w], i) => (
              <line key={i} x1={x + Math.sin(t * 0.1 + i) * 30} y1={y} x2={x + w + Math.sin(t * 0.1 + i) * 30} y2={y} stroke={C.paper} strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
            ))}
            <Facade lit={revealed} />
            {/* la brume qui monte de la dalle */}
            {mist > 0 &&
              Array.from({ length: 11 }, (_, i) => {
                const x = -420 + i * 84 + Math.sin(i * 2.1) * 20;
                const rise = mist * (70 + (i % 3) * 38);
                const r = (56 + (i % 4) * 16) * clamp(mist * 1.6);
                return <circle key={i} cx={x + Math.sin(t * 0.08 + i) * 14} cy={40 - rise} r={r} fill={C.paper} opacity={0.5 * clamp(mist * 2)} stroke="none" />;
              })}
          </svg>
        </div>
        <Mystery f={f} at={start + 10} until={B} x={540} y={640} size={210} />
        <BigWord lines={["Miroir d'eau"]} f={f} at={B} x={520} y={1165} size={158} rotate={-4} exitAt={Cc - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. le tram sans fil (dit directement) ─────────────

const TramShape: React.FC<{ t: number }> = ({ t }) => (
  <g stroke={C.ink} strokeWidth={9} strokeLinejoin="round">
    {/* ombre */}
    <ellipse cx={0} cy={152} rx={400} ry={16} fill="rgba(13,13,18,0.25)" stroke="none" />
    {/* caisse */}
    <path d="M-330 130 H330 Q400 130 410 60 Q414 -40 350 -100 Q320 -124 270 -124 H-270 Q-320 -124 -350 -100 Q-414 -40 -410 60 Q-400 130 -330 130 Z" fill={C.paper} />
    <path d="M-408 44 H408 Q406 100 386 118 Q366 130 330 130 H-330 Q-366 130 -386 118 Q-406 100 -408 44 Z" fill="#B8C4D6" />
    <rect x={-409} y={30} width={818} height={22} fill={C.coral} strokeWidth={6} />
    {/* pare-brise des deux cabines */}
    <path d="M-392 14 Q-388 -52 -338 -88 H-292 V14 Z" fill={C.ink} />
    <path d="M392 14 Q388 -52 338 -88 H292 V14 Z" fill={C.ink} />
    {/* vitres */}
    {[-218, -58, 102].map((x) => (
      <rect key={x} x={x - 44} y={-88} width={160} height={92} rx={14} fill="#22304F" strokeWidth={7} />
    ))}
    {/* portes */}
    {[-120, 40, 200].map((x) => (
      <g key={x}>
        <rect x={x - 26} y={-92} width={52} height={206} rx={8} fill={C.yellow} strokeWidth={7} />
        <line x1={x} y1={-92} x2={x} y2={114} strokeWidth={5} />
      </g>
    ))}
    {/* phares */}
    <circle cx={-384} cy={84} r={11} fill={C.yellow} strokeWidth={5} />
    <circle cx={384} cy={84} r={11} fill={C.yellow} strokeWidth={5} />
    {/* reflet sur les vitres */}
    <line x1={-240 + (t % 60) * 2} y1={-78} x2={-262 + (t % 60) * 2} y2={-10} stroke={C.paper} strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" />
  </g>
);

export const Tram: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("tram");
  const sans = q.c("tram.a#sans");
  const B = q.c("tram.b");
  const Cc = q.c("tram.c");
  const normal = q.c("tram.c#normal");

  const arrive = glide(f, start + 1, 70);
  const t = f - start;
  const wireGone = prog(f, sans, 12, Easing.in(Easing.cubic));
  const up = glide(f, B, 140) - glide(f, Cc - 2, 120);
  const bump = f >= normal ? 1 + 0.12 * Math.exp(-(f - normal) / 4) : 1;
  const railShift = (t * 14) % 120;
  // éclats là où le fil vient de disparaître
  const sparkle = f - sans - 10;

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="stripes" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[sans + 10, 12], [B, 22]])}>
        <div style={{ position: "absolute", left: 540, top: lerp(790, 700, up), width: 0, height: 0 }}>
          <svg width={1080} height={900} viewBox="-540 -450 1080 900" style={{ position: "absolute", left: -540, top: -450, overflow: "visible" }}>
            {/* la ligne aérienne qu'on attendrait… et qui s'en va */}
            {wireGone < 1 && (
              <g opacity={1 - wireGone} transform={`translate(${wireGone * 520} ${-wireGone * 140}) rotate(${wireGone * -10})`}>
                <line x1={-600} y1={-300} x2={600} y2={-300} stroke={C.ink} strokeWidth={9} />
                {[-330, 330].map((x) => (
                  <line key={x} x1={x} y1={-300} x2={x} y2={-350} stroke={C.ink} strokeWidth={7} />
                ))}
                <line x1={-600} y1={-350} x2={600} y2={-350} stroke={C.ink} strokeWidth={6} strokeDasharray="2 26" strokeLinecap="round" />
              </g>
            )}
            {sparkle >= 0 && sparkle < 14 &&
              [-300, -100, 110, 310].map((x, i) => (
                <g key={x} transform={`translate(${x} ${-300 - sparkle * 3}) scale(${1 + sparkle * 0.06}) rotate(${i * 20})`} opacity={1 - sparkle / 14}>
                  <path d="M0 -34 L9 -9 L34 0 L9 9 L0 34 L-9 9 L-34 0 L-9 -9 Z" fill={C.yellow} />
                </g>
              ))}
            {/* la voie */}
            <line x1={-600} y1={176} x2={600} y2={176} stroke={C.ink} strokeWidth={12} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={-660 + i * 120 - railShift * (1 - arrive * 0)} y={186} width={56} height={14} rx={7} fill="rgba(13,13,18,0.45)" />
            ))}
            <g transform={`translate(${(1 - arrive) * -1100} ${Math.sin(t * 0.5) * 2.5}) scale(${bump})`}>
              <TramShape t={t} />
            </g>
          </svg>
        </div>
        <BigWord lines={["1er au monde"]} f={f} at={B} x={505} y={1115} size={150} color={C.yellow} rotate={-4} exitAt={Cc - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. « gavé bien » et la poche (dit directement) ─────────────

const Poche: React.FC = () => (
  <svg width={640} height={760} viewBox="-320 -400 640 760" style={{ overflow: "visible" }}>
    {/* ce qui dépasse : une baguette et un poireau */}
    <g stroke={C.ink} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round">
      <g transform="rotate(14 60 -200)">
        <rect x={30} y={-390} width={66} height={330} rx={33} fill={CRUST} />
        {[-330, -270, -210, -150].map((y) => (
          <line key={y} x1={44} y1={y} x2={82} y2={y + 22} stroke={CRUST_DARK} />
        ))}
      </g>
      <g transform="rotate(-12 -90 -200)">
        <rect x={-112} y={-250} width={40} height={190} rx={12} fill={C.paper} />
        <path d="M-112 -240 Q-150 -330 -120 -390 Q-96 -330 -92 -250 Z" fill={C.green} />
        <path d="M-72 -240 Q-40 -320 -64 -380 Q-92 -330 -92 -250 Z" fill="#0A8A52" />
      </g>
    </g>
    {/* l'ombre puis la poche */}
    <path d="M-228 -90 H252 L296 348 H-196 Z" fill="rgba(13,13,18,0.22)" />
    <path d="M-250 -110 H230 L270 330 H-290 Z" fill={C.paper} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
    <path d="M-250 -110 H230 L236 -44 H-256 Z" fill="#E9DDC2" stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
    {/* les anses */}
    {[-120, 100].map((x) => (
      <path key={x} d={`M${x - 62} -78 V-150 A62 62 0 0 1 ${x + 62} -150 V-78`} fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
    ))}
    <path d="M-150 60 Q-10 200 130 60" fill="none" stroke={C.coral} strokeWidth={26} strokeLinecap="round" />
  </svg>
);

export const Gave: React.FC<SceneProps> = ({ f, q }) => {
  const mot = q.c("gave.a#gavé");
  const B = q.c("gave.b");
  const poche = q.c("gave.b#une");
  const pas = q.c("gave.b#jamais");

  const bag = pop(f, B, { damping: 12, stiffness: 190 });
  const kick = (f >= poche ? 0.22 * Math.exp(-(f - poche) / 4) : 0) + (f >= pas ? 0.14 * Math.exp(-(f - pas) / 4) : 0);
  const swing = Math.sin((f - B) * 0.18) * 4;

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[mot, 26], [poche, 14]])}>
        <BigWord lines={["Gavé", "bien"]} f={f} at={mot} x={520} y={760} size={330} color={C.yellow} rotate={-5} exitAt={B - 3} />
        {f >= B && (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 790 + (1 - bag) * 700,
              transform: `translate(-50%, -50%) rotate(${-4 + swing}deg) scale(${1 + kick})`,
              transformOrigin: "50% 20%",
            }}
          >
            <Poche />
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, mot)} />
    </AbsoluteFill>
  );
};

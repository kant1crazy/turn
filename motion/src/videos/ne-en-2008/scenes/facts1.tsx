import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { flash, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY, TEXT } from "../../../theme";
import type { SceneProps } from "../../../timeline";

/** Boîte centrée sur (x, y) dans laquelle on dessine en coordonnées locales. */
export const At: React.FC<{ x?: number; y?: number; s?: number; r?: number; o?: number; children: React.ReactNode }> = ({
  x = 540,
  y = 760,
  s = 1,
  r = 0,
  o = 1,
  children,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transform: `scale(${s}) rotate(${r}deg)`, opacity: o }}>
    {children}
  </div>
);

export const Svg: React.FC<{ size: number; children: React.ReactNode }> = ({ size, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="-200 -200 400 400"
    style={{ position: "absolute", left: -size / 2, top: -size / 2, overflow: "visible" }}
  >
    {children}
  </svg>
);

// ───────────── 1. La Reine des neiges (devinette) ─────────────

const Flake: React.FC<{ color?: string }> = ({ color = C.paper }) => (
  <g stroke={color} strokeWidth={13} strokeLinecap="round" fill="none">
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <line x1={0} y1={0} x2={0} y2={-170} />
        <path d="M-42 -128 L0 -92 L42 -128" />
        <path d="M-30 -70 L0 -44 L30 -70" />
      </g>
    ))}
  </g>
);

/** Une note de musique mystère, puis le titre de la chanson sous la neige, puis un grand flocon. */
export const Reine: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("reine");
  const B = q.c("reine.b");
  const parents = q.c("reine.c");
  const t = f - start;

  const noteOut = prog(f, B - 2, 4, Easing.in(Easing.cubic));
  const flakeIn = pop(f, parents - 1, { damping: 10 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="none" />
      {/* la neige, simple décor */}
      {Array.from({ length: 26 }, (_, i) => {
        const sp = 3 + random(`fs${i}`) * 4;
        const y = ((random(`fy${i}`) * 2100 + t * sp) % 2100) - 100;
        const x = random(`fx${i}`) * 1080 + Math.sin(t * 0.04 + i) * 26;
        const r = 7 + random(`fr${i}`) * 11;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />;
      })}
      <Shaker s={shake(f, B, 22)}>
        {noteOut < 1 && (
          <At s={pop(f, start + 2, { damping: 11 }) * (1 - noteOut)} r={-6 + Math.sin(t * 0.16) * 5} y={760 + Math.sin(t * 0.32) * 14}>
            <Svg size={640}>
              <g fill={C.ink}>
                <ellipse cx={-78} cy={112} rx={62} ry={46} transform="rotate(-18 -78 112)" />
                <ellipse cx={92} cy={76} rx={62} ry={46} transform="rotate(-18 92 76)" />
                <rect x={-40} y={-130} width={24} height={240} />
                <rect x={130} y={-166} width={24} height={240} />
                <polygon points="-40,-130 154,-166 154,-96 -40,-60" />
              </g>
            </Svg>
          </At>
        )}
        <Mystery f={f} at={start + 10} until={B} x={540} y={720} size={230} />
        <BigWord lines={["Libérée,", "délivrée"]} f={f} at={B} x={525} y={750} size={236} rotate={-4} shadow={C.blue} exitAt={parents - 4} />
        {f >= parents - 1 && (
          <At s={flakeIn} r={t * 1.1}>
            <Svg size={660}>
              <Flake />
            </Svg>
          </At>
        )}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. Brawl Stars (dit directement) ─────────────

const starPoints = (R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? R : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return `${rad * Math.cos(a)},${rad * Math.sin(a)}`;
  }).join(" ");

/** Une étoile, le nom du jeu, puis l'horloge qui fait un tour complet : la « dernière partie ». */
export const Brawl: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("brawl");
  const B = q.c("brawl.a#Brawl");
  const partie = q.c("brawl.b");
  const elle = q.c("brawl.b#elle");
  const heure = q.c("brawl.b#heure");
  const t = f - start;

  const starOut = prog(f, B - 2, 4, Easing.in(Easing.cubic));
  const clockIn = pop(f, partie, { damping: 11 });
  const turn = prog(f, elle, heure - elle + 8, Easing.inOut(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[B, 24], [heure + 8, 12]])}>
        {starOut < 1 && (
          <At s={pop(f, start + 2, { damping: 9 }) * (1 - starOut)} r={Math.sin(t * 0.14) * 10} y={760 + Math.sin(t * 0.3) * 12}>
            <Svg size={720}>
              <polygon points={starPoints(190, 86)} fill={C.yellow} stroke={C.ink} strokeWidth={14} strokeLinejoin="round" />
              <polygon points={starPoints(86, 40)} fill={C.orange} />
            </Svg>
          </At>
        )}
        <BigWord lines={["Brawl", "Stars"]} f={f} at={B} x={525} y={760} size={300} color={C.yellow} rotate={-5} exitAt={partie - 4} />
        {f >= partie && (
          <At s={clockIn} r={-4}>
            <Svg size={700}>
              <circle r={186} fill={C.paper} stroke={C.ink} strokeWidth={15} />
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1={0} y1={-160} x2={0} y2={i % 3 === 0 ? -128 : -142} stroke={C.ink} strokeWidth={i % 3 === 0 ? 11 : 6} strokeLinecap="round" transform={`rotate(${i * 30})`} />
              ))}
              {/* le secteur balayé : l'heure qui passe */}
              <circle r={66} fill="none" stroke={C.coral} strokeOpacity={0.9} strokeWidth={132} strokeDasharray={`${turn * 414.7} 414.7`} transform="rotate(-90)" />
              <line x1={0} y1={0} x2={0} y2={-84} stroke={C.ink} strokeWidth={17} strokeLinecap="round" transform={`rotate(${-60 + turn * 30})`} />
              <line x1={0} y1={0} x2={0} y2={-138} stroke={C.ink} strokeWidth={11} strokeLinecap="round" transform={`rotate(${turn * 360})`} />
              <circle r={15} fill={C.ink} />
            </Svg>
          </At>
        )}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. le vendredi 13 mars 2020 (dit directement) ─────────────

/** L'éphéméride qui s'arrête sur le 13, puis le cadenas qui se ferme… et qui sourit. */
export const Sixieme: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("sixieme");
  const vendredi = q.c("sixieme.a#vendredi");
  const B = q.c("sixieme.b");
  const ferme = q.c("sixieme.b#fermé");
  const content = q.c("sixieme.c#content");
  const t = f - start;

  // les jours défilent : 9, 10, 11, 12… puis 13
  const steps = 4;
  const per = (vendredi - start - 6) / steps;
  const idx = f >= vendredi ? steps : Math.min(steps - 1, Math.max(0, Math.floor((t - 6) / per)));
  const since = f >= vendredi ? f - vendredi : t - 6 - idx * per;
  const flip = Math.max(0, 1 - since / 5);
  const stuck = f >= vendredi;
  const calOut = prog(f, B - 3, 8, Easing.in(Easing.quad));

  const lockIn = pop(f, B + 3, { damping: 11 });
  const closed = pop(f, ferme, { damping: 13, stiffness: 320, mass: 0.4 });
  const happy = f >= content;
  const hop = happy ? Math.abs(Math.sin((f - content) * 0.42)) * 46 * Math.exp(-(f - content) / 22) : 0;

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="dots" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[vendredi, 26], [ferme, 22]])}>
        {calOut < 1 && (
          <At s={pop(f, start + 2, { damping: 11 }) * (stuck ? 1 + 0.16 * Math.exp(-(f - vendredi) / 4) : 1)} r={-4 + calOut * 24} y={770 + calOut * 1500}>
            <div
              style={{
                position: "absolute",
                left: -290,
                top: -330,
                width: 580,
                height: 660,
                borderRadius: 50,
                background: C.paper,
                overflow: "hidden",
                boxShadow: "18px 20px 0 rgba(13,13,18,0.28)",
              }}
            >
              <div
                style={{
                  height: 150,
                  background: stuck ? C.coral : C.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: TEXT,
                  fontWeight: 800,
                  fontSize: 76,
                  letterSpacing: 5,
                  color: C.paper,
                }}
              >
                {stuck ? "VENDREDI" : ""}
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontFamily: DISPLAY,
                  fontSize: 430,
                  lineHeight: "500px",
                  color: stuck ? C.coral : C.ink,
                  transform: `translateY(${-flip * 90}px) scaleY(${1 - flip * 0.7})`,
                  opacity: 1 - flip * 0.6,
                }}
              >
                {9 + idx}
              </div>
            </div>
            {[-150, 150].map((x) => (
              <div key={x} style={{ position: "absolute", left: x - 17, top: -372, width: 34, height: 96, borderRadius: 17, background: C.ink }} />
            ))}
          </At>
        )}

        {f >= B + 3 && (
          <At s={lockIn * (f >= ferme ? 1 + 0.14 * Math.exp(-(f - ferme) / 4) : 1)} y={810 - hop} r={happy ? Math.sin((f - content) * 0.42) * 5 : -3}>
            <Svg size={640}>
              <g transform={`translate(0 ${-58 * (1 - closed)})`}>
                <path d="M-84 -40 V-104 A84 84 0 0 1 84 -104 V-40" fill="none" stroke={C.ink} strokeWidth={60} strokeLinecap="round" />
                <path d="M-84 -40 V-104 A84 84 0 0 1 84 -104 V-40" fill="none" stroke={C.paper} strokeWidth={34} strokeLinecap="round" />
              </g>
              <rect x={-150} y={-56} width={300} height={236} rx={44} fill={C.yellow} stroke={C.ink} strokeWidth={14} />
              {happy ? (
                <>
                  <circle cx={-56} cy={28} r={19} fill={C.ink} />
                  <circle cx={56} cy={28} r={19} fill={C.ink} />
                  <path d="M-64 88 Q0 146 64 88" fill="none" stroke={C.ink} strokeWidth={15} strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx={0} cy={42} r={28} fill={C.ink} />
                  <rect x={-11} y={50} width={22} height={64} rx={9} fill={C.ink} />
                </>
              )}
            </Svg>
          </At>
        )}
      </Shaker>
      <Flash opacity={flash(f, vendredi) + flash(f, ferme, 5, 0.4)} />
    </AbsoluteFill>
  );
};

// ───────────── la relance ─────────────

const LEVELS = [C.green, C.yellow, C.orange, C.coral, C.red];

/** « 3/3 ? », puis la jauge de difficulté qui grimpe. */
export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const A = q.c("relance.a");
  const B = q.c("relance.b");
  const cest = q.c("relance.b#c'est");
  const corse = q.c("relance.b#corse");

  return (
    <AbsoluteFill>
      <Backdrop color={C.slate} f={f} pattern="stripes" tint="rgba(255,255,255,0.05)" />
      <Shaker s={shakes(f, [[A, 22], [corse, 20]])}>
        <BigWord lines={["3/3 ?"]} f={f} at={A} x={525} y={760} size={350} color={C.yellow} shadow={C.coral} rotate={-4} exitAt={B - 3} />
        {f >= B + 2 &&
          LEVELS.map((col, i) => {
            const h = 150 + i * 105;
            const inP = pop(f, B + 2 + i * 2, { damping: 12, stiffness: 240 });
            const fillAt = cest + ((corse - cest) * i) / (LEVELS.length - 1);
            const on = prog(f, fillAt - 3, 5);
            const bump = i === LEVELS.length - 1 && f >= corse ? 1 + 0.12 * Math.exp(-(f - corse) / 4) : 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 150 + i * 156,
                  top: 1050 - h,
                  width: 124,
                  height: h,
                  borderRadius: 30,
                  background: "rgba(255,247,232,0.14)",
                  overflow: "hidden",
                  transform: `scaleY(${inP * bump})`,
                  transformOrigin: "50% 100%",
                }}
              >
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${on * 100}%`, background: col }} />
              </div>
            );
          })}
      </Shaker>
      <Flash opacity={flash(f, A, 5, 0.5)} />
    </AbsoluteFill>
  );
};

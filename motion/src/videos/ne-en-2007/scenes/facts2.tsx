import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { clamp, flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { Ball } from "./parts";

// ───────────── la relance ─────────────

const Padlock: React.FC<{ color: string }> = ({ color }) => (
  <svg width={52} height={62} viewBox="0 0 46 54">
    <path d="M11 24 V15 A12 12 0 0 1 35 15 V24" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
    <rect x={3} y={22} width={40} height={30} rx={8} fill={color} />
  </svg>
);

/** « Échauffement », puis les quatre cartes verrouillées. */
export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const word = q.c("relance.a#l'échauffement");
  const B = q.c("relance.b");
  const annee = q.c("relance.b#2007");

  const out = prog(f, B - 2, 8, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.red} f={f} pattern="stripes" tint="rgba(13,13,18,0.09)" />
      <Shaker s={shakes(f, [[word, 22], [annee, 14]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * -900}px)`, opacity: 1 - out }}>
            <BigWord lines={["Échauf-", "fement"]} f={f} at={word} y={760} size={270} rotate={-3} />
          </AbsoluteFill>
        )}
        {f >= B &&
          [5, 6, 7, 8].map((n, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const bump = f >= annee ? 1 + 0.16 * Math.exp(-(f - annee) / 4) : 1;
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
      <Flash opacity={flash(f, word, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 5. le téléphone interdit au collège (dit directement) ─────────────

/** Un téléphone allumé, le panneau d'interdiction qui tombe dessus, puis le téléphone éteint qui file au fond du sac. */
export const Portable: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("portable");
  const interdit = q.c("portable.a#interdit");
  const B = q.c("portable.b");
  const eteint = q.c("portable.b#éteint");
  const fond = q.c("portable.b#fond");

  const enter = pop(f, start + 2, { damping: 12 });
  const sign = pop(f, interdit, { damping: 11, stiffness: 240, mass: 0.6 });
  const signOut = prog(f, B - 3, 5, Easing.in(Easing.cubic));
  const off = prog(f, eteint, 4);
  const drop = prog(f, fond, 13, Easing.inOut(Easing.cubic));
  const bag = pop(f, fond - 3, { damping: 13, stiffness: 170 });
  const py = lerp(760, 905, drop) - Math.sin(drop * Math.PI) * 330;
  const ps = lerp(1, 0.46, clamp(drop * 1.6));
  const buzz = f < interdit ? Math.sin((f - start) * 1.1) * 2.5 : 0;
  const gulp = f >= fond + 12 ? 1 + 0.1 * Math.exp(-(f - fond - 12) / 3) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.slate} f={f} pattern="dots" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[interdit, 28], [fond + 12, 14]])}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: py,
            width: 400,
            height: 720,
            marginLeft: -200,
            marginTop: -360,
            borderRadius: 64,
            background: C.ink,
            border: "6px solid rgba(255,247,232,0.25)",
            boxSizing: "border-box",
            transform: `rotate(${-4 + buzz + drop * 12}deg) scale(${enter * ps})`,
          }}
        >
          <div style={{ position: "absolute", left: 14, top: 14, right: 14, bottom: 14, borderRadius: 46, overflow: "hidden", background: C.sky }}>
            {/* des bulles de messages qui arrivent */}
            {[0, 1, 2, 3].map((i) => {
              const at = start + 8 + i * 9;
              const p = pop(f, at, { damping: 10, stiffness: 240, mass: 0.5 });
              const mine = i % 2 === 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: mine ? 120 : 28,
                    top: 110 + i * 130,
                    width: 210,
                    height: 92,
                    borderRadius: 40,
                    background: mine ? C.yellow : C.paper,
                    transform: `scale(${p})`,
                    transformOrigin: mine ? "100% 100%" : "0% 100%",
                  }}
                />
              );
            })}
            <div style={{ position: "absolute", inset: 0, background: "#10131C", opacity: off }} />
          </div>
          <div style={{ position: "absolute", left: 140, top: 26, width: 108, height: 14, borderRadius: 7, background: C.ink }} />
        </div>

        {/* le panneau d'interdiction */}
        {f >= interdit && signOut < 1 && (
          <svg
            width={760}
            height={760}
            viewBox="-380 -380 760 760"
            style={{
              position: "absolute",
              left: 540 - 380,
              top: 760 - 380,
              overflow: "visible",
              transform: `scale(${lerp(2.6, 1, sign) * (1 - signOut)})`,
              opacity: clamp((f - interdit + 1) / 2),
            }}
          >
            <circle r={320} fill="none" stroke="#6E1414" strokeWidth={84} transform="translate(12 12)" />
            <circle r={320} fill="none" stroke={C.coral} strokeWidth={84} />
            <line x1={-226} y1={-226} x2={226} y2={226} stroke={C.coral} strokeWidth={84} />
          </svg>
        )}

        {/* le sac à dos, devant le téléphone qui tombe dedans */}
        {f >= fond - 3 && (
          <svg
            width={560}
            height={620}
            viewBox="-280 -330 560 620"
            style={{
              position: "absolute",
              left: 540 - 280,
              top: 880 - 310 + (1 - bag) * 900,
              overflow: "visible",
              transform: `scale(${gulp})`,
              transformOrigin: "50% 100%",
            }}
          >
            <path d="M-90 -210 V-262 A90 60 0 0 1 90 -262 V-210" fill="none" stroke={C.ink} strokeWidth={40} strokeLinecap="round" />
            <path d="M-90 -210 V-262 A90 60 0 0 1 90 -262 V-210" fill="none" stroke={C.orange} strokeWidth={20} strokeLinecap="round" />
            <rect x={-240} y={-230} width={480} height={500} rx={120} fill={C.coral} stroke={C.ink} strokeWidth={12} />
            <path d="M-200 -110 H200" stroke={C.ink} strokeWidth={10} strokeLinecap="round" strokeDasharray="4 26" />
            <rect x={-160} y={10} width={320} height={200} rx={56} fill={C.orange} stroke={C.ink} strokeWidth={12} />
            <rect x={-36} y={-4} width={72} height={40} rx={14} fill={C.yellow} stroke={C.ink} strokeWidth={8} />
          </svg>
        )}
      </Shaker>
      <Flash opacity={flash(f, interdit, 6, 0.6)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. la finale de décembre 2022 (dit directement) ─────────────

const MAROON = "#7A1436";

/** Un ballon coiffé d'un bonnet sous la neige, puis les trois buts qui ne suffisent pas. */
export const Qatar: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("qatar");
  const plein = q.c("qatar.a#plein");
  const B = q.c("qatar.b");
  const goals = [q.c("qatar.b#Mbappé"), q.c("qatar.b#marque"), q.c("qatar.b#trois")];
  const perd = q.c("qatar.b#perd");

  const enter = pop(f, start + 2, { damping: 11 });
  const out = prog(f, B - 4, 5, Easing.in(Easing.cubic));
  const hat = prog(f, plein - 6, 7, Easing.in(Easing.quad));
  const hatHit = f >= plein + 1 ? 1 - 0.1 * Math.exp(-(f - plein - 1) / 3) : 1;
  const snow = clamp((f - plein + 4) / 10);

  return (
    <AbsoluteFill>
      <Backdrop color={MAROON} f={f} pattern="rays" tint="rgba(255,255,255,0.05)" />
      <Shaker s={shakes(f, [[plein + 1, 18], [perd, 24]])}>
        {/* la neige de décembre */}
        {Array.from({ length: 34 }, (_, i) => {
          const speed = 5 + random(`ns${i}`) * 5;
          const y = ((random(`ny${i}`) * 1500 + (f - start) * speed) % 1500) - 60;
          const x = random(`nx${i}`) * 1080 + Math.sin((f - start) * 0.06 + i) * 26;
          const r = 9 + random(`nr${i}`) * 12;
          return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: C.paper, opacity: 0.85 * snow }} />;
        })}

        {out < 1 && (
          <AbsoluteFill style={{ transform: `scale(${enter * (1 - out)})`, transformOrigin: "540px 800px" }}>
            <Ball x={540} y={830} r={250} rot={Math.sin((f - start) * 0.08) * 6} scaleY={hatHit} />
            {/* le bonnet */}
            <svg
              width={520}
              height={420}
              viewBox="-260 -260 520 420"
              style={{ position: "absolute", left: 540 - 260, top: lerp(-420, 618 - 160 + (1 - hatHit) * 60, hat), overflow: "visible", transform: `rotate(${lerp(-24, -7, hat)}deg)` }}
            >
              <circle cx={0} cy={-196} r={52} fill={C.paper} stroke={C.ink} strokeWidth={10} />
              <path d="M-200 60 C-200 -230 200 -230 200 60 Z" fill={C.coral} stroke={C.ink} strokeWidth={12} strokeLinejoin="round" />
              <rect x={-226} y={30} width={452} height={96} rx={44} fill={C.paper} stroke={C.ink} strokeWidth={12} />
              {[-150, -75, 0, 75, 150].map((x) => (
                <line key={x} x1={x} y1={52} x2={x} y2={104} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
              ))}
            </svg>
          </AbsoluteFill>
        )}

        {/* un, deux, trois buts… qui tombent quand même */}
        {goals.map((at, i) => {
          if (f < at) return null;
          const p = pop(f, at, { damping: 8, stiffness: 240, mass: 0.5 });
          // à « perd », les trois ballons se dégonflent l'un après l'autre
          const flat = prog(f, perd + i * 3, 7, Easing.out(Easing.cubic));
          return <Ball key={i} x={240 + i * 300} y={885 + flat * 40} r={125 * p} rot={(i - 1) * 10 * (1 - flat)} scaleY={1 - 0.62 * flat} />;
        })}
      </Shaker>
      <Flash opacity={flash(f, goals[2], 5, 0.4)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. le permis à 17 ans (devinette) ─────────────

const Wheel: React.FC<{ color: boolean }> = ({ color }) => {
  const rim = color ? C.paper : C.ink;
  return (
    <>
      <circle r={270} fill="none" stroke={C.ink} strokeWidth={96} />
      {[180, 0, 90].map((a) => (
        <line key={a} x1={0} y1={0} x2={270 * Math.cos((a * Math.PI) / 180)} y2={270 * Math.sin((a * Math.PI) / 180)} stroke={C.ink} strokeWidth={84} />
      ))}
      <circle r={112} fill={C.ink} />
      {color && (
        <>
          <circle r={270} fill="none" stroke={rim} strokeWidth={70} />
          {[180, 0, 90].map((a) => (
            <line key={a} x1={0} y1={0} x2={262 * Math.cos((a * Math.PI) / 180)} y2={262 * Math.sin((a * Math.PI) / 180)} stroke={rim} strokeWidth={58} />
          ))}
          <circle r={98} fill={rim} />
          <circle r={62} fill={C.yellow} stroke={C.ink} strokeWidth={10} />
        </>
      )}
    </>
  );
};

/** Un volant en silhouette qui hésite, se dévoile à la réponse, puis tremble comme les parents. */
export const Permis: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("permis");
  const B = q.c("permis.b");
  const C3 = q.c("permis.c");
  const tremblent = q.c("permis.c#tremblent");

  const revealed = f >= B;
  const enter = pop(f, start + 2, { damping: 12 });
  const up = glide(f, B, 140) - glide(f, C3 - 2, 120);
  const kick = revealed ? 1 + 0.2 * Math.exp(-(f - B) / 4) : 1;
  const fear = clamp((f - tremblent) / 4);
  let angle = Math.sin((f - start) * 0.11) * 28;
  if (revealed) angle += 70 * (1 - Math.exp(-(f - B) / 6)) * Math.cos((f - B) * 0.12);
  const jx = fear * (random(`px${f}`) - 0.5) * 34;
  const jy = fear * (random(`py${f}`) - 0.5) * 22;
  angle += fear * (random(`pa${f}`) - 0.5) * 16;

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="stripes" tint="rgba(13,13,18,0.08)" />
      <Shaker s={shake(f, B, 24)}>
        <svg
          width={680}
          height={680}
          viewBox="-340 -340 680 680"
          style={{
            position: "absolute",
            left: 540 - 340 + jx,
            top: lerp(760, 610, up) - 340 + jy,
            overflow: "visible",
            transform: `scale(${enter * kick * lerp(1, 0.84, up)}) rotate(${angle}deg)`,
          }}
        >
          <Wheel color={revealed} />
        </svg>
        <Mystery f={f} at={start + 10} until={B} x={540} y={760} size={230} />
        <BigWord lines={["Permis", "à 17 ans"]} f={f} at={B} x={520} y={1120} size={150} rotate={-4} exitAt={C3 - 3} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 8. le premier vote : les municipales de mars 2026 (dit directement) ─────────────

/** Une urne, l'enveloppe qui tombe dedans, puis l'écharpe tricolore du maire. */
export const Vote: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("vote");
  const vote = q.c("vote.a#vote");
  const B = q.c("vote.b");
  const maire = q.c("vote.b#maire");

  const enter = pop(f, start + 2, { damping: 12 });
  const drop = prog(f, vote - 2, 12, Easing.in(Easing.quad));
  const ey = lerp(330, 930, drop) + (drop === 0 ? Math.sin((f - start) * 0.25) * 12 : 0);
  const er = lerp(-8, 14, drop);
  const landed = f >= vote + 10 ? 1 + 0.06 * Math.exp(-(f - vote - 10) / 3) : 1;
  const sash = prog(f, B, 9);
  const bump = f >= maire ? 1 + 0.1 * Math.exp(-(f - maire) / 4) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.indigo} f={f} pattern="dots" tint="rgba(255,255,255,0.06)" />
      <Shaker s={shakes(f, [[vote + 10, 16], [maire, 22]])}>
        <AbsoluteFill style={{ transform: `scale(${enter * landed * bump})`, transformOrigin: "540px 820px" }}>
          {/* le fond de l'urne et les enveloppes déjà dedans */}
          <div style={{ position: "absolute", left: 250, top: 590, width: 580, height: 480, borderRadius: 36, background: "rgba(255,255,255,0.16)" }} />
          {[[320, 1000, -12], [520, 1010, 8], [650, 995, -5]].map(([x, y, r], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y - 50, width: 170, height: 100, borderRadius: 14, background: "#BFD0FF", border: `8px solid ${C.ink}`, boxSizing: "border-box", transform: `rotate(${r}deg)` }} />
          ))}
          {/* l'enveloppe du jour */}
          <svg width={280} height={190} viewBox="-140 -95 280 190" style={{ position: "absolute", left: 540 - 140, top: ey - 95, overflow: "visible", transform: `rotate(${er}deg)` }}>
            <rect x={-130} y={-85} width={260} height={170} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={10} />
            <path d="M-128 -80 L0 14 L128 -80" fill="none" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
          </svg>
          {/* les parois vitrées, par-dessus */}
          <div style={{ position: "absolute", left: 250, top: 590, width: 580, height: 480, borderRadius: 36, border: `14px solid ${C.paper}`, boxSizing: "border-box", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", left: 300, top: 640, width: 26, height: 250, borderRadius: 13, background: "rgba(255,255,255,0.35)" }} />
          {/* le couvercle et sa fente */}
          <div style={{ position: "absolute", left: 215, top: 530, width: 650, height: 84, borderRadius: 26, background: C.paper, border: `10px solid ${C.ink}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 400, top: 562, width: 280, height: 20, borderRadius: 10, background: C.ink }} />

          {/* l'écharpe tricolore */}
          {f >= B && (
            <div
              style={{
                position: "absolute",
                left: 190,
                top: 770,
                width: 700 * sash,
                height: 150,
                transform: "rotate(-14deg)",
                transformOrigin: "350px 75px",
                border: `10px solid ${C.ink}`,
                borderRadius: 16,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: 1, background: "#2447E8" }} />
              <div style={{ flex: 1, background: C.paper }} />
              <div style={{ flex: 1, background: C.red }} />
            </div>
          )}
        </AbsoluteFill>
      </Shaker>
      <Flash opacity={flash(f, maire, 5, 0.45)} />
    </AbsoluteFill>
  );
};

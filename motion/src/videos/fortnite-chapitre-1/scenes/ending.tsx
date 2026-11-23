import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, flash, lerp, pop, prog, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Shaker } from "../../../components/ui";
import { C, DISPLAY, TEXT } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { HookTitle, hookTitleScale } from "./hook";

// ───────────── l'appel au commentaire ─────────────

/** Un seul objet : le champ de commentaire qui se remplit. */
export const Cta: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("cta");
  const A = q.c("cta.a");
  const comm = q.c("cta.a#commentaire");

  const card = pop(f, start + 2, { damping: 12, stiffness: 200 });
  const typed = "Moi : 7/8".slice(0, Math.max(0, Math.floor((f - A - 9) / 2)));
  const cursor = Math.floor(f / 6) % 2 === 0;
  const send = f >= comm ? 1 + 0.22 * Math.abs(Math.sin((f - comm) * 0.4)) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.indigo} f={f} pattern="stripes" tint="rgba(255,255,255,0.06)" />
      <div
        style={{
          position: "absolute",
          left: 95,
          top: 760 - 120 + (1 - card) * 900,
          width: 850,
          height: 240,
          borderRadius: 56,
          background: C.paper,
          boxShadow: "16px 18px 0 rgba(13,13,18,0.3)",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          boxSizing: "border-box",
          gap: 32,
          transform: "rotate(-2deg)",
        }}
      >
        <div style={{ width: 130, height: 130, borderRadius: "50%", background: C.yellow, border: `9px solid ${C.ink}`, boxSizing: "border-box", flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: TEXT, fontWeight: 800, fontSize: 84, color: C.ink, whiteSpace: "nowrap" }}>
          {typed}
          <span style={{ opacity: cursor ? 1 : 0, color: C.coral }}>|</span>
        </div>
        <div style={{ width: 130, height: 130, borderRadius: "50%", background: C.coral, flexShrink: 0, transform: `scale(${send})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={68} height={68} viewBox="0 0 60 60">
            <path d="M30 50 V12 M12 28 L30 10 L48 28" fill="none" stroke={C.paper} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────── la chute ─────────────

/** Un chiffre de compteur qui défile verticalement (v peut être fractionnaire). */
const Digit: React.FC<{ v: number; size: number }> = ({ v, size }) => {
  const base = Math.floor(v);
  const frac = v - base;
  const h = size * 1.08;
  return (
    <span style={{ display: "inline-block", height: h, overflow: "hidden", verticalAlign: "top" }}>
      <span style={{ display: "block", transform: `translateY(${-frac * h}px)` }}>
        <span style={{ display: "block", height: h, lineHeight: `${h}px` }}>{((base % 10) + 10) % 10}</span>
        <span style={{ display: "block", height: h, lineHeight: `${h}px` }}>{(((base + 1) % 10) + 10) % 10}</span>
      </span>
    </span>
  );
};

/** Chaque temps a l'écran pour lui seul : « Le dernier. », « Fait mal. », le compteur, « 10 ans », puis la boucle. */
export const Punch: React.FC<SceneProps & { end: number }> = ({ f, q, end }) => {
  const dernier = q.c("punch.a#le");
  const mal = q.c("punch.b#fait");
  const P = q.c("punch.c");
  const cetait = q.c("punch.c#c'était");
  const dix = q.c("punch.c#sept");
  const seul = q.c("punch.d#seulement");

  // le compteur d'années : 2019 → 2026
  const roll = prog(f, cetait, Math.max(8, dix - cetait - 3), Easing.inOut(Easing.cubic));
  const v = 19 + 7 * roll;
  const ones = v % 10;
  const tens = Math.floor(v / 10) + clamp(ones - 9);
  const yearSize = 420;
  const yearOut = prog(f, dix - 2, 4, Easing.in(Easing.cubic));

  // la boucle : le titre d'ouverture revient pile dans l'état de la première image
  const loopIn = prog(f, end - 10, 9, Easing.out(Easing.cubic));
  const loopScale = lerp(1.5, hookTitleScale(0), prog(f, end - 10, 10, Easing.out(Easing.cubic)));
  const dots = Math.max(0, Math.floor((f - seul) / 5) % 4);

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,214,10,0.055)" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 35%, ${C.coral} 130%)`, opacity: flash(f, mal, 14, 0.75) }} />
      <Shaker s={shakes(f, [[dernier, 22], [mal, 30], [dix, 34]])}>
        <BigWord lines={["Le dernier."]} f={f} at={dernier} y={760} size={215} shadow={C.coral} rotate={-3} exitAt={mal - 3} />
        <BigWord lines={["Fait mal."]} f={f} at={mal} x={520} y={760} size={250} color={C.coral} shadow="#6E1414" rotate={3} exitAt={P - 8} />

        {f >= P && yearOut < 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1080,
              top: 760,
              textAlign: "center",
              fontFamily: DISPLAY,
              fontSize: yearSize,
              color: C.paper,
              lineHeight: `${yearSize * 1.08}px`,
              transform: `translateY(-50%) scale(${pop(f, P + 2, { damping: 11 }) * (1 + 0.35 * yearOut)})`,
              opacity: 1 - yearOut,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "inline-block", verticalAlign: "top" }}>20</span>
            <Digit v={tens} size={yearSize} />
            <Digit v={ones} size={yearSize} />
          </div>
        )}
        <BigWord lines={["7 ans"]} f={f} at={dix} x={520} y={760} size={350} color={C.yellow} shadow={C.coral} rotate={-4} exitAt={seul - 3} />

        {f >= seul && loopIn < 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1080,
              top: 720,
              textAlign: "center",
              fontFamily: DISPLAY,
              fontSize: 300,
              lineHeight: 1,
              color: C.paper,
              letterSpacing: 24,
              opacity: 1 - loopIn,
              transform: `scale(${pop(f, seul, { damping: 12 })})`,
            }}
          >
            {".".repeat(Math.min(3, dots + 1))}
          </div>
        )}
        {loopIn > 0 && <HookTitle f={0} scale={loopScale} opacity={loopIn} />}
      </Shaker>
      <Flash opacity={flash(f, dix, 7, 0.75)} />
    </AbsoluteFill>
  );
};

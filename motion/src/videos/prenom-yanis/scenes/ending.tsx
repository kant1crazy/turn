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
      <Backdrop color={C.slate} f={f} pattern="stripes" tint="rgba(255,255,255,0.06)" />
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

/** Chaque temps a l'écran pour lui seul : « Le dernier. », le compteur, le prénom avec deux N, puis la boucle. */
export const Punch: React.FC<SceneProps & { end: number }> = ({ f, q, end }) => {
  const dernier = q.c("punch.a#le");
  const plus = q.c("punch.b#plus");
  const yanis = q.c("punch.b#Yanis");
  const P = q.c("punch.c");
  const deux = q.c("punch.c#deux");
  const seul = q.c("punch.d#seulement");

  // le compteur : 0 → 60 000
  const roll = prog(f, plus, Math.max(8, yanis - plus - 4), Easing.out(Easing.cubic));
  const n = Math.round((60000 * roll) / 1000) * 1000;
  const count = n >= 1000 ? `${n / 1000} 000` : "0";
  const numIn = pop(f, plus, { damping: 10, stiffness: 230, mass: 0.6 });
  const numOut = prog(f, P - 3, 5, Easing.in(Easing.cubic));
  const landed = plus + Math.max(8, yanis - plus - 4);

  // le prénom mal écrit : le deuxième N tombe du ciel
  const word = pop(f, deux, { damping: 10, stiffness: 230, mass: 0.6 });
  const wordOut = prog(f, seul - 3, 5, Easing.in(Easing.cubic));
  const nIn = pop(f, deux + 4, { damping: 8, stiffness: 260, mass: 0.5 });

  // la boucle : le titre d'ouverture revient pile dans l'état de la première image
  const loopIn = prog(f, end - 10, 9, Easing.out(Easing.cubic));
  const loopScale = lerp(1.5, hookTitleScale(0), prog(f, end - 10, 10, Easing.out(Easing.cubic)));
  const dots = Math.max(0, Math.floor((f - seul) / 5) % 4);

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,214,10,0.055)" />
      <Shaker s={shakes(f, [[dernier, 22], [landed, 24], [deux + 4, 34]])}>
        <BigWord lines={["Le dernier."]} f={f} at={dernier} y={760} size={215} shadow={C.coral} rotate={-3} exitAt={plus - 3} />

        {f >= plus && numOut < 1 && (
          <div
            style={{
              position: "absolute",
              left: 525,
              top: 760,
              transform: `translate(-50%, -50%) rotate(-3deg) scale(${lerp(2, 1, numIn) * (1 - 0.4 * numOut) * (f >= landed ? 1 + 0.16 * Math.exp(-(f - landed) / 4) : 1)})`,
              opacity: clamp((f - plus + 1) / 2) * (1 - numOut),
              fontFamily: DISPLAY,
              fontSize: 270,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `14px 14px 0 ${C.coral}`,
            }}
          >
            <span style={{ color: C.yellow }}>+</span>
            {count}
          </div>
        )}

        {f >= deux && wordOut < 1 && (
          <div
            style={{
              position: "absolute",
              left: 525,
              top: 760,
              transform: `translate(-50%, -50%) rotate(-4deg) scale(${lerp(2.3, 1, word) * (1 - 0.4 * wordOut)})`,
              opacity: clamp((f - deux + 1) / 2) * (1 - wordOut),
              fontFamily: DISPLAY,
              fontSize: 300,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `15px 15px 0 ${C.coral}`,
              display: "flex",
            }}
          >
            <span>YAN</span>
            <span
              style={{
                display: "inline-block",
                color: C.coral,
                textShadow: "15px 15px 0 #6E1414",
                width: `${0.53 * nIn}em`,
                transform: `translateY(${(1 - nIn) * -700}px) rotate(${(1 - nIn) * -40}deg)`,
                opacity: clamp((f - deux - 3) / 2),
              }}
            >
              N
            </span>
            <span>IS</span>
          </div>
        )}

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
      <Flash opacity={flash(f, deux + 4, 7, 0.75)} />
    </AbsoluteFill>
  );
};

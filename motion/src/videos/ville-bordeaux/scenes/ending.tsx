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

// ───────────── la chute : cannelé, un N ou deux ? ─────────────

/** Chaque temps a l'écran pour lui seul : « Le dernier. », « Fâche. », le mot qui hésite, puis la boucle. */
export const Punch: React.FC<SceneProps & { end: number }> = ({ f, q, end }) => {
  const dernier = q.c("punch.a#le");
  const fache = q.c("punch.b#fâche");
  const P = q.c("punch.c");
  const jamais = q.c("punch.c#T'as");
  const un = q.c("punch.c#un");
  const ou = q.c("punch.c#ou");
  const D = q.c("punch.d");

  // le mot hésite : un N, deux N, puis ça clignote de plus en plus vite
  let two = true;
  if (f >= un) two = false;
  if (f >= ou) two = true;
  if (f >= ou + 24) two = Math.floor((f - ou - 24) / (f >= D ? 4 : 7)) % 2 === 1;
  const lastFlip = f >= ou + 24 ? ou + 24 + Math.floor((f - ou - 24) / (f >= D ? 4 : 7)) * (f >= D ? 4 : 7) : f >= ou ? ou : f >= un ? un : P;
  const kick = 1 + 0.5 * Math.exp(-(f - lastFlip) / 2.5);
  const asking = f >= jamais;

  const wordIn = pop(f, P, { damping: 10, stiffness: 230, mass: 0.6 });
  const loopIn = prog(f, end - 10, 9, Easing.out(Easing.cubic));
  const loopScale = lerp(1.5, hookTitleScale(0), prog(f, end - 10, 10, Easing.out(Easing.cubic)));
  const size = 235;

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,214,10,0.055)" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 35%, ${C.coral} 130%)`, opacity: flash(f, fache, 14, 0.75) }} />
      <Shaker s={shakes(f, [[dernier, 22], [fache, 30], [P, 30], [un, 10], [ou, 10]])}>
        <BigWord lines={["Le dernier."]} f={f} at={dernier} y={760} size={215} shadow={C.coral} rotate={-3} exitAt={fache - 3} />
        <BigWord lines={["Fâche."]} f={f} at={fache} x={520} y={760} size={290} color={C.coral} shadow="#6E1414" rotate={3} exitAt={P - 8} />

        {f >= P && loopIn < 1 && (
          <div
            style={{
              position: "absolute",
              left: 520,
              top: 760,
              transform: `translate(-50%, -50%) rotate(-3deg) scale(${lerp(2.3, 1, wordIn)})`,
              opacity: clamp((f - P + 1) / 2) * (1 - loopIn),
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `${size * 0.05}px ${size * 0.05}px 0 ${C.coral}`,
            }}
          >
            CA
            <span
              style={{
                display: "inline-block",
                color: asking ? C.yellow : C.paper,
                textShadow: asking ? `${size * 0.05}px ${size * 0.05}px 0 ${C.ink}` : undefined,
                transform: `scale(${asking ? kick : 1})`,
                transformOrigin: "50% 60%",
                margin: asking ? "0 6px" : 0,
              }}
            >
              {two ? "NN" : "N"}
            </span>
            ELÉ
          </div>
        )}
        {loopIn > 0 && <HookTitle f={0} scale={loopScale} opacity={loopIn} />}
      </Shaker>
      <Flash opacity={flash(f, P, 7, 0.75)} />
    </AbsoluteFill>
  );
};

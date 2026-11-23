import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, lerp, pop, prog, shakes } from "../../../anim";
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
  const typed = "Moi : 6/8".slice(0, Math.max(0, Math.floor((f - A - 9) / 2)));
  const cursor = Math.floor(f / 6) % 2 === 0;
  const send = f >= comm ? 1 + 0.22 * Math.abs(Math.sin((f - comm) * 0.4)) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="stripes" tint="rgba(255,255,255,0.06)" />
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

const Flame: React.FC<{ x: number; y: number; f: number; k: number; s: number }> = ({ x, y, f, k, s }) => (
  <svg
    width={90}
    height={130}
    viewBox="-45 -120 90 130"
    style={{
      position: "absolute",
      left: x - 45,
      top: y - 120,
      overflow: "visible",
      transform: `scale(${s * (1 + 0.08 * Math.sin(f * 0.9 + k))}) rotate(${Math.sin(f * 0.5 + k) * 7}deg)`,
      transformOrigin: "50% 100%",
    }}
  >
    <path d="M0 -116 C34 -70 40 -44 40 -28 A40 40 0 0 1 -40 -28 C-40 -44 -34 -70 0 -116 Z" fill={C.orange} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M0 -62 C14 -42 18 -32 18 -24 A18 18 0 0 1 -18 -24 C-18 -32 -14 -42 0 -62 Z" fill={C.yellow} />
  </svg>
);

/** « Le dernier. », « Il pique. », puis le gâteau : les bougies « 19 » deviennent « 20 » ; et la boucle. */
export const Punch: React.FC<SceneProps & { end: number }> = ({ f, q, end }) => {
  const dernier = q.c("punch.a#le");
  const pique = q.c("punch.b#il");
  const P = q.c("punch.c");
  const vingt = q.c("punch.c#vingt");
  const surtout = q.c("punch.d#surtout");

  const cakeIn = pop(f, P + 1, { damping: 12, stiffness: 180 });
  const cakeOut = prog(f, surtout - 4, 5, Easing.in(Easing.cubic));
  const twenty = f >= vingt;
  const slam = twenty ? lerp(2.2, 1, pop(f, vingt, { damping: 10, stiffness: 230, mass: 0.6 })) : 1;
  const tremble = !twenty && f >= P + 8 ? Math.sin((f - P) * 1.6) * 4 * prog(f, P + 8, Math.max(4, vingt - P - 8)) : 0;

  // la boucle : le titre d'ouverture revient pile dans l'état de la première image
  const loopIn = prog(f, end - 10, 9, Easing.out(Easing.cubic));
  const loopScale = lerp(1.5, hookTitleScale(0), prog(f, end - 10, 10, Easing.out(Easing.cubic)));
  const dots = Math.max(0, Math.floor((f - surtout) / 5) % 4);

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,214,10,0.055)" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 35%, ${C.coral} 130%)`, opacity: flash(f, pique, 14, 0.75) }} />
      <Shaker s={shakes(f, [[dernier, 22], [pique, 30], [vingt, 34]])}>
        <BigWord lines={["Le dernier."]} f={f} at={dernier} y={760} size={215} shadow={C.coral} rotate={-3} exitAt={pique - 3} />
        <BigWord lines={["Il pique."]} f={f} at={pique} x={520} y={760} size={250} color={C.coral} shadow="#6E1414" rotate={3} exitAt={P - 8} />

        {f >= P && cakeOut < 1 && (
          <AbsoluteFill style={{ transform: `scale(${cakeIn * (1 - 0.4 * cakeOut)})`, opacity: 1 - cakeOut, transformOrigin: "540px 800px" }}>
            {/* le gâteau */}
            <div style={{ position: "absolute", left: 150, top: 1085, width: 780, height: 44, borderRadius: 22, background: C.paper }} />
            <div style={{ position: "absolute", left: 220, top: 880, width: 640, height: 215, borderRadius: "44px 44px 14px 14px", background: C.paper, border: `12px solid ${C.ink}`, boxSizing: "border-box", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 64, background: C.coral }} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ position: "absolute", left: 18 + i * 104, top: 30, width: 68, height: 62 + (i % 2) * 34, borderRadius: 34, background: C.coral }} />
              ))}
            </div>
            {/* les bougies-chiffres */}
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 1080,
                top: 520 + tremble,
                textAlign: "center",
                fontFamily: DISPLAY,
                fontSize: 380,
                lineHeight: "380px",
                letterSpacing: 26,
                paddingLeft: 26,
                boxSizing: "border-box",
                color: twenty ? C.yellow : C.paper,
                WebkitTextStroke: `14px ${C.ink}`,
                paintOrder: "stroke fill",
                textShadow: `12px 12px 0 ${twenty ? C.coral : "rgba(255,247,232,0.25)"}`,
                transform: `scale(${slam})`,
                transformOrigin: "50% 80%",
                whiteSpace: "nowrap",
              }}
            >
              {twenty ? "20" : "19"}
            </div>
            {(twenty ? [436, 660] : [432, 628]).map((x, i) => (
              <Flame key={i} x={x} y={545 + tremble} f={f} k={i * 2} s={twenty ? 1.25 * pop(f, vingt + 2 + i * 2, { damping: 8 }) : 0.85} />
            ))}
          </AbsoluteFill>
        )}

        {f >= surtout && loopIn < 1 && (
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
              transform: `scale(${pop(f, surtout, { damping: 12 })})`,
            }}
          >
            {".".repeat(Math.min(3, dots + 1))}
          </div>
        )}
        {loopIn > 0 && <HookTitle f={0} scale={loopScale} opacity={loopIn} />}
      </Shaker>
      <Flash opacity={flash(f, vingt, 7, 0.75)} />
    </AbsoluteFill>
  );
};

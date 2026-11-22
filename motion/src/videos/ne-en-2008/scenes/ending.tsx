import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, lerp, pop, prog, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { At, Svg } from "./facts1";
import { HookTitle, hookTitleScale } from "./hook";

// ───────────── l'appel au commentaire ─────────────

/** Un seul objet : la bulle de commentaire dont le score grimpe. */
export const Cta: React.FC<SceneProps> = ({ f, q }) => {
  const { start, end } = q.scene("cta");
  const A = q.c("cta.a");
  const step = Math.max(4, Math.floor((end - A - 12) / 4));
  const n = Math.min(3, Math.max(0, Math.floor((f - A - 6) / step)));
  const since = f - A - 6 - n * step;
  const tick = since >= 0 ? 1 + 0.3 * Math.exp(-since / 3) : 1;

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="stripes" tint="rgba(13,13,18,0.07)" />
      <At s={pop(f, start + 2, { damping: 10 })} r={-4 + Math.sin((f - start) * 0.15) * 2}>
        <Svg size={860}>
          <path d="M-180 -120 H180 A40 40 0 0 1 220 -80 V70 A40 40 0 0 1 180 110 H-60 L-150 190 V110 H-180 A40 40 0 0 1 -220 70 V-80 A40 40 0 0 1 -180 -120 Z" transform="scale(0.88)" fill={C.paper} stroke={C.ink} strokeWidth={13} strokeLinejoin="round" />
        </Svg>
        <div style={{ position: "absolute", left: -400, width: 800, top: -200, textAlign: "center", fontFamily: DISPLAY, fontSize: 300, lineHeight: "380px", color: C.ink, whiteSpace: "nowrap" }}>
          <span style={{ display: "inline-block", color: C.coral, transform: `scale(${tick})` }}>{5 + n}</span>/8
        </div>
      </At>
    </AbsoluteFill>
  );
};

// ───────────── la chute ─────────────

/** « Il en reste un. », « Accroche-toi. », le biberon, « Au CP », puis la boucle. */
export const Punch: React.FC<SceneProps & { end: number }> = ({ f, q, end }) => {
  const reste = q.c("punch.a#il");
  const accroche = q.c("punch.b");
  const P = q.c("punch.c");
  const sont = q.c("punch.c#sont");
  const cp = q.c("punch.c#au");
  const seul = q.c("punch.d#surtout");

  const babyOut = prog(f, sont + 1, cp - sont - 1, Easing.in(Easing.cubic));
  const loopIn = prog(f, end - 10, 9, Easing.out(Easing.cubic));
  const loopScale = lerp(1.5, hookTitleScale(0), prog(f, end - 10, 10, Easing.out(Easing.cubic)));
  const dots = Math.max(0, Math.floor((f - seul) / 4) % 4);

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,77,77,0.06)" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 35%, ${C.coral} 130%)`, opacity: flash(f, accroche, 14, 0.75) }} />
      <Shaker s={shakes(f, [[reste, 22], [accroche, 28], [cp, 34]])}>
        <BigWord lines={["Il en", "reste un."]} f={f} at={reste} x={525} y={760} size={215} shadow={C.coral} rotate={-3} exitAt={accroche - 3} />
        <BigWord lines={["Accroche-", "toi."]} f={f} at={accroche} x={520} y={760} size={200} color={C.coral} shadow="#6E1414" rotate={3} exitAt={P - 8} />

        {f >= P && babyOut < 1 && (
          <At s={pop(f, P + 1, { damping: 9 }) * (1 - babyOut)} r={14 + Math.sin((f - P) * 0.3) * 7 + babyOut * 60}>
            <Svg size={720}>
              {/* le biberon : la tétine, la bague, le corps gradué */}
              <path d="M-52 -92 C-52 -140 -24 -138 -22 -168 A22 22 0 0 1 22 -168 C24 -138 52 -140 52 -92 Z" fill={C.yellow} stroke={C.paper} strokeWidth={10} strokeLinejoin="round" />
              <rect x={-98} y={-66} width={196} height={250} rx={48} fill={C.paper} />
              <path d="M-98 30 Q-50 10 0 30 T98 30 V136 A48 48 0 0 1 50 184 H-50 A48 48 0 0 1 -98 136 Z" fill={C.sky} />
              {[0, 1, 2].map((i) => (
                <rect key={i} x={30} y={-6 + i * 52} width={44} height={11} rx={5} fill={C.ink} />
              ))}
              <rect x={-112} y={-100} width={224} height={52} rx={22} fill={C.coral} />
            </Svg>
          </At>
        )}
        <BigWord lines={["Au CP"]} f={f} at={cp} x={520} y={760} size={400} color={C.yellow} shadow={C.coral} rotate={-4} exitAt={seul - 3} />

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
      <Flash opacity={flash(f, cp, 7, 0.75)} />
    </AbsoluteFill>
  );
};

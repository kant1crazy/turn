import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY, TEXT } from "../../../theme";
import type { SceneProps } from "../../../timeline";

// ───────────── 1. « avec un seul N » (dit directement) ─────────────

/** Une bulle qui répète, puis le prénom écrit avec un N de trop, qui se fait éjecter. */
export const Ortho: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("ortho");
  const B = q.c("ortho.b");
  const seul = q.c("ortho.b#seul");

  const bubble = pop(f, start + 2, { damping: 11 });
  const bubbleOut = prog(f, B - 4, 5, Easing.in(Easing.cubic));
  const word = pop(f, B, { damping: 10, stiffness: 230, mass: 0.6 });
  // le N en trop : il s'envole, les autres lettres se resserrent
  const kick = prog(f, seul, 12, Easing.in(Easing.quad));
  const close = glide(f, seul + 2, 160);
  const size = 300;

  return (
    <AbsoluteFill>
      <Backdrop color={C.orange} f={f} pattern="dots" tint="rgba(13,13,18,0.1)" />
      <Shaker s={shakes(f, [[B, 20], [seul, 24]])}>
        {bubbleOut < 1 && (
          <svg
            width={640}
            height={560}
            viewBox="-320 -260 640 560"
            style={{
              position: "absolute",
              left: 540 - 320,
              top: 760 - 280 + Math.sin((f - start) * 0.2) * 8,
              overflow: "visible",
              transform: `scale(${bubble * (1 - bubbleOut)}) rotate(-3deg)`,
            }}
          >
            <path d="M-120 150 L-190 280 L-10 170 Z" fill={C.paper} stroke={C.ink} strokeWidth={14} strokeLinejoin="round" />
            <rect x={-300} y={-220} width={600} height={400} rx={130} fill={C.paper} stroke={C.ink} strokeWidth={14} />
            <rect x={-150} y={140} width={160} height={36} fill={C.paper} />
            {[0, 1, 2].map((i) => {
              const u = ((f - start) * 0.16 - i * 0.7) % 3.2;
              const hop = u > 0 && u < 1 ? Math.sin(u * Math.PI) * -46 : 0;
              return <circle key={i} cx={-130 + i * 130} cy={-20 + hop} r={42} fill={C.ink} />;
            })}
          </svg>
        )}

        {f >= B && (
          <div
            style={{
              position: "absolute",
              left: 525,
              top: 760,
              transform: `translate(-50%, -50%) rotate(-4deg) scale(${lerp(2.3, 1, word)})`,
              opacity: clamp((f - B + 1) / 2),
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `15px 15px 0 ${C.ink}`,
              display: "flex",
            }}
          >
            {"YAN".split("").map((l) => (
              <span key={l}>{l}</span>
            ))}
            <span
              style={{
                display: "inline-block",
                color: C.ink,
                textShadow: "none",
                width: `${lerp(0.53, 0, close)}em`,
                transform: `translate(${kick * 260}px, ${-kick * 900}px) rotate(${kick * 220}deg)`,
                opacity: 1 - clamp((kick - 0.75) / 0.25),
              }}
            >
              N
            </span>
            {"IS".split("").map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, B) + flash(f, seul, 5, 0.4)} />
    </AbsoluteFill>
  );
};

// ───────────── 2. deux Yanis dans la classe (dit directement) ─────────────

const PUPILS = [C.paper, C.yellow, C.paper, C.yellow, C.paper];

/** Une rangée d'élèves ; deux lèvent la main en même temps. Puis l'initiale collée au prénom. */
export const Classe: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("classe");
  const deux = q.c("classe.b#deux");
  const C3 = q.c("classe.c");
  const initiale = q.c("classe.c#l'initiale");

  const out = prog(f, C3 - 3, 7, Easing.in(Easing.cubic));
  const tagIn = pop(f, C3 + 2, { damping: 11, stiffness: 200 });
  const letter = pop(f, initiale, { damping: 8, stiffness: 240, mass: 0.5 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.green} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[deux, 20], [initiale, 22]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * 1100}px)` }}>
            {PUPILS.map((col, i) => {
              const x = 150 + i * 195;
              const inP = pop(f, start + 2 + i * 2, { damping: 11, stiffness: 180 });
              const me = i === 1 || i === 3;
              const up = me ? pop(f, deux + (i === 3 ? 3 : 0), { damping: 9, stiffness: 240, mass: 0.5 }) : 0;
              const wave = me && f >= deux ? Math.sin((f - deux) * 0.5 + i) * 8 : 0;
              return (
                <svg
                  key={i}
                  width={190}
                  height={520}
                  viewBox="-95 -300 190 520"
                  style={{ position: "absolute", left: x - 95, top: 860 - 300 + (1 - inP) * 900, overflow: "visible" }}
                >
                  {me && (
                    <line
                      x1={52}
                      y1={70}
                      x2={lerp(70, 62 + wave, up)}
                      y2={lerp(170, -250, up)}
                      stroke={col}
                      strokeWidth={30}
                      strokeLinecap="round"
                    />
                  )}
                  <rect x={-78} y={40} width={156} height={220} rx={56} fill={col} stroke={C.ink} strokeWidth={10} />
                  <circle cy={-40} r={78} fill={col} stroke={C.ink} strokeWidth={10} />
                  <circle cx={-26} cy={-48} r={9} fill={C.ink} />
                  <circle cx={26} cy={-48} r={9} fill={C.ink} />
                </svg>
              );
            })}
            {/* la table */}
            <div style={{ position: "absolute", left: 40, top: 1050, width: 1000, height: 60, borderRadius: 30, background: C.ink }} />
          </AbsoluteFill>
        )}

        {f >= C3 && (
          <div
            style={{
              position: "absolute",
              left: 525,
              top: 760 + (1 - tagIn) * 900,
              transform: "translate(-50%, -50%) rotate(-4deg)",
              fontFamily: DISPLAY,
              fontSize: 270,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `14px 14px 0 ${C.ink}`,
            }}
          >
            YANIS
            <span
              style={{
                display: "inline-block",
                marginLeft: 34,
                color: C.yellow,
                transform: `scale(${lerp(0, 1, letter)}) rotate(${lerp(-30, 0, letter)}deg)`,
                transformOrigin: "50% 60%",
              }}
            >
              B.
            </span>
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, initiale, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 3. l'année record (devinette) ─────────────

/** Une courbe qui grimpe vers un sommet inconnu, puis l'année, puis le nombre. */
export const Record: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("record");
  const B = q.c("record.b");
  const C3 = q.c("record.c");
  const mille = q.c("record.c#quatre");

  const draw = prog(f, start + 4, B - start - 10, Easing.inOut(Easing.cubic));
  const curveOut = prog(f, B - 2, 5, Easing.in(Easing.cubic));
  const LEN = 1500;
  const n = Math.round(lerp(0, 4000, prog(f, C3, Math.max(6, mille - C3 + 6), Easing.out(Easing.cubic))) / 100) * 100;
  const count = n >= 1000 ? `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, "0")}` : String(n);
  const numIn = pop(f, C3, { damping: 10, stiffness: 230, mass: 0.6 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.blue} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[B, 26], [mille + 6, 18]])}>
        {curveOut < 1 && (
          <svg
            width={860}
            height={640}
            viewBox="0 0 860 640"
            style={{ position: "absolute", left: 110, top: 440, overflow: "visible", opacity: 1 - curveOut, transform: `scale(${1 - 0.2 * curveOut})` }}
          >
            <path
              d="M20 600 C220 596 330 580 430 430 C520 290 560 90 640 60 C720 90 760 300 840 420"
              fill="none"
              stroke={C.paper}
              strokeWidth={30}
              strokeLinecap="round"
              strokeDasharray={LEN}
              strokeDashoffset={LEN * (1 - draw)}
            />
          </svg>
        )}
        <Mystery f={f} at={start + 12} until={B} x={750} y={440} size={230} />

        <BigWord lines={["2007"]} f={f} at={B} x={525} y={760} size={420} color={C.yellow} rotate={-4} exitAt={C3 - 3} />

        {f >= C3 && (
          <div
            style={{
              position: "absolute",
              left: 525,
              top: 760,
              transform: `translate(-50%, -50%) rotate(-3deg) scale(${lerp(2, 1, numIn) * (f >= mille + 6 ? 1 + 0.14 * Math.exp(-(f - mille - 6) / 4) : 1)})`,
              opacity: clamp((f - C3 + 1) / 2),
              fontFamily: DISPLAY,
              fontSize: 300,
              lineHeight: 1,
              color: C.paper,
              whiteSpace: "nowrap",
              textShadow: `15px 15px 0 ${C.ink}`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ color: C.yellow }}>+</span>
            {count}
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 4. le pseudo (dit directement) ─────────────

const DIGITS = "48271";

/** Un seul objet : le champ de pseudo. Il se remplit, puis « yanis » tout court est refusé. */
export const Pseudo: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("pseudo");
  const yanis = q.c("pseudo.a#Yanis");
  const avec = q.c("pseudo.a#avec");
  const B = q.c("pseudo.b");
  const pris = q.c("pseudo.b#déjà");

  const card = pop(f, start + 2, { damping: 12, stiffness: 200 });
  const name = "yanis".slice(0, clamp(Math.floor((f - yanis) / 2) + 1, 0, 5));
  const digits = f < B ? DIGITS.slice(0, clamp(Math.floor((f - avec) / 3) + 1, 0, DIGITS.length)) : DIGITS.slice(0, Math.max(0, DIGITS.length - Math.floor((f - B) / 2) - 1));
  const refused = f >= pris;
  const s = shake(f, pris, 30, 14);
  const cursor = Math.floor(f / 6) % 2 === 0;
  const badge = pop(f, pris, { damping: 9, stiffness: 260, mass: 0.5 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.violet} f={f} pattern="stripes" tint="rgba(255,255,255,0.07)" />
      <div
        style={{
          position: "absolute",
          left: 80 + s.x * 1.5,
          top: 760 - 130 + (1 - card) * 900,
          width: 880,
          height: 260,
          borderRadius: 60,
          background: C.paper,
          border: `12px solid ${refused ? C.coral : C.ink}`,
          boxShadow: "16px 18px 0 rgba(13,13,18,0.3)",
          display: "flex",
          alignItems: "center",
          padding: "0 44px",
          boxSizing: "border-box",
          transform: "rotate(-2deg)",
        }}
      >
        <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 104, color: C.violet, marginRight: 6 }}>@</div>
        <div style={{ flex: 1, fontFamily: TEXT, fontWeight: 800, fontSize: 104, color: C.ink, whiteSpace: "nowrap" }}>
          {name}
          <span style={{ color: C.violet }}>{digits}</span>
          <span style={{ opacity: cursor && !refused ? 1 : 0, color: C.coral }}>|</span>
        </div>
        {refused && (
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: C.coral,
              flexShrink: 0,
              transform: `scale(${badge})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={80} height={80} viewBox="0 0 60 60">
              <path d="M12 12 L48 48 M48 12 L12 48" fill="none" stroke={C.paper} strokeWidth={11} strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <Flash opacity={flash(f, pris, 6, 0.5)} color={C.coral} />
    </AbsoluteFill>
  );
};

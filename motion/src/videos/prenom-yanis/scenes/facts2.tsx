import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, glide, lerp, pop, prog, shake, shakes } from "../../../anim";
import { Backdrop, BigWord, Flash, Mystery, Shaker } from "../../../components/ui";
import { C, DISPLAY } from "../../../theme";
import type { SceneProps } from "../../../timeline";
import { Face, Strike } from "./shared";

// ───────────── la relance ─────────────

const Padlock: React.FC<{ color: string }> = ({ color }) => (
  <svg width={52} height={62} viewBox="0 0 46 54">
    <path d="M11 24 V15 A12 12 0 0 1 35 15 V24" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
    <rect x={3} y={22} width={40} height={30} rx={8} fill={color} />
  </svg>
);

/** « Échauffement » barré, puis les quatre cartes verrouillées. */
export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const mot = q.c("relance.a#l'échauffement");
  const B = q.c("relance.b");
  const vrais = q.c("relance.b#vrais");

  const out = prog(f, B - 2, 8, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.red} f={f} pattern="stripes" tint="rgba(13,13,18,0.09)" />
      <Shaker s={shakes(f, [[mot, 22], [vrais, 14]])}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * -900}px)`, opacity: 1 - out }}>
            <BigWord lines={["L'échauffement"]} f={f} at={mot} x={525} y={760} size={138} rotate={-3} />
            <Strike f={f} at={mot + 8} y={768} color={C.ink} x={140} width={770} />
          </AbsoluteFill>
        )}
        {f >= B &&
          [5, 6, 7, 8].map((n, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const bump = f >= vrais ? 1 + 0.16 * Math.exp(-(f - vrais) / 4) : 1;
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
      <Flash opacity={flash(f, mot, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 5. les surnoms (dit directement) ─────────────

/** Le prénom en entier, puis raccourci, puis rallongé : un seul mot à l'écran qui change. */
export const Surnom: React.FC<SceneProps> = ({ f, q }) => {
  const yanis = q.c("surnom.a#Yanis");
  const yan = q.c("surnom.b#Yan");
  const yanou = q.c("surnom.b#Yanou");

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="rays" tint="rgba(255,255,255,0.08)" />
      <Shaker s={shakes(f, [[yanis, 16], [yan, 22], [yanou, 24]])}>
        <BigWord lines={["Yanis"]} f={f} at={yanis} x={525} y={760} size={380} rotate={-3} exitAt={yan - 4} />
        <BigWord lines={["Yan"]} f={f} at={yan} x={525} y={760} size={460} color={C.yellow} rotate={4} exitAt={yanou - 3} />
        <BigWord lines={["Yanou"]} f={f} at={yanou} x={525} y={760} size={315} color={C.yellow} rotate={-5} />
      </Shaker>
      <Flash opacity={flash(f, yan, 5, 0.5) + flash(f, yanou, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. « Yanis ! » dans la rue (devinette) ─────────────

/** Le personnage se retourne ; ce n'était pas pour lui ; il plonge dans son téléphone. */
export const Rue: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("rue");
  const crie = q.c("rue.a#crie");
  const tu = q.c("rue.a#tu");
  const B = q.c("rue.b");
  const C3 = q.c("rue.c");
  const tel = q.c("rue.c#regarder");
  const t = f - start;

  const turn = glide(f, tu, 200);
  const back = glide(f, C3, 160);
  const look = lerp(lerp(1, -1, turn), 0, back);
  const lookY = glide(f, tel - 4, 160);
  const flip = Math.cos(Math.PI * Math.min(1, prog(f, tu, 6))) < 0 ? 1 : 1;
  const squash = 1 - 0.25 * Math.sin(Math.PI * prog(f, tu, 7));
  const mood = f < tu ? "smile" : f < B ? "open" : "flat";
  const phone = pop(f, tel - 4, { damping: 11, stiffness: 220 });
  const waves = f >= crie && f < B;
  const sweat = pop(f, B + 3, { damping: 9 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="dots" tint="rgba(13,13,18,0.09)" />
      <Shaker s={shakes(f, [[tu, 14], [B, 22]])}>
        {/* le cri, qui arrive de la gauche */}
        {waves &&
          [0, 1, 2].map((i) => {
            const u = ((f - crie) * 0.06 + i / 3) % 1;
            return (
              <svg key={i} width={200} height={520} viewBox="0 0 200 520" style={{ position: "absolute", left: 20 + u * 150, top: 500, opacity: 1 - u, overflow: "visible" }}>
                <path d="M40 60 Q170 260 40 460" fill="none" stroke={C.paper} strokeWidth={22} strokeLinecap="round" />
              </svg>
            );
          })}

        <Face
          x={560}
          y={750 + lookY * 10}
          size={640}
          scale={pop(f, start + 2, { damping: 12 }) * 1}
          t={t}
          mood={mood}
          look={look}
          lookY={lookY}
          flip={flip * squash}
        >
          {f >= B + 3 && (
            <path d="M150 -190 C120 -140 120 -108 150 -100 C180 -108 180 -140 150 -190 Z" fill="#CFEFFF" stroke={C.ink} strokeWidth={9} transform={`translate(${(1 - sweat) * 0} ${sweat * 30}) scale(${sweat})`} style={{ transformOrigin: "150px -150px" }} />
          )}
        </Face>
        <Mystery f={f} at={tu + 2} until={B} x={835} y={470} size={200} />

        {f >= tel - 4 && (
          <div
            style={{
              position: "absolute",
              left: 560 - 115,
              top: 900 + (1 - phone) * 700,
              width: 230,
              height: 400,
              borderRadius: 40,
              background: C.ink,
              border: `10px solid ${C.paper}`,
              boxSizing: "border-box",
              transform: "rotate(-5deg)",
              boxShadow: "12px 14px 0 rgba(13,13,18,0.25)",
            }}
          >
            <div style={{ position: "absolute", left: 80, top: 24, width: 50, height: 50, borderRadius: "50%", background: "#3A3D49" }} />
          </div>
        )}
      </Shaker>
      <Flash opacity={flash(f, B, 6, 0.6)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. jamais de Yanis de 50 ans (dit directement) ─────────────

const BARS = [0.012, 0.012, 0.02, 0.05, 0.16, 0.42, 0.78, 1];

/** « 50 ans », puis l'histoire du prénom en barres : rien, rien, rien… puis ça décolle. */
export const Age: React.FC<SceneProps> = ({ f, q }) => {
  const de = q.c("age.a#de");
  const B = q.c("age.b");
  const presque = q.c("age.b#presque");

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="stripes" tint="rgba(13,13,18,0.07)" />
      <Shaker s={shake(f, de, 24)}>
        <BigWord lines={["50 ans"]} f={f} at={de} x={525} y={760} size={310} rotate={-4} exitAt={B - 4} />
        {f >= B && (
          <>
            {BARS.map((h, i) => {
              const grow = prog(f, B + 2 + i * 5, 12, Easing.out(Easing.back(1.4)));
              const early = i < 3;
              const pulse = early && f >= presque ? 1 + 0.9 * Math.abs(Math.sin((f - presque) * 0.35)) : 1;
              const height = Math.max(14, 620 * h) * grow * pulse;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 120 + i * 104,
                    top: 1080 - height,
                    width: 78,
                    height,
                    borderRadius: 16,
                    background: early ? C.yellow : C.paper,
                    border: `8px solid ${C.ink}`,
                    boxSizing: "border-box",
                  }}
                />
              );
            })}
            <div style={{ position: "absolute", left: 90, top: 1080, width: 870 * prog(f, B, 8), height: 16, borderRadius: 8, background: C.ink }} />
          </>
        )}
      </Shaker>
      <Flash opacity={flash(f, de, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 8. cinq fois moins : bientôt un prénom de tonton (dit directement) ─────────────

/** Cinq bébés, il n'en reste qu'un ; puis le personnage prend une moustache. */
export const Tonton: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("tonton");
  const cinq = q.c("tonton.a#cinq");
  const B = q.c("tonton.b");
  const tonton = q.c("tonton.b#tonton");
  const t = f - start;

  const out = prog(f, B - 3, 6, Easing.in(Easing.cubic));
  const stache = pop(f, tonton, { damping: 8, stiffness: 240, mass: 0.5 });

  return (
    <AbsoluteFill>
      <Backdrop color={C.indigo} f={f} pattern="rays" tint="rgba(255,255,255,0.07)" />
      <Shaker s={shakes(f, [[cinq, 20], [tonton, 26]])}>
        {out < 1 &&
          [0, 1, 2, 3, 4].map((i) => {
            const inP = pop(f, start + 2 + i * 2, { damping: 10, stiffness: 220 });
            const gone = i === 2 ? 0 : prog(f, cinq + Math.abs(i - 2) * 2 + (i > 2 ? 1 : 0), 7, Easing.in(Easing.cubic));
            const keep = i === 2 ? glide(f, cinq + 4, 140) : 0;
            return (
              <Face
                key={i}
                x={525 + (i - 2) * 190}
                y={760 + (i % 2 ? 46 : -46) * (1 - keep) + gone * 1500}
                size={200}
                scale={inP * (1 - out) * lerp(1, 2.1, keep)}
                t={t + i * 13}
                color={i === 2 ? C.yellow : C.paper}
              />
            );
          })}

        {f >= B && (
          <Face x={525} y={750} size={640} scale={pop(f, B, { damping: 11 })} t={t} mood={f >= tonton ? "flat" : "smile"}>
            {f >= tonton && (
              <g transform={`translate(0 40) scale(${stache})`}>
                <path
                  d="M0 -8 C-30 -44 -96 -40 -150 6 C-120 40 -50 44 0 12 C50 44 120 40 150 6 C96 -40 30 -44 0 -8 Z"
                  fill={C.ink}
                />
              </g>
            )}
          </Face>
        )}
      </Shaker>
      <Flash opacity={flash(f, tonton, 6, 0.6)} />
    </AbsoluteFill>
  );
};

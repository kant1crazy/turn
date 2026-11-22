import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, glide, lerp, pop, prog, shake } from "../anim";
import { Backdrop, BigWord, Shaker, Stamp, Tag, dotCenter } from "../components/ui";
import { C, DISPLAY, TEXT } from "../theme";
import type { SceneProps } from "../timeline";

/** Le titre d'ouverture. Réutilisé à la toute fin pour que la vidéo boucle sans couture. */
export const HookTitle: React.FC<{ f: number; scale?: number; opacity?: number; x?: number; y?: number }> = ({
  f,
  scale = 1,
  opacity = 1,
  x = 540,
  y = 770,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      textAlign: "center",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 74, color: C.yellow, letterSpacing: 7, lineHeight: 1 }}>
      SI T'ES NÉ EN
    </div>
    <div
      style={{
        fontFamily: DISPLAY,
        fontSize: 410,
        lineHeight: 1.04,
        color: C.paper,
        textShadow: `16px 16px 0 ${C.yellow}`,
        marginTop: 6,
      }}
    >
      {"2006".split("").map((d, i) => {
        const u = (f - 7 - i * 3) / 9;
        const hop = u > 0 && u < 1 ? Math.sin(u * Math.PI) * -48 : 0;
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${hop}px)` }}>
            {d}
          </span>
        );
      })}
    </div>
  </div>
);

/** Échelle du titre à l'image `f` : c'est aussi la valeur que la fin de la vidéo doit rejoindre. */
export const hookTitleScale = (f: number) => 1 + 0.12 * Math.exp(-f / 4);

export const Hook: React.FC<SceneProps> = ({ f, q }) => {
  const compte = q.c("hook.a#compte");
  const chaque = q.c("hook.a#chaque");
  const que = q.c("hook.a#que");
  const B = q.c("hook.b");
  const moins = q.c("hook.b#moins");
  const menti = q.c("hook.b#menti");
  const age = q.c("hook.b#âge");

  // 1. le titre, puis il file vers le bandeau du haut
  const away = glide(f, compte, 150);
  const title = {
    scale: hookTitleScale(f) * lerp(1, 0.2, away),
    x: lerp(540, 205, away),
    y: lerp(770, 245, away),
    opacity: 1 - clamp((away - 0.7) / 0.3),
  };

  // 2. la pastille « +1 »
  const badgeIn = pop(f, compte, { damping: 9, stiffness: 230, mass: 0.6 });
  const badgeOut = prog(f, B - 2, 9, Easing.inOut(Easing.cubic));
  const target = dotCenter(3.5);
  const bx = lerp(540, target.x, badgeOut);
  const by = lerp(730, target.y, badgeOut) + Math.sin((f - compte) * 0.22) * 10 * (1 - badgeOut);
  const bs = badgeIn * lerp(1, 0.06, badgeOut);
  const burst = f - compte;

  // 3. la jauge « moins de 5 »
  const s = shake(f, menti, 24);

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,214,10,0.055)" />
      <Shaker s={s}>
        {title.opacity > 0 && <HookTitle f={f} {...title} />}

        {f >= compte && f < B + 8 && (
          <>
            {burst < 13 &&
              Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const r = 250 + burst * 22;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 540 + Math.cos(a) * r,
                      top: 730 + Math.sin(a) * r,
                      width: 70,
                      height: 16,
                      marginLeft: -35,
                      marginTop: -8,
                      borderRadius: 8,
                      background: C.yellow,
                      opacity: 1 - burst / 13,
                      transform: `rotate(${(a * 180) / Math.PI}deg)`,
                    }}
                  />
                );
              })}
            <div
              style={{
                position: "absolute",
                left: bx,
                top: by,
                width: 460,
                height: 460,
                marginLeft: -230,
                marginTop: -230,
                borderRadius: "50%",
                background: C.yellow,
                transform: `scale(${bs}) rotate(${lerp(-18, -6, badgeIn)}deg)`,
                opacity: 1 - clamp((badgeOut - 0.8) / 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: DISPLAY,
                fontSize: 290,
                color: C.ink,
                paddingTop: 14,
                boxSizing: "border-box",
              }}
            >
              +1
            </div>
          </>
        )}

        {f < B + 4 &&
          [
            { text: "À CHAQUE FOIS", at: chaque, y: 1050 },
            { text: "QUE C'EST VRAI", at: que, y: 1128 },
          ].map((l) =>
            f < l.at ? null : (
              <div
                key={l.text}
                style={{
                  position: "absolute",
                  left: 0,
                  width: 1080,
                  top: l.y,
                  textAlign: "center",
                  fontFamily: TEXT,
                  fontWeight: 800,
                  fontSize: 64,
                  lineHeight: 1,
                  color: C.paper,
                  letterSpacing: 2,
                  transform: `translateY(${(1 - pop(f, l.at, { damping: 13 })) * 40}px)`,
                  opacity: clamp((f - l.at + 1) / 3) * (1 - prog(f, B - 2, 5)),
                }}
              >
                {l.text}
              </div>
            ),
          )}

        <BigWord lines={["MOINS DE 5 ?"]} f={f} at={B} y={560} size={172} shadow={C.coral} rotate={-3} />
        {f >= B &&
          Array.from({ length: 8 }, (_, i) => {
            const appear = pop(f, B + 2 + i, { damping: 10, stiffness: 260, mass: 0.5 });
            const fillAt = moins + 3 + i * 3;
            const filled = i < 4 && f >= fillAt;
            const bump = filled ? 1 + 0.5 * Math.exp(-(f - fillAt) / 3) : 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 169 + i * 106 - 46,
                  top: 800 - 46,
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: filled ? C.coral : "transparent",
                  border: `7px solid ${filled ? C.coral : "rgba(255,247,232,0.4)"}`,
                  transform: `scale(${appear * bump})`,
                  opacity: f >= menti ? 0.5 : 1,
                }}
              />
            );
          })}
        <Stamp text="T'as menti" f={f} at={menti} x={525} y={1010} size={158} color={C.coral} bg={C.ink} rotate={-8} />
        <Tag text="sur ton âge" f={f} at={age} x={700} y={1170} bg={C.paper} fg={C.ink} size={46} rotate={3} />
      </Shaker>
    </AbsoluteFill>
  );
};

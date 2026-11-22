import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, glide, lerp, pop, prog, shake } from "../../../anim";
import { Backdrop, BigWord, Shaker, dotCenter } from "../../../components/ui";
import { C, DISPLAY, TEXT } from "../../../theme";
import type { SceneProps } from "../../../timeline";

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
    <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 74, color: C.paper, letterSpacing: 7, lineHeight: 1 }}>
      SI T'ES NÉ EN
    </div>
    <div
      style={{
        fontFamily: DISPLAY,
        fontSize: 410,
        lineHeight: 1.04,
        color: C.yellow,
        textShadow: `16px 16px 0 ${C.coral}`,
        marginTop: 6,
      }}
    >
      {"2008".split("").map((d, i) => {
        // les chiffres se penchent l'un après l'autre, comme une vague
        const u = (f - 6 - i * 3) / 10;
        const tilt = u > 0 && u < 1 ? Math.sin(u * Math.PI * 2) * 9 : 0;
        return (
          <span key={i} style={{ display: "inline-block", transform: `rotate(${tilt}deg)` }}>
            {d}
          </span>
        );
      })}
    </div>
  </div>
);

/** Échelle du titre à l'image `f` : c'est aussi la valeur que la fin de la vidéo doit rejoindre. */
export const hookTitleScale = (f: number) => 1 + 0.12 * Math.exp(-f / 4);

/** Un seul élément à la fois : le titre, la pastille « +1 », la jauge à quatre points, puis « 2009 ? ». */
export const Hook: React.FC<SceneProps> = ({ f, q }) => {
  const compte = q.c("hook.a#compte");
  const B = q.c("hook.b");
  const cinq = q.c("hook.b#cinq");
  const neuf = q.c("hook.b#2009");

  const away = glide(f, compte, 150);
  const title = {
    scale: hookTitleScale(f) * lerp(1, 0.2, away),
    x: lerp(540, 205, away),
    y: lerp(770, 245, away),
    opacity: 1 - clamp((away - 0.7) / 0.3),
  };

  const badgeIn = pop(f, compte, { damping: 9, stiffness: 230, mass: 0.6 });
  const badgeOut = prog(f, B - 2, 9, Easing.inOut(Easing.cubic));
  const target = dotCenter(3.5);
  const bx = lerp(540, target.x, badgeOut);
  const by = lerp(760, target.y, badgeOut);
  const bs = badgeIn * lerp(1, 0.06, badgeOut);

  const dotsOut = prog(f, neuf - 3, 4, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill>
      <Backdrop color={C.ink} f={f} pattern="rays" tint="rgba(255,77,77,0.06)" />
      <Shaker s={shake(f, neuf, 24)}>
        {title.opacity > 0 && <HookTitle f={f} {...title} />}

        {f >= compte && f < B + 8 && (
          <div
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: 500,
              height: 500,
              marginLeft: -250,
              marginTop: -250,
              borderRadius: 110,
              background: C.coral,
              transform: `scale(${bs}) rotate(${lerp(30, 8, badgeIn) + Math.sin((f - compte) * 0.2) * 3}deg)`,
              opacity: 1 - clamp((badgeOut - 0.8) / 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontSize: 320,
              color: C.paper,
              paddingTop: 16,
              boxSizing: "border-box",
              boxShadow: `18px 18px 0 ${C.yellow}`,
            }}
          >
            +1
          </div>
        )}

        {f >= B &&
          dotsOut < 1 &&
          Array.from({ length: 8 }, (_, i) => {
            const appear = pop(f, B + 2 + i, { damping: 10, stiffness: 260, mass: 0.5 });
            const fillAt = cinq - 9 + i * 3;
            const filled = i < 4 && f >= fillAt;
            const bump = filled ? 1 + 0.5 * Math.exp(-(f - fillAt) / 3) : 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 148 + i * 112 - 50,
                  top: 760 - 50,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: filled ? C.yellow : "transparent",
                  border: `8px solid ${filled ? C.yellow : "rgba(255,247,232,0.4)"}`,
                  transform: `scale(${appear * bump * (1 - dotsOut)})`,
                }}
              />
            );
          })}
        <BigWord lines={["2009 ?"]} f={f} at={neuf} x={520} y={760} size={285} color={C.coral} shadow="#6E1414" rotate={-5} />
      </Shaker>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { clamp, glide, lerp, pop, prog, shake } from "../../../anim";
import { Backdrop, Shaker, dotCenter } from "../../../components/ui";
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
    <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 70, color: C.yellow, letterSpacing: 6, lineHeight: 1 }}>
      SI TU T'APPELLES
    </div>
    <div
      style={{
        fontFamily: DISPLAY,
        fontSize: 380,
        lineHeight: 1.04,
        color: C.paper,
        textShadow: `16px 16px 0 ${C.yellow}`,
        marginTop: 6,
      }}
    >
      {"YANIS".split("").map((d, i) => {
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

/** Un seul élément à la fois : le titre, puis la pastille « +1 », puis la jauge barrée. */
export const Hook: React.FC<SceneProps> = ({ f, q }) => {
  const compte = q.c("hook.a#compte");
  const B = q.c("hook.b");
  const moins = q.c("hook.b#moins");
  const menti = q.c("hook.b#pas");

  // 1. le titre, puis il file vers le bandeau du haut
  const away = glide(f, compte, 150);
  const title = {
    scale: hookTitleScale(f) * lerp(1, 0.2, away),
    x: lerp(540, 205, away),
    y: lerp(770, 245, away),
    opacity: 1 - clamp((away - 0.7) / 0.3),
  };

  // 2. la pastille « +1 », qui rejoint ensuite le compteur de points
  const badgeIn = pop(f, compte, { damping: 9, stiffness: 230, mass: 0.6 });
  const badgeOut = prog(f, B - 2, 9, Easing.inOut(Easing.cubic));
  const target = dotCenter(3.5);
  const bx = lerp(540, target.x, badgeOut);
  const by = lerp(760, target.y, badgeOut) + Math.sin((f - compte) * 0.22) * 10 * (1 - badgeOut);
  const bs = badgeIn * lerp(1, 0.06, badgeOut);
  const burst = f - compte;

  // 3. la jauge : quatre points sur huit, puis la croix
  const s = shake(f, menti, 24);
  const cross = pop(f, menti, { damping: 12, stiffness: 260, mass: 0.5 });

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
                const r = 280 + burst * 22;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 540 + Math.cos(a) * r,
                      top: 760 + Math.sin(a) * r,
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
                width: 520,
                height: 520,
                marginLeft: -260,
                marginTop: -260,
                borderRadius: "50%",
                background: C.yellow,
                transform: `scale(${bs}) rotate(${lerp(-18, -6, badgeIn)}deg)`,
                opacity: 1 - clamp((badgeOut - 0.8) / 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: DISPLAY,
                fontSize: 330,
                color: C.ink,
                paddingTop: 16,
                boxSizing: "border-box",
              }}
            >
              +1
            </div>
          </>
        )}

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
                  left: 148 + i * 112 - 50,
                  top: 760 - 50,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: filled ? C.yellow : "transparent",
                  border: `8px solid ${filled ? C.yellow : "rgba(255,247,232,0.4)"}`,
                  transform: `scale(${appear * bump})`,
                  opacity: f >= menti ? 0.35 : 1,
                }}
              />
            );
          })}
        {f >= menti && (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 760,
              width: 0,
              height: 0,
              transform: `rotate(-6deg) scale(${lerp(2.8, 1, cross)})`,
              opacity: clamp((f - menti + 1) / 2),
              filter: "drop-shadow(12px 12px 0 #6E1414)",
            }}
          >
            {[45, -45].map((a) => (
              <div
                key={a}
                style={{
                  position: "absolute",
                  left: -330,
                  top: -46,
                  width: 660,
                  height: 92,
                  borderRadius: 46,
                  background: C.coral,
                  transform: `rotate(${a}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </Shaker>
    </AbsoluteFill>
  );
};

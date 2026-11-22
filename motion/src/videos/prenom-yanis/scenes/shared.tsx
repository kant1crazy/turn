import React from "react";
import { prog } from "../../../anim";
import { C } from "../../../theme";

/** Trait qui barre un mot, tracé de gauche à droite. */
export const Strike: React.FC<{ f: number; at: number; y: number; color: string; x?: number; width?: number; rotate?: number }> = ({
  f,
  at,
  y,
  color,
  x = 110,
  width = 860,
  rotate = -5,
}) =>
  f < at ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - 16,
        width: width * prog(f, at, 5),
        height: 32,
        borderRadius: 16,
        background: color,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: `${width / 2}px 16px`,
      }}
    />
  );

export type Mood = "smile" | "flat" | "open";

/** Visage rond : le personnage « Yanis » de la vidéo. `look` déplace le regard (-1 à 1). */
export const Face: React.FC<{
  x: number;
  y: number;
  size: number;
  scale?: number;
  t: number;
  color?: string;
  mood?: Mood;
  look?: number;
  lookY?: number;
  flip?: number;
  children?: React.ReactNode;
}> = ({ x, y, size, scale = 1, t, color = C.yellow, mood = "smile", look = 0, lookY = 0, flip = 1, children }) => {
  const blink = t % 46 < 3 ? 0.12 : 1;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-260 -260 520 520"
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        overflow: "visible",
        transform: `scale(${scale * flip}, ${scale}) rotate(${Math.sin(t * 0.09) * 3}deg)`,
      }}
    >
      <circle r={214} fill={color} stroke={C.ink} strokeWidth={13} />
      <ellipse cx={-74 + look * 46} cy={-48 + lookY * 40} rx={24} ry={34 * blink} fill={C.ink} />
      <ellipse cx={74 + look * 46} cy={-48 + lookY * 40} rx={24} ry={34 * blink} fill={C.ink} />
      {mood === "smile" && <path d="M-62 62 Q0 112 62 62" fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />}
      {mood === "flat" && <line x1={-52} y1={84} x2={52} y2={84} stroke={C.ink} strokeWidth={13} strokeLinecap="round" />}
      {mood === "open" && <ellipse cx={0} cy={86} rx={34} ry={40} fill={C.ink} />}
      {children}
    </svg>
  );
};

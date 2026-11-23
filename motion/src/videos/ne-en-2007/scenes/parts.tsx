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

const PENTA = Array.from({ length: 5 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
  return { x: Math.cos(a), y: Math.sin(a) };
});

/** Ballon de foot, positionné par son centre. */
export const Ball: React.FC<{ x: number; y: number; r: number; rot?: number; scaleY?: number }> = ({ x, y, r, rot = 0, scaleY = 1 }) => (
  <svg
    width={r * 2}
    height={r * 2}
    viewBox="-56 -56 112 112"
    style={{ position: "absolute", left: x - r, top: y - r, overflow: "visible", transform: `scaleY(${scaleY}) rotate(${rot}deg)`, transformOrigin: "50% 100%" }}
  >
    <circle r={50} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <polygon points={PENTA.map((p) => `${p.x * 19},${p.y * 19}`).join(" ")} fill={C.ink} />
    {PENTA.map((p, i) => (
      <line key={i} x1={p.x * 19} y1={p.y * 19} x2={p.x * 47} y2={p.y * 47} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    ))}
  </svg>
);

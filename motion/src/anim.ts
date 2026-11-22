import { Easing, interpolate, random, spring } from "remotion";
import { FPS } from "./theme";

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progression 0→1 entre `start` et `start + dur` (en images). */
export const prog = (
  f: number,
  start: number,
  dur: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
) => interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Ressort avec rebond ; vaut 0 avant `start`. */
export const pop = (f: number, start: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < start ? 0 : spring({ frame: f - start, fps: FPS, config: { damping: 11, stiffness: 200, mass: 0.7, ...cfg } });

/** Ressort sans rebond. */
export const glide = (f: number, start: number, stiffness = 120) =>
  f < start ? 0 : spring({ frame: f - start, fps: FPS, config: { damping: 200, stiffness, mass: 0.8 } });

/** Tremblement de caméra qui s'amortit. */
export const shake = (f: number, at: number, amp = 18, dur = 10) => {
  const d = f - at;
  if (d < 0 || d >= dur) return { x: 0, y: 0 };
  const k = amp * (1 - d / dur) ** 2;
  return { x: (random(`sx-${at}-${d}`) - 0.5) * 2 * k, y: (random(`sy-${at}-${d}`) - 0.5) * 2 * k };
};

export const shakes = (f: number, hits: [number, number][]) =>
  hits.reduce((acc, [at, amp]) => {
    const s = shake(f, at, amp);
    return { x: acc.x + s.x, y: acc.y + s.y };
  }, { x: 0, y: 0 });

/** Opacité d'un flash blanc. */
export const flash = (f: number, at: number, dur = 6, peak = 0.8) => {
  const d = f - at;
  return d < 0 || d >= dur ? 0 : peak * (1 - d / dur) ** 1.5;
};

export const io = Easing.inOut(Easing.cubic);

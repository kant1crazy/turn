export type Word = { t: string; s: number; e: number; b?: number };
export type Line = { id: string; scene: string; kind: string; start: number; end: number; text: string; words: Word[] };
export type Timeline = {
  id: string;
  title: string;
  fps: number;
  durationInFrames: number;
  duration: number;
  voice: string;
  scenes: { id: string; start: number; end: number }[];
  points: { scene: string; t: number }[];
  lines: Line[];
};

export const norm = (w: string) =>
  w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Repères en images : « ligne » ou « ligne#début-de-mot ». */
export const makeCues = (tl: Timeline) => {
  const lines = new Map(tl.lines.map((l) => [l.id, l]));
  const sec = (ref: string) => {
    const [id, prefix] = ref.split("#");
    const line = lines.get(id);
    if (!line) throw new Error(`ligne inconnue : ${ref}`);
    if (!prefix) return line.start;
    const w = line.words.find((x) => norm(x.t).startsWith(norm(prefix)));
    if (!w) throw new Error(`repère introuvable : ${ref}`);
    return w.s;
  };
  const c = (ref: string) => Math.round(sec(ref) * tl.fps);
  const scene = (id: string) => {
    const i = tl.scenes.findIndex((s) => s.id === id);
    if (i < 0) throw new Error(`scène inconnue : ${id}`);
    return { index: i, start: Math.round(tl.scenes[i].start * tl.fps), end: Math.round(tl.scenes[i].end * tl.fps) };
  };
  const point = (sceneId: string) => {
    const i = tl.points.findIndex((p) => p.scene === sceneId);
    if (i < 0) throw new Error(`pas de point pour : ${sceneId}`);
    return { index: i, at: Math.round(tl.points[i].t * tl.fps) };
  };
  return { c, scene, point };
};

export type Cues = ReturnType<typeof makeCues>;
export type SceneProps = { f: number; q: Cues };

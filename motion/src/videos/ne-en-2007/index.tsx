import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/ne-en-2007.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Bottle, Euro, Loom, Tiktok } from "./scenes/facts1";
import { Permis, Portable, Qatar, Relance, Vote } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "loom", wipe: "circle", render: (p) => <Loom {...p} /> },
  { id: "euro", wipe: "diag", render: (p) => <Euro {...p} /> },
  { id: "bottle", wipe: "up", render: (p) => <Bottle {...p} /> },
  { id: "tiktok", wipe: "circle", render: (p) => <Tiktok {...p} /> },
  { id: "relance", wipe: "left", render: (p) => <Relance {...p} /> },
  { id: "portable", wipe: "down", render: (p) => <Portable {...p} /> },
  { id: "qatar", wipe: "diag", render: (p) => <Qatar {...p} /> },
  { id: "permis", wipe: "circle", render: (p) => <Permis {...p} /> },
  { id: "vote", wipe: "up", render: (p) => <Vote {...p} /> },
  { id: "cta", wipe: "circle", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "loom.b" },
  { line: "tiktok.b" },
  { line: "relance.a", from: "l'échauffement" },
  { line: "permis.b" },
  { line: "punch.a", from: "le" },
  { line: "punch.b", from: "il" },
  { line: "punch.c", from: "vingt" },
];

export const NeEn2007: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("polices"));
  useEffect(() => {
    fontsReady.then(() => continueRender(handle));
  }, [handle]);

  const q = useMemo(() => makeCues(timeline), []);
  const points = useMemo(() => timeline.points.map((p) => Math.round(p.t * timeline.fps)), []);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {SCENES.map((s) => {
        const { start, end } = q.scene(s.id);
        // la scène sortante reste dessous pendant le volet de la suivante
        if (f < start || f >= end + 12) return null;
        return (
          <Wipe key={s.id} f={f} start={start} kind={s.wipe}>
            {s.render({ f, q })}
          </Wipe>
        );
      })}
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="NÉ EN 2007" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("ne-en-2007/audio.wav")} />
    </AbsoluteFill>
  );
};

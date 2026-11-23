import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/fortnite-chapitre-1.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Caddie, Comete, Fusee, Relance, Tilted } from "./scenes/facts1";
import { Concert, Cube, Trou, Volcan } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "tilted", wipe: "circle", render: (p) => <Tilted {...p} /> },
  { id: "comete", wipe: "up", render: (p) => <Comete {...p} /> },
  { id: "caddie", wipe: "diag", render: (p) => <Caddie {...p} /> },
  { id: "fusee", wipe: "circle", render: (p) => <Fusee {...p} /> },
  { id: "relance", wipe: "left", render: (p) => <Relance {...p} /> },
  { id: "cube", wipe: "down", render: (p) => <Cube {...p} /> },
  { id: "concert", wipe: "circle", render: (p) => <Concert {...p} /> },
  { id: "volcan", wipe: "diag", render: (p) => <Volcan {...p} /> },
  { id: "trou", wipe: "up", render: (p) => <Trou {...p} /> },
  { id: "cta", wipe: "circle", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "relance.a", from: "facile" },
  { line: "cube.c", from: "Kevin" },
  { line: "punch.a", from: "le" },
  { line: "punch.b", from: "fait" },
  { line: "punch.c", from: "sept" },
];

export const FortniteChapitre1: React.FC = () => {
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
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="CHAPITRE 1" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("fortnite-chapitre-1/audio.wav")} />
    </AbsoluteFill>
  );
};

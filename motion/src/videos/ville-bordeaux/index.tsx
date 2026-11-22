import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/ville-bordeaux.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Choco, Gave, Miroir, Tram } from "./scenes/facts1";
import { Bassin, Cath, Chaban, Relance } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "choco", wipe: "circle", render: (p) => <Choco {...p} /> },
  { id: "miroir", wipe: "up", render: (p) => <Miroir {...p} /> },
  { id: "tram", wipe: "left", render: (p) => <Tram {...p} /> },
  { id: "gave", wipe: "diag", render: (p) => <Gave {...p} /> },
  { id: "relance", wipe: "circle", render: (p) => <Relance {...p} /> },
  { id: "chaban", wipe: "down", render: (p) => <Chaban {...p} /> },
  { id: "cath", wipe: "diag", render: (p) => <Cath {...p} /> },
  { id: "bassin", wipe: "circle", render: (p) => <Bassin {...p} /> },
  { id: "cta", wipe: "up", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "choco.a", from: "chocolatine" },
  { line: "miroir.b" },
  { line: "tram.b" },
  { line: "gave.a", from: "gavé" },
  { line: "relance.a", from: "l'échauffement" },
  { line: "chaban.b" },
  { line: "cath.b", to: "de" },
  { line: "bassin.a", from: "au" },
  { line: "punch.a", from: "le" },
  { line: "punch.b", from: "fâche" },
  { line: "punch.c", to: "T'as" },
];

export const VilleBordeaux: React.FC = () => {
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
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="BORDEAUX" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("ville-bordeaux/audio.wav")} />
    </AbsoluteFill>
  );
};

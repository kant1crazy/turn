import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/ne-en-2006.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Fortnite, Mondial, Pokemon, Spinner } from "./scenes/facts1";
import { Brevet, Confinement, Iphone, Majorite, Relance } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "spinner", wipe: "circle", render: (p) => <Spinner {...p} /> },
  { id: "pokemon", wipe: "up", render: (p) => <Pokemon {...p} /> },
  { id: "fortnite", wipe: "diag", render: (p) => <Fortnite {...p} /> },
  { id: "mondial", wipe: "circle", render: (p) => <Mondial {...p} /> },
  { id: "relance", wipe: "left", render: (p) => <Relance {...p} /> },
  { id: "confinement", wipe: "down", render: (p) => <Confinement {...p} /> },
  { id: "brevet", wipe: "circle", render: (p) => <Brevet {...p} /> },
  { id: "majorite", wipe: "diag", render: (p) => <Majorite {...p} /> },
  { id: "iphone", wipe: "up", render: (p) => <Iphone {...p} /> },
  { id: "cta", wipe: "circle", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "spinner.b" },
  { line: "pokemon.a", from: "Pokémon" },
  { line: "fortnite.a", from: "Fortnite" },
  { line: "relance.a", from: "facile" },
  { line: "confinement.a", from: "quinze", to: "à" },
  { line: "confinement.b", from: "deux" },
  { line: "majorite.a", from: "tes", to: "c'était" },
  { line: "iphone.b" },
  { line: "iphone.c", from: "2007" },
  { line: "punch.a", from: "le" },
  { line: "punch.b", from: "fait" },
  { line: "punch.c", from: "dix" },
];

export const NeEn2006: React.FC = () => {
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
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="NÉ EN 2006" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("ne-en-2006/audio.wav")} />
    </AbsoluteFill>
  );
};

import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/prenom-yanis.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Classe, Ortho, Pseudo, Record } from "./scenes/facts1";
import { Age, Relance, Rue, Surnom, Tonton } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "ortho", wipe: "circle", render: (p) => <Ortho {...p} /> },
  { id: "classe", wipe: "up", render: (p) => <Classe {...p} /> },
  { id: "record", wipe: "diag", render: (p) => <Record {...p} /> },
  { id: "pseudo", wipe: "circle", render: (p) => <Pseudo {...p} /> },
  { id: "relance", wipe: "left", render: (p) => <Relance {...p} /> },
  { id: "surnom", wipe: "down", render: (p) => <Surnom {...p} /> },
  { id: "rue", wipe: "circle", render: (p) => <Rue {...p} /> },
  { id: "age", wipe: "diag", render: (p) => <Age {...p} /> },
  { id: "tonton", wipe: "up", render: (p) => <Tonton {...p} /> },
  { id: "cta", wipe: "circle", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "ortho.b", to: "avec" },
  { line: "record.b" },
  { line: "record.c", to: "Yanis" },
  { line: "relance.a", from: "l'échauffement" },
  { line: "surnom.a", from: "Yanis", to: "en" },
  { line: "surnom.b", from: "Yan", to: "ou" },
  { line: "surnom.b", from: "Yanou" },
  { line: "age.a", from: "de" },
  { line: "punch.a", from: "le" },
  { line: "punch.b", from: "plus", to: "Yanis" },
];

export const PrenomYanis: React.FC = () => {
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
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="YANIS" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("prenom-yanis/audio.wav")} />
    </AbsoluteFill>
  );
};

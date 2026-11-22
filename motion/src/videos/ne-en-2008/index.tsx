import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Subtitles, type HideSpec } from "../../components/Subtitles";
import { TopBar, Wipe, type WipeKind } from "../../components/ui";
import { fontsReady } from "../../fonts";
import raw from "../../generated/ne-en-2008.timeline.json";
import { C } from "../../theme";
import { makeCues, type SceneProps, type Timeline } from "../../timeline";
import { Cta, Punch } from "./scenes/ending";
import { Brawl, Reine, Relance, Sixieme } from "./scenes/facts1";
import { Among, Chatgpt, Mondial, Squid } from "./scenes/facts2";
import { Hook } from "./scenes/hook";

export const timeline = raw as Timeline;

const SCENES: { id: string; wipe: WipeKind; render: (p: SceneProps) => React.ReactNode }[] = [
  { id: "hook", wipe: "cut", render: (p) => <Hook {...p} /> },
  { id: "reine", wipe: "circle", render: (p) => <Reine {...p} /> },
  { id: "brawl", wipe: "diag", render: (p) => <Brawl {...p} /> },
  { id: "sixieme", wipe: "up", render: (p) => <Sixieme {...p} /> },
  { id: "relance", wipe: "left", render: (p) => <Relance {...p} /> },
  { id: "among", wipe: "circle", render: (p) => <Among {...p} /> },
  { id: "squid", wipe: "down", render: (p) => <Squid {...p} /> },
  { id: "chatgpt", wipe: "diag", render: (p) => <Chatgpt {...p} /> },
  { id: "mondial", wipe: "up", render: (p) => <Mondial {...p} /> },
  { id: "cta", wipe: "circle", render: (p) => <Cta {...p} /> },
  { id: "punch", wipe: "cut", render: (p) => <Punch {...p} end={timeline.durationInFrames} /> },
];

/** Passages qu'un gros mot affiche déjà à l'écran : on ne les sous-titre pas une seconde fois. */
const HIDE: HideSpec[] = [
  { line: "hook.a", to: "compte" },
  { line: "hook.b", from: "2009" },
  { line: "reine.b" },
  { line: "brawl.a", from: "Brawl" },
  { line: "sixieme.a", from: "vendredi" },
  { line: "relance.a" },
  { line: "among.b" },
  { line: "squid.a", from: "Squid" },
  { line: "squid.b", from: "aux" },
  { line: "squid.c", from: "douze" },
  { line: "chatgpt.a", from: "ChatGPT" },
  { line: "mondial.b", from: "quatorze" },
  { line: "punch.a", from: "il" },
  { line: "punch.b" },
  { line: "punch.c", from: "au" },
];

export const NeEn2008: React.FC = () => {
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
      <TopBar f={f} from={q.c("hook.b")} until={timeline.durationInFrames} label="NÉ EN 2008" points={points} />
      <Subtitles tl={timeline} f={f} hide={HIDE} />
      <Audio src={staticFile("ne-en-2008/audio.wav")} />
    </AbsoluteFill>
  );
};

import React from "react";
import { Composition } from "remotion";
import { H, W } from "./theme";
import { NeEn2006, timeline as neEn2006 } from "./videos/ne-en-2006";
import { VilleBordeaux, timeline as villeBordeaux } from "./videos/ville-bordeaux";

/** Une ligne par vidéo : son identifiant, sa composition et sa timeline. */
const VIDEOS = [
  { id: "ne-en-2006", component: NeEn2006, timeline: neEn2006 },
  { id: "ville-bordeaux", component: VilleBordeaux, timeline: villeBordeaux },
];

export const Root: React.FC = () => (
  <>
    {VIDEOS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={v.component}
        width={W}
        height={H}
        fps={v.timeline.fps}
        durationInFrames={v.timeline.durationInFrames}
      />
    ))}
  </>
);

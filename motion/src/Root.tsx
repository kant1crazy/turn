import React from "react";
import { Composition } from "remotion";
import { H, W } from "./theme";
import { NeEn2006, timeline as neEn2006 } from "./videos/ne-en-2006";
import { NeEn2007, timeline as neEn2007 } from "./videos/ne-en-2007";

/** Une ligne par vidéo : son identifiant, sa composition et sa timeline. */
const VIDEOS = [
  { id: "ne-en-2006", component: NeEn2006, timeline: neEn2006 },
  { id: "ne-en-2007", component: NeEn2007, timeline: neEn2007 },
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

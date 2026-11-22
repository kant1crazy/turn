import React from "react";
import { Composition } from "remotion";
import { H, W } from "./theme";
import { NeEn2006, timeline } from "./videos/NeEn2006";

export const Root: React.FC = () => (
  <Composition
    id="ne-en-2006"
    component={NeEn2006}
    width={W}
    height={H}
    fps={timeline.fps}
    durationInFrames={timeline.durationInFrames}
  />
);

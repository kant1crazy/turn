import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const fontsReady = Promise.all([
  loadFont({ family: "Anton", url: staticFile("fonts/anton.woff2"), weight: "400" }),
  loadFont({ family: "Bricolage", url: staticFile("fonts/bricolage.woff2"), weight: "200 800" }),
]);

import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { flash, glide, lerp, pop, prog, shakes } from "../anim";
import { Backdrop, BigWord, Flash, Kicker, Mystery, PlusOne, Shaker, Stamp, Tag } from "../components/ui";
import { C, DISPLAY, TEXT } from "../theme";
import type { SceneProps } from "../timeline";

/** Trait qui barre un mot, tracé de gauche à droite. */
const Strike: React.FC<{ f: number; at: number; y: number; color: string; x?: number; width?: number; rotate?: number }> = ({
  f,
  at,
  y,
  color,
  x = 110,
  width = 860,
  rotate = -5,
}) =>
  f < at ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - 16,
        width: width * prog(f, at, 5),
        height: 32,
        borderRadius: 16,
        background: color,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: `${width / 2}px 16px`,
      }}
    />
  );

// ───────────── la relance ─────────────

const Padlock: React.FC<{ color: string }> = ({ color }) => (
  <svg width={46} height={54} viewBox="0 0 46 54">
    <path d="M11 24 V15 A12 12 0 0 1 35 15 V24" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
    <rect x={3} y={22} width={40} height={30} rx={8} fill={color} />
  </svg>
);

export const Relance: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("relance");
  const facile = q.c("relance.a#facile");
  const B = q.c("relance.b");
  const joue = q.c("relance.b#joue");

  const out = prog(f, B - 2, 8, Easing.in(Easing.cubic));
  const s = shakes(f, [[facile, 22], [joue, 14]]);

  return (
    <AbsoluteFill>
      <Backdrop color={C.red} f={f} pattern="stripes" tint="rgba(13,13,18,0.09)" />
      <Shaker s={s}>
        {out < 1 && (
          <AbsoluteFill style={{ transform: `translateY(${out * -900}px)`, opacity: 1 - out }}>
            <Tag text="Jusque-là…" f={f} at={start + 3} x={540} y={520} size={58} rotate={-3} />
            <BigWord lines={["Facile."]} f={f} at={facile} y={770} size={330} rotate={-3} />
            <Strike f={f} at={facile + 8} y={790} color={C.ink} />
          </AbsoluteFill>
        )}
        <BigWord lines={["Les 4 suivants"]} f={f} at={B} y={520} size={158} rotate={-3} />
        {f >= B &&
          [5, 6, 7, 8].map((n, i) => {
            const at = B + 2 + i * 3;
            const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
            const bump = f >= joue ? 1 + 0.16 * Math.exp(-(f - joue) / 4) : 1;
            return (
              <div
                key={n}
                style={{
                  position: "absolute",
                  left: 249 + i * 194 - 85,
                  top: 820 - 125,
                  width: 170,
                  height: 250,
                  borderRadius: 30,
                  background: C.ink,
                  boxShadow: "10px 12px 0 rgba(13,13,18,0.3)",
                  transform: `scale(${p * bump}) rotate(${(i % 2 ? 4 : -4) + Math.sin((f - at) * 0.18 + i) * 2.5}deg)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <div style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: C.yellow }}>{n}</div>
                <Padlock color={C.paper} />
              </div>
            );
          })}
        <Tag text="De plus en plus précis" f={f} at={joue} x={512} y={1090} bg={C.yellow} fg={C.ink} size={52} rotate={-2} />
      </Shaker>
      <Flash opacity={flash(f, facile, 5, 0.5)} />
    </AbsoluteFill>
  );
};

// ───────────── 5. le confinement ─────────────

const AVATARS = [C.sky, C.magenta, C.green, C.orange, C.yellow, C.violet];

export const Confinement: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("confinement");
  const quinze = q.c("confinement.a#quinze");
  const maison = q.c("confinement.a#maison");
  const B = q.c("confinement.b");
  const deux = q.c("confinement.b#deux");
  const pyjama = q.c("confinement.c");
  const camera = q.c("confinement.c#caméra");
  const pt = q.point("confinement");

  const up = glide(f, pyjama - 3, 150);
  const s = shakes(f, [[quinze, 14], [deux, 28]]);

  return (
    <AbsoluteFill>
      <Backdrop color={C.slate} f={f} pattern="dots" tint="rgba(255,255,255,0.06)" />
      <Shaker s={s}>
        <Kicker text="Mars 2020 · en 4e" f={f} at={start + 3} bg={C.coral} fg={C.ink} />
        <AbsoluteFill
          style={{
            transform: `translateY(${lerp(0, -225, up)}px) scale(${lerp(1, 0.56, up)})`,
            transformOrigin: "540px 760px",
          }}
        >
          <BigWord lines={["15 jours"]} f={f} at={quinze} y={650} size={248} shadow={C.coral} rotate={-3} />
          {f < deux && <Tag text="à la maison" f={f} at={maison} x={540} y={880} bg={C.paper} fg={C.ink} size={52} rotate={2} />}
          <Strike f={f} at={B} y={665} color={C.coral} />
          <BigWord lines={["2 mois"]} f={f} at={deux} y={890} size={320} color={C.yellow} shadow={C.coral} rotate={5} />
        </AbsoluteFill>

        {/* la visio : six vignettes dont les caméras se coupent */}
        {f >= pyjama - 2 &&
          AVATARS.map((col, i) => {
            const cx = 248 + (i % 3) * 272;
            const cy = 840 + Math.floor(i / 3) * 222;
            const p = pop(f, pyjama - 2 + i * 2, { damping: 11, stiffness: 220 });
            const off = f >= camera + i * 1.5;
            const me = i === 4;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - 125,
                  top: cy - 100,
                  width: 250,
                  height: 200,
                  borderRadius: 26,
                  background: off ? "#0A0D17" : "#2B3452",
                  border: me ? `7px solid ${C.yellow}` : "7px solid transparent",
                  boxSizing: "border-box",
                  transform: `scale(${p})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {off ? (
                  <svg width={96} height={80} viewBox="0 0 96 80">
                    <rect x={6} y={18} width={56} height={44} rx={10} fill={C.paper} />
                    <path d="M62 34 L88 20 V60 L62 46 Z" fill={C.paper} />
                    <line x1={10} y1={72} x2={84} y2={8} stroke={C.coral} strokeWidth={10} strokeLinecap="round" />
                  </svg>
                ) : (
                  <div style={{ width: 96, height: 96, borderRadius: "50%", background: col, transform: `translateY(${Math.sin(f * 0.3 + i) * 4}px)` }} />
                )}
                {me && (
                  <div style={{ position: "absolute", left: 12, top: 10, background: C.yellow, color: C.ink, fontFamily: TEXT, fontWeight: 800, fontSize: 30, lineHeight: 1, padding: "6px 14px 8px", borderRadius: 14 }}>
                    TOI
                  </div>
                )}
              </div>
            );
          })}
        <PlusOne f={f} at={pt.at} index={pt.index} x={830} y={560} />
      </Shaker>
      <Flash opacity={flash(f, deux)} />
    </AbsoluteFill>
  );
};

// ───────────── 6. le brevet masqué ─────────────

export const Brevet: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("brevet");
  const truc = q.c("brevet.a#truc");
  const B = q.c("brevet.b");
  const gen = q.c("brevet.c");
  const seule = q.c("brevet.c#seule");
  const pt = q.point("brevet");

  const enter = pop(f, start + 2, { damping: 12 });
  const mask = pop(f, B, { damping: 11, stiffness: 220 });
  const blink = (f - start) % 46 < 3 ? 0.12 : 1;
  const squint = f >= B ? 0.55 : 1;
  const look = Math.sin((f - start) * 0.11) * 12;
  const s = shakes(f, [[B, 22], [seule, 18]]);

  return (
    <AbsoluteFill>
      <Backdrop color={C.teal} f={f} pattern="rays" tint="rgba(255,255,255,0.08)" />
      <Shaker s={s}>
        <Kicker text="Juin 2021 · le brevet" f={f} at={start + 3} />
        <svg
          width={520}
          height={520}
          viewBox="-260 -260 520 520"
          style={{ position: "absolute", left: 540 - 260, top: 740 - 260, overflow: "visible", transform: `scale(${enter}) rotate(${Math.sin((f - start) * 0.09) * 3}deg)` }}
        >
          <circle r={214} fill={C.yellow} stroke={C.ink} strokeWidth={13} />
          <ellipse cx={-74 + look} cy={-48} rx={24} ry={34 * blink * squint} fill={C.ink} />
          <ellipse cx={74 + look} cy={-48} rx={24} ry={34 * blink * squint} fill={C.ink} />
          {f >= B && (
            <g transform={`translate(0 ${(1 - mask) * 330})`}>
              <path d="M-150 30 Q-214 0 -206 -40" fill="none" stroke={C.paper} strokeWidth={9} strokeLinecap="round" />
              <path d="M150 30 Q214 0 206 -40" fill="none" stroke={C.paper} strokeWidth={9} strokeLinecap="round" />
              <rect x={-156} y={2} width={312} height={178} rx={54} fill="#CFEFFF" stroke={C.ink} strokeWidth={11} />
              <line x1={-112} y1={62} x2={112} y2={62} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
              <line x1={-112} y1={104} x2={112} y2={104} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
              <line x1={-96} y1={144} x2={96} y2={144} stroke={C.ink} strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
            </g>
          )}
        </svg>
        <Mystery f={f} at={truc} until={B} x={540} y={840} size={180} />
        <BigWord lines={["Le masque"]} f={f} at={B} x={515} y={1085} size={188} rotate={-4} />

        {f >= gen && (
          <div
            style={{
              position: "absolute",
              left: 215,
              top: 575,
              width: 290,
              height: 170,
              marginLeft: -145,
              marginTop: -85,
              borderRadius: 22,
              background: C.paper,
              boxShadow: "10px 12px 0 rgba(13,13,18,0.25)",
              transform: `rotate(-9deg) scale(${pop(f, gen, { damping: 10 })})`,
              textAlign: "center",
              paddingTop: 18,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontFamily: DISPLAY, fontSize: 82, lineHeight: 1, color: C.ink }}>BREVET</div>
            <div style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 34, color: C.teal, marginTop: 2 }}>SESSION 2021</div>
          </div>
        )}
        <Stamp text="Les seuls" f={f} at={seule} x={745} y={470} size={104} color={C.coral} bg={C.paper} rotate={8} />
        <PlusOne f={f} at={pt.at} index={pt.index} x={850} y={640} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};

// ───────────── 7. les 18 ans ─────────────

const FlipCard: React.FC<{ f: number; inAt: number; flipAt: number; x: number; y: number; children: React.ReactNode }> = ({
  f,
  inAt,
  flipAt,
  x,
  y,
  children,
}) => {
  if (f < inAt) return null;
  const p = pop(f, inAt, { damping: 10, stiffness: 230, mass: 0.6 });
  const flip = prog(f, flipAt, 9, Easing.inOut(Easing.cubic));
  const front = flip >= 0.5;
  const kick = f >= flipAt + 9 ? 1 + 0.12 * Math.exp(-(f - flipAt - 9) / 3) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 185,
        top: y - 200,
        width: 370,
        height: 400,
        borderRadius: 40,
        boxSizing: "border-box",
        background: front ? C.paper : C.ink,
        border: `9px solid ${front ? C.ink : C.yellow}`,
        boxShadow: "12px 14px 0 rgba(13,13,18,0.28)",
        transform: `scale(${p * kick}) scaleX(${Math.abs(Math.cos(flip * Math.PI))}) rotate(${x < 540 ? -3 : 3}deg)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {front ? children : <div style={{ fontFamily: DISPLAY, fontSize: 250, lineHeight: 1, color: C.yellow }}>?</div>}
    </div>
  );
};

const CardLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: DISPLAY, fontSize: 88, lineHeight: 1, color: C.ink, textAlign: "center" }}>{children}</div>
);

export const Majorite: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("majorite");
  const dixhuit = q.c("majorite.a#18");
  const ans = q.c("majorite.a#ans");
  const deux = q.c("majorite.a#deux");
  const bac = q.c("majorite.b");
  const jeux = q.c("majorite.c#Jeux");
  const pt = q.point("majorite");

  const s = shakes(f, [[bac + 5, 16], [jeux + 5, 20]]);

  return (
    <AbsoluteFill>
      <Backdrop color={C.magenta} f={f} pattern="rays" tint="rgba(255,255,255,0.08)" />
      <Shaker s={s}>
        <Kicker text="2024" f={f} at={start + 3} />
        <BigWord lines={["18"]} f={f} at={dixhuit} x={430} y={590} size={440} rotate={-4} />
        <BigWord lines={["ans"]} f={f} at={ans} x={765} y={650} size={180} color={C.yellow} rotate={-4} />
        <FlipCard f={f} inAt={deux} flipAt={bac} x={300} y={1000}>
          <svg width={170} height={130} viewBox="0 0 170 130">
            <path d="M85 8 L164 46 L85 84 L6 46 Z" fill={C.ink} />
            <path d="M40 66 V98 Q85 124 130 98 V66 L85 88 Z" fill={C.ink} />
            <line x1={150} y1={52} x2={150} y2={100} stroke={C.coral} strokeWidth={8} strokeLinecap="round" />
            <circle cx={150} cy={106} r={10} fill={C.coral} />
          </svg>
          <CardLabel>LE BAC</CardLabel>
        </FlipCard>
        <FlipCard f={f} inAt={deux + 3} flipAt={jeux} x={710} y={1000}>
          <svg width={120} height={170} viewBox="0 0 120 170">
            <path d="M60 4 C92 40 98 62 84 82 C80 70 72 62 66 60 C70 78 60 92 60 92 C60 92 34 78 40 46 C24 60 22 76 30 90 C10 70 20 34 60 4 Z" fill={C.coral} />
            <path d="M34 96 H86 L72 164 H48 Z" fill={C.ink} />
            <rect x={28} y={90} width={64} height={14} rx={7} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          </svg>
          <CardLabel>
            PARIS
            <br />
            2024
          </CardLabel>
        </FlipCard>
        <PlusOne f={f} at={pt.at} index={pt.index} x={850} y={520} />
      </Shaker>
      <Flash opacity={flash(f, bac + 5, 5, 0.45) + flash(f, jeux + 5, 5, 0.55)} />
    </AbsoluteFill>
  );
};

// ───────────── 8. l'iPhone ─────────────

const APPS = [C.green, C.sky, C.yellow, C.coral, C.violet, C.orange, C.magenta, C.teal, C.paper, C.green, C.coral, C.sky];

export const Iphone: React.FC<SceneProps> = ({ f, q }) => {
  const { start } = q.scene("iphone");
  const vieux = q.c("iphone.a#vieux");
  const objet = q.c("iphone.a#objet");
  const B = q.c("iphone.b");
  const an = q.c("iphone.c#2007");
  const pt = q.point("iphone");

  const phone = pop(f, objet, { damping: 10, stiffness: 220 });
  const lit = f >= B;
  const kick = lit ? 1 + 0.2 * Math.exp(-(f - B) / 4) : 1;
  const line = prog(f, start + 4, 14);
  const s = shakes(f, [[B, 24], [an + 6, 14]]);

  const node = (x: number, at: number, year: string, color: string) => {
    const p = pop(f, at, { damping: 9, stiffness: 240, mass: 0.5 });
    return (
      <React.Fragment key={year}>
        <div style={{ position: "absolute", left: x - 30, top: 1105 - 30, width: 60, height: 60, borderRadius: "50%", background: color, border: `8px solid ${C.ink}`, boxSizing: "border-box", transform: `scale(${p})` }} />
        <div style={{ position: "absolute", left: x - 130, width: 260, top: 985, textAlign: "center", fontFamily: DISPLAY, fontSize: 84, lineHeight: 1, color: C.ink, transform: `scale(${p})` }}>
          {year}
        </div>
      </React.Fragment>
    );
  };

  return (
    <AbsoluteFill>
      <Backdrop color={C.sky} f={f} pattern="dots" tint="rgba(13,13,18,0.08)" />
      <Shaker s={s}>
        <Kicker text="2006 vs 2007" f={f} at={start + 3} />

        {/* le téléphone */}
        <div
          style={{
            position: "absolute",
            left: 565,
            top: 668,
            width: 290,
            height: 500,
            marginLeft: -145,
            marginTop: -250,
            borderRadius: 52,
            background: C.ink,
            boxShadow: "16px 18px 0 rgba(13,13,18,0.22)",
            transform: `scale(${phone * kick}) rotate(${-6 + Math.sin((f - start) * 0.1) * 2}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: 105, top: 26, width: 80, height: 10, borderRadius: 5, background: "#3A3D49" }} />
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 58,
              bottom: 86,
              borderRadius: 10,
              background: lit ? "#F4F7FF" : "#23262F",
              overflow: "hidden",
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              gap: 14,
              padding: 18,
              boxSizing: "border-box",
            }}
          >
            {lit
              ? APPS.map((c, i) => (
                  <div key={i} style={{ width: 44, height: 44, borderRadius: 12, background: c === C.paper ? C.ink : c, transform: `scale(${pop(f, B + 1 + i, { damping: 9, stiffness: 260, mass: 0.4 })})` }} />
                ))
              : (
                <div style={{ width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 210, lineHeight: 1.5, color: C.yellow, transform: `scale(${1 + 0.07 * Math.sin((f - start) * 0.45)})` }}>
                  ?
                </div>
              )}
          </div>
          <div style={{ position: "absolute", left: 145 - 24, bottom: 20, width: 48, height: 48, borderRadius: "50%", border: "5px solid #5A5E6B", boxSizing: "border-box" }} />
        </div>
        <BigWord lines={["L'iPhone"]} f={f} at={B} y={850} size={196} rotate={-5} />

        {/* la frise : toi d'abord, lui ensuite */}
        <div style={{ position: "absolute", left: 150, top: 1105 - 7, width: 740 * line, height: 14, borderRadius: 7, background: C.ink }} />
        {node(300, vieux, "2006", C.yellow)}
        {node(740, objet + 4, "2007", C.paper)}
        <Tag text="Toi" f={f} at={vieux + 3} x={300} y={1178} bg={C.yellow} fg={C.ink} size={40} rotate={-3} />
        {f < an ? (
          <Tag text="?" f={f} at={objet + 7} x={740} y={1178} bg={C.ink} fg={C.yellow} size={40} rotate={3} />
        ) : (
          <Tag text="L'iPhone" f={f} at={an} x={740} y={1178} bg={C.ink} fg={C.paper} size={40} rotate={3} />
        )}
        <Stamp text="T'es l'aîné" f={f} at={an + 6} x={750} y={480} size={92} color={C.coral} bg={C.paper} rotate={8} />
        <PlusOne f={f} at={pt.at} index={pt.index} x={850} y={640} />
      </Shaker>
      <Flash opacity={flash(f, B)} />
    </AbsoluteFill>
  );
};



#!/usr/bin/env python3
"""
Fabrique la bande-son et la timeline d'une vidéo.

    python3 tools/build_audio.py ne-en-2006 [--voice kokoro|tom|siwis] [--speed 1.06] [--no-music]

Entrée  : content/<id>.json
Sorties : public/<id>/audio.wav             voix + bruitages + musique, normalisés à -14 LUFS
          src/generated/<id>.timeline.json  scènes, lignes, mots horodatés, points

Chaque ligne est synthétisée séparément, puis relue par un modèle de reconnaissance
vocale : on en tire l'horodatage mot à mot (sous-titres) et un contrôle de prononciation.
"""
import argparse
import difflib
import json
import math
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
import sherpa_onnx
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path(os.environ.get("MOTION_MODELS", ROOT / "models"))
SR = 48000
FPS = 30
rng = np.random.default_rng(7)


# ───────────────────────── voix ─────────────────────────

def load_tts(engine: str):
    if engine == "kokoro":
        d = MODELS / "kokoro-multi-lang-v1_0"
        model = sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(d / "model.onnx"), voices=str(d / "voices.bin"), tokens=str(d / "tokens.txt"),
                data_dir=str(d / "espeak-ng-data"), dict_dir=str(d / "dict"), lang="fr"),
            num_threads=4)
    else:  # voix Piper : tom, siwis, upmc
        d = MODELS / f"vits-piper-fr_FR-{engine}-medium"
        model = sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(d / f"fr_FR-{engine}-medium.onnx"), tokens=str(d / "tokens.txt"),
                data_dir=str(d / "espeak-ng-data")),
            num_threads=4)
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=model, max_num_sentences=1))


def load_asr():
    d = MODELS / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8"
    return sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(d / "encoder.int8.onnx"), decoder=str(d / "decoder.int8.onnx"),
        joiner=str(d / "joiner.int8.onnx"), tokens=str(d / "tokens.txt"),
        num_threads=4, model_type="nemo_transducer")


TOKEN_RE = re.compile(r"\[([^\]|]+)\|([^\]]+)\]|(\S+)")


def parse(text: str):
    """« Le [hand|hannd] spinner / … » -> [{d: affiché, s: prononcé, br: césure après}, …]"""
    out = []
    for m in TOKEN_RE.finditer(text):
        if m.group(3) == "/":          # césure de sous-titre, muette
            if out:
                out[-1]["br"] = True
        elif m.group(3):
            out.append({"d": m.group(3), "s": m.group(3)})
        else:
            out.append({"d": m.group(1), "s": m.group(2)})
    return out


def strip_accents(w: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", w) if unicodedata.category(c) != "Mn")


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", strip_accents(w.lower()))


def trim(x: np.ndarray, sr: int) -> np.ndarray:
    env = np.abs(x)
    thr = env.max() * 10 ** (-48 / 20)
    idx = np.where(env > thr)[0]
    a = max(0, idx[0] - int(0.010 * sr))
    b = min(len(x), idx[-1] + int(0.07 * sr))
    y = x[a:b].copy()
    f = int(0.006 * sr)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def level(x: np.ndarray, target=0.115) -> np.ndarray:
    active = x[np.abs(x) > 0.02 * np.abs(x).max()]
    rms = math.sqrt(float(np.mean(active ** 2))) if len(active) else 1.0
    return x * float(np.clip(target / rms, 0.4, 3.0))


def asr_words(asr, x: np.ndarray, sr: int):
    # marges de silence généreuses : sans elles le modèle tronque les fins de phrase
    lead = 0.5
    s = asr.create_stream()
    s.accept_waveform(sr, np.concatenate([np.zeros(int(lead * sr), dtype=np.float32), x.astype(np.float32),
                                          np.zeros(sr, dtype=np.float32)]))
    asr.decode_stream(s)
    r = s.result
    words = []
    for tok, t in zip(r.tokens, r.timestamps):
        if tok[:1] in (" ", "▁") or not words:
            words.append([tok.strip(" ▁"), t - lead])
        else:
            words[-1][0] += tok
    words = [(norm(w), max(0.0, t)) for w, t in words]
    return r.text.strip(), [(w, t) for w, t in words if w]


def align(expected, heard, dur):
    """Heure de début de chaque mot attendu, d'après les mots reconnus."""
    n = len(expected)
    starts = [None] * n
    sm = difflib.SequenceMatcher(a=expected, b=[w for w, _ in heard], autojunk=False)
    ops = sm.get_opcodes()
    for tag, i1, i2, j1, j2 in ops:
        if tag == "equal":
            for k in range(i2 - i1):
                starts[i1 + k] = heard[j1 + k][1]
    weight = lambda w: len(w) + 1.5
    for tag, i1, i2, j1, j2 in ops:
        if tag not in ("replace", "delete"):
            continue
        right = starts[i2] if i2 < n and starts[i2] is not None else dur
        if tag == "replace":          # le modèle a entendu autre chose (ex. « 2006 »)
            left, first = heard[j1][1], i1
        elif i1 > 0:                  # mots non entendus : on partage avec le mot précédent
            left, first = starts[i1 - 1], i1 - 1
        else:
            left, first = 0.0, 0
        ws = [weight(expected[k]) for k in range(first, i2)]
        acc = 0.0
        for k, w in zip(range(first, i2), ws):
            starts[k] = left + (right - left) * acc / sum(ws)
            acc += w
    starts = [max(0.0, s - 0.04) for s in starts]   # le modèle émet légèrement après l'attaque
    starts[0] = 0.0
    anchor = next((k for k in range(1, n) if starts[k] >= 0.2), n)
    if anchor > 1:                 # premiers mots tassés au début : répartition au prorata
        right = starts[anchor] if anchor < n else dur
        ws = [weight(expected[k]) for k in range(anchor)]
        acc = 0.0
        for k in range(anchor):
            starts[k] = right * acc / sum(ws)
            acc += ws[k]
    for k in range(1, n):
        starts[k] = max(starts[k], starts[k - 1] + 0.05)
    return starts, sm.ratio()


# ───────────────────────── bruitages ─────────────────────────

def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def band(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hipass(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def lopass(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def svf_band(x, fc, q=1.4):
    """Filtre passe-bande dont la fréquence varie dans le temps."""
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 7) / SR)
    low = bandv = 0.0
    out = np.empty_like(x)
    damp = 1 / q
    for i in range(len(x)):
        low += f[i] * bandv
        high = x[i] - low - damp * bandv
        bandv += f[i] * high
        out[i] = bandv
    return out


def peak_norm(x, p=1.0):
    return x * (p / (np.abs(x).max() + 1e-9))


def sfx_impact(**_):
    t = t_axis(0.55)
    f = 46 + 120 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.35
    air = band(rng.standard_normal(len(t)), 300, 3000) * np.exp(-t / 0.05) * 0.4
    return peak_norm(body + click + air)


def sfx_whoosh(dur=0.34, **_):
    t = t_axis(dur)
    u = t / dur
    fc = 350 + 3600 * np.exp(-((u - 0.55) / 0.28) ** 2)
    x = svf_band(rng.standard_normal(len(t)), fc) * np.sin(np.pi * u) ** 1.6
    return peak_norm(x, 0.8)


def sfx_riser(dur=0.5, **_):
    t = t_axis(dur)
    u = t / dur
    noise = svf_band(rng.standard_normal(len(t)), 500 * (14 ** u), q=2.0)
    tone = np.sin(2 * np.pi * np.cumsum(220 * (4 ** u)) / SR) * 0.25
    x = (noise + tone) * u ** 2.4
    f = int(0.008 * SR)
    x[-f:] *= np.linspace(1, 0, f)
    return peak_norm(x, 0.75)


def sfx_pop(**_):
    t = t_axis(0.1)
    f = 330 + 560 * np.exp(-t / 0.018)
    return peak_norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.028), 0.8)


def sfx_tick(**_):
    t = t_axis(0.035)
    x = hipass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) + np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.006)
    return peak_norm(x, 0.6)


def sfx_ding(**_):
    def note(f, dur, tau):
        t = t_axis(dur)
        w = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 3 * f * t) + 0.12 * np.sin(2 * np.pi * 5 * f * t)
        e = np.exp(-t / tau)
        e[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
        return w * e
    a, b = note(987.77, 0.075, 0.2), note(1318.51, 0.55, 0.15)
    x = np.zeros(int(0.075 * SR) + len(b))
    x[: len(a)] += a
    x[int(0.075 * SR):] += b
    return peak_norm(x, 0.7)


def sfx_stamp(**_):
    t = t_axis(0.3)
    thud = np.sin(2 * np.pi * np.cumsum(52 + 70 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.08)
    slap = lopass(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.02) * 0.7
    return peak_norm(thud + slap, 0.95)


def sfx_typing(dur=0.9, **_):
    x = np.zeros(int(dur * SR))
    pos = 0.0
    while pos < dur - 0.06:
        c = sfx_tick() * rng.uniform(0.5, 1.0)
        i = int(pos * SR)
        x[i:i + len(c)] += c
        pos += rng.uniform(0.055, 0.105)
    return x * 0.8


def sfx_roll(dur=0.7, **_):
    x = np.zeros(int(dur * SR) + 2000)
    for k in range(10):
        u = (k / 9) ** 1.5
        c = sfx_tick()
        i = int(u * (dur - 0.05) * SR)
        x[i:i + len(c)] += c
    return x


SFX = {"impact": sfx_impact, "whoosh": sfx_whoosh, "riser": sfx_riser, "pop": sfx_pop, "tick": sfx_tick,
       "ding": sfx_ding, "stamp": sfx_stamp, "typing": sfx_typing, "roll": sfx_roll}
SFX_GAIN = {"impact": 0.62, "whoosh": 0.34, "riser": 0.3, "pop": 0.38, "tick": 0.3, "ding": 0.36,
            "stamp": 0.6, "typing": 0.34, "roll": 0.36}


# ───────────────────────── musique ─────────────────────────

def music_bed(total: float) -> np.ndarray:
    """Boucle rythmique discrète (100 BPM, la mineur), à remplacer par un son tendance au besoin."""
    beat = 60 / 100
    n = int((total + 1) * SR)
    out = np.zeros(n)

    def add(sig, at, g=1.0):
        i = int(at * SR)
        if i >= n:
            return
        j = min(n, i + len(sig))
        out[i:j] += sig[: j - i] * g

    tk = t_axis(0.3)
    kick = np.sin(2 * np.pi * np.cumsum(47 + 85 * np.exp(-tk / 0.035)) / SR) * np.exp(-tk / 0.11)
    tc = t_axis(0.16)
    clap = band(rng.standard_normal(len(tc)), 900, 3600) * (np.exp(-tc / 0.05) + 0.6 * np.exp(-np.abs(tc - 0.013) / 0.004))
    th = t_axis(0.05)
    hat = hipass(rng.standard_normal(len(th)), 7000) * np.exp(-th / 0.012)

    def bass(f):
        t = t_axis(0.3)
        e = np.exp(-t / 0.16)
        e[:200] *= np.linspace(0, 1, 200)
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * e

    def pluck(freqs):
        t = t_axis(0.42)
        s = sum(np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t) for f in freqs)
        e = np.exp(-t / 0.13)
        e[:150] *= np.linspace(0, 1, 150)
        return lopass(s * e, 2600) / len(freqs)

    chords = [  # la mineur, fa, do, sol
        (55.0, (220.0, 261.63, 329.63)),
        (43.65, (174.61, 220.0, 261.63)),
        (65.41, (196.0, 261.63, 329.63)),
        (49.0, (196.0, 246.94, 293.66)),
    ]
    bars = int(total / (4 * beat)) + 2
    for b in range(bars):
        root, tri = chords[b % 4]
        t0 = b * 4 * beat
        for q in range(4):
            tb = t0 + q * beat
            if q in (0, 2):
                add(kick, tb, 0.9)
            else:
                add(clap, tb, 0.3)
            add(hat, tb, 0.16)
            add(hat, tb + beat / 2, 0.26)
            add(pluck(tri), tb + beat / 2, 0.36)
        for e8 in (0, 1, 3, 4, 5, 7):
            add(bass(root), t0 + e8 * beat / 2, 0.55)
        add(kick, t0 + 2.5 * beat, 0.45)
    out = np.tanh(out[: int(total * SR)] * 1.1)
    return lopass(out, 9000)


# ───────────────────────── assemblage ─────────────────────────

def loudnorm(src: Path, dst: Path, pre=""):
    flt = f"{pre}loudnorm=I=-14:TP=-1.5:LRA=11"
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", flt + ":print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = json.loads(p.stderr[p.stderr.rindex("{"):p.stderr.rindex("}") + 1])
    second = (f"{flt}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
              f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", second,
                    "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(dst)], check=True)
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--voice")
    ap.add_argument("--speed", type=float)
    ap.add_argument("--no-music", action="store_true")
    args = ap.parse_args()

    content = json.loads((ROOT / "content" / f"{args.id}.json").read_text())
    vcfg = content.get("voice", {})
    engine = args.voice or vcfg.get("engine", "kokoro")
    speed = args.speed or vcfg.get("speed", 1.0)
    sid = vcfg.get("speaker", 0) if engine == vcfg.get("engine", "kokoro") else 0

    print(f"Voix : {engine} (vitesse {speed})")
    tts, asr = load_tts(engine), load_asr()

    # 1. synthèse + horodatage de chaque ligne
    lines = []
    for scene in content["scenes"]:
        for li, line in enumerate(scene["lines"]):
            toks = parse(line["text"])
            say = " ".join(t["s"] for t in toks).replace("…", "...")
            a = tts.generate(say, sid=sid, speed=speed)
            x = trim(np.array(a.samples, dtype=np.float32), a.sample_rate)
            dur = len(x) / a.sample_rate
            heard_text, heard = asr_words(asr, x, a.sample_rate)

            expected, owner = [], []
            for ti, t in enumerate(toks):
                for w in t["s"].split():
                    if norm(w):
                        expected.append(norm(w))
                        owner.append(ti)
            starts, ratio = align(expected, heard, dur)
            words = []
            for ti, t in enumerate(toks):
                ks = [k for k, o in enumerate(owner) if o == ti]
                s = starts[ks[0]]
                e = starts[ks[-1] + 1] if ks[-1] + 1 < len(starts) else dur
                words.append({"t": t["d"], "s": s, "e": e, **({"b": 1} if t.get("br") else {})})
            flag = "  " if ratio > 0.8 else "⚠ "
            print(f"{flag}{line['id']:7s} {dur:5.2f}s  {ratio:4.2f}  dit    : {say}\n{'':24s}entendu: {heard_text}")

            g = math.gcd(SR, a.sample_rate)
            y = level(resample_poly(x, SR // g, a.sample_rate // g))
            lines.append({"id": line["id"], "scene": scene["id"], "kind": line.get("kind", "plain"),
                          "gap": line.get("gap"), "last": li == len(scene["lines"]) - 1,
                          "text": " ".join(t["d"] for t in toks), "dur": dur, "words": words, "audio": y})

    # 2. placement dans le temps
    t = 0.03
    for ln in lines:
        ln["start"], ln["end"] = t, t + ln["dur"]
        gap = ln["gap"]
        if gap is None:
            gap = 0.46 if ln["kind"] == "riddle" else 0.34 if ln["last"] else 0.24 if ln["kind"] == "reveal" else 0.16
        ln["gapUsed"] = gap
        t = ln["end"] + gap
        for w in ln["words"]:
            w["s"] = round(ln["start"] + w["s"], 3)
            w["e"] = round(ln["start"] + w["e"], 3)
    frames = math.ceil((lines[-1]["end"] + 0.3) * FPS)
    total = frames / FPS

    scenes = []
    for scene in content["scenes"]:
        first = next(l for l in lines if l["scene"] == scene["id"])
        scenes.append({"id": scene["id"], "start": 0.0 if not scenes else round(first["start"] - 0.14, 3)})
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total
    by_id = {l["id"]: l for l in lines}

    def cue(ref: str) -> float:
        lid, _, prefix = ref.partition("#")
        ln = by_id[lid]
        if not prefix:
            return ln["start"]
        for w in ln["words"]:
            if norm(w["t"]).startswith(norm(prefix)):
                return w["s"]
        raise SystemExit(f"repère introuvable : {ref}")

    # 3. bruitages
    events, points = [], []
    for i, scene in enumerate(content["scenes"]):
        if i > 0:
            events.append(("whoosh", scenes[i]["start"] - 0.06, {}))
        if "point" in scene:
            pt = cue(scene["point"]["at"]) + scene["point"].get("offset", 0)
            points.append({"scene": scene["id"], "t": round(pt, 3)})
            events.append(("ding", pt, {}))
        for e in scene.get("sfx", []):
            events.append((e["name"], cue(e["at"]) + e.get("offset", 0), e))
    for a, b in zip(lines, lines[1:]):
        if a["kind"] == "riddle" and b["kind"] == "reveal":
            d = max(0.3, b["start"] - a["end"] + 0.06)
            events.append(("riser", b["start"] - d, {"dur": d}))
    for ln in lines:
        if ln["kind"] == "reveal" and not any(n == "impact" and abs(at - ln["start"]) < 0.4 for n, at, _ in events):
            events.append(("impact", ln["start"], {"gain": 0.85}))

    n = int(total * SR)
    voice, sfx = np.zeros(n), np.zeros(n)
    for ln in lines:
        i = int(ln["start"] * SR)
        voice[i:i + len(ln["audio"])] += ln["audio"][: n - i]
    for name, at, opt in events:
        sig = SFX[name](**{k: v for k, v in opt.items() if k == "dur"}) * SFX_GAIN[name] * opt.get("gain", 1.0)
        i = max(0, int(at * SR))
        j = min(n, i + len(sig))
        sfx[i:j] += sig[: j - i]

    # 4. musique, atténuée quand la voix parle
    music = np.zeros(n)
    if content.get("music", True) and not args.no_music:
        music = music_bed(total)[:n]
        music = np.pad(music, (0, n - len(music)))
        env = np.sqrt(np.maximum(lopass(voice ** 2, 6), 0))
        duck = 1 - 0.5 * np.clip(env / 0.06, 0, 1)
        music *= np.clip(duck, 0.5, 1) * 0.085
        f = int(0.04 * SR)
        music[-f:] *= np.linspace(1, 0, f)

    build = ROOT / "build" / args.id
    build.mkdir(parents=True, exist_ok=True)
    sf.write(build / "voice_raw.wav", voice, SR)
    # voix : coupe-bas + compression légère pour un rendu plus « présent »
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(build / "voice_raw.wav"), "-af",
                    "highpass=f=75,acompressor=threshold=-20dB:ratio=3:attack=4:release=90:makeup=2.5,"
                    "equalizer=f=3200:t=q:w=1.2:g=2", str(build / "voice.wav")], check=True)
    voice_p, _ = sf.read(build / "voice.wav")
    voice_p = np.pad(voice_p[:n], (0, max(0, n - len(voice_p))))
    mix = voice_p + sfx * 0.55 + music
    mix = np.tanh(mix * 1.05) / 1.05
    sf.write(build / "sfx.wav", sfx, SR)
    sf.write(build / "music.wav", music, SR)
    sf.write(build / "mix_raw.wav", mix, SR)
    out_dir = ROOT / "public" / args.id
    out_dir.mkdir(parents=True, exist_ok=True)
    stats = loudnorm(build / "mix_raw.wav", out_dir / "audio.wav")

    timeline = {
        "id": args.id, "title": content["title"], "fps": FPS, "durationInFrames": frames, "duration": round(total, 3),
        "voice": engine, "scenes": scenes, "points": points,
        "lines": [{"id": l["id"], "scene": l["scene"], "kind": l["kind"], "start": round(l["start"], 3),
                   "end": round(l["end"], 3), "text": l["text"], "words": l["words"]} for l in lines],
    }
    gen = ROOT / "src" / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    (gen / f"{args.id}.timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))

    nwords = sum(len(l["words"]) for l in lines)
    print(f"\nDurée : {total:.2f} s ({frames} images) · {len(lines)} lignes · {nwords} mots · {len(events)} bruitages")
    print(f"Niveau avant normalisation : {stats['input_i']} LUFS, crête {stats['input_tp']} dBTP")
    for sc in scenes:
        print(f"  {sc['id']:8s} {sc['start']:6.2f} → {sc['end']:6.2f}")


if __name__ == "__main__":
    main()

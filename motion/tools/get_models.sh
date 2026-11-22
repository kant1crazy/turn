#!/usr/bin/env bash
# Télécharge les modèles de voix et de reconnaissance vocale dans ./models (≈ 1,2 Go).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models && cd models
B=https://github.com/k2-fsa/sherpa-onnx/releases/download
for url in \
  "$B/tts-models/kokoro-multi-lang-v1_0.tar.bz2" \
  "$B/tts-models/vits-piper-fr_FR-tom-medium.tar.bz2" \
  "$B/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8.tar.bz2"; do
  name="${url##*/}"
  [ -d "${name%.tar.bz2}" ] && continue
  curl -L --retry 3 -o "$name" "$url"
  tar xjf "$name" && rm "$name"
done

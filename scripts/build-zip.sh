#!/usr/bin/env zsh
# build-zip.sh – Erstellt das Store-Upload-ZIP fuer ScreenSteps
# Aufruf: zsh scripts/build-zip.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/manifest.json','utf8')).version)")
OUT="$ROOT/dist/screensteps-v${VERSION}.zip"

mkdir -p "$ROOT/dist"
rm -f "$OUT"

cd "$ROOT"
zip -r "$OUT" \
  manifest.json \
  assets/icons \
  popup \
  manager \
  preview \
  src \
  -x "*.DS_Store" \
  -x "*/.git/*"

echo ""
echo "✅  Store-ZIP erstellt: dist/screensteps-v${VERSION}.zip"
echo "    $(du -sh "$OUT" | cut -f1)  $(unzip -t "$OUT" | tail -1)"


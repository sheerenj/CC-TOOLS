#!/bin/sh
# Boldly Identity's source lives in the HearTheYouth experiments repo; this page is a mirror.
# Copies it in, fixes the shared-style paths (one folder deeper here) and keeps the local autosave file.
set -e
SRC="${1:-$HOME/Documents/GitHub/HTY/hty-experiments/boldly-identity}"
DST="$(cd "$(dirname "$0")/.." && pwd)/generators/boldly-identity"
[ -d "$SRC/core" ] || { echo "Source not found: $SRC"; exit 1; }
rsync -a --delete --exclude library-autosave.json --exclude README.md --exclude '_*.html' "$SRC/" "$DST/"
for f in "$DST"/type/index.html "$DST"/icons/index.html "$DST"/compose/index.html "$DST"/data/index.html; do
  sed -i '' 's#\.\./\.\./shared/#../../../shared/#g' "$f"
done
sed -i '' 's#"\.\./shared/#"../../shared/#g' "$DST/index.html"
echo "Synced Boldly Identity from $SRC → generators/boldly-identity (review with git diff, then commit + push)"

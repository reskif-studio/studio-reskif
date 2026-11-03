#!/bin/bash
# Construit le client web Reskif Studio à partir de la version officielle de FluffyChat (non modifiée).
# Usage : ./build.sh  → dossier dist/ prêt pour Cloudflare Pages.
set -euo pipefail
cd "$(dirname "$0")"
V=$(cat FLUFFYCHAT_VERSION)
[ -f .cache/fluffychat-web-$V.tar.gz ] || { mkdir -p .cache; curl -fsSL -o .cache/fluffychat-web-$V.tar.gz "https://github.com/krille-chan/fluffychat/releases/download/$V/fluffychat-web.tar.gz"; }
rm -rf dist .cache/x && mkdir -p .cache/x && tar xzf .cache/fluffychat-web-$V.tar.gz -C .cache/x
cp -r .cache/x/build/web dist
find dist -name '*.map' -delete
cp brand/config.json dist/config.json
cp brand/icons/* dist/icons/ && cp brand/icons/Icon-32.png dist/favicon.png
python3 brand/patch.py dist "$V"
cp brand/_headers dist/_headers
echo "dist prêt ($(find dist -type f | wc -l) fichiers, FluffyChat $V)"

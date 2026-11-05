#!/bin/bash
# Construit le client web Reskif Studio à partir de la version officielle de FluffyChat (non modifiée).
# Usage : ./build.sh  → dossier dist/ prêt pour Cloudflare Pages.
set -euo pipefail
cd "$(dirname "$0")"
V=$(cat FLUFFYCHAT_VERSION)
# Version habillée (compilée par GitHub Actions, voir patch/) si présente, sinon version officielle.
RESKIF_BUILD=.cache/fluffychat-reskif-web.tar.gz
rm -rf dist .cache/x && mkdir -p .cache/x
if [ -f "$RESKIF_BUILD" ]; then tar xzf "$RESKIF_BUILD" -C .cache/x; echo "base : FluffyChat $V habillé Reskif";
else [ -f .cache/fluffychat-web-$V.tar.gz ] || { mkdir -p .cache; curl -fsSL -o .cache/fluffychat-web-$V.tar.gz "https://github.com/krille-chan/fluffychat/releases/download/$V/fluffychat-web.tar.gz"; }
     tar xzf .cache/fluffychat-web-$V.tar.gz -C .cache/x; echo "base : FluffyChat $V officiel"; fi
cp -r .cache/x/build/web dist
find dist -name '*.map' -delete
cp brand/config.json dist/config.json
cp brand/icons/* dist/icons/ && cp brand/icons/Icon-32.png dist/favicon.png
python3 brand/patch.py dist "$V"
sed -i 's#<base href="/web/">#<base href="/">#' dist/index.html
cp brand/_headers dist/_headers
cp brand/sphere.js brand/splash.js brand/reskif_logo.svg brand/reskif_logo_clair.svg dist/
echo "dist prêt ($(find dist -type f | wc -l) fichiers, FluffyChat $V)"

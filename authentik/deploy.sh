#!/bin/bash
# Déploie l'habillage de la page de connexion sur id.reskif.org (Authentik, VPS ov-755d32).
# authentik/if-flow.html -> /opt/authentik/custom-templates/if/flow.html
# brand/sphere.js + authentik/reskif/login.js -> /opt/authentik/custom-templates/reskif/ (entourés de {% verbatim %})
# Le serveur Authentik garde les gabarits en cache : redémarrage du conteneur authentik-server-1 (~30 s).
# ATTENTION : une connexion en cours à ce moment-là est perdue (incident du 05/11 05:44). Éviter pendant les essais de Julien.
set -euo pipefail
cd "$(dirname "$0")/.."
H=ubuntu@195.15.213.24
T=$(mktemp -d)
cp authentik/if-flow.html $T/flow.html
for f in brand/sphere.js authentik/reskif/login.js; do node --check $f; { printf '{%% verbatim %%}'; cat $f; printf '{%% endverbatim %%}'; } > $T/$(basename $f); done
scp -q $T/flow.html $T/sphere.js $T/login.js $H:/tmp/
ssh -o BatchMode=yes $H 'sudo bash -s' <<'EOF'
set -e
D=/opt/authentik/custom-templates
mkdir -p $D/if $D/reskif
mv /tmp/flow.html $D/if/flow.html; mv /tmp/sphere.js /tmp/login.js $D/reskif/
chown -R 1000:1000 $D
docker restart authentik-server-1 >/dev/null
for i in $(seq 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' https://id.reskif.org/if/flow/reskif-email-login/)" = 200 ] && break; sleep 2; done
curl -s https://id.reskif.org/if/flow/reskif-email-login/ | grep -q RkSphere && echo "id.reskif.org : habillage en ligne"
EOF
rm -rf $T

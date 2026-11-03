# studio.reskif.org

Client web de la messagerie Matrix Reskif (`:reskif.org`), basé sur **FluffyChat** (version dans `FLUFFYCHAT_VERSION`), aux couleurs Reskif.

- FluffyChat n'est **pas modifié** : `build.sh` télécharge la version officielle et y ajoute `brand/` (config, écran de chargement, icônes, manifeste).
- FluffyChat est sous licence **AGPL-3.0** ; ses sources : https://github.com/krille-chan/fluffychat. Ce dépôt est public pour la même raison.
- Déploiement : Cloudflare Pages (projet `reskif-studio`), dossier `dist/`.
- Plan de design : `content/design.md`.

Mettre à jour FluffyChat : changer `FLUFFYCHAT_VERSION`, `./build.sh`, vérifier, déployer.

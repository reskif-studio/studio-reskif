# Studio Reskif : plan de design (client Matrix FluffyChat)

Adresse : https://studio.reskif.org. Base : FluffyChat (version dans FLUFFYCHAT_VERSION, AGPL-3.0), **compilé avec un habillage Reskif** (patch/reskif-theme.py, appliqué par GitHub Actions avant compilation).

## Brief
- Identité Reskif « sphère » (reskif-commons@cd09ebf) : un seul univers, la nuit ; texte blanc ; chaud #ffb08a / froid #9cc0ff réservés aux rôles ; Syne + Fraunces ; verre et pilules.
- Exigence de Julien (03/11) : **contrastes fond/texte irréprochables**. Chaque couple texte/fond utilisé par l'appli est vérifié par le script ; la compilation échoue sous le seuil (texte courant 7:1, texte secondaire 4,5:1, composants 3:1).

## Couleurs (palette unique, dans patch/reskif-theme.py)
| Rôle | Hex | Usage |
|---|---|---|
| nuit | #010101 | fond de tous les écrans |
| verre | #07050E → #221C3A | 4 paliers de conteneurs teintés violet (listes, dialogues, bulles des autres, champs) |
| encre | #FFFFFF | texte (20,9:1 sur la nuit, ≥ 14:1 partout) |
| encre douce | #B9B5C8 | texte secondaire (≥ 7:1) ; « outline » #A6A1B8 pour les aperçus de messages (≥ 5,6:1) |
| froid | #9CC0FF | liens, accents, pastilles non-lus (texte nuit dessus 11,3:1) |
| froid profond | #1D3260 | mes bulles, bout froid du dégradé (blanc dessus 12,5:1) |
| violet profond | #2B2060 | bout violet du dégradé de mes bulles (blanc dessus 14,2:1) |
| salon actif | #1E2A4A | sélection dans les listes (blanc 14,1:1, aperçu 5,7:1) |

Chaud #FFB08A : seulement l'anneau de focus clavier (usage.md). Aucun fond clair : les boutons principaux sont des pilules **blanches à texte nuit** (20,9:1).

Corrigé par rapport à la version précédente : le salon actif avait un fond blanc avec un titre blanc ; les messages en échec étaient en rouge vif sous texte blanc (3,3:1) ; les couleurs des avatars et des noms d'espaces étaient calculées pour un fond clair (texte foncé sur la nuit) ; la sélection de texte était blanche à 50 % sous du texte blanc ; la pastille « non lu » sans compteur était bleu nuit sur la nuit (1,6:1, maintenant #A6A1B8, 8,4:1) ; le nom de l'expéditeur au-dessus des bulles était foncé sur la nuit.

Vérification au rendu : compte jetable `reskif-apercu` connecté en headless (Chromium SwiftShader, setup/apercu-login.mjs côté Vincky) sur un déploiement d'aperçu, captures bureau + mobile de l'introduction, de la liste des salons, d'un salon et des paramètres.

## Typographie
- **Syne** (500 à 800) : titres, barres d'en-tête, boutons, libellés, infobulles.
- **Fraunces** (400, 500, 600) en romain pour les messages et les listes. L'italique 300 du site est trop fin pour une messagerie lue en petit corps sur écran : il n'est pas utilisé dans l'appli.
- Polices embarquées en **instances statiques par graisse** (Google Fonts) : le fichier variable de Fraunces vaut 900 par défaut et Flutter ne relie pas toujours la graisse demandée à l'axe variable.

## Composants
- Mes messages : dégradé violet → froid (la sphère) selon la position à l'écran, encre blanche. Messages des autres : verre #171329.
- Pilules : bouton principal (blanc plein), bouton flottant « nouvelle discussion », boutons contour et texte.
- Dialogues, menus, feuilles du bas : verre #171329 bordé de --line (22 % de blanc), rayon 18.
- Logo FluffyChat remplacé par le logo carré Reskif (écran d'introduction, filigrane de la colonne vide).
- Paramètres › Style : choix clair/sombre et choix de couleur retirés (sans objet).

## Écran d'accueil (avant Flutter)
Sphère organique de reskif-commons, logo, « Se connecter » (Syne 800), sous-titre Fraunces italique (grand corps, lisible). Voir brand/splash.js.

## Principes
1. Le code de FluffyChat n'est pas versionné ici : le patch est appliqué à la version officielle au moment de la compilation et vérifie ce qu'il modifie (échec explicite si FluffyChat change).
2. Tout ce qui est Reskif vit dans brand/ et patch/.
3. Serveur imposé (reskif.org).

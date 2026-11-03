# Studio Reskif : plan de design (client Matrix FluffyChat)

Adresse : https://studio.reskif.org. Base : FluffyChat v2.11.4 (web, AGPL-3.0), **non modifié** ; seuls la configuration, l'écran de chargement, les icônes et le manifeste sont aux couleurs Reskif.

## Brief
- Identité Reskif « sphère » (reskif-commons) : fond nuit, texte blanc, chaud/froid réservés aux rôles, Syne / Fraunces / EB Garamond.
- Contrainte : l'interface de l'appli est dessinée par Flutter (Material 3). On ne contrôle que la **couleur de départ** (palette générée), pas les polices ni les composants. Une refonte complète demanderait un fork compilé : hors périmètre pour l'instant.

## Couleurs
| Nom | Hex | Usage |
|---|---|---|
| nuit | #010101 | fond de l'écran de chargement, fond du manifeste |
| encre | #ffffff | texte de l'écran de chargement |
| froid | #9cc0ff | halo de la sphère (icône, chargement) |
| froid vif | #4d8dff | **graine Material** (colorSchemeSeedInt) → boutons, sélection dans l'appli |
| violet | #5b1cff | cœur de la sphère (icône) |

Le froid porte l'outil (le studio, là où l'on travaille) ; le chaud reste réservé aux rôles.

## Typographie
- Écran de chargement : Syne (titre « Reskif Studio »), Fraunces (phrase d'accroche).
- Dans l'appli : police de FluffyChat (non modifiable sans fork).

## Écran de chargement (avant que Flutter ne prenne la main)
```
┌──────────────────────────────┐
│                              │
│            ( ◉ )             │  sphère : dégradé violet → froid, halo
│                              │
│        RESKIF  STUDIO        │  Syne, capitales espacées
│   le virtuel au service      │  Fraunces italique, 60 % d'opacité
│         du réel              │
│                              │
└──────────────────────────────┘
```

## Icônes
Sphère seule sur fond nuit (lisible à 16 px, contrairement au logo texte).

## Principes
1. Ne jamais modifier le code de FluffyChat dans ce dépôt (mises à jour simples, conformité AGPL : lien vers les sources).
2. Tout ce qui est Reskif vit dans `brand/` et est injecté par `build.sh`.
3. Le serveur est imposé (reskif.org) : pas de choix de serveur pour les membres.

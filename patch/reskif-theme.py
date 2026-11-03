#!/usr/bin/env python3
"""Habillage Reskif appliqué au code de FluffyChat avant compilation.
Usage (depuis la racine du dépôt) : python3 patch/reskif-theme.py <dossier fluffychat>
                                    python3 patch/reskif-theme.py --check   (contrastes seulement)

Design system « sphère » (reskif-commons@cd09ebf) : un seul univers, la nuit.
La palette est définie UNE fois ci-dessous ; le contrôle de contraste (WCAG 2.x) arrête la compilation
si un couple texte/fond utilisé par l'appli passe sous son seuil. Plan de design : content/design.md.
"""
import colorsys, pathlib, re, shutil, sys, urllib.request

here = pathlib.Path(__file__).resolve().parent.parent  # racine du dépôt studio-reskif

# ---------------------------------------------------------------------------------------------
# 0. Palette (nuit). Chaud/froid restent réservés aux rôles : l'appli travaille en froid + violet.
# ---------------------------------------------------------------------------------------------
P = {
    # fonds
    "surface": "010101",                 # nuit
    "surfaceContainerLowest": "010101",
    "surfaceContainerLow": "07050E",     # verre rgba(10,4,24,.55) posé sur la nuit
    "surfaceContainer": "0E0B1A",
    "surfaceContainerHigh": "171329",    # bulles des autres, dialogues
    "surfaceContainerHighest": "221C3A",
    "surfaceDim": "010101",
    "surfaceBright": "2A2444",
    # encres
    "onSurface": "FFFFFF",
    "onSurfaceVariant": "B9B5C8",        # « muted » éclairci pour rester lisible sur tous les fonds
    "outline": "A6A1B8",                 # FluffyChat s'en sert comme couleur de TEXTE (aperçu des messages)
    "outlineVariant": "3A3550",          # séparateurs (décoratif)
    # froid (l'outil)
    "primary": "9CC0FF", "onPrimary": "010101",
    "primaryContainer": "1D3260", "onPrimaryContainer": "FFFFFF",   # mes bulles (bout froid du dégradé)
    "secondary": "C3D6FF", "onSecondary": "010101",
    "secondaryContainer": "1E2A4A", "onSecondaryContainer": "FFFFFF",  # salon actif, indicateurs
    # violet (cœur de la sphère)
    "tertiary": "C4B5FF", "onTertiary": "010101",
    "tertiaryContainer": "2B2060", "onTertiaryContainer": "E4DCFF",  # liens dans mes bulles
    # erreurs
    "error": "FF8F85", "onError": "010101",
    "errorContainer": "4D1512", "onErrorContainer": "FFDAD5",
    # inversé (snackbars, infobulles)
    "inverseSurface": "F2F0F7", "onInverseSurface": "010101", "inversePrimary": "2D5BD8",
}

def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def blend(fg, bg, alpha):  # fg posé sur bg avec l'opacité alpha
    f = [int(fg[i:i+2], 16) for i in (0, 2, 4)]; b = [int(bg[i:i+2], 16) for i in (0, 2, 4)]
    return "".join(f"{round(x * alpha + y * (1 - alpha)):02X}" for x, y in zip(f, b))

def secondary_bubble():  # = BubbleColorTheme.secondaryBubbleColor (tertiaryContainer, saturation 0,5)
    h = P["tertiaryContainer"]; r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    hh, l, s = colorsys.rgb_to_hls(r, g, b); r, g, b = colorsys.hls_to_rgb(hh, l, 0.5)
    return "".join(f"{round(x * 255):02X}" for x in (r, g, b))

SB = secondary_bubble()
SEL = blend(P["primary"], P["surfaceContainerHigh"], 0x55 / 255)   # sélection de texte
CHECKS = []  # (texte, fond, seuil, où)
for bg in ("surface", "surfaceContainerLow", "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest", "secondaryContainer"):
    CHECKS += [(P["onSurface"], P[bg], 7, f"texte / {bg}"),
               (P["onSurfaceVariant"], P[bg], 4.5, f"texte secondaire / {bg}"),
               (P["outline"], P[bg], 4.5, f"aperçu de message (outline) / {bg}"),
               (P["primary"], P[bg], 4.5, f"lien, accent / {bg}")]
CHECKS += [
    (P["onPrimary"], P["primary"], 7, "bouton plein froid, pastille non-lus"),
    (P["onPrimaryContainer"], P["primaryContainer"], 7, "mes messages (bout froid)"),
    (P["onPrimaryContainer"], SB, 7, "mes messages (bout violet du dégradé)"),
    (P["onTertiaryContainer"], P["primaryContainer"], 4.5, "lien dans mes messages (froid)"),
    (P["onTertiaryContainer"], SB, 4.5, "lien dans mes messages (violet)"),
    (P["onSurface"], P["errorContainer"], 7, "mon message en échec d'envoi"),
    (P["onSecondaryContainer"], P["secondaryContainer"], 7, "salon actif"),
    (P["onTertiaryContainer"], P["tertiaryContainer"], 7, "conteneur violet"),
    (P["onError"], P["error"], 4.5, "pastille mention"),
    (P["error"], P["surface"], 4.5, "texte d'erreur"),
    (P["onErrorContainer"], P["errorContainer"], 7, "bandeau d'erreur"),
    (P["onInverseSurface"], P["inverseSurface"], 7, "snackbar, infobulle"),
    (P["surface"], "FFFFFF", 7, "bouton pilule pleine (nuit sur blanc)"),
    (P["onSurface"], SEL, 4.5, "texte sélectionné"),
    (P["outline"], P["surface"], 3, "bordure de champ, bouton contour (composant)"),
]
fails = [f"  {ratio(a, b):5.2f} < {t} : {w} (#{a} sur #{b})" for a, b, t, w in CHECKS if ratio(a, b) < t]
print(f"contraste : {len(CHECKS) - len(fails)}/{len(CHECKS)} couples conformes "
      f"(min {min(ratio(a, b) for a, b, _, _ in CHECKS):.2f}:1)")
if fails:
    raise SystemExit("contraste insuffisant :\n" + "\n".join(fails))
if "--check" in sys.argv:
    for a, b, t, w in CHECKS: print(f"{ratio(a, b):6.2f}  (seuil {t})  {w}")
    sys.exit(0)

import yaml
root = pathlib.Path(sys.argv[1])

# ---------------------------------------------------------------------------------------------
# 1. Polices : instances STATIQUES par graisse. Le fichier variable de Fraunces vaut 900 par défaut
#    et Flutter ne relie pas toujours fontWeight à l'axe wght (texte trop gras ou trop maigre).
# ---------------------------------------------------------------------------------------------
fonts = root / "assets/fonts/reskif"; fonts.mkdir(parents=True, exist_ok=True)
for old in fonts.glob("*.ttf"): old.unlink()
FAMILIES = {"Fraunces": "Fraunces:wght@400;500;600", "Syne": "Syne:wght@500;600;700;800"}
decl = []
for fam, q in FAMILIES.items():
    req = urllib.request.Request(f"https://fonts.googleapis.com/css2?family={q}", headers={"User-Agent": "Mozilla/4.0"})
    css = urllib.request.urlopen(req).read().decode()
    entries = []
    for w, url in re.findall(r"font-weight:\s*(\d+);\s*src:\s*url\((https://[^)]+\.ttf)\)", css):
        dst = fonts / f"{fam}-{w}.ttf"; urllib.request.urlretrieve(url, dst)
        head = dst.read_bytes()[:12 + 16 * 40]
        assert b"fvar" not in head, f"{dst.name} n'est pas une instance statique"
        entries.append({"asset": f"assets/fonts/reskif/{dst.name}", "weight": int(w)})
    assert len(entries) == q.count(";") + 1, f"{fam} : graisses manquantes ({len(entries)})"
    decl.append({"family": fam, "fonts": entries})
pub = root / "pubspec.yaml"; spec = yaml.safe_load(pub.read_text())
fl = spec.setdefault("flutter", {}); fl.setdefault("fonts", [])
fl["fonts"] = [f for f in (fl["fonts"] or []) if f.get("family") not in FAMILIES] + decl
pub.write_text(yaml.safe_dump(spec, sort_keys=False, allow_unicode=True))
print("polices : " + ", ".join(f"{d['family']} {[e['weight'] for e in d['fonts']]}" for d in decl))

# ---------------------------------------------------------------------------------------------
# 2. Thème : lib/config/themes.dart remplacé (même API publique que FluffyChat, vérifiée avant).
# ---------------------------------------------------------------------------------------------
t = root / "lib/config/themes.dart"; up = t.read_text()
API = ["static const double columnWidth", "static const double maxTimelineWidth", "static const double navRailWidth",
       "static bool isColumnModeByWidth", "static bool isColumnMode(", "static bool isThreeColumnMode",
       "static LinearGradient backgroundGradient", "static const Duration animationDuration",
       "static const Curve animationCurve", "static ThemeData buildTheme(", "extension BubbleColorTheme on ThemeData",
       "Color get bubbleColor", "Color get onBubbleColor", "Color get secondaryBubbleColor"]
missing = [a for a in API if a not in up]
assert not missing, f"themes.dart de FluffyChat a changé, adapter le patch : {missing}"
cs = "\n".join(f"    {k}: Color(0xFF{v})," for k, v in P.items())
dart = (here / "patch/themes.dart.in").read_text().replace("    /*PALETTE*/", cs)
assert "/*PALETTE*/" not in dart
t.write_text(dart)
print("thème : lib/config/themes.dart remplacé")

# ---------------------------------------------------------------------------------------------
# 3. Thème sombre par défaut, et choix clair/sombre/couleur retiré des paramètres (sans effet).
# ---------------------------------------------------------------------------------------------
n = 0
for f in (root / "lib").rglob("*.dart"):
    c = f.read_text()
    if "ThemeMode.system" in c and ("themeMode" in c or "theme_mode" in c):
        c2 = re.sub(r"(themeMode[^;\n]*?)ThemeMode\.system", r"\1ThemeMode.dark", c)
        c2 = c2.replace("?? ThemeMode.system", "?? ThemeMode.dark")
        if c2 != c: f.write_text(c2); n += 1
print(f"mode sombre par défaut dans {n} fichier(s)")
f = root / "lib/pages/settings_style/settings_style_view.dart"; c = f.read_text()
a = c.find("child: SegmentedButton<ThemeMode>("); a = c.rfind("Padding(", 0, a)
d = c.find("DynamicColorBuilder(", a); e = c.find("Divider(color: theme.dividerColor),", d)
assert 0 < a < d < e, "settings_style_view : bloc thème/couleur introuvable"
c = c[:a] + "// Reskif : pas de choix clair/sombre ni de couleur (un seul univers, la nuit).\n" + c[e + len("Divider(color: theme.dividerColor),"):]
f.write_text(c); print("paramètres : choix du thème et de la couleur retirés")

# ---------------------------------------------------------------------------------------------
# 4. Couleurs dérivées et cas particuliers
# ---------------------------------------------------------------------------------------------
# Avatars, initiales, noms d'espaces : palette générée en version SOMBRE (le « primary » clair est illisible sur la nuit).
f = root / "lib/utils/string_color.dart"; c = f.read_text()
old = "ColorScheme.fromSeed(\n        seedColor: _getColorLight(0.3),"
assert old in c, "string_color.dart : fromSeed introuvable"
f.write_text(c.replace(old, "ColorScheme.fromSeed(\n        brightness: Brightness.dark,\n        seedColor: _getColorLight(0.3),", 1))
# Mon message en échec : redAccent (blanc dessus = 3,3:1) remplacé par errorContainer.
f = root / "lib/pages/chat/events/message.dart"; c = f.read_text()
old = "          ? Colors.redAccent\n          : theme.bubbleColor;"
assert old in c, "message.dart : couleur d'échec introuvable"
f.write_text(c.replace(old, "          ? theme.colorScheme.errorContainer\n          : theme.bubbleColor;", 1))
print("avatars en palette sombre, message en échec lisible")

# ---------------------------------------------------------------------------------------------
# 5. Logo de FluffyChat remplacé par le logo carré Reskif (et sa version masque pour les filigranes).
# ---------------------------------------------------------------------------------------------
for name in ("logo_mini.png", "logo_mono_mini.png"):
    shutil.copy(here / "brand/app" / name, root / "assets/logo/mini" / name)
print("logos remplacés")

# ---------------------------------------------------------------------------------------------
# 6. Pas de panneau « sauvegarde des clés » après la connexion : directement aux salons (non chiffrés).
# ---------------------------------------------------------------------------------------------
skip = 0
for rel in ["lib/pages/intro/intro_page_presenter.dart", "lib/pages/login/login.dart", "lib/widgets/matrix.dart", "lib/utils/sign_in_flows/check_homeserver.dart"]:
    f = root / rel
    if not f.exists(): continue
    c = f.read_text(); c2 = c.replace("go('/backup')", "go('/rooms')")
    if c2 != c: f.write_text(c2); skip += c.count("go('/backup')")
assert skip >= 3, f"redirection /backup introuvable ({skip}) : vérifier la version de FluffyChat"
print(f"panneau de sauvegarde ignoré à {skip} endroit(s)")

# ---------------------------------------------------------------------------------------------
# 7. ?autologin=1 (posé par l'écran d'accueil « Se connecter ») : connexion directe.
# ---------------------------------------------------------------------------------------------
f = root / "lib/pages/intro/intro_page_presenter.dart"; c = f.read_text()
old = """    if (homeserverUrl == null || session == null) {
      setState(() {
        isLoading = false;
      });
"""
assert old in c, "intro_page_presenter : bloc attendu introuvable"
c = c.replace(old, old + """      if (Uri.base.queryParameters['autologin'] == '1') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _login();
        });
      }
""", 1)
f.write_text(c)
print("connexion automatique depuis l'écran d'accueil : ok")

#!/usr/bin/env python3
"""Habillage Reskif appliqué au code de FluffyChat avant compilation (thème nuit, Syne + Fraunces).
Usage : python3 reskif-theme.py <dossier fluffychat>"""
import pathlib, re, sys, urllib.request, yaml
root = pathlib.Path(sys.argv[1])
# 1. Polices
fonts = root / "assets/fonts/reskif"; fonts.mkdir(parents=True, exist_ok=True)
SRC = {
  "Fraunces.ttf": "https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf",
  "Syne.ttf": "https://github.com/google/fonts/raw/main/ofl/syne/Syne%5Bwght%5D.ttf",
}
for name, url in SRC.items():
    urllib.request.urlretrieve(url, fonts / name)
pub = root / "pubspec.yaml"; spec = yaml.safe_load(pub.read_text())
fl = spec.setdefault("flutter", {}); fl.setdefault("fonts", [])
fl["fonts"] = [f for f in fl["fonts"] if f.get("family") not in ("Fraunces", "Syne")]
fl["fonts"] += [{"family": "Fraunces", "fonts": [{"asset": "assets/fonts/reskif/Fraunces.ttf"}]},
                {"family": "Syne", "fonts": [{"asset": "assets/fonts/reskif/Syne.ttf"}]}]
pub.write_text(yaml.safe_dump(spec, sort_keys=False, allow_unicode=True))
# 2. Thème
t = root / "lib/config/themes.dart"; s = t.read_text()
s = s.replace("    final colorScheme = ColorScheme.fromSeed(", "    final baseScheme = ColorScheme.fromSeed(", 1)
s = s.replace("      dynamicSchemeVariant: DynamicSchemeVariant.rainbow,\n    );",
"""      dynamicSchemeVariant: DynamicSchemeVariant.rainbow,
    );
    // Reskif « sphère » : fond nuit, encre blanche, froid #9cc0ff, violet #5b1cff
    final colorScheme = brightness == Brightness.dark
        ? baseScheme.copyWith(
            surface: const Color(0xFF010101),
            surfaceDim: const Color(0xFF010101),
            surfaceBright: const Color(0xFF1A1A1E),
            surfaceContainerLowest: const Color(0xFF010101),
            surfaceContainerLow: const Color(0xFF08080A),
            surfaceContainer: const Color(0xFF0E0E11),
            surfaceContainerHigh: const Color(0xFF151518),
            surfaceContainerHighest: const Color(0xFF1C1C21),
            onSurface: const Color(0xFFFFFFFF),
            primary: const Color(0xFF9CC0FF),
            onPrimary: const Color(0xFF010101),
            primaryContainer: const Color(0xFF1D2B4D),
            onPrimaryContainer: const Color(0xFFFFFFFF),
            secondary: const Color(0xFF9CC0FF),
            secondaryContainer: const Color(0xFFFFFFFF),
            onSecondaryContainer: const Color(0xFF010101),
            tertiary: const Color(0xFFFFB08A),
            tertiaryContainer: const Color(0xFF2B1D4D),
            onTertiaryContainer: const Color(0xFFFFFFFF),
          )
        : baseScheme;""", 1)
s = s.replace("      useMaterial3: true,\n", """      useMaterial3: true,
      fontFamily: 'Fraunces',
      textTheme: Typography.material2021(platform: TargetPlatform.android).white.apply(fontFamily: 'Fraunces').copyWith(
        displayLarge: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        displayMedium: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        displaySmall: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        headlineLarge: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        headlineMedium: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        headlineSmall: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        titleLarge: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w700),
        titleMedium: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w600),
        labelLarge: const TextStyle(fontFamily: 'Syne', fontWeight: FontWeight.w600),
      ).apply(bodyColor: brightness == Brightness.dark ? Colors.white : Colors.black, displayColor: brightness == Brightness.dark ? Colors.white : Colors.black),
""", 1)
# boutons en pilule
s = s.replace("          padding: const EdgeInsets.all(16),\n          textStyle: const TextStyle(fontSize: 16),",
              "          padding: const EdgeInsets.all(16),\n          shape: const StadiumBorder(),\n          textStyle: const TextStyle(fontSize: 16, fontFamily: 'Syne', fontWeight: FontWeight.w700),", 1)
assert "baseScheme.copyWith" in s and "fontFamily: 'Fraunces'" in s, "patch thème non appliqué"
t.write_text(s)
# 3. Thème sombre par défaut
n = 0
for f in (root / "lib").rglob("*.dart"):
    c = f.read_text()
    if "ThemeMode.system" in c and ("themeMode" in c or "theme_mode" in c):
        c2 = re.sub(r"(themeMode[^;\n]*?)ThemeMode\.system", r"\1ThemeMode.dark", c)
        c2 = c2.replace("?? ThemeMode.system", "?? ThemeMode.dark")
        if c2 != c: f.write_text(c2); n += 1
# 4. Pas de panneau « sauvegarde des clés / chiffrement » après la connexion : on va directement aux salons.
#    (Les salons de projet ne sont pas chiffrés ; la sauvegarde reste accessible dans Paramètres.)
skip = 0
for rel in ["lib/pages/intro/intro_page_presenter.dart", "lib/pages/login/login.dart", "lib/widgets/matrix.dart", "lib/utils/sign_in_flows/check_homeserver.dart"]:
    f = root / rel
    if not f.exists(): continue
    c = f.read_text(); c2 = c.replace("go('/backup')", "go('/rooms')")
    if c2 != c: f.write_text(c2); skip += c.count("go('/backup')")
assert skip >= 3, f"redirection /backup introuvable ({skip}) : vérifier la version de FluffyChat"
print(f"panneau de sauvegarde ignoré à {skip} endroit(s)")
print(f"thème Reskif appliqué ; mode sombre par défaut dans {n} fichier(s)")

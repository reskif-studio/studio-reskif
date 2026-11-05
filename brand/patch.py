import json, re, sys
d, v = sys.argv[1], sys.argv[2]
p = f"{d}/index.html"; h = open(p, encoding="utf-8").read()
h = h.replace('<html>', '<html lang="fr">', 1)
h = h.replace('<base href="/web/">', '<base href="/">')
h = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Reskif Studio : la messagerie des projets Reskif.">', h)
h = h.replace('content="FluffyChat"', 'content="Reskif Studio"').replace('<title>FluffyChat</title>', '<title>Reskif Studio</title>')
h = h.replace('content="black"', 'content="black-translucent"')
splash = open("brand/splash-head.html", encoding="utf-8").read()
h = h.replace('</head>', splash + '\n  <meta name="theme-color" content="#010101">\n</head>', 1)
body = ('<div id="rk-splash" aria-hidden="true"><div class="s"></div><h1>Reskif Studio</h1><p>le virtuel au service du réel</p></div>\n'
        f'  <!-- Reskif Studio est construit sur FluffyChat {v} (AGPL-3.0), sources : https://github.com/krille-chan/fluffychat -->')
h = h.replace('<body>', '<body>\n  ' + body, 1)
# Démarrage de l'appli différé : splash.js décide (connecté : tout de suite ; sinon tout de suite en ?autologin=1, sous la sphère)
i = h.find("_flutter.loader.load(")
if i < 0: raise SystemExit("bootstrap Flutter introuvable dans index.html")
# La vraie balise est celle qui ouvre le bloc « window.addEventListener('load' » : flutter.js, inliné juste avant,
# contient lui-même la chaîne "<script>" dans un message d'erreur (bug du 03/11 : le site ne démarrait plus).
mm = list(re.finditer(r"<script>(?=\s*window\.addEventListener\('load')", h[:i]))
if not mm: raise SystemExit("balise <script> du démarrage Flutter introuvable")
a = mm[-1].start(); b = h.find("</script>", i)
inner = h[a+len("<script>"):b]
# Démarrage différé : si la page est déjà chargée (clic sur « Se connecter »), l'événement load est passé → lancer tout de suite.
LOAD = "window.addEventListener('load', function (ev) {"
if LOAD not in inner: raise SystemExit("écouteur load introuvable")
inner = inner.replace(LOAD, "(function (f) { if (document.readyState === 'complete') f(); else window.addEventListener('load', f); })(function (ev) {", 1)
h = h[:a] + "<script>window.__rkBoot=function(){" + inner + "};</script>\n  <script src=\"/sphere.js\"></script>\n  <script src=\"/splash.js\"></script>" + h[b+len("</script>"):]
open(p, "w", encoding="utf-8").write(h)
m = json.load(open(f"{d}/manifest.json"))
m.update(name="Reskif Studio", short_name="Reskif", background_color="#010101", theme_color="#010101",
         description="La messagerie des projets Reskif", lang="fr", start_url="/")
json.dump(m, open(f"{d}/manifest.json", "w"), ensure_ascii=False, indent=2)

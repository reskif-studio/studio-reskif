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
# Démarrage de l'appli différé : splash.js décide (membre connecté -> tout de suite ; sinon après « Se connecter »)
i = h.find("_flutter.loader.load(")
if i < 0: raise SystemExit("bootstrap Flutter introuvable dans index.html")
a = h.rfind("<script>", 0, i); b = h.find("</script>", i)
h = h[:a] + "<script>window.__rkBoot=function(){" + h[a+len("<script>"):b] + "};</script>\n  <script src=\"/splash.js\"></script>" + h[b+len("</script>"):]
open(p, "w", encoding="utf-8").write(h)
m = json.load(open(f"{d}/manifest.json"))
m.update(name="Reskif Studio", short_name="Reskif", background_color="#010101", theme_color="#010101",
         description="La messagerie des projets Reskif", lang="fr", start_url="/")
json.dump(m, open(f"{d}/manifest.json", "w"), ensure_ascii=False, indent=2)

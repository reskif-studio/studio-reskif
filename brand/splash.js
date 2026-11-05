/* Reskif Studio : écran d'attente (sphère organique) devant l'appli.
   Règle : on ne montre jamais l'interface de FluffyChat avant la liste des salons.
   - Pas connecté : l'appli démarre en ?autologin=1 sous la sphère et part tout de suite vers id.reskif.org
     (sphère + adresse e-mail + « Se connecter »). La sphère reste jusqu'au changement de page.
   - Retour de connexion (?code=…) ou déjà connecté : la sphère reste jusqu'à ce que les salons soient affichés.
   Nécessite /sphere.js (window.RkSphere). */
(function () {
  var KEY = "flutter.im.fluffychat.store.clients";
  var hasClient = function () { try { var v = localStorage.getItem(KEY); return !!v && JSON.parse(v).length > 0; } catch (e) { return false; } };
  var boot = function (auto) {
    if (auto) { try { history.replaceState(null, "", "/?autologin=1#/home"); } catch (e) {} }
    if (window.__rkBoot) { var f = window.__rkBoot; window.__rkBoot = null; f(); }
  };
  var loggedIn = hasClient();
  var oidcReturn = /[?&](code|state|error)=/.test(location.href);

  var css = "#rk-home{position:fixed;inset:0;z-index:2147483000;background:#010101;color:#fff;transition:opacity .5s ease}" +
    "#rk-home canvas{position:absolute;inset:0;width:100%;height:100%;display:block}" +
    "#rk-home .hero{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;pointer-events:none;padding:24px;text-align:center}" +
    "#rk-home .logo{width:clamp(120px,22vmin,200px);height:auto;filter:drop-shadow(0 0 18px rgba(0,0,0,.6))}" +
    "#rk-home .st{font:300 italic clamp(15px,2.2vmin,19px)/1.4 Fraunces,Georgia,serif;color:rgba(255,255,255,.78);margin:0;text-shadow:0 0 10px rgba(0,0,0,.8);min-height:1.4em}" +
    "#rk-home.out{opacity:0;pointer-events:none}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var el = document.createElement("div"); el.id = "rk-home"; el.setAttribute("role", "status");
  el.innerHTML = '<canvas aria-hidden="true"></canvas><div class="hero"><img class="logo" src="/reskif_logo.svg" alt="Reskif" width="605" height="185">' +
    '<p class="st">' + (loggedIn || oidcReturn ? "Ouverture de vos salons…" : "Ouverture de la connexion…") + '</p></div>';
  var sphere = null;
  var mount = function () {
    (document.body || document.documentElement).appendChild(el);
    var sp = document.getElementById("rk-splash"); if (sp) sp.remove();
    if (window.RkSphere) sphere = window.RkSphere(el.querySelector("canvas"));
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  var done = false;
  var reveal = function () {
    if (done) return; done = true; el.classList.add("out");
    setTimeout(function () { el.remove(); if (sphere) sphere.stop(); }, 600);
  };

  if (loggedIn || oidcReturn) {
    boot(false);
    // On retire la sphère quand Flutter affiche les salons (hash #/rooms) et a eu le temps de dessiner.
    var since = 0;
    var iv = setInterval(function () {
      var ready = document.querySelector("flutter-view") && /^#\/rooms/.test(location.hash || "");
      if (!ready) { since = 0; return; }
      if (!since) since = Date.now();
      if (Date.now() - since > 700) { clearInterval(iv); reveal(); }
    }, 150);
    setTimeout(function () { clearInterval(iv); reveal(); }, 30000); // filet de sécurité (erreur de connexion)
    // Après une déconnexion, l'appli revient sur #/home sans recharger : on recharge pour repartir vers la connexion.
    var check = function () { if (/^#\/home\/?$/.test(location.hash || "") && !hasClient() && !/[?&](code|state)=/.test(location.href)) location.replace("/"); };
    addEventListener("hashchange", check); setInterval(check, 1500);
  } else {
    // Pas connecté : l'appli part d'elle-même vers id.reskif.org ; la sphère reste affichée jusque-là.
    boot(true);
    setTimeout(reveal, 45000); // filet de sécurité (réseau en panne)
  }
})();

/* Reskif Studio : décor d'attente (sphère + logo, brand/sphere.js RkStage) devant l'appli.
   On ne montre jamais l'interface de FluffyChat avant la liste des salons.
   - Pas connecté : l'appli démarre en ?autologin=1 sous le décor et part vers id.reskif.org, qui affiche
     le même décor au même endroit (logo à la même place, sphère réglée sur l'heure).
   - Retour de connexion ou déjà connecté : le décor reste jusqu'aux salons, puis disparaît
     par une transition de vue (View Transitions API) quand le navigateur la connaît. */
(function () {
  var KEY = "flutter.im.fluffychat.store.clients";
  var hasClient = function () { try { var v = localStorage.getItem(KEY); return !!v && JSON.parse(v).length > 0; } catch (e) { return false; } };
  var boot = function (auto) {
    if (auto) { try { history.replaceState(null, "", "/?autologin=1#/home"); } catch (e) {} }
    if (window.__rkBoot) { var f = window.__rkBoot; window.__rkBoot = null; f(); }
  };
  var loggedIn = hasClient();
  var oidcReturn = /[?&](code|state|error)=/.test(location.href);
  // Pas connecté : décor sans sphère (on part tout de suite vers id.reskif.org, où elle apparaît en fondu).
  var stage = window.RkStage({ front: true, sphere: loggedIn || oidcReturn });
  var sp = document.getElementById("rk-splash"); if (sp) sp.remove();

  var done = false;
  var reveal = function () {
    if (done) return; done = true;
    var go = function () { if (window.__rkStage) window.__rkStage.remove(); };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Le logo et la sphère sortent ensemble ; la liste des salons apparaît en fondu.
      var s = document.createElement("style");
      s.textContent = "::view-transition-old(rk-logo),::view-transition-old(rk-stage){animation:rk-out .45s ease both}@keyframes rk-out{to{opacity:0}}::view-transition-group(rk-logo),::view-transition-group(rk-stage){animation-duration:.45s}";
      document.head.appendChild(s);
      document.startViewTransition(go).finished.then(function () { s.remove(); });
    } else {
      stage.stage.style.transition = stage.logo.style.transition = "opacity .45s ease";
      stage.stage.style.opacity = stage.logo.style.opacity = "0";
      setTimeout(go, 500);
    }
  };

  if (loggedIn || oidcReturn) {
    boot(false);
    var since = 0;
    var iv = setInterval(function () {
      var ready = document.querySelector("flutter-view") && /^#\/rooms/.test(location.hash || "");
      if (!ready) { since = 0; return; }
      if (!since) since = Date.now();
      if (Date.now() - since > 700) { clearInterval(iv); reveal(); }
    }, 150);
    setTimeout(function () { clearInterval(iv); reveal(); }, 30000); // filet de sécurité (erreur de connexion)
    var check = function () { if (/^#\/home\/?$/.test(location.hash || "") && !hasClient() && !/[?&](code|state)=/.test(location.href)) location.replace("/"); };
    addEventListener("hashchange", check); setInterval(check, 1500);
  } else {
    boot(true);
    setTimeout(reveal, 45000); // filet de sécurité (réseau en panne)
  }
})();

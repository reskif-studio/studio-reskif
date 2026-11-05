/* Reskif : habillage de la page de connexion id.reskif.org (Authentik), injecté par if/flow.html.
   - Fond : sphère organique (RkSphere) plein écran.
   - Étape e-mail : seulement le logo, le champ e-mail et « Se connecter » posés sur la sphère.
   - Étape code : 6 cases, chiffres seulement, une seule vraie zone de saisie (collage, remplissage auto, mobile),
     envoi automatique au 6e chiffre.
   Authentik dessine dans des shadow DOM : on parcourt les racines et on y injecte nos styles. */
(function () {
  // Page de connexion ouverte sans venir de Reskif Studio (rechargée, mise en favori, ouverte pendant un redémarrage) :
  // sans les paramètres OIDC, la connexion n'aurait nulle part où revenir → on repart de studio.reskif.org.
  if (/^\/if\/flow\/reskif-email-login\/?$/.test(location.pathname) && !/[?&](client_id|next)=/.test(location.search)) {
    location.replace("https://studio.reskif.org/"); return;
  }
  var STYLE = [
    ".rk-sr{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;margin:-1px!important;padding:0!important;border:0!important}",
    ".rk-hide{display:none!important}",
    "ak-locale-select{display:none!important}", /* site en français seulement */
    /* PatternFly peint un fond clair en ::before de .pf-c-login sur petit écran : il masquait la sphère */
    ".pf-c-login::before,.pf-c-login::after{display:none!important;background:none!important}",
    /* panneau transparent pour l'étape e-mail */
    "main.rk-bare{background:transparent!important;border:0!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;max-width:440px!important;margin:0 auto!important}",
    /* logo d'Authentik remplacé par celui du décor commun (#rk-logo, même place que sur studio.reskif.org) */
    ".pf-c-login__main .pf-c-brand,.pf-c-login__main-header.pf-c-brand{display:none!important}",
    ".pf-c-login{align-content:start!important;align-items:start!important;justify-content:center!important;padding-top:var(--rk-content-top,180px)!important;min-height:100vh;box-sizing:border-box}",
    ".pf-c-login__container{padding-top:0!important;align-content:start!important}",
    /* champ e-mail sur la sphère : verre sombre opaque pour le contraste */
    "input.pf-c-form-control.rk-email{background:rgba(1,1,1,.78)!important;border:1px solid rgba(255,255,255,.35)!important;border-radius:999px!important;text-align:center;font-size:17px!important;padding:15px 20px!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}",
    "input.pf-c-form-control.rk-email::placeholder{color:rgba(255,255,255,.62)!important;font-style:italic}",
    "button.pf-c-button.rk-go{padding:16px 22px!important;font-size:13px!important;box-shadow:0 0 30px rgba(0,0,0,.55)}",
    "form.rk-email-form{gap:14px!important}",
    /* code à 6 cases, grandes et centrées */
    "ak-form-static{display:none!important}",
    /* étape d'inscription (pseudo + nom) : libellés petits, sur une ligne */
    "label.rk-fit,label.rk-fit .pf-c-form__label-text{white-space:nowrap!important;letter-spacing:.06em!important;font-size:11px!important}",
    "label.rk-fit{display:block!important;overflow:hidden;margin-bottom:6px!important}",
    "label.rk-fit .pf-c-form__label-required{display:none!important}",
    "form.rk-reg{gap:16px!important}",
    "form.rk-reg .pf-c-form__group{gap:0!important}", /* ligne « avatar, pseudo, Pas vous ? » */
    "fieldset.rk-code-group{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:18px!important}",
    ".rk-otp-wrap{position:relative;width:100%;margin:8px 0 0}",
    ".rk-otp{display:flex;gap:clamp(8px,2.4vw,14px);justify-content:center;width:100%}",
    ".rk-otp span{flex:1 1 0;max-width:64px;min-width:0;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.4);border-radius:14px;background:rgba(1,1,1,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:700 clamp(26px,7.5vw,36px)/1 Syne,'Helvetica Neue',Arial,sans-serif;color:#fff;transition:border-color .15s}",
    ".pf-c-form__helper-text.rk-sent{text-align:center!important;font:300 italic clamp(17px,4.6vw,20px)/1.45 Fraunces,Georgia,serif!important;color:#fff!important;text-shadow:0 0 12px rgba(0,0,0,.85);margin:0!important}",
    ".rk-otp span.on{border-color:#fff;outline:2px solid #ffb08a;outline-offset:2px}",
    ".rk-otp span.full{border-color:rgba(255,255,255,.7)}",
    "input.pf-c-form-control.rk-code,input.rk-code{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;font-size:16px!important;color:transparent!important;caret-color:transparent!important;background:transparent!important;border:0!important;outline:0!important;z-index:2;cursor:text;letter-spacing:0;padding:0!important}",
    ".rk-otp-wrap.err .rk-otp span{border-color:#ff8f85}",
    "@media (prefers-reduced-motion:reduce){.rk-otp span{transition:none}}"
  ].join("\n");

  function roots(start) {
    var out = [], stack = [start];
    while (stack.length) {
      var r = stack.pop(); out.push(r);
      var all = r.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) if (all[i].shadowRoot) stack.push(all[i].shadowRoot);
    }
    return out;
  }
  function style(root) {
    if (root === document || root.getElementById && root.getElementById("rk-style")) return;
    if (root.querySelector && root.querySelector("style.rk-style")) return;
    var s = document.createElement("style"); s.className = "rk-style"; s.textContent = STYLE;
    root.appendChild(s);
  }

  function setupCode(input) {
    if (input.dataset.rk) return;
    input.dataset.rk = "1";
    input.classList.add("rk-code");
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("autocomplete", "one-time-code");
    input.setAttribute("pattern", "[0-9]*");
    input.setAttribute("maxlength", "6");
    input.setAttribute("aria-label", "Code à 6 chiffres reçu par e-mail");
    input.type = "text";
    var wrap = document.createElement("div"); wrap.className = "rk-otp-wrap";
    var row = document.createElement("div"); row.className = "rk-otp"; row.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 6; i++) row.appendChild(document.createElement("span"));
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(row); wrap.appendChild(input);
    var sent = "";
    var paint = function () {
      var v = input.value, cells = row.children, focus = input.matches(":focus");
      for (var i = 0; i < 6; i++) {
        cells[i].textContent = v[i] || "";
        cells[i].className = (v[i] ? "full" : "") + (focus && i === Math.min(v.length, 5) ? " on" : "");
      }
    };
    var clean = function () {
      var v = input.value.replace(/\D/g, "").slice(0, 6);
      if (v !== input.value) input.value = v;
      wrap.classList.remove("err"); paint();
      if (v.length === 6 && v !== sent) {
        sent = v;
        var form = input.form || input.closest("form");
        if (form) setTimeout(function () { if (window.__rkStage) window.__rkStage.dim(true); form.requestSubmit ? form.requestSubmit() : form.submit(); }, 120);
      }
      if (v.length < 6) sent = "";
    };
    input.addEventListener("input", clean);
    input.addEventListener("focus", paint); input.addEventListener("blur", paint);
    input.addEventListener("keydown", function (e) {
      if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
    });
    clean();
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
  }

  function scan() {
    var all = roots(document);
    var email = null, code = null, main = null;
    for (var i = 0; i < all.length; i++) {
      var r = all[i]; style(r);
      email = email || r.querySelector("input[name=email]");
      code = code || r.querySelector("input[name=code]");
      main = main || r.querySelector("main.pf-c-login__main");
      var err = r.querySelector(".pf-c-form__helper-text.pf-m-error, .pf-m-error");
      if (err && code) { var w = code.closest(".rk-otp-wrap"); if (w) w.classList.add("err"); if (window.__rkStage) window.__rkStage.dim(false); }
    }
    if (main) main.classList.add("rk-bare");
    if (email && !email.dataset.rk) {
      email.dataset.rk = "1";
      email.classList.add("rk-email");
      email.placeholder = "votre adresse e-mail";
      email.setAttribute("aria-label", "Adresse e-mail");
      email.setAttribute("autocomplete", "email");
    }
    if (email) {
      var form = email.form || email.closest("form");
      if (form) form.classList.add("rk-email-form");
      var root = email.getRootNode();
      var lab = root.querySelector("label[for='" + email.id + "']") || (email.closest(".pf-c-form__group") || {}).querySelector && email.closest(".pf-c-form__group").querySelector("label");
      if (lab) lab.classList.add("rk-sr");
      var btn = form && form.querySelector("button[type=submit]");
      if (btn) { btn.classList.add("rk-go"); if (btn.textContent.trim() !== "Se connecter") btn.textContent = "Se connecter"; }
      // titre de la carte (« Connexion à Reskif Studio ») : gardé pour les lecteurs d'écran seulement
      for (var j = 0; j < all.length; j++) { var h = all[j].querySelector("h1.pf-c-title"); if (h) h.classList.add("rk-sr"); }
    } else {
      for (var k = 0; k < all.length; k++) { var h2 = all[k].querySelector("h1.pf-c-title.rk-sr"); if (h2) h2.classList.remove("rk-sr"); }
    }
    if (email && !code) markReady(email);
    // Étape d'inscription (nouveau compte) : pseudo + nom affiché
    var nameIn = null;
    for (var ni = 0; ni < all.length && !nameIn; ni++) nameIn = all[ni].querySelector("form input[name=name]");
    if (nameIn && !code && !email) setupRegister(nameIn, all);
    if (code) {
      setupCode(code);
      var croot = code.getRootNode(), cform = code.form || code.closest("form");
      var grp = code.closest("fieldset") || code.closest(".pf-c-form__group"); if (grp) grp.classList.add("rk-code-group");
      // Texte « code envoyé » (Authentik, FR ou EN) : réécrit, centré, plus grand, sous les cases
      // Texte « code envoyé » d'Authentik (étape de validation ou de première configuration, FR ou EN) :
      // l'original est masqué, on affiche le nôtre, centré, au-dessus des cases.
      var w2 = code.closest(".rk-otp-wrap");
      if (w2 && !croot.querySelector(".rk-sent")) {
        var cands = croot.querySelectorAll(".pf-c-form__helper-text:not(.pf-m-error), p, .pf-c-form__group-text, div"), help = null;
        for (var hc = 0; hc < cands.length; hc++) {
          var tx = cands[hc].textContent;
          if (cands[hc].children.length === 0 && tx.length < 300 && /(envoy|sent)/i.test(tx) && /(code|token|jeton)/i.test(tx)) { help = cands[hc]; break; }
        }
        var m = help && /(\S+@\S+)/.exec(help.textContent);
        var mine = document.createElement("div"); mine.className = "pf-c-form__helper-text rk-sent";
        mine.textContent = "Un code à 6 chiffres vient d'être envoyé" + (m ? " à " + m[1].replace(/[.,]$/, "") : " à votre adresse e-mail") + ".";
        w2.parentNode.insertBefore(mine, w2);
        if (help) help.classList.add("rk-hide");
      }
      var cb = cform && cform.querySelector("button[type=submit]");
      if (cb && cb.textContent.trim() !== "Valider") cb.textContent = "Valider";
      for (var q = 0; q < all.length; q++) { var t = all[q].querySelector("h1.pf-c-title"); if (t) t.classList.add("rk-sr"); }
      markReady(code);
      var cr = code.getRootNode(), cl = cr.querySelector("label[for='" + code.id + "']");
      if (cl) cl.classList.add("rk-sr");
    }
  }

  // Hôte de l'étape (enfant direct de <main>) qui contient l'élément : seul lui est rendu visible (.rk-ok, voir CSS de marque).
  function stageHost(node) {
    var n = node;
    while (n) {
      var p = n.parentElement || (n.parentNode && n.parentNode.host) || (n.getRootNode && n.getRootNode().host);
      if (p && p.tagName === "MAIN") return n;
      n = n.parentElement || (n.getRootNode && n.getRootNode() !== document ? n.getRootNode().host : null);
    }
    return null;
  }
  function markReady(input) { var h = stageHost(input); if (h && !h.classList.contains("rk-ok")) h.classList.add("rk-ok"); }

  // Passage e-mail → code : transition de vue (View Transitions API). Le navigateur fige l'écran e-mail,
  // attend que l'étape code soit habillée, puis fond l'un dans l'autre ; logo et sphère ne bougent pas.
  function transitionToNext() {
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches || transitionToNext.on) return;
    transitionToNext.on = true;
    var t0 = Date.now();
    document.startViewTransition(function () {
      return new Promise(function (res) {
        (function wait() {
          var all = roots(document), ready = false;
          for (var i = 0; i < all.length; i++) {
            var c = all[i].querySelector("input[name=code]"), e = all[i].querySelector(".pf-m-error");
            var rg = all[i].querySelector("form.rk-reg");
            if ((c && c.dataset.rk) || e || rg) ready = true;
          }
          if (ready || Date.now() - t0 > 3500) { transitionToNext.on = false; res(); } else setTimeout(wait, 40);
        })();
      });
    });
  }

  function fitLabel(lab) {
    lab.classList.add("rk-fit");
    var size = 11;
    lab.style.fontSize = size + "px";
    while (lab.scrollWidth > lab.clientWidth + 1 && size > 8) { size -= 0.5; lab.style.setProperty("font-size", size + "px", "important"); var t = lab.querySelector(".pf-c-form__label-text"); if (t) t.style.setProperty("font-size", size + "px", "important"); }
  }
  function setupRegister(nameIn, all) {
    var form = nameIn.form || nameIn.closest("form"), root = nameIn.getRootNode();
    if (!form) return;
    form.classList.add("rk-reg");
    var labs = form.querySelectorAll("label.pf-c-form__label");
    for (var i = 0; i < labs.length; i++) { labs[i].classList.remove("rk-sr"); fitLabel(labs[i]); }
    var btn = form.querySelector("button[type=submit]");
    if (btn) { btn.classList.add("rk-go"); if (btn.textContent.trim() !== "S'inscrire") btn.textContent = "S'inscrire"; }
    for (var q = 0; q < all.length; q++) { var t = all[q].querySelector("h1.pf-c-title"); if (t) t.classList.add("rk-sr"); }
    markReady(nameIn);
  }

  function start() {
    var s = document.createElement("style");
    s.textContent = "ak-drawer,ak-message-container{position:relative;z-index:1}";
    document.head.appendChild(s);
    if (window.RkStage) window.RkStage();
    document.addEventListener("click", function (e) {
      var path = e.composedPath ? e.composedPath() : [];
      for (var i = 0; i < path.length; i++) if (path[i].classList && path[i].classList.contains("rk-go")) { transitionToNext(); break; }
    }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var t = e.composedPath ? e.composedPath()[0] : e.target;
      if (t && t.classList && t.classList.contains("rk-email") && t.value) transitionToNext();
    }, true);
    scan();
    new MutationObserver(function () { clearTimeout(start.t); start.t = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
    setInterval(scan, 80); // les changements dans les shadow DOM ne remontent pas jusqu'à body
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

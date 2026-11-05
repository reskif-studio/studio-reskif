/* Reskif : habillage de la page de connexion id.reskif.org (Authentik), injecté par if/flow.html.
   - Fond : sphère organique (RkSphere) plein écran.
   - Étape e-mail : seulement le logo, le champ e-mail et « Se connecter » posés sur la sphère.
   - Étape code : 6 cases, chiffres seulement, une seule vraie zone de saisie (collage, remplissage auto, mobile),
     envoi automatique au 6e chiffre.
   Authentik dessine dans des shadow DOM : on parcourt les racines et on y injecte nos styles. */
(function () {
  var STYLE = [
    ".rk-sr{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;margin:-1px!important;padding:0!important;border:0!important}",
    ".rk-hide{display:none!important}",
    "ak-locale-select{display:none!important}", /* site en français seulement */
    /* PatternFly peint un fond clair en ::before de .pf-c-login sur petit écran : il masquait la sphère */
    ".pf-c-login::before,.pf-c-login::after{display:none!important;background:none!important}",
    /* panneau transparent pour l'étape e-mail */
    "main.rk-bare{background:transparent!important;border:0!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;max-width:440px!important;margin:0 auto!important}",
    "main.rk-bare .pf-c-brand{padding-bottom:8px!important}",
    "main.rk-bare img.branding-logo{filter:drop-shadow(0 0 18px rgba(0,0,0,.6))}",
    /* champ e-mail sur la sphère : verre sombre opaque pour le contraste */
    "input.pf-c-form-control.rk-email{background:rgba(1,1,1,.78)!important;border:1px solid rgba(255,255,255,.35)!important;border-radius:999px!important;text-align:center;font-size:17px!important;padding:15px 20px!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}",
    "input.pf-c-form-control.rk-email::placeholder{color:rgba(255,255,255,.62)!important;font-style:italic}",
    "button.pf-c-button.rk-go{padding:16px 22px!important;font-size:13px!important;box-shadow:0 0 30px rgba(0,0,0,.55)}",
    "form.rk-email-form{gap:14px!important}",
    /* code à 6 cases, grandes et centrées */
    "ak-form-static{display:none!important}", /* ligne « avatar, pseudo, Pas vous ? » */
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
        if (form) setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.submit(); }, 120);
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
      if (err && code) { var w = code.closest(".rk-otp-wrap"); if (w) w.classList.add("err"); }
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
    if (code) {
      setupCode(code);
      var croot = code.getRootNode(), cform = code.form || code.closest("form");
      var grp = code.closest("fieldset") || code.closest(".pf-c-form__group"); if (grp) grp.classList.add("rk-code-group");
      // Texte « code envoyé » (Authentik, FR ou EN) : réécrit, centré, plus grand, sous les cases
      var help = croot.querySelector(".pf-c-form__helper-text:not(.pf-m-error)");
      if (help && !help.dataset.rk) {
        var m = /(?:adresse|address)\s*:?\s*(\S+@\S+)/i.exec(help.textContent);
        help.textContent = "Un code à 6 chiffres vient d'être envoyé" + (m ? " à " + m[1].replace(/\.$/, "") : " à votre adresse e-mail") + ".";
        help.dataset.rk = "1"; help.classList.add("rk-sent");
        var w2 = code.closest(".rk-otp-wrap"); if (w2 && w2.parentNode === help.parentNode) w2.parentNode.insertBefore(help, w2);
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

  function start() {
    var bg = document.createElement("canvas"); bg.id = "rk-bg"; bg.setAttribute("aria-hidden", "true");
    document.body.insertBefore(bg, document.body.firstChild);
    var s = document.createElement("style");
    s.textContent = "html,body{background:#010101!important}#rk-bg{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:block}" +
      "ak-drawer,ak-message-container{position:relative;z-index:1}";
    document.head.appendChild(s);
    if (window.RkSphere) window.RkSphere(bg);
    scan();
    new MutationObserver(function () { clearTimeout(start.t); start.t = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
    setInterval(scan, 80); // les changements dans les shadow DOM ne remontent pas jusqu'à body
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

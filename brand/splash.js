/* Reskif Studio : écran d'accueil (non connecté) avec la sphère organique de reskif.org.
   Scène reprise de reskif-commons@cd09ebf brand/sphere (Organic Sphere, Bruno Simon, MIT ; bruit perlin4d de Stefan Gustavson).
   Logique : membre déjà connecté -> l'appli démarre directement. Sinon : sphère + « Se connecter » ; au clic, l'appli
   démarre avec ?autologin=1 et part directement vers la connexion par code e-mail. */
(function () {
  var boot = function (auto) {
    if (auto) { try { history.replaceState(null, "", "/?autologin=1" + (location.hash || "#/home")); } catch (e) {} }
    if (window.__rkBoot) { var f = window.__rkBoot; window.__rkBoot = null; f(); }
  };
  var loggedIn = false;
  try { var v = localStorage.getItem("flutter.im.fluffychat.store.clients"); loggedIn = !!v && JSON.parse(v).length > 0; } catch (e) {}
  var h = location.hash || "";
  var special = /[?&](code|state|error)=/.test(location.href) || (h && h !== "#" && h !== "#/" && !/^#\/home\/?$/.test(h));
  if (loggedIn || special) {
    boot(false);
    // rk-watch : après une déconnexion, l'appli revient sur #/home sans recharger la page ;
    // on recharge alors pour afficher l'écran d'accueil avec la sphère.
    var noClient = function () { try { var c = localStorage.getItem("flutter.im.fluffychat.store.clients"); return !c || JSON.parse(c).length === 0; } catch (e) { return false; } };
    var check = function () { if (/^#\/home\/?$/.test(location.hash || "") && noClient() && !/[?&](code|state)=/.test(location.href)) location.replace("/"); };
    addEventListener("hashchange", check); setInterval(check, 1500);
    return;
  }

  var css = "#rk-home{position:fixed;inset:0;z-index:10;background:#010101;color:#fff;font-family:Syne,'Helvetica Neue',Arial,sans-serif;transition:opacity .45s ease}" +
    "#rk-home canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer}" +
    "#rk-home .hero{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(16px,3vmin,28px);pointer-events:none;padding:24px;text-align:center}" +
    "#rk-home .logo{width:clamp(120px,22vmin,200px);height:auto;filter:drop-shadow(0 0 18px rgba(0,0,0,.6))}" +
    "#rk-home button{pointer-events:auto;cursor:pointer;background:none;border:0;color:#fff;padding:.2em .3em;margin:0;font:800 clamp(30px,8.4vmin,92px)/.95 Syne,'Helvetica Neue',Arial,sans-serif;letter-spacing:-.01em;text-transform:uppercase;text-shadow:0 0 10px rgba(0,0,0,.7);border-radius:12px}" +
    "#rk-home button:focus-visible{outline:2px solid #ffb08a;outline-offset:6px}" +
    "#rk-home .sub{font:300 italic clamp(15px,2.2vmin,20px)/1.4 Fraunces,Georgia,serif;opacity:.7;margin:0}" +
    "#rk-home .credits{position:absolute;left:0;right:0;bottom:10px;text-align:center;font:11px/1.4 Syne,Arial,sans-serif;opacity:.45}" +
    "#rk-home .credits a{color:inherit}#rk-home.out{opacity:0;pointer-events:none}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var el = document.createElement("div"); el.id = "rk-home";
  el.innerHTML = '<canvas aria-hidden="true"></canvas><div class="hero"><img class="logo" src="/reskif_logo.svg" alt="Reskif" width="605" height="185">' +
    '<button type="button" id="rk-go">Se connecter</button><p class="sub">avec votre adresse e-mail</p></div>' +
    '<div class="credits">Sphère : <a href="https://github.com/brunosimon/organic-sphere" target="_blank" rel="noopener">Organic Sphere</a>, Bruno Simon (MIT)</div>';
  var start = function () { (document.body || document.documentElement).appendChild(el); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);

  var stop = false;
  var go = function () {
    if (stop) return; stop = true; el.classList.add("out");
    setTimeout(function () { el.remove(); }, 600);
    boot(true);
  };
  el.addEventListener("click", function (e) { if (e.target.tagName !== "A") go(); });
  addEventListener("keydown", function (e) { if (!stop && (e.key === "Enter" || e.key === " ")) go(); });

  var base = "https://cdn.jsdelivr.net/npm/three@0.132.2/";
  var libs = ["build/three.min.js", "examples/js/shaders/CopyShader.js", "examples/js/shaders/LuminosityHighPassShader.js",
    "examples/js/postprocessing/EffectComposer.js", "examples/js/postprocessing/ShaderPass.js", "examples/js/postprocessing/RenderPass.js",
    "examples/js/postprocessing/UnrealBloomPass.js"];
  var load = function (i) {
    if (i >= libs.length) return scene();
    var s = document.createElement("script"); s.src = base + libs[i]; s.onload = function () { load(i + 1); }; s.onerror = function () {};
    document.head.appendChild(s);
  };
  load(0);
  // Pendant que la sphère tourne, le navigateur récupère déjà l'appli.
  var pf = document.createElement("link"); pf.rel = "prefetch"; pf.href = "main.dart.js"; document.head.appendChild(pf);

  function scene() {
    if (stop || !window.THREE || !THREE.EffectComposer || !THREE.UnrealBloomPass) return;
    const perlin4d = `
  //	Classic Perlin 3D Noise 
  //	by Stefan Gustavson
  //
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  
  float perlin4d(vec4 P){
    vec4 Pi0 = floor(P); // Integer part for indexing
    vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec4 Pf0 = fract(P); // Fractional part for interpolation
    vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);
  
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 ixy00 = permute(ixy0 + iw0);
    vec4 ixy01 = permute(ixy0 + iw1);
    vec4 ixy10 = permute(ixy1 + iw0);
    vec4 ixy11 = permute(ixy1 + iw1);
  
    vec4 gx00 = ixy00 / 7.0;
    vec4 gy00 = floor(gx00) / 7.0;
    vec4 gz00 = floor(gy00) / 6.0;
    gx00 = fract(gx00) - 0.5;
    gy00 = fract(gy00) - 0.5;
    gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);
  
    vec4 gx01 = ixy01 / 7.0;
    vec4 gy01 = floor(gx01) / 7.0;
    vec4 gz01 = floor(gy01) / 6.0;
    gx01 = fract(gx01) - 0.5;
    gy01 = fract(gy01) - 0.5;
    gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);
  
    vec4 gx10 = ixy10 / 7.0;
    vec4 gy10 = floor(gx10) / 7.0;
    vec4 gz10 = floor(gy10) / 6.0;
    gx10 = fract(gx10) - 0.5;
    gy10 = fract(gy10) - 0.5;
    gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);
  
    vec4 gx11 = ixy11 / 7.0;
    vec4 gy11 = floor(gx11) / 7.0;
    vec4 gz11 = floor(gy11) / 6.0;
    gx11 = fract(gx11) - 0.5;
    gy11 = fract(gy11) - 0.5;
    gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);
  
    vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
    vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
    vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
    vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
    vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
    vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
    vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
    vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
    vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
    vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
    vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
    vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
    vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
    vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
    vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
    vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);
  
    vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x;
    g0100 *= norm00.y;
    g1000 *= norm00.z;
    g1100 *= norm00.w;
  
    vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x;
    g0101 *= norm01.y;
    g1001 *= norm01.z;
    g1101 *= norm01.w;
  
    vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x;
    g0110 *= norm10.y;
    g1010 *= norm10.z;
    g1110 *= norm10.w;
  
    vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x;
    g0111 *= norm11.y;
    g1011 *= norm11.z;
    g1111 *= norm11.w;
  
    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);
  
    vec4 fade_xyzw = fade(Pf0);
    vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
    vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
    vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
    return 2.2 * n_xyzw;
  }
  `;
  
    const vertexShader = `
  #define M_PI 3.1415926535897932384626433832795
  
  uniform vec3 uLightAColor;
  uniform vec3 uLightAPosition;
  uniform float uLightAIntensity;
  uniform vec3 uLightBColor;
  uniform vec3 uLightBPosition;
  uniform float uLightBIntensity;
  
  uniform vec2 uSubdivision;
  
  uniform vec3 uOffset;
  
  uniform float uDistortionFrequency;
  uniform float uDistortionStrength;
  uniform float uDisplacementFrequency;
  uniform float uDisplacementStrength;
  
  uniform float uFresnelOffset;
  uniform float uFresnelMultiplier;
  uniform float uFresnelPower;
  
  uniform float uTime;
  
  varying vec3 vColor;
  
  ${perlin4d}
  
  vec3 getDisplacedPosition(vec3 _position)
  {
      vec3 distoredPosition = _position;
      distoredPosition += perlin4d(vec4(distoredPosition * uDistortionFrequency + uOffset, uTime)) * uDistortionStrength;
  
      float perlinStrength = perlin4d(vec4(distoredPosition * uDisplacementFrequency + uOffset, uTime));
  
      vec3 displacedPosition = _position;
      displacedPosition += normalize(_position) * perlinStrength * uDisplacementStrength;
  
      return displacedPosition;
  }
  
  void main()
  {
      // Position
      vec3 displacedPosition = getDisplacedPosition(position);
      // (ajout : modelMatrix, pour que la sphère puisse rapetisser et se déplacer)
      vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
      vec4 viewPosition = viewMatrix * worldPosition;
      gl_Position = projectionMatrix * viewPosition;
  
      // Bi tangents
      float distanceA = (M_PI * 2.0) / uSubdivision.x;
      float distanceB = M_PI / uSubdivision.x;
  
      vec3 biTangent = cross(normal, tangent.xyz);
  
      vec3 positionA = position + tangent.xyz * distanceA;
      vec3 displacedPositionA = getDisplacedPosition(positionA);
  
      vec3 positionB = position + biTangent.xyz * distanceB;
      vec3 displacedPositionB = getDisplacedPosition(positionB);
  
      vec3 computedNormal = cross(displacedPositionA - displacedPosition.xyz, displacedPositionB - displacedPosition.xyz);
      computedNormal = normalize(computedNormal);
  
      // Fresnel
      vec3 viewDirection = normalize(worldPosition.xyz - cameraPosition);
      float fresnel = uFresnelOffset + (1.0 + dot(viewDirection, computedNormal)) * uFresnelMultiplier;
      fresnel = pow(max(0.0, fresnel), uFresnelPower);
  
      // Color
      float lightAIntensity = max(0.0, - dot(computedNormal.xyz, normalize(- uLightAPosition))) * uLightAIntensity;
      float lightBIntensity = max(0.0, - dot(computedNormal.xyz, normalize(- uLightBPosition))) * uLightBIntensity;
  
      vec3 color = vec3(0.0);
      color = mix(color, uLightAColor, lightAIntensity * fresnel);
      color = mix(color, uLightBColor, lightBIntensity * fresnel);
      color = mix(color, vec3(1.0), clamp(pow(max(0.0, fresnel - 0.8), 3.0), 0.0, 1.0));
  
      // Varying
      vColor = color;
  }`;
  
    const fragmentShader = `
  varying vec3 vColor;
  
  void main()
  {
      gl_FragColor = vec4(vColor, 1.0);
  }`;
  
    const bloomCompositeShader = `
  varying vec2 vUv;
  uniform sampler2D blurTexture1;
  uniform sampler2D blurTexture2;
  uniform sampler2D blurTexture3;
  uniform sampler2D blurTexture4;
  uniform sampler2D blurTexture5;
  uniform sampler2D dirtTexture;
  uniform float bloomStrength;
  uniform float bloomRadius;
  uniform float bloomFactors[NUM_MIPS];
  uniform vec3 bloomTintColors[NUM_MIPS];
  uniform vec3 uTintColor;
  uniform float uTintStrength;
  
  float lerpBloomFactor(const in float factor) {
      float mirrorFactor = 1.2 - factor;
      return mix(factor, mirrorFactor, bloomRadius);
  }
  
  void main() {
      vec4 color = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
          lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
          lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
          lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
          lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
  
      color.rgb = mix(color.rgb, uTintColor, uTintStrength);
      gl_FragColor = color;
  }`;
  
    
    var canvas = el.querySelector("canvas");
    var config = { pixelRatio: Math.min(Math.max(window.devicePixelRatio, 1), 2), width: innerWidth, height: innerHeight };
    var coarse = matchMedia("(pointer: coarse)").matches;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: true }); } catch (e) { return; }
    renderer.setClearColor("#010101", 1); renderer.setPixelRatio(config.pixelRatio); renderer.setSize(config.width, config.height, false);
    var scn = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(25, config.width / config.height, 0.01, 80); scn.add(camera);
    var RT = config.pixelRatio >= 2 || !THREE.WebGLMultisampleRenderTarget ? THREE.WebGLRenderTarget : THREE.WebGLMultisampleRenderTarget;
    var rt = new RT(config.width, config.height, { generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, encoding: THREE.sRGBEncoding });
    var composer = new THREE.EffectComposer(renderer, rt); composer.setSize(config.width, config.height); composer.setPixelRatio(config.pixelRatio);
    composer.addPass(new THREE.RenderPass(scn, camera));
    var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(config.width, config.height), 0.8, 0.315, 0);
    bloom.compositeMaterial.uniforms.uTintColor = { value: new THREE.Color("#7f00ff") };
    bloom.compositeMaterial.uniforms.uTintStrength = { value: 0.15 };
    bloom.compositeMaterial.fragmentShader = bloomCompositeShader; bloom.compositeMaterial.needsUpdate = true;
    composer.addPass(bloom);

    var sub = coarse ? 256 : 512;
    var geometry = new THREE.SphereGeometry(1, sub, sub); geometry.computeTangents();
    var la = { intensity: 1.85, color: new THREE.Color("#ff3e00"), spherical: new THREE.Spherical(1, 0.615, 2.049) };
    var lb = { intensity: 1.4, color: new THREE.Color("#0063ff"), spherical: new THREE.Spherical(1, 2.561, -1.844) };
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uLightAColor: { value: la.color }, uLightAPosition: { value: new THREE.Vector3().setFromSpherical(la.spherical) }, uLightAIntensity: { value: la.intensity },
        uLightBColor: { value: lb.color }, uLightBPosition: { value: new THREE.Vector3().setFromSpherical(lb.spherical) }, uLightBIntensity: { value: lb.intensity },
        uSubdivision: { value: new THREE.Vector2(geometry.parameters.widthSegments, geometry.parameters.heightSegments) },
        uOffset: { value: new THREE.Vector3() }, uDistortionFrequency: { value: 1.5 }, uDistortionStrength: { value: 0.65 },
        uDisplacementFrequency: { value: 2.120 }, uDisplacementStrength: { value: 0.152 },
        uFresnelOffset: { value: -1.609 }, uFresnelMultiplier: { value: 3.587 }, uFresnelPower: { value: 1.793 }, uTime: { value: 0 }
      },
      defines: { USE_TANGENT: "" }, vertexShader: vertexShader, fragmentShader: fragmentShader
    });
    scn.add(new THREE.Mesh(geometry, material));

    var speed = 1, agitation = 0, pointer = null;
    var variations = {
      volume: { current: 0.152, up: 0.03, down: 0.002, target: function () { return 0.152 + agitation * 0.06; } },
      lowLevel: { current: 0.0003, up: 0.005, down: 0.002, target: function () { return 0.0003 * speed; } },
      mediumLevel: { current: 3.587, up: 0.008, down: 0.004, target: function () { return 3.587 + agitation * 0.6; } },
      highLevel: { current: 0.65, up: 0.02, down: 0.001, target: function () { return 0.65 + agitation * 0.5; } }
    };
    var offset = { spherical: new THREE.Spherical(1, Math.random() * Math.PI, Math.random() * Math.PI * 2), direction: new THREE.Vector3() };
    var halfFov = THREE.MathUtils.degToRad(25 / 2), restZ = 7;
    function resize() {
      config.width = innerWidth; config.height = innerHeight; camera.aspect = config.width / config.height;
      restZ = camera.aspect >= 1 ? 7 : Math.max(7, 1.45 / (Math.tan(halfFov) * camera.aspect) + 0.2);
      camera.position.set(0, 0, restZ); camera.updateProjectionMatrix();
      renderer.setSize(config.width, config.height, false); composer.setSize(config.width, config.height); bloom.setSize(config.width, config.height);
    }
    addEventListener("resize", resize); resize();
    addEventListener("pointermove", function (e) { pointer = { x: e.clientX, y: e.clientY }; });
    var smooth = function (a, b, x) { var t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
    function hover() {
      if (!pointer) return { speed: 1, agitation: 0 };
      var r = (1 / (restZ * Math.tan(halfFov))) * (config.height / 2);
      var d = Math.hypot(pointer.x - config.width / 2, pointer.y - config.height / 2) / r;
      if (d < 1) { var k = Math.pow(1 - d, 1.4); return { speed: 1 + k * 7, agitation: k }; }
      return { speed: 1 - smooth(1, 2.4, d) * 0.85, agitation: 0 };
    }
    var last = Date.now();
    function tick() {
      if (stop) { renderer.dispose(); return; }
      var now = Date.now(), delta = Math.min(now - last, 60); last = now;
      var hv = hover(); speed = hv.speed; agitation = hv.agitation;
      for (var n in variations) { var v = variations[n], t = v.target(), ea = t > v.current ? v.up : v.down; v.current += (t - v.current) * Math.min(ea * delta, 1); }
      var tf = variations.lowLevel.current, el2 = delta * tf;
      material.uniforms.uDisplacementStrength.value = variations.volume.current;
      material.uniforms.uDistortionStrength.value = variations.highLevel.current;
      material.uniforms.uFresnelMultiplier.value = variations.mediumLevel.current;
      var ot = el2 * 0.3;
      offset.spherical.phi = ((Math.sin(ot * 0.001) * Math.sin(ot * 0.00321)) * 0.5 + 0.5) * Math.PI;
      offset.spherical.theta = ((Math.sin(ot * 0.0001) * Math.sin(ot * 0.000321)) * 0.5 + 0.5) * Math.PI * 2;
      offset.direction.setFromSpherical(offset.spherical); offset.direction.multiplyScalar(tf * 2);
      material.uniforms.uOffset.value.add(offset.direction); material.uniforms.uTime.value += el2;
      composer.render(); requestAnimationFrame(tick);
    }
    tick();
  }
})();

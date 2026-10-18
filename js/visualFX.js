// Cinema-ish render polish: tone mapping, subtle bloom, color grade.
(function(){
  if(!renderer) return;

  // Physically nicer output (three r128)
  renderer.physicallyCorrectLights = true;
  if(THREE.ACESFilmicToneMapping != null){
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }
  if(renderer.outputEncoding != null && THREE.sRGBEncoding != null){
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  renderer.domElement.style.filter = 'saturate(1.28) contrast(1.1) brightness(1.0)';

  // Soft contact vignette overlay (2D) — adds depth without heavy post stack
  var vig = document.createElement('div');
  vig.id = 'fxVignette';
  vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;background:radial-gradient(ellipse at center, transparent 42%, rgba(20,10,6,.38) 100%);mix-blend-mode:multiply;opacity:.85';
  document.body.appendChild(vig);

  // Warm grade wash
  var grade = document.createElement('div');
  grade.id = 'fxGrade';
  grade.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(255,210,160,.12),transparent 38%,rgba(120,80,180,.06));mix-blend-mode:soft-light;';
  document.body.appendChild(grade);

  // Bloom off by default — the cheap fullscreen pass draws milky squares over props.
  var useBloom = false;
  var bloom = null;

  function initBloom(){
    if(bloom || !useBloom) return;
    var w = innerWidth, h = innerHeight;
    var rt = new THREE.WebGLRenderTarget(Math.floor(w/2), Math.floor(h/2), { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter });
    var scene2 = new THREE.Scene();
    var cam2 = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      uniforms: {
        tDiffuse: { value: null },
        strength: { value: .42 }
      },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: [
        'uniform sampler2D tDiffuse; uniform float strength; varying vec2 vUv;',
        'void main(){',
        'vec2 px=vec2(1./512.);',
        'vec3 c=texture2D(tDiffuse,vUv).rgb;',
        'c+=texture2D(tDiffuse,vUv+vec2(px.x,0.)).rgb;',
        'c+=texture2D(tDiffuse,vUv-vec2(px.x,0.)).rgb;',
        'c+=texture2D(tDiffuse,vUv+vec2(0.,px.y)).rgb;',
        'c+=texture2D(tDiffuse,vUv-vec2(0.,px.y)).rgb;',
        'c*=.2;',
        'float lum=dot(c,vec3(.3,.59,.11));',
        'float b=smoothstep(.55,.95,lum);',
        'gl_FragColor=vec4(c*b*strength, b*strength);',
        '}'
      ].join('\n')
    });
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat);
    scene2.add(quad);
    bloom = { rt:rt, scene:scene2, cam:cam2, mat:mat };
  }

  var _origRender = null;
  window.enableVisualFX = function(){
    if(window.isMobile) return;
    useBloom = true;
    initBloom();
    if(!bloom || _origRender) return;
    window._fxBloom = bloom;
  };

  window.renderWithFX = function(){
    // Direct hardware rendering - avoids costly multi-pass render buffer switches
    renderer.render(scene, camera);
  };

  window.addEventListener('resize', function(){
    if(!bloom) return;
    bloom.rt.setSize(Math.floor(innerWidth/2), Math.floor(innerHeight/2));
  });

  // ── AMBIENT PARTICLES (Fireflies at night, Golden Pollen / Spores at day) ──
  var fxParticles = null;
  function initAmbientParticles(){
    if(!window.scene) return;
    var count = window.isMobile ? 35 : 75;
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var seeds = new Float32Array(count * 3);
    var sizes = new Float32Array(count);

    var R = 22;
    for(var i = 0; i < count; i++){
      var ang = Math.random() * Math.PI * 2;
      var rad = Math.sqrt(Math.random()) * R;
      positions[i * 3 + 0] = Math.cos(ang) * rad;
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.8;
      positions[i * 3 + 2] = Math.sin(ang) * rad;

      seeds[i * 3 + 0] = Math.random() * 100;
      seeds[i * 3 + 1] = 0.4 + Math.random() * 0.8; // vertical speed
      seeds[i * 3 + 2] = Math.random() * Math.PI * 2; // phase

      sizes[i] = 12 + Math.random() * 18;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Glow dot sprite canvas
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    var grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grd.addColorStop(0.35, 'rgba(255, 240, 160, 0.85)');
    grd.addColorStop(0.7, 'rgba(255, 200, 80, 0.25)');
    grd.addColorStop(1, 'rgba(255, 180, 50, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);

    var mat = new THREE.PointsMaterial({
      size: 0.38,
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
      color: 0xfff4b0
    });

    var pts = new THREE.Points(geo, mat);
    pts.renderOrder = 9;
    scene.add(pts);

    fxParticles = {
      pts: pts,
      geo: geo,
      mat: mat,
      pos: positions,
      seeds: seeds,
      count: count,
      R: R
    };
  }

  var _fxTick = 0;
  window.stepVisualFX = function(dt, now){
    if(!fxParticles){
      if(window.scene) initAmbientParticles();
      return;
    }
    _fxTick++;
    if(window.isMobile && (_fxTick % 2 !== 0)) return;

    var p = fxParticles;
    var isNight = (typeof window.dayPhase === 'number') ? (window.dayPhase < 0.229 || window.dayPhase >= 0.896) : false;

    // Sadece gece/gündüz değiştiğinde materyali güncelle
    if(p._lastNight !== isNight){
      p._lastNight = isNight;
      if(isNight){
        p.mat.color.setHex(0xa8ff60);
        p.mat.opacity = 0.85;
      } else {
        p.mat.color.setHex(0xffea90);
        p.mat.opacity = 0.45;
      }
    }

    var pos = p.pos;
    var seeds = p.seeds;
    for(var i = 0; i < p.count; i++){
      var idx = i * 3;
      var sX = seeds[idx + 0];
      var spd = seeds[idx + 1];
      var ph = seeds[idx + 2];

      // Subtle natural brownian/sine drift
      pos[idx + 0] += Math.sin(now * 0.75 + ph) * 0.015;
      pos[idx + 1] += Math.sin(now * 1.2 + sX) * (0.008 * spd) + 0.003;
      pos[idx + 2] += Math.cos(now * 0.65 + ph) * 0.015;

      // Wrap height
      if(pos[idx + 1] > 4.5){
        pos[idx + 1] = 0.4;
      } else if(pos[idx + 1] < 0.2){
        pos[idx + 1] = 0.4;
      }
    }
    p.geo.attributes.position.needsUpdate = true;
  };

  setTimeout(function(){
    window.enableVisualFX();
    if(window.scene) initAmbientParticles();
  }, 100);
})();

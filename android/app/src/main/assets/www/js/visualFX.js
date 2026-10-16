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
  renderer.domElement.style.filter = 'saturate(1.18) contrast(1.06) brightness(1.02)';

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

  // Lightweight bloom: second pass only on desktop / high perf
  var useBloom = !isMobile && (typeof _perfMode === 'undefined' || _perfMode !== 'low');
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
    initBloom();
    if(!bloom || _origRender) return;
    // Hook end of frame from loop via wrap
    window._fxBloom = bloom;
  };

  window.renderWithFX = function(){
    if(!bloom){ renderer.render(scene, camera); return; }
    renderer.setRenderTarget(bloom.rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    bloom.mat.uniforms.tDiffuse.value = bloom.rt.texture;
    renderer.autoClear = false;
    renderer.render(bloom.scene, bloom.cam);
    renderer.autoClear = true;
  };

  window.addEventListener('resize', function(){
    if(!bloom) return;
    bloom.rt.setSize(Math.floor(innerWidth/2), Math.floor(innerHeight/2));
  });

  setTimeout(function(){ window.enableVisualFX(); }, 0);
})();

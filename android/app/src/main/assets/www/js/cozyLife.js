// Ambient life: birds, fireflies, sparkles — makes the diorama feel alive.
(function(){
  window._birds = window._birds || [];
  window._fireflies = window._fireflies || [];
  window._sparkles = window._sparkles || [];
  var _lifeReady = false;

  function lifeMat(hex, emissive, eInt){
    var m = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: .65,
      emissive: emissive != null ? emissive : 0x000000,
      emissiveIntensity: eInt || 0
    });
    m.userData.keep = true;
    return m;
  }

  function mkBird(){
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), lifeMat(0xffb347));
    body.scale.set(1.1, .85, 1.35);
    g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), lifeMat(0xffc878));
    head.position.set(0, .06, .12);
    g.add(head);
    var beak = new THREE.Mesh(new THREE.ConeGeometry(.03, .08, 6), lifeMat(0xff8a3a));
    beak.rotation.x = Math.PI/2;
    beak.position.set(0, .05, .2);
    g.add(beak);
    var wingL = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), lifeMat(0xff9a4a));
    wingL.scale.set(.3, .15, .7);
    wingL.position.set(-.12, .04, 0);
    g.add(wingL);
    var wingR = wingL.clone();
    wingR.position.x = .12;
    g.add(wingR);
    g.scale.setScalar(.85 + Math.random()*.4);
    var R = (window._islandR || 16) * .7;
    var a = Math.random()*Math.PI*2;
    g.position.set(Math.cos(a)*R*.5, 2.2+Math.random()*1.5, Math.sin(a)*R*.5);
    scene.add(g);
    return {
      mesh: g, wingL: wingL, wingR: wingR,
      t: Math.random()*20,
      phase: Math.random()*Math.PI*2,
      radius: 6 + Math.random()*8,
      height: 2.2 + Math.random()*1.8,
      speed: .35 + Math.random()*.45,
      bob: .15 + Math.random()*.2
    };
  }

  function mkFirefly(){
    var m = new THREE.Mesh(
      new THREE.SphereGeometry(.04, 8, 6),
      new THREE.MeshStandardMaterial({ color:0xd6ff6a, emissive:0xc8ff40, emissiveIntensity:1.4, roughness:.3 })
    );
    m.material.userData.keep = true;
    var R = (window._islandR || 16) * .85;
    m.position.set((Math.random()-.5)*R*1.4, .4+Math.random()*1.6, (Math.random()-.5)*R*1.4);
    scene.add(m);
    // Skip per-firefly PointLights — dozens of lights freeze mobile WebView.
    return { mesh:m, light:null, t:Math.random()*10, ox:m.position.x, oy:m.position.y, oz:m.position.z };
  }

  function mkSparkleField(){
    // Tiny emissive orbs — PointsMaterial squares look broken on many mobile GPUs.
    var n = isMobile ? 10 : 16;
    var g = new THREE.Group();
    var R = (window._islandR || 16);
    var mat = new THREE.MeshBasicMaterial({ color:0xffe6a8, transparent:true, opacity:.55, depthWrite:false });
    mat.userData.keep = true;
    var geo = new THREE.SphereGeometry(0.035, 6, 5);
    for(var i = 0; i < n; i++){
      var a = Math.random()*Math.PI*2;
      var r = Math.random()*R*.85;
      var m = new THREE.Mesh(geo, mat);
      m.position.set(Math.cos(a)*r, .35 + Math.random()*2.1, Math.sin(a)*r);
      m.scale.setScalar(.6 + Math.random()*.8);
      g.add(m);
    }
    scene.add(g);
    return { mesh:g, mat:mat, t:0 };
  }

  function seedAmbientButterflies(){
    if(typeof window.addBug !== 'function') return;
    var want = isMobile ? 2 : 3;
    var guard = 0;
    while(bugs.length < want && guard < 8){
      var prev = isLoading;
      isLoading = true; // avoid save spam / toasts
      window.addBug();
      isLoading = prev;
      guard++;
    }
    // Cap excess butterflies from saves / prior sessions
    while(bugs.length > want){
      var extra = bugs.pop();
      if(extra && extra.mesh){
        if(extra.mesh.parent) extra.mesh.parent.remove(extra.mesh);
        else scene.remove(extra.mesh);
      }
    }
    var el = document.getElementById('bC');
    if(el) el.innerText = bugs.length;
  }

  function seedMeadowPatches(force){
    if(!window._meadow) window._meadow = [];
    if(window._meadow.length && !force) return;
    if(force && window._meadow.length){
      window._meadow.forEach(function(m){ if(m && m.parent) m.parent.remove(m); else if(m) scene.remove(m); });
      window._meadow = [];
    }
    // Biome pads already auto-plant flowers — keep only a light sprinkle on meadow.
    if(window._biomeRoot){
      var nLite = isMobile ? 4 : 6;
      for(var i = 0; i < nLite; i++){
        var a = (i/nLite)*Math.PI*2 + 0.2;
        var r = 5 + (i%3)*1.4;
        if(typeof buildWild === 'function'){
          var patch = buildWild(Math.cos(a)*r, Math.sin(a)*r);
          patch.scale.setScalar(.5 + Math.random()*.25);
          scene.add(patch);
          window._meadow.push(patch);
        }
      }
      return;
    }
    var n = isMobile ? 10 : 18;
    var R = (window._islandR || 18) - 2;
    for(var j = 0; j < n; j++){
      var a2 = (j/n)*Math.PI*2 + Math.random()*.4;
      var r2 = 4 + Math.random()*(R-5);
      var x = Math.cos(a2)*r2, z = Math.sin(a2)*r2;
      if(typeof buildWild === 'function'){
        var patch2 = buildWild(x, z);
        patch2.scale.setScalar(.55 + Math.random()*.35);
        scene.add(patch2);
        window._meadow.push(patch2);
        if(!window._blooms) window._blooms = [];
        if(patch2.userData.heads){
          patch2.userData.heads.forEach(function(h){ window._blooms.push(h); });
        }
      }
    }
  }
  window.reseedMeadowPatches = function(){ seedMeadowPatches(true); };

  window.ensureCozyLife = function(){
    if(_lifeReady) return;
    _lifeReady = true;
    var birdN = isMobile ? 1 : 2;
    for(var i = 0; i < birdN; i++) window._birds.push(mkBird());
    var flyN = isMobile ? 2 : 4;
    for(var j = 0; j < flyN; j++) window._fireflies.push(mkFirefly());
    window._sparkles.push(mkSparkleField());
    seedAmbientButterflies();
    seedMeadowPatches();
  };

  window.stepCozyLife = function(dt, now){
    if(typeof isCozy === 'function' && !isCozy()){
      // Hide ambient life outside cozy mode
      window._birds.forEach(function(b){ b.mesh.visible = false; });
      window._fireflies.forEach(function(f){ f.mesh.visible = false; });
      window._sparkles.forEach(function(s){ s.mesh.visible = false; });
      if(window._meadow) window._meadow.forEach(function(m){ m.visible = false; });
      return;
    }
    if(!_lifeReady) window.ensureCozyLife();

    var lifeCx = 0, lifeCz = 0;
    if(typeof window.getActiveBiome === 'function'){
      var ab = window.getActiveBiome();
      if(ab){ lifeCx = ab.cx || 0; lifeCz = ab.cz || 0; }
    }
    window._birds.forEach(function(b){
      b.mesh.visible = true;
      b.t += dt * b.speed;
      var ang = b.t + b.phase;
      b.mesh.position.x = lifeCx + Math.cos(ang) * b.radius;
      b.mesh.position.z = lifeCz + Math.sin(ang) * b.radius;
      b.mesh.position.y = b.height + Math.sin(b.t*2.2) * b.bob;
      b.mesh.rotation.y = -ang + Math.PI/2;
      var flap = Math.sin(b.t * 14) * .55;
      b.wingL.rotation.z = .4 + flap;
      b.wingR.rotation.z = -.4 - flap;
    });

    window._fireflies.forEach(function(f, i){
      f.mesh.visible = true;
      f.t += dt;
      f.mesh.position.x = f.ox + Math.sin(f.t*1.3+i)*.45;
      f.mesh.position.z = f.oz + Math.cos(f.t*1.1+i*.7)*.45;
      f.mesh.position.y = f.oy + Math.sin(f.t*2.4+i)*.35;
      var pulse = .55 + .45*Math.sin(f.t*5+i);
      f.mesh.material.emissiveIntensity = .8 + pulse;
      if(f.light) f.light.intensity = .15 + pulse*.35;
    });

    window._sparkles.forEach(function(s){
      if(!s || !s.mesh) return;
      s.mesh.visible = true;
      s.t += dt;
      s.mesh.rotation.y = s.t * .05;
      // mesh is a Group of orbs sharing s.mat (not PointsMaterial)
      if(s.mat) s.mat.opacity = .45 + .35*Math.sin(s.t*1.5);
    });

    if(window._meadow) window._meadow.forEach(function(m){ m.visible = true; });

    // Extra canopy bob for cozy trees
    if(typeof decos !== 'undefined'){
      for(var di = 0; di < decos.length; di++){
        var d = decos[di];
        if((d.type==='tree'||d.type==='bush') && d.group.userData.leaves){
          var leaves = d.group.userData.leaves;
          for(var li = 0; li < leaves.length; li++){
            var lf = leaves[li];
            if(lf.userData.by!=null) lf.position.y = lf.userData.by + Math.sin(now*1.4+li+d.group.position.x)*.04;
          }
        }
      }
    }
  };

  // Boot life after models are ready (so meadow uses GLB flowers)
  function bootLife(){
    if(typeof isCozy === 'function' && isCozy()) window.ensureCozyLife();
  }
  if(typeof window.whenModelsReady === 'function') window.whenModelsReady(bootLife);
  else setTimeout(bootLife, 500);
})();

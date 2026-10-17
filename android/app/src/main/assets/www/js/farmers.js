// Cozy farmer NPCs — Quaternius modular Farmer/Worker plant & harvest crops.
(function(){
  var farmers = [];
  var MAX_FARMERS = 2;
  var MAX_NPC_CROPS = 10;
  var WALK = 1.55;
  var CROP_TYPES = ['tomato','strawberry','carrot','pepper','cucumber'];
  var CLASSIC_BEDS = [
    {x:0, z:6.2, r:2.8},
    {x:-8.2, z:-1.3, r:2.5},
    {x:8.2, z:-1.3, r:2.5},
    {x:0, z:-7.1, r:2.2}
  ];

  function cozyNow(){
    return typeof isCozy === 'function' && isCozy();
  }

  function farmBiome(){
    if(!window._biomes) return null;
    for(var i=0;i<window._biomes.length;i++){
      if(window._biomes[i].id === 'farm') return window._biomes[i];
    }
    return null;
  }

  function workZone(){
    if(cozyNow()){
      var b = farmBiome();
      if(b) return {cx:b.cx||0, cz:b.cz||0, r:Math.max(4, (b.R||15)-2.2)};
      if(typeof window.placeZone === 'function') return window.placeZone();
    }
    return {cx:0, cz:0, r:12};
  }

  function randInZone(){
    var z = workZone();
    var a = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * z.r * 0.85;
    return {x: z.cx + Math.cos(a)*r, z: z.cz + Math.sin(a)*r};
  }

  function spotFree(x, z){
    var zone = workZone();
    if(Math.hypot(x - zone.cx, z - zone.cz) > zone.r) return false;
    var gap = 1.45, i, p;
    if(typeof flowers !== 'undefined'){
      for(i=0;i<flowers.length;i++){
        p = flowers[i].mesh.position;
        if(Math.hypot(p.x - x, p.z - z) < gap) return false;
      }
    }
    if(typeof harvestItems !== 'undefined'){
      for(i=0;i<harvestItems.length;i++){
        p = harvestItems[i];
        if(Math.hypot(p.x - x, p.z - z) < gap) return false;
      }
    }
    return true;
  }

  function pickPlantSpot(){
    var tries = 14, i, p;
    if(!cozyNow()){
      for(i=0;i<tries;i++){
        var bed = CLASSIC_BEDS[Math.floor(Math.random()*CLASSIC_BEDS.length)];
        var a = Math.random()*Math.PI*2;
        var r = Math.random()*bed.r;
        p = {x: bed.x + Math.cos(a)*r, z: bed.z + Math.sin(a)*r};
        if(spotFree(p.x, p.z)) return p;
      }
    }
    for(i=0;i<tries;i++){
      p = randInZone();
      if(spotFree(p.x, p.z)) return p;
    }
    return null;
  }

  function findRipe(){
    if(typeof harvestItems === 'undefined') return null;
    var z = workZone();
    var best = null, bestD = 1e9;
    for(var i=0;i<harvestItems.length;i++){
      var h = harvestItems[i];
      if(!h || h.stage < 2) continue;
      var d = Math.hypot(h.x - z.cx, h.z - z.cz);
      if(d > z.r + 1.5) continue;
      if(d < bestD){ bestD = d; best = {idx:i, x:h.x, z:h.z, item:h}; }
    }
    return best;
  }

  function countZoneCrops(){
    if(typeof harvestItems === 'undefined') return 0;
    var z = workZone(), n = 0;
    for(var i=0;i<harvestItems.length;i++){
      var h = harvestItems[i];
      if(!h) continue;
      if(Math.hypot(h.x - z.cx, h.z - z.cz) <= z.r + 1.5) n++;
    }
    return n;
  }

  function mkFarmerVisual(kind){
    var g = new THREE.Group();
    var body = null;
    var key = kind === 'worker' ? 'worker' : 'farmer';
    if(typeof window.spawnModel === 'function'){
      body = window.spawnModel(key, 1.55) || window.spawnModel(key === 'farmer' ? 'worker' : 'farmer', 1.55);
    }
    if(body){
      g.add(body);
      var shovel = typeof window.spawnModel === 'function' ? window.spawnModel('shovel', 0.85) : null;
      if(shovel){
        shovel.position.set(0.28, 0.55, 0.05);
        shovel.rotation.z = -0.35;
        shovel.rotation.x = 0.15;
        g.add(shovel);
      }
    } else {
      // Soft fallback so farmers still appear if GLB late
      var mat = new THREE.MeshStandardMaterial({color:0xc4a06a, roughness:0.75});
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.7, 8), mat);
      torso.position.y = 0.85; g.add(torso);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({color:0xf0c8a0, roughness:0.7}));
      head.position.y = 1.35; g.add(head);
      var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 10), new THREE.MeshStandardMaterial({color:0x8a5a28, roughness:0.9}));
      hat.position.y = 1.48; g.add(hat);
      var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12), hat.material);
      brim.position.y = 1.43; g.add(brim);
    }
    if(typeof sitShadow === 'function') g.add(sitShadow(0.45));
    else {
      var sh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), new THREE.MeshBasicMaterial({color:0x1a2a14, transparent:true, opacity:0.28, depthWrite:false}));
      sh.rotation.x = -Math.PI/2; sh.position.y = 0.02; g.add(sh);
    }
    return g;
  }

  function spawnFarmer(kind, x, z){
    var g = mkFarmerVisual(kind);
    g.position.set(x, 0, z);
    scene.add(g);
    var rec = {
      group: g,
      kind: kind,
      state: 'idle',
      timer: 1 + Math.random() * 2,
      target: null,
      job: null,
      time: Math.random() * 10,
      world: cozyNow() ? 'cozy' : 'classic'
    };
    farmers.push(rec);
    return rec;
  }

  function syncFarmerVisibility(){
    var cozy = cozyNow();
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      if(!f.group) continue;
      // Farmers follow the active garden mode they were hired for; refresh home on mode flip.
      f.group.visible = true;
      if((cozy && f.world !== 'cozy') || (!cozy && f.world !== 'classic')){
        f.world = cozy ? 'cozy' : 'classic';
        var home = randInZone();
        f.group.position.set(home.x, 0, home.z);
        f.state = 'idle';
        f.timer = 0.8 + Math.random();
        f.target = null;
        f.job = null;
      }
    }
  }

  function setTarget(f, x, z){
    f.target = {x:x, z:z};
    f.state = 'walk';
  }

  function chooseJob(f){
    var ripe = findRipe();
    if(ripe && Math.random() < 0.65){
      f.job = {type:'harvest', idx:ripe.idx, x:ripe.x, z:ripe.z};
      setTarget(f, ripe.x, ripe.z);
      return;
    }
    if(countZoneCrops() < MAX_NPC_CROPS){
      var spot = pickPlantSpot();
      if(spot){
        var tp = CROP_TYPES[Math.floor(Math.random()*CROP_TYPES.length)];
        f.job = {type:'plant', crop:tp, x:spot.x, z:spot.z};
        setTarget(f, spot.x, spot.z);
        return;
      }
    }
    // wander
    var w = randInZone();
    f.job = {type:'wander'};
    setTarget(f, w.x, w.z);
  }

  function doJob(f){
    if(!f.job){ f.state = 'idle'; f.timer = 1.2; return; }
    if(f.job.type === 'plant'){
      if(countZoneCrops() < MAX_NPC_CROPS && spotFree(f.job.x, f.job.z) && typeof mkHarvestPlant === 'function'){
        mkHarvestPlant(f.job.x, f.job.z, f.job.crop, 0);
        if(typeof markDirty === 'function') markDirty();
        if(typeof save === 'function') save(true);
        if(typeof showToast === 'function' && Math.random() < 0.35){
          showToast('🧑‍🌾 Çiftçi ekti');
        }
      }
      f.state = 'work';
      f.timer = 0.7;
    } else if(f.job.type === 'harvest'){
      // Re-resolve ripe index (list may have shifted)
      var ripe = findRipe();
      var idx = -1;
      if(ripe) idx = ripe.idx;
      else if(typeof harvestItems !== 'undefined'){
        for(var i=0;i<harvestItems.length;i++){
          var h = harvestItems[i];
          if(h && h.stage >= 2 && Math.hypot(h.x - f.group.position.x, h.z - f.group.position.z) < 1.2){
            idx = i; break;
          }
        }
      }
      if(idx >= 0 && typeof harvestPlant === 'function'){
        var ok = harvestPlant(idx, {silent:true});
        if(ok){
          if(typeof save === 'function') save(true);
          if(typeof showToast === 'function' && Math.random() < 0.4){
            showToast('🧑‍🌾 Çiftçi hasat etti');
          }
        }
      }
      f.state = 'work';
      f.timer = 0.85;
    } else {
      f.state = 'idle';
      f.timer = 1.5 + Math.random() * 2;
    }
    f.job = null;
    f.target = null;
  }

  function stepFarmers(dt, now){
    if(!(dt > 0) || !farmers.length) return;
    syncFarmerVisibility();
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      if(!f.group || f.group.visible === false) continue;
      f.time += dt;
      var moving = false;
      if(f.state === 'idle'){
        f.timer -= dt;
        if(f.timer <= 0) chooseJob(f);
      } else if(f.state === 'walk' && f.target){
        var dx = f.target.x - f.group.position.x;
        var dz = f.target.z - f.group.position.z;
        var dist = Math.hypot(dx, dz);
        if(dist < 0.35){
          f.group.position.x = f.target.x;
          f.group.position.z = f.target.z;
          doJob(f);
        } else {
          var step = Math.min(dist, WALK * dt);
          f.group.position.x += dx / dist * step;
          f.group.position.z += dz / dist * step;
          f.group.rotation.y = Math.atan2(dx, dz);
          moving = true;
        }
      } else if(f.state === 'work'){
        f.timer -= dt;
        // Dig / plant bob
        f.group.position.y = Math.abs(Math.sin(f.time * 10)) * 0.04;
        f.group.rotation.x = Math.sin(f.time * 8) * 0.06;
        if(f.timer <= 0){
          f.group.position.y = 0;
          f.group.rotation.x = 0;
          f.state = 'idle';
          f.timer = 1.2 + Math.random() * 2;
        }
      }
      if(moving){
        f.group.position.y = Math.abs(Math.sin(f.time * 9)) * 0.035;
      } else if(f.state === 'idle'){
        f.group.position.y = Math.sin(f.time * 2) * 0.012;
      }
    }
  }

  function ensureFarmers(){
    if(farmers.length >= MAX_FARMERS){
      syncFarmerVisibility();
      return;
    }
    var need = MAX_FARMERS - farmers.length;
    for(var i=0;i<need;i++){
      var kind = i === 0 ? 'farmer' : 'worker';
      var p = randInZone();
      spawnFarmer(kind, p.x, p.z);
    }
    if(typeof showToast === 'function' && !window._farmersBootToast){
      window._farmersBootToast = true;
      showToast('🧑‍🌾 Çiftçiler bahçede çalışıyor');
    }
  }

  window.ensureFarmers = ensureFarmers;
  window.stepFarmers = stepFarmers;
  window.farmers = farmers;

  // Boot after models (modelPack also calls ensureFarmers); fallback if pack already ready.
  if(typeof window.whenModelsReady === 'function'){
    window.whenModelsReady(function(){ setTimeout(ensureFarmers, 50); });
  } else {
    setTimeout(ensureFarmers, 800);
  }
})();

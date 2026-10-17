// Cozy farmer house + stylized NPC farmhands (reference: soft toon farmers + rock bed).
// Players plant; farmers tend & harvest. Capacity = farmers × 3 jobs.
(function(){
  var JOBS_PER_FARMER = 3;
  var WALK = 1.7;
  var farmers = [];
  var houseRec = null; // {group, level, world, beds:[]}
  var _mats = {};

  function M(hex, rough){
    var k = hex + ':' + (rough||.8);
    if(!_mats[k]){
      _mats[k] = new THREE.MeshStandardMaterial({
        color: hex, roughness: rough==null?.82:rough, metalness: 0,
        flatShading: false
      });
      _mats[k].userData.keep = true;
    }
    return _mats[k];
  }

  function cozyNow(){ return typeof isCozy === 'function' && isCozy(); }
  function worldTag(){ return cozyNow() ? 'cozy' : 'classic'; }

  function farmerCount(){
    return houseRec ? Math.min(2, Math.max(0, houseRec.level|0)) : 0;
  }
  function maxJobs(){ return farmerCount() * JOBS_PER_FARMER; }

  function activeJobs(){
    var n = 0;
    for(var i=0;i<farmers.length;i++) n += (farmers[i].slots || []).length;
    return n;
  }

  window.farmerCapacity = function(){
    return {farmers: farmerCount(), max: maxJobs(), used: activeJobs(), level: houseRec ? houseRec.level : 0};
  };
  window.canPlantHarvest = function(){
    if(!houseRec) return 'Önce çiftçi evi koy 🏠';
    if(activeJobs() >= maxJobs()) return 'Çiftçiler meşgul (max ' + maxJobs() + ' iş) 🧑‍🌾';
    return '';
  };

  // ── Visuals: circular rock garden bed (reference) ──────────────────────────
  function buildRockBed(radius){
    var g = new THREE.Group();
    var R = radius || 1.55;
    var soil = new THREE.Mesh(new THREE.CircleGeometry(R, 28), M(0x6b4428, 1));
    soil.rotation.x = -Math.PI/2; soil.position.y = 0.03; g.add(soil);
    var mound = new THREE.Mesh(new THREE.SphereGeometry(R*0.92, 18, 12), M(0x7a4e30, 1));
    mound.scale.set(1, 0.18, 1); mound.position.y = 0.08; g.add(mound);
    // rim rocks
    for(var i=0;i<14;i++){
      var a = (i/14)*Math.PI*2 + 0.12;
      var rr = R * (0.92 + (i%3)*0.03);
      var rock = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 + (i%4)*0.04, 8, 6),
        M(i%2 ? 0x9aa3a8 : 0xb0b8bc, 0.95)
      );
      rock.scale.set(1.1, 0.7, 0.95);
      rock.position.set(Math.cos(a)*rr, 0.1, Math.sin(a)*rr);
      g.add(rock);
    }
    // accent flowers in bed (decorative, not harvest)
    var cols = [0xff6fae, 0xc77dff, 0xfff6f0, 0xffd84a, 0xff9a3c, 0xff5a8a];
    for(var f=0;f<7;f++){
      var fa = (f/7)*Math.PI*2 + 0.4;
      var fr = R * (0.25 + (f%3)*0.12);
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 5), M(0x3d9a4a, 0.85));
      stem.position.set(Math.cos(fa)*fr, 0.22, Math.sin(fa)*fr); g.add(stem);
      var bloom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M(cols[f%cols.length], 0.55));
      bloom.position.set(stem.position.x, 0.42, stem.position.z);
      bloom.scale.set(1, 0.7, 1); g.add(bloom);
      if(f%2===0){
        var petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(cols[(f+2)%cols.length], 0.5));
        petal.position.set(stem.position.x, 0.4, stem.position.z);
        petal.scale.set(1.35, 0.35, 1.35); g.add(petal);
      }
    }
    // tiny yellow ground dots around bed
    for(var d=0;d<10;d++){
      var da = Math.random()*Math.PI*2, dr = R + 0.4 + Math.random()*0.9;
      var dot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 6), M(0xffe066, 0.7));
      dot.rotation.x = -Math.PI/2;
      dot.position.set(Math.cos(da)*dr, 0.025, Math.sin(da)*dr);
      g.add(dot);
    }
    if(typeof sitShadow === 'function') g.add(sitShadow(R*1.1));
    return g;
  }

  function buildFarmerCottage(level){
    var g = new THREE.Group();
    // soft cottage base
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 2.0), M(0xf2e2c4, 0.9));
    base.position.y = 0.68; g.add(base);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.1, 4), M(0xd4784a, 0.85));
    roof.position.y = 1.9; roof.rotation.y = Math.PI/4; g.add(roof);
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.08), M(0x8a5a32, 0.9));
    door.position.set(0, 0.42, 1.02); g.add(door);
    var win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.06), M(0x8ec8ff, 0.4));
    win.position.set(-0.7, 0.85, 1.01); g.add(win);
    var win2 = win.clone(); win2.position.x = 0.7; g.add(win2);
    // chimney
    var chim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.28), M(0xb07050, 0.95));
    chim.position.set(0.7, 2.15, -0.3); g.add(chim);
    // level badge porch for L2
    if(level >= 2){
      var porch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.55), M(0xe8d2a8, 0.9));
      porch.position.set(0, 0.12, 1.35); g.add(porch);
      var flowerBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.28), M(0x6a8f3a, 0.8));
      flowerBox.position.set(-1.35, 0.55, 0.2); g.add(flowerBox);
    }
    var plaque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.04), M(0xfff4d6, 0.7));
    plaque.position.set(0, 1.15, 1.03); g.add(plaque);
    if(typeof sitShadow === 'function') g.add(sitShadow(1.6));
    return g;
  }

  // ── Stylized farmers matching reference ────────────────────────────────────
  function buildToonFarmer(kind){
    // kind: 'male' | 'female'
    var g = new THREE.Group();
    var skin = M(0xf0c8a8, 0.7);
    var isMale = kind !== 'female';

    // boots
    var bootM = M(0x5a3a28, 0.9);
    [[-0.12, 0.08, 0.06],[0.12, 0.08, 0.06]].forEach(function(p){
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.22), bootM);
      b.position.set(p[0], p[1], p[2]); g.add(b);
    });
    // legs
    var jean = M(isMale ? 0x3d6db5 : 0x4a7cc9, 0.85);
    [[-0.11, 0.32, 0],[0.11, 0.32, 0]].forEach(function(p){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 8), jean);
      leg.position.set(p[0], p[1], p[2]); g.add(leg);
    });
    // torso
    var shirt = M(isMale ? 0xe8d2b0 : 0xe6d4b8, 0.8);
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.48, 10), shirt);
    body.position.y = 0.72; g.add(body);
    if(isMale){
      // overalls bib
      var ov = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.2), M(0x3a68b0, 0.85));
      ov.position.set(0, 0.78, 0.06); g.add(ov);
      var strapL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.04), ov.material);
      strapL.position.set(-0.12, 0.95, 0.14); g.add(strapL);
      var strapR = strapL.clone(); strapR.position.x = 0.12; g.add(strapR);
    } else {
      // checkered hint — light vest stripes
      for(var s=0;s<3;s++){
        var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.22), M(0xf7f1e6, 0.75));
        stripe.position.set(0, 0.58 + s*0.12, 0.05); g.add(stripe);
      }
    }
    // arms
    var armM = isMale ? shirt : M(0xf5e6c8, 0.8);
    var armL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.38, 7), armM);
    armL.position.set(-0.3, 0.72, 0.05); armL.rotation.z = 0.35; g.add(armL);
    var armR = armL.clone(); armR.position.x = 0.3; armR.rotation.z = -0.35; g.add(armR);
    // gloves / hands
    var handM = isMale ? skin : M(0xf0d24a, 0.7);
    var handL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), handM);
    handL.position.set(-0.38, 0.52, 0.12); g.add(handL);
    var handR = handL.clone(); handR.position.x = 0.38; g.add(handR);

    // tool
    var tool = new THREE.Group();
    if(isMale){
      // pink shears
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.02), M(0xff8ab8, 0.45));
      blade.position.y = 0.1; tool.add(blade);
      var blade2 = blade.clone(); blade2.rotation.z = 0.35; blade2.position.x = 0.04; tool.add(blade2);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6), M(0xe8e8e8, 0.5));
      handle.position.y = -0.02; tool.add(handle);
      tool.position.set(0.42, 0.48, 0.18);
      tool.rotation.z = -0.8;
    } else {
      // silver watering can
      var can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 8), M(0xcfd8e0, 0.35));
      can.position.y = 0.08; tool.add(can);
      var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.18, 6), can.material);
      spout.rotation.z = 1.1; spout.position.set(0.12, 0.12, 0); tool.add(spout);
      var handleC = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 10, Math.PI), can.material);
      handleC.rotation.y = Math.PI/2; handleC.position.set(-0.02, 0.16, 0); tool.add(handleC);
      tool.position.set(0.4, 0.5, 0.16);
      tool.rotation.z = -0.5;
    }
    g.add(tool);
    g.userData.tool = tool;
    g.userData.armR = armR;

    // head
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skin);
    head.position.y = 1.18; g.add(head);
    // eyes
    var eyeM = M(0x2a221c, 0.5);
    [[-0.06, 1.2, 0.15],[0.06, 1.2, 0.15]].forEach(function(p){
      var e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), eyeM);
      e.position.set(p[0], p[1], p[2]); g.add(e);
    });
    // smile
    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 4, 8, Math.PI), M(0xc47a6a, 0.7));
    smile.position.set(0, 1.12, 0.16); smile.rotation.x = Math.PI; g.add(smile);
    if(isMale){
      var beard = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0x6b4a32, 0.9));
      beard.scale.set(1, 0.55, 0.7); beard.position.set(0, 1.08, 0.1); g.add(beard);
    } else {
      // ponytail
      var hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), M(0x5a3a28, 0.85));
      hair.position.set(0, 1.22, -0.02); hair.scale.set(1.05, 0.85, 1.05); g.add(hair);
      var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.28, 6), hair.material);
      tail.position.set(0, 1.05, -0.18); tail.rotation.x = 0.5; g.add(tail);
    }
    // straw hat
    var hatM = M(0xe0c070, 0.9);
    var brim = new THREE.Mesh(new THREE.CylinderGeometry(isMale?0.32:0.26, isMale?0.32:0.26, 0.03, 14), hatM);
    brim.position.y = 1.32; g.add(brim);
    var crown = new THREE.Mesh(new THREE.CylinderGeometry(isMale?0.16:0.14, isMale?0.18:0.16, 0.14, 12), hatM);
    crown.position.y = 1.4; g.add(crown);

    if(typeof sitShadow === 'function') g.add(sitShadow(0.4));
    g.scale.setScalar(1.05);
    return g;
  }

  // ── House lifecycle ────────────────────────────────────────────────────────
  function clearFarmers(){
    for(var i=0;i<farmers.length;i++){
      if(farmers[i].group && farmers[i].group.parent) scene.remove(farmers[i].group);
    }
    farmers.length = 0;
  }

  function spawnFarmerAt(kind, x, z){
    var g = buildToonFarmer(kind);
    g.position.set(x, 0, z);
    scene.add(g);
    var rec = {
      group: g, kind: kind, state: 'idle', timer: 1 + Math.random(),
      target: null, job: null, slots: [], time: Math.random()*8, pose: 0
    };
    farmers.push(rec);
    return rec;
  }

  function homeAnchor(){
    if(!houseRec) return {x:0, z:0};
    var p = houseRec.group.position;
    return {x:p.x, z:p.z};
  }

  function refreshFarmers(){
    if(!houseRec){ clearFarmers(); return; }
    var need = farmerCount();
    var home = homeAnchor();
    // keep existing if possible
    while(farmers.length > need){
      var drop = farmers.pop();
      if(drop.group && drop.group.parent) scene.remove(drop.group);
    }
    while(farmers.length < need){
      var kind = farmers.length === 0 ? 'male' : 'female';
      var ang = farmers.length === 0 ? -0.9 : 0.9;
      spawnFarmerAt(kind, home.x + Math.cos(ang)*1.8, home.z + Math.sin(ang)*1.8 + 1.6);
    }
    // park idle farmers by bed
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      if(f.state === 'idle' && !f.job){
        var a = i === 0 ? -0.85 : 0.85;
        f.group.position.x = home.x + Math.cos(a)*1.9;
        f.group.position.z = home.z + 1.7 + Math.sin(a)*0.3;
        f.group.rotation.y = Math.atan2(home.x - f.group.position.x, home.z + 1.2 - f.group.position.z);
      }
    }
  }

  function rebuildHouseVisual(){
    if(!houseRec) return;
    var x = houseRec.group.position.x, z = houseRec.group.position.z;
    var ry = houseRec.group.rotation.y;
    var sc = houseRec.group.scale.x || 1;
    var world = houseRec.world;
    var level = houseRec.level;
    // remove old
    if(houseRec.group.parent) scene.remove(houseRec.group);
    var idx = -1;
    for(var i=0;i<decos.length;i++){ if(decos[i] === houseRec || decos[i].type === 'farmer_house'){ idx=i; break; } }
    if(idx>=0) decos.splice(idx,1);

    var root = new THREE.Group();
    root.add(buildFarmerCottage(level));
    // beds in front of house
    var bed1 = buildRockBed(level >= 2 ? 1.7 : 1.5);
    bed1.position.set(0, 0, 3.2);
    root.add(bed1);
    if(level >= 2){
      var bed2 = buildRockBed(1.35);
      bed2.position.set(2.6, 0, 2.4);
      root.add(bed2);
    }
    root.position.set(x, 0, z);
    root.rotation.y = ry;
    root.scale.setScalar(sc);
    root.visible = !(world && world !== 'both' && ((cozyNow() && world !== 'cozy') || (!cozyNow() && world !== 'classic')));
    scene.add(root);
    houseRec = {group: root, type: 'farmer_house', level: level, world: world || worldTag(), beds: true};
    decos.push(houseRec);
    refreshFarmers();
  }

  function placeFarmerHouse(x, z, level, world){
    // only one house
    if(houseRec){
      showToast('Çiftçi evi zaten var — yükseltmeyi dene ⬆️');
      return false;
    }
    level = level || 1;
    var root = new THREE.Group();
    root.add(buildFarmerCottage(level));
    var bed1 = buildRockBed(1.5);
    bed1.position.set(0, 0, 3.2);
    root.add(bed1);
    root.position.set(x, 0, z);
    scene.add(root);
    houseRec = {group: root, type: 'farmer_house', level: level, world: world || worldTag(), beds: true};
    decos.push(houseRec);
    refreshFarmers();
    if(typeof markDirty === 'function') markDirty();
    return true;
  }

  window.mkFarmerHouse = function(x, z, level){
    return placeFarmerHouse(x, z, level || 1, worldTag());
  };

  window.upgradeFarmerHouse = function(){
    if(!houseRec){ showToast('Önce çiftçi evi koy 🏠'); return false; }
    if(houseRec.level >= 2){ showToast('Çiftçi evi maksimum seviyede ⭐'); return false; }
    var cost = 120;
    if(typeof stats === 'undefined' || stats.coin < cost){
      showToast('Yükseltme için ' + cost + ' 💰 gerekli');
      return false;
    }
    stats.coin -= cost;
    if(typeof updStats === 'function') updStats();
    if(typeof saveStats === 'function') saveStats();
    houseRec.level = 2;
    rebuildHouseVisual();
    showToast('🏠 Çiftçi evi Seviye 2 — 2 çiftçi!');
    if(typeof save === 'function') save(true);
    return true;
  };

  // ── Job assignment (player plants → farmers react) ─────────────────────────
  function freeFarmer(){
    var best = null;
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      if(f.state !== 'idle' && f.state !== 'park') continue;
      if((f.slots||[]).length >= JOBS_PER_FARMER) continue;
      if(!best || f.slots.length < best.slots.length) best = f;
    }
    return best;
  }

  function findSlotCrop(f, pred){
    for(var i=0;i<(f.slots||[]).length;i++){
      var id = f.slots[i];
      for(var j=0;j<harvestItems.length;j++){
        var h = harvestItems[j];
        if(h && h._farmId === id && pred(h, j)) return {item:h, idx:j, id:id};
      }
    }
    return null;
  }

  var _farmIdSeq = 1;
  window.onPlayerPlantedHarvest = function(item){
    if(!item || !houseRec) return;
    var f = freeFarmer();
    if(!f){
      // capacity already gated, but if all busy walking — queue on least loaded
      var least = farmers[0];
      for(var i=1;i<farmers.length;i++){
        if(farmers[i].slots.length < least.slots.length) least = farmers[i];
      }
      f = least;
    }
    if(!f) return;
    if(!item._farmId) item._farmId = 'c' + (_farmIdSeq++);
    if(f.slots.indexOf(item._farmId) < 0) f.slots.push(item._farmId);
    f.job = {type: 'tend', farmId: item._farmId, x: item.x, z: item.z};
    f.target = {x: item.x, z: item.z};
    f.state = 'walk';
    if(typeof showToast === 'function') showToast(f.kind === 'female' ? '👩‍🌾 Çiftçi sulamaya gidiyor' : '👨‍🌾 Çiftçi bakıma gidiyor');
  };

  function pruneSlots(){
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      f.slots = (f.slots || []).filter(function(id){
        for(var j=0;j<harvestItems.length;j++){
          if(harvestItems[j] && harvestItems[j]._farmId === id) return true;
        }
        return false;
      });
    }
  }

  function chooseHarvestJob(f){
    var ripe = findSlotCrop(f, function(h){ return h.stage >= 2; });
    if(ripe){
      f.job = {type:'harvest', farmId: ripe.id, x: ripe.item.x, z: ripe.item.z};
      f.target = {x: ripe.item.x, z: ripe.item.z};
      f.state = 'walk';
      return true;
    }
    return false;
  }

  function doArrive(f){
    if(!f.job){ f.state = 'idle'; f.timer = 1; return; }
    if(f.job.type === 'return'){
      f.job = null; f.target = null; f.state = 'idle'; f.timer = 1.2;
      f.group.position.y = 0; f.group.rotation.x = 0;
      return;
    }
    if(f.job.type === 'tend'){
      f.state = 'work';
      f.timer = 1.1;
      f.pose = 1; // kneel
      // slight growth boost when tended
      for(var j=0;j<harvestItems.length;j++){
        var h = harvestItems[j];
        if(h && h._farmId === f.job.farmId && h.stage < 2){
          h.growTimer = (h.growTimer || 0) + (h.cfg ? h.cfg.growTime * 0.15 : 8);
        }
      }
    } else if(f.job.type === 'harvest'){
      f.state = 'work';
      f.timer = 0.9;
      f.pose = 1;
      var idx = -1;
      for(var i=0;i<harvestItems.length;i++){
        if(harvestItems[i] && harvestItems[i]._farmId === f.job.farmId && harvestItems[i].stage >= 2){
          idx = i; break;
        }
      }
      if(idx >= 0 && typeof harvestPlant === 'function'){
        var ok = harvestPlant(idx, {silent: true});
        if(ok){
          f.slots = f.slots.filter(function(id){ return id !== f.job.farmId; });
          if(typeof save === 'function') save(true);
          if(typeof showToast === 'function') showToast('🧑‍🌾 Hasat tamam');
        }
      }
    } else {
      f.state = 'idle'; f.timer = 1.2;
    }
  }

  function stepFarmers(dt){
    if(!(dt > 0)) return;
    pruneSlots();
    // visibility with house
    if(houseRec && houseRec.group){
      var vis = houseRec.group.visible !== false;
      for(var vi=0;vi<farmers.length;vi++){
        if(farmers[vi].group) farmers[vi].group.visible = vis;
      }
    }
    for(var i=0;i<farmers.length;i++){
      var f = farmers[i];
      if(!f.group || f.group.visible === false) continue;
      f.time += dt;

      // idle farmers look for ripe crops on their slots
      if(f.state === 'idle'){
        f.timer -= dt;
        f.group.position.y = Math.sin(f.time * 2) * 0.012;
        f.group.rotation.x = 0;
        if(f.timer <= 0){
          if(!chooseHarvestJob(f)) f.timer = 1.4 + Math.random();
        }
      } else if(f.state === 'walk' && f.target){
        var dx = f.target.x - f.group.position.x;
        var dz = f.target.z - f.group.position.z;
        var dist = Math.hypot(dx, dz);
        if(dist < 0.4){
          f.group.position.x = f.target.x;
          f.group.position.z = f.target.z;
          doArrive(f);
        } else {
          var step = Math.min(dist, WALK * dt);
          f.group.position.x += dx / dist * step;
          f.group.position.z += dz / dist * step;
          f.group.rotation.y = Math.atan2(dx, dz);
          f.group.position.y = Math.abs(Math.sin(f.time * 9)) * 0.04;
          f.group.rotation.x = 0;
        }
      } else if(f.state === 'work'){
        f.timer -= dt;
        // kneel + tool bob
        f.group.position.y = -0.08;
        f.group.rotation.x = 0.35;
        if(f.group.userData.tool){
          f.group.userData.tool.rotation.z = -0.6 + Math.sin(f.time * 10) * 0.25;
        }
        if(f.timer <= 0){
          f.group.position.y = 0;
          f.group.rotation.x = 0;
          f.job = null;
          f.target = null;
          f.state = 'idle';
          f.timer = 0.8 + Math.random();
          // walk back toward house bed
          if(houseRec){
            var home = homeAnchor();
            var side = f.kind === 'female' ? 0.9 : -0.9;
            f.target = {x: home.x + Math.cos(side)*1.9, z: home.z + 1.7};
            f.state = 'walk';
            f.job = {type: 'return'};
          }
        }
      }
    }
  }

  function ensureFarmers(){
    // no auto-hire without house
    if(houseRec) refreshFarmers();
  }

  function adoptOrphanCrops(){
    if(!houseRec || typeof harvestItems === 'undefined') return;
    var cap = maxJobs();
    var used = activeJobs();
    for(var i=0;i<harvestItems.length && used < cap;i++){
      var h = harvestItems[i];
      if(!h) continue;
      if(!h._farmId) h._farmId = 'c' + (_farmIdSeq++);
      var owned = false;
      for(var f=0;f<farmers.length;f++){
        if(farmers[f].slots.indexOf(h._farmId) >= 0){ owned = true; break; }
      }
      if(owned) continue;
      var farmer = freeFarmer();
      if(!farmer) break;
      farmer.slots.push(h._farmId);
      used++;
    }
  }

  // Find existing house after load
  window.bindFarmerHouseFromDecos = function(){
    houseRec = null;
    clearFarmers();
    if(typeof decos === 'undefined') return;
    for(var i=0;i<decos.length;i++){
      if(decos[i] && decos[i].type === 'farmer_house'){
        houseRec = decos[i];
        if(!houseRec.level) houseRec.level = 1;
        break;
      }
    }
    if(houseRec){
      refreshFarmers();
      adoptOrphanCrops();
    }
  };

  window.ensureFarmers = ensureFarmers;
  window.stepFarmers = stepFarmers;
  window.farmers = farmers;
  window.getFarmerHouse = function(){ return houseRec; };

  // After models/boot — rebind house from save
  if(typeof window.whenModelsReady === 'function'){
    window.whenModelsReady(function(){ setTimeout(function(){ window.bindFarmerHouseFromDecos(); }, 80); });
  }
})();

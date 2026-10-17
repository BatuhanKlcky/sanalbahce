// Cozy farmer house + Quaternius Modular Farmer meshes.
// AnimationMixer clips are built from the Farmer BIND pose (Character pack
// clips use incompatible binds — Idle Head ~80° / arms break). Real mixer, not script bob.
// Players plant; farmers tend & harvest. Capacity = farmers × 3 jobs.
(function(){
  var JOBS_PER_FARMER = 3;
  var WALK = 1.55;
  var farmers = [];
  var houseRec = null; // {group, level, world, beds:[]}
  var _mats = {};
  // ArrayBuffers — each farmer is a fresh GLTFLoader.parse (no skinned clone = no spaghetti).
  var _bufMale = null;
  var _bufFemale = null;
  var _rigReady = false;
  var _rigWait = [];
  var RIG_MALE = 'models/characters/FarmerAnim.glb';
  var RIG_FEMALE = 'models/characters/FarmerAnim_F.glb';
  var DEG = Math.PI / 180;

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

  function whenRigReady(fn){
    if(_rigReady) fn();
    else _rigWait.push(fn);
  }

  function findClip(f, name){
    var pack = f && f.clips;
    if(!pack) return null;
    if(pack[name]) return pack[name];
    var keys = Object.keys(pack);
    for(var i=0;i<keys.length;i++){
      if(keys[i] === name || keys[i].indexOf('|'+name) >= 0 || keys[i].endsWith(name)) return pack[keys[i]];
    }
    return null;
  }

  /** Snapshot bind quaternions after skeleton.pose(). */
  function snapshotBindQuats(root){
    var bind = {};
    root.traverse(function(o){
      if(!o.isBone) return;
      bind[o.name] = o.quaternion.clone();
    });
    if(Object.keys(bind).length < 8){
      root.traverse(function(o){
        if(!o.name || bind[o.name]) return;
        if(/^(Root|Hips|Abdomen|Torso|Chest|Neck|Head|Shoulder|UpperArm|LowerArm|Hand|UpperLeg|LowerLeg|Foot)/.test(o.name)){
          bind[o.name] = o.quaternion.clone();
        }
      });
    }
    return bind;
  }

  /** bind * localEuler(x,y,z deg) — delta in bone local space. */
  function bindDelta(bindQ, xDeg, yDeg, zDeg){
    var q = bindQ.clone();
    var d = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      (xDeg || 0) * DEG, (yDeg || 0) * DEG, (zDeg || 0) * DEG, 'XYZ'
    ));
    return q.multiply(d);
  }

  function quatTrack(boneName, times, quats){
    var values = [];
    for(var i=0;i<quats.length;i++){
      var q = quats[i];
      values.push(q.x, q.y, q.z, q.w);
    }
    return new THREE.QuaternionKeyframeTrack(boneName + '.quaternion', times, values);
  }

  /**
   * Farmer-bind-relative clips. Modular Farmer bind is a T-pose; Character pack
   * Idle cannot be retargeted (Head bind −90° vs 0°, arms break). We author
   * standing rest + walk/work as local euler deltas from Farmer bind.
   * Bone names use GLTFLoader sanitization: UpperArm.L → UpperArmL.
   */
  function buildFarmerClips(root){
    var bind = snapshotBindQuats(root);
    function B(name){ return bind[name] || new THREE.Quaternion(); }
    function has(name){ return !!bind[name]; }
    // Natural standing rest (arms down, soft elbows) — bind alone is T-pose.
    var REST = {
      UpperArmL: [-78, 8, 22],
      UpperArmR: [-78, -8, -22],
      LowerArmL: [0, 0, -32],
      LowerArmR: [0, 0, 32],
      ShoulderL: [0, 0, 4],
      ShoulderR: [0, 0, -4],
      UpperLegL: [0, 0, 0],
      UpperLegR: [0, 0, 0],
      LowerLegL: [0, 0, 0],
      LowerLegR: [0, 0, 0],
      Hips: [0, 0, 0],
      Abdomen: [2, 0, 0],
      Torso: [0, 0, 0],
      Chest: [0, 0, 0],
      Neck: [0, 0, 0],
      Head: [0, 0, 0]
    };
    function R(name, dx, dy, dz){
      var r = REST[name] || [0, 0, 0];
      return bindDelta(B(name), r[0] + (dx || 0), r[1] + (dy || 0), r[2] + (dz || 0));
    }
    function restTrack(name, times, frames){
      if(!has(name)) return null;
      var qs = frames.map(function(f){ return R(name, f[0], f[1], f[2]); });
      return quatTrack(name, times, qs);
    }

    var clips = {};

    // Idle — arms-down rest + tiny breath (not T-pose, not Character Head tilt)
    (function(){
      var times = [0, 1.25, 2.5];
      var tracks = [];
      function add(name, frames){
        var t = restTrack(name, times, frames);
        if(t) tracks.push(t);
      }
      add('Abdomen', [[0,0,0],[2.2,0,0],[0,0,0]]);
      add('Chest', [[0,0,0],[1.4,0,0],[0,0,0]]);
      add('Head', [[0,0,0],[1.5,4,0],[0,0,0]]);
      add('UpperArmL', [[0,0,0],[1,0,0],[0,0,0]]);
      add('UpperArmR', [[0,0,0],[1,0,0],[0,0,0]]);
      add('LowerArmL', [[0,0,0],[0,0,-3],[0,0,0]]);
      add('LowerArmR', [[0,0,0],[0,0,3],[0,0,0]]);
      ['ShoulderL','ShoulderR','UpperLegL','UpperLegR','LowerLegL','LowerLegR','Hips','Torso','Neck'].forEach(function(n){
        add(n, [[0,0,0],[0,0,0],[0,0,0]]);
      });
      clips.Idle = new THREE.AnimationClip('Idle', 2.5, tracks);
    })();

    // Walk — Farmer L/R thigh forward uses the SAME local Z sign (not mirrored).
    // Old opposite-sign keys put BOTH feet forward → "spastic" double-step.
    // Arms open (abducted) + swing opposite the legs.
    (function(){
      var times = [0, 0.25, 0.5, 0.75, 1.0];
      var tracks = [];
      function add(name, frames){
        var t = restTrack(name, times, frames);
        if(t) tracks.push(t);
      }
      // Thigh Z: + = L forward AND R back; − = L back AND R forward
      //          L-fwd            mid             R-fwd            mid             L-fwd
      add('UpperLegL', [[0,0,24],[0,0,12],[0,0,-24],[0,0,-12],[0,0,24]]);
      add('UpperLegR', [[0,0,24],[0,0,12],[0,0,-24],[0,0,-12],[0,0,24]]);
      add('LowerLegL', [[5,0,0],[16,0,0],[34,0,0],[24,0,0],[5,0,0]]);
      add('LowerLegR', [[34,0,0],[24,0,0],[5,0,0],[16,0,0],[34,0,0]]);
      // Open arms (abducted) vs idle REST, then ±Z swing (same sign L/R = opposite world)
      // REST [-78,8,22] → walk open ≈ +28 X / +14 Z / shoulders out
      add('ShoulderL', [[0,0,20],[0,0,20],[0,0,20],[0,0,20],[0,0,20]]);
      add('ShoulderR', [[0,0,-20],[0,0,-20],[0,0,-20],[0,0,-20],[0,0,-20]]);
      add('UpperArmL', [[28,-2,48],[28,-2,32],[28,-2,-4],[28,-2,12],[28,-2,48]]);
      add('UpperArmR', [[28,2,20],[28,2,4],[28,2,-32],[28,2,-16],[28,2,20]]);
      add('LowerArmL', [[0,0,6],[0,0,3],[0,0,8],[0,0,3],[0,0,6]]);
      add('LowerArmR', [[0,0,-6],[0,0,-3],[0,0,-8],[0,0,-3],[0,0,-6]]);
      add('Abdomen', [[0,4,0],[0,0,0],[0,-4,0],[0,0,0],[0,4,0]]);
      add('Torso', [[0,3,0],[0,0,0],[0,-3,0],[0,0,0],[0,3,0]]);
      add('Head', [[0,3,0],[0,0,0],[0,-3,0],[0,0,0],[0,3,0]]);
      clips.Walk = new THREE.AnimationClip('Walk', 1.05, tracks);
    })();

    // Duck — kneel/tend: thighs forward (Z), knees bend (+X)
    (function(){
      var times = [0, 0.35, 1.0, 1.35];
      var tracks = [];
      function add(name, frames){
        var t = restTrack(name, times, frames);
        if(t) tracks.push(t);
      }
      add('Abdomen', [[0,0,0],[18,0,0],[20,0,0],[0,0,0]]);
      add('Torso', [[0,0,0],[10,0,0],[12,0,0],[0,0,0]]);
      add('Chest', [[0,0,0],[6,0,0],[6,0,0],[0,0,0]]);
      add('Head', [[0,0,0],[-6,0,0],[-8,0,0],[0,0,0]]);
      add('UpperArmL', [[0,0,0],[30,0,20],[34,0,24],[0,0,0]]);
      add('UpperArmR', [[0,0,0],[30,0,-20],[34,0,-24],[0,0,0]]);
      add('LowerArmL', [[0,0,0],[0,0,-28],[0,0,-32],[0,0,0]]);
      add('LowerArmR', [[0,0,0],[0,0,28],[0,0,32],[0,0,0]]);
      add('UpperLegL', [[0,0,0],[0,0,32],[0,0,34],[0,0,0]]);
      add('UpperLegR', [[0,0,0],[0,0,32],[0,0,34],[0,0,0]]);
      add('LowerLegL', [[0,0,0],[48,0,0],[50,0,0],[0,0,0]]);
      add('LowerLegR', [[0,0,0],[48,0,0],[50,0,0],[0,0,0]]);
      clips.Duck = new THREE.AnimationClip('Duck', 1.35, tracks);
    })();

    // Punch — harvest reach from standing rest
    (function(){
      var times = [0, 0.2, 0.45, 0.75, 1.05];
      var tracks = [];
      function add(name, frames){
        var t = restTrack(name, times, frames);
        if(t) tracks.push(t);
      }
      add('Abdomen', [[0,0,0],[8,0,0],[16,5,0],[6,0,0],[0,0,0]]);
      add('Torso', [[0,0,0],[6,0,0],[10,4,0],[4,0,0],[0,0,0]]);
      add('UpperArmR', [[0,0,0],[25,-15,40],[35,-20,55],[10,-5,15],[0,0,0]]);
      add('LowerArmR', [[0,0,0],[0,0,35],[0,0,50],[0,0,10],[0,0,0]]);
      add('UpperArmL', [[0,0,0],[8,0,-8],[12,0,-12],[4,0,0],[0,0,0]]);
      add('Head', [[0,0,0],[6,0,0],[10,-8,0],[4,0,0],[0,0,0]]);
      clips.Punch = new THREE.AnimationClip('Punch', 1.05, tracks);
    })();

    // Wave — soft watering / greeting from standing rest
    (function(){
      var times = [0, 0.25, 0.5, 0.75, 1.2];
      var tracks = [];
      function add(name, frames){
        var t = restTrack(name, times, frames);
        if(t) tracks.push(t);
      }
      add('UpperArmL', [[0,0,0],[50,25,55],[55,15,65],[50,30,55],[0,0,0]]);
      add('LowerArmL', [[0,0,0],[0,0,-15],[0,20,-8],[0,-20,-15],[0,0,0]]);
      add('ShoulderL', [[0,0,0],[0,0,10],[0,0,14],[0,0,10],[0,0,0]]);
      add('Head', [[0,0,0],[0,8,0],[0,10,0],[0,6,0],[0,0,0]]);
      add('Abdomen', [[0,0,0],[0,3,0],[0,4,0],[0,2,0],[0,0,0]]);
      add('UpperArmR', [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]);
      clips.Wave = new THREE.AnimationClip('Wave', 1.2, tracks);
    })();

    return clips;
  }

  function cozyLift(root){
    root.traverse(function(c){
      if(!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(function(m){
        if(!m || !m.color) return;
        var hsl = {h:0,s:0,l:0};
        m.color.getHSL(hsl);
        hsl.l = Math.min(0.64, hsl.l * 1.45 + 0.07);
        hsl.s = Math.min(0.82, hsl.s * 1.25 + 0.06);
        m.color.setHSL(hsl.h, hsl.s, hsl.l);
        m.metalness = 0;
        m.roughness = Math.min(0.92, (m.roughness != null ? m.roughness : 0.8) * 0.95 + 0.05);
        m.userData.keep = true;
      });
      // skinned meshes must keep matrix updates for AnimationMixer
      if(c.isSkinnedMesh){
        c.frustumCulled = false;
        c.matrixAutoUpdate = true;
      }
    });
  }

  function playClip(f, clipName, opts){
    opts = opts || {};
    if(!f.mixer || !f.actions) return;
    var clip = findClip(f, clipName);
    if(!clip) return;
    var key = clip.name;
    if(!f.actions[key]) f.actions[key] = f.mixer.clipAction(clip);
    var next = f.actions[key];
    if(f.currentAction === next && next.isRunning()) return;
    next.reset();
    next.setLoop(opts.loop === false ? THREE.LoopOnce : THREE.LoopRepeat, opts.loop === false ? 1 : Infinity);
    if(opts.loop === false) next.clampWhenFinished = true;
    next.setEffectiveWeight(1);
    // Walk cycle authored ~1s; keep cadence calm vs move speed
    next.timeScale = clipName === 'Walk' ? 0.85 : 1;
    if(f.currentAction){
      f.currentAction.crossFadeTo(next, opts.fade != null ? opts.fade : 0.18, false);
    } else {
      next.fadeIn(0.12);
    }
    next.play();
    f.currentAction = next;
    f.animName = clipName;
  }

  function loadArrayBuffer(url, cb){
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function(){
      if(req.status >= 200 && req.status < 300) cb(null, req.response);
      else cb(new Error('HTTP '+req.status));
    };
    req.onerror = function(){ cb(new Error('network')); };
    req.send(null);
  }

  function loadFarmerRig(){
    if(typeof THREE === 'undefined' || !THREE.GLTFLoader){
      _rigReady = true; _rigWait.splice(0).forEach(function(fn){try{fn();}catch(e){}});
      return;
    }
    var left = 2;
    function doneOne(){
      left--;
      if(left > 0) return;
      _rigReady = true;
      _rigWait.splice(0).forEach(function(fn){try{fn();}catch(e){}});
    }
    loadArrayBuffer(RIG_MALE, function(err, buf){
      if(err) console.warn('FarmerAnim buf', err);
      else _bufMale = buf;
      doneOne();
    });
    loadArrayBuffer(RIG_FEMALE, function(err, buf){
      if(err) console.warn('FarmerAnim_F buf', err);
      else _bufFemale = buf;
      doneOne();
    });
  }

  /** Fresh parse per farmer — keeps skin binds intact (unlike scene.clone). */
  function parseFarmerInstance(kind, onDone){
    var buf = kind === 'female' ? _bufFemale : _bufMale;
    if(!buf){ onDone(null); return; }
    var loader = new THREE.GLTFLoader();
    loader.parse(buf, '', function(gltf){
      var body = gltf.scene;
      cozyLift(body);
      body.updateMatrixWorld(true);
      var box = new THREE.Box3().setFromObject(body);
      var h = Math.max(1e-4, box.max.y - box.min.y);
      if(isFinite(box.min.y)) body.position.y -= box.min.y;
      // Scale OUTER group only — never scale skinned root (avoids bind explode).
      var g = new THREE.Group();
      g.add(body);
      g.scale.setScalar(1.62 / h);
      // Reset skeletons to Farmer bind, then build clips from that pose.
      // Discard gltf.animations — Character retargets break Modular Farmer Idle.
      body.traverse(function(c){
        if(c.isSkinnedMesh && c.skeleton) c.skeleton.pose();
      });
      body.updateMatrixWorld(true);
      var clips = buildFarmerClips(body);
      var mixer = new THREE.AnimationMixer(body);
      onDone({ group: g, mixer: mixer, clips: clips, body: body });
    }, function(err){
      console.warn('parse farmer', err);
      onDone(null);
    });
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

  // ── Quaternius Modular Farmer meshes + bind-relative mixer clips ───────────
  function buildStubFarmer(){
    var g = new THREE.Group();
    var stub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 8), M(0xc4a06a, 0.8));
    stub.position.y = 0.7; g.add(stub);
    if(typeof sitShadow === 'function') g.add(sitShadow(0.45));
    return g;
  }

  // ── House lifecycle ────────────────────────────────────────────────────────
  function clearFarmers(){
    for(var i=0;i<farmers.length;i++){
      if(farmers[i].group && farmers[i].group.parent) scene.remove(farmers[i].group);
    }
    farmers.length = 0;
  }

  function spawnFarmerAt(kind, x, z, slots){
    var stub = buildStubFarmer();
    stub.position.set(x, 0, z);
    scene.add(stub);
    var rec = {
      group: stub, kind: kind, state: 'idle', timer: 1 + Math.random(),
      target: null, job: null, slots: slots || [], time: Math.random()*8,
      mixer: null, actions: {}, clips: null,
      currentAction: null, animName: ''
    };
    farmers.push(rec);
    parseFarmerInstance(kind, function(inst){
      if(!inst) return;
      // Swap stub for real skinned instance
      var px = rec.group.position.x, pz = rec.group.position.z, ry = rec.group.rotation.y;
      if(rec.group.parent) scene.remove(rec.group);
      inst.group.position.set(px, 0, pz);
      inst.group.rotation.y = ry;
      if(typeof sitShadow === 'function') inst.group.add(sitShadow(0.45));
      scene.add(inst.group);
      rec.group = inst.group;
      rec.mixer = inst.mixer;
      rec.clips = inst.clips;
      rec.actions = {};
      rec.currentAction = null;
      playClip(rec, 'Idle', {fade: 0.05});
    });
    return rec;
  }

  function homeAnchor(){
    if(!houseRec) return {x:0, z:0};
    var p = houseRec.group.position;
    return {x:p.x, z:p.z};
  }

  function refreshFarmers(){
    if(!houseRec){ clearFarmers(); return; }
    whenRigReady(function(){
      var need = farmerCount();
      var home = homeAnchor();
      var keepSlots = farmers.map(function(f){ return (f.slots || []).slice(); });
      clearFarmers();
      for(var i=0;i<need;i++){
        var kind = i === 0 ? 'male' : 'female';
        var a = i === 0 ? -0.85 : 0.85;
        var x = home.x + Math.cos(a)*1.9;
        var z = home.z + 1.7 + Math.sin(a)*0.3;
        var rec = spawnFarmerAt(kind, x, z, keepSlots[i] || []);
        rec.group.rotation.y = Math.atan2(home.x - x, home.z + 1.2 - z);
      }
    });
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
      f.timer = 1.35;
      // Duck = kneel/tend; Wave = soft water gesture for female farmer
      playClip(f, f.kind === 'female' ? 'Wave' : 'Duck', {fade: 0.12});
      for(var j=0;j<harvestItems.length;j++){
        var h = harvestItems[j];
        if(h && h._farmId === f.job.farmId && h.stage < 2){
          h.growTimer = (h.growTimer || 0) + (h.cfg ? h.cfg.growTime * 0.15 : 8);
        }
      }
    } else if(f.job.type === 'harvest'){
      f.state = 'work';
      f.timer = 1.1;
      playClip(f, 'Punch', {fade: 0.1});
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
      playClip(f, 'Idle');
    }
  }

  function stepFarmers(dt){
    if(!(dt > 0)) return;
    pruneSlots();
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
      if(f.mixer) f.mixer.update(dt);

      if(f.state === 'idle'){
        f.timer -= dt;
        if(f.animName !== 'Idle') playClip(f, 'Idle');
        f.group.position.y = 0;
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
          f.group.position.y = 0;
          doArrive(f);
        } else {
          var step = Math.min(dist, WALK * dt);
          f.group.position.x += dx / dist * step;
          f.group.position.z += dz / dist * step;
          f.group.rotation.y = Math.atan2(dx, dz);
          f.group.position.y = 0;
          if(f.animName !== 'Walk') playClip(f, 'Walk', {fade: 0.12});
        }
      } else if(f.state === 'work'){
        f.timer -= dt;
        f.group.position.y = 0;
        if(f.timer <= 0){
          f.job = null;
          f.target = null;
          f.state = 'idle';
          f.timer = 0.8 + Math.random();
          playClip(f, 'Idle');
          if(houseRec){
            var home = homeAnchor();
            var side = f.kind === 'female' ? 0.9 : -0.9;
            f.target = {x: home.x + Math.cos(side)*1.9, z: home.z + 1.7};
            f.state = 'walk';
            f.job = {type: 'return'};
            playClip(f, 'Walk', {fade: 0.12});
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

  loadFarmerRig();
  // After models/boot — rebind house from save
  if(typeof window.whenModelsReady === 'function'){
    window.whenModelsReady(function(){ setTimeout(function(){ window.bindFarmerHouseFromDecos(); }, 80); });
  } else {
    setTimeout(function(){ window.bindFarmerHouseFromDecos(); }, 400);
  }
})();

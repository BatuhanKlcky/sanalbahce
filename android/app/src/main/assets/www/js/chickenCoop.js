// Chicken Coop (Tavuk Kumesi) & Egg Production System
// Spawns 3D animated chickens around coop, manages egg cycles, feeding & collection.
(function(){
  var coops = [];
  var chickens = [];
  var eggsInWorld = [];
  var _chickBuf = null;
  var _chickGltf = null;
  var _isLoadingChick = false;

  var CHICK_URL = 'models/animals/Chick.glb';

  // Sound helper
  function playPop(pitch){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch || 520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime((pitch || 520) * 1.5, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.13);
      }
    } catch(e){}
  }

  function playCluck(){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var now = ctx.currentTime;
        [0, 0.08, 0.18].forEach(function(dt, i){
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.type = 'sawtooth';
          var freq = 340 + Math.random() * 80;
          osc.frequency.setValueAtTime(freq, now + dt);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + dt + 0.06);
          g.gain.setValueAtTime(0.08, now + dt);
          g.gain.linearRampToValueAtTime(0.001, now + dt + 0.06);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + dt); osc.stop(now + dt + 0.07);
        });
      }
    } catch(e){}
  }

  // Build architectural 3D Chicken Coop
  function createCoopMesh(){
    var root = new THREE.Group();
    root.name = 'ChickenCoopBuilding';

    // Materials
    var woodDark = new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.85 });
    var woodLight = new THREE.MeshStandardMaterial({ color: 0x9b6a38, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x963228, roughness: 0.75 }); // Red rustic roof
    var strawMat = new THREE.MeshStandardMaterial({ color: 0xd9b343, roughness: 0.95 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.8 });

    // 1. Raised foundation & stilts
    var stilts = [
      [-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]
    ];
    stilts.forEach(function(p){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 6), woodDark);
      post.position.set(p[0], 0.25, p[1]);
      post.castShadow = true;
      root.add(post);
    });

    // Floor deck
    var floor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 2.1), woodDark);
    floor.position.set(0, 0.5, 0);
    floor.receiveShadow = true;
    root.add(floor);

    // 2. Main Wooden Coop House
    var houseBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 1.7), woodLight);
    houseBody.position.set(-0.1, 1.25, 0);
    houseBody.castShadow = true;
    root.add(houseBody);

    // Doorway opening
    var doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.08), woodDark);
    doorFrame.position.set(0.4, 1.05, 0.86);
    root.add(doorFrame);

    var doorOpen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.04), new THREE.MeshBasicMaterial({ color: 0x1f140e }));
    doorOpen.position.set(0.4, 1.03, 0.88);
    root.add(doorOpen);

    // Ramp down to grass
    var ramp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 1.2), woodDark);
    ramp.position.set(0.4, 0.28, 1.35);
    ramp.rotation.x = 0.42;
    ramp.castShadow = true;
    root.add(ramp);

    // Ramp slats
    for(var s = 0; s < 4; s++){
      var slat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.05), woodLight);
      slat.position.set(0.4, 0.12 + s * 0.11, 1.0 + s * 0.24);
      slat.rotation.x = 0.42;
      root.add(slat);
    }

    // 3. Nesting Side Box (where hens lay eggs)
    var nestBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 1.2), woodLight);
    nestBox.position.set(-1.3, 0.95, 0);
    nestBox.castShadow = true;
    root.add(nestBox);

    var nestLid = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 1.3), woodDark);
    nestLid.position.set(-1.32, 1.36, 0);
    nestLid.rotation.z = -0.22;
    root.add(nestLid);

    // Straw bed inside/near nest box
    var straw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 1.0), strawMat);
    straw.position.set(-1.28, 0.65, 0);
    root.add(straw);

    // 4. A-frame Gable Roof
    var roofLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.0), roofMat);
    roofLeft.position.set(-0.6, 2.2, 0);
    roofLeft.rotation.z = 0.58;
    roofLeft.castShadow = true;
    root.add(roofLeft);

    var roofRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.0), roofMat);
    roofRight.position.set(0.45, 2.2, 0);
    roofRight.rotation.z = -0.58;
    roofRight.castShadow = true;
    root.add(roofRight);

    // Roof cap
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.05), woodDark);
    cap.position.set(-0.07, 2.65, 0);
    root.add(cap);

    // 5. Round Window / Vent
    var ventRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), woodDark);
    ventRing.position.set(-0.1, 2.1, 0.86);
    root.add(ventRing);

    // 6. Lantern hanging from roof peak
    var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), metalMat);
    chain.position.set(-0.07, 2.4, 1.05);
    root.add(chain);

    var lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.2, 6), metalMat);
    lantern.position.set(-0.07, 2.18, 1.05);
    root.add(lantern);

    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe680 }));
    glow.position.set(-0.07, 2.18, 1.05);
    root.add(glow);

    // 7. Chicken Wire Run / Paddock Fence
    var fenceMat = new THREE.MeshStandardMaterial({ color: 0x8a7052, roughness: 0.9 });
    var posts = [
      [1.8, 1.8], [1.8, -1.8], [-1.8, -1.8], [-1.8, 1.8], [0, 1.8], [0, -1.8]
    ];
    posts.forEach(function(pos){
      var fp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6), fenceMat);
      fp.position.set(pos[0], 0.45, pos[1]);
      fp.castShadow = true;
      root.add(fp);
    });

    // Horizontal rails
    var railZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 3.6), fenceMat);
    railZ1.position.set(1.8, 0.6, 0);
    root.add(railZ1);
    var railZ2 = railZ1.clone();
    railZ2.position.set(-1.8, 0.6, 0);
    root.add(railZ2);

    // 8. Feed Bowl (Yem Kabı)
    var trough = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), woodDark);
    trough.position.set(1.1, 0.08, 0.8);
    trough.rotation.y = -0.3;
    root.add(trough);

    var grains = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.22), strawMat);
    grains.position.set(1.1, 0.12, 0.8);
    grains.rotation.y = -0.3;
    root.add(grains);

    // 9. Interactive Sign / Floating badge helper
    root.userData.isChickenCoop = true;
    root.userData.interactType = 'chicken_coop';

    return root;
  }

  // Load Chick ArrayBuffer once, parse fresh for each instance to prevent bone matrix leaks
  function loadChickBuffer(onDone){
    if(_chickBuf){ onDone(_chickBuf); return; }
    if(typeof THREE === 'undefined' || !THREE.GLTFLoader){
      setTimeout(function(){ loadChickBuffer(onDone); }, 200);
      return;
    }
    var cleanUrl = CHICK_URL;
    var candidates = [
      cleanUrl,
      cleanUrl + '?cb=' + Date.now(),
      'https://raw.githubusercontent.com/BatuhanKlcky/sanalbahce/main/' + cleanUrl
    ];
    var cIdx = 0;
    function tryNext(){
      if(cIdx >= candidates.length){
        console.warn('[ChickenCoop] Chick.glb buffer failed, using procedural fallback');
        onDone(null);
        return;
      }
      var target = candidates[cIdx++];
      if(typeof fetch === 'function'){
        fetch(target).then(function(r){
          if(!r.ok) throw new Error(r.status);
          return r.arrayBuffer();
        }).then(function(buf){
          _chickBuf = buf;
          onDone(buf);
        }).catch(function(){ tryNext(); });
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', target, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(){
          if(xhr.status === 200 || xhr.status === 0){
            _chickBuf = xhr.response;
            onDone(xhr.response);
          } else tryNext();
        };
        xhr.onerror = tryNext;
        xhr.send(null);
      }
    }
    tryNext();
  }

  // Fallback Procedural Chick if GLB fails
  function makeProceduralChick(){
    var g = new THREE.Group();
    var yellow = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.7 });
    var orange = new THREE.MeshStandardMaterial({ color: 0xef7a18, roughness: 0.6 });
    var black = new THREE.MeshBasicMaterial({ color: 0x111111 });

    var body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), yellow);
    body.position.y = 0.24;
    body.scale.set(1, 0.9, 1.2);
    g.add(body);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), yellow);
    head.position.set(0, 0.38, 0.15);
    g.add(head);

    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), orange);
    beak.position.set(0, 0.36, 0.28);
    beak.rotation.x = Math.PI / 2;
    g.add(beak);

    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), black);
    eyeL.position.set(0.08, 0.4, 0.22);
    g.add(eyeL);
    var eyeR = eyeL.clone();
    eyeR.position.set(-0.08, 0.4, 0.22);
    g.add(eyeR);

    var comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: 0xd62828 }));
    comb.position.set(0, 0.49, 0.12);
    g.add(comb);

    g.scale.setScalar(0.7);
    return { group: g, mixer: null, isProcedural: true };
  }

  // Create individual animated chicken
  function spawnChicken(coop, index){
    var ch = {
      coop: coop,
      group: null,
      mixer: null,
      action: null,
      x: coop.x + (Math.random() - 0.5) * 2.6,
      z: coop.z + (Math.random() - 0.5) * 2.6,
      tx: coop.x,
      tz: coop.z,
      state: 'idle', // idle, walk, peck
      timer: 1 + Math.random() * 3,
      cluckTimer: 5 + Math.random() * 10,
      rotY: Math.random() * Math.PI * 2,
      scale: 0.55 + Math.random() * 0.1
    };

    loadChickBuffer(function(buf){
      if(!buf){
        var proc = makeProceduralChick();
        ch.group = proc.group;
        ch.isProcedural = true;
        finishSpawn();
        return;
      }

      try {
        new THREE.GLTFLoader().parse(buf.slice(0), '', function(gltf){
          var body = gltf.scene;
          var box = new THREE.Box3().setFromObject(body);
          var h = Math.max(0.1, box.max.y - box.min.y);
          body.position.y -= box.min.y;
          var wrap = new THREE.Group();
          wrap.add(body);
          wrap.scale.setScalar(0.6 / h);

          ch.group = wrap;
          if(gltf.animations && gltf.animations.length > 0){
            ch.mixer = new THREE.AnimationMixer(body);
            ch.action = ch.mixer.clipAction(gltf.animations[0]);
            ch.action.play();
          }
          finishSpawn();
        }, function(){
          var proc = makeProceduralChick();
          ch.group = proc.group;
          ch.isProcedural = true;
          finishSpawn();
        });
      } catch(e){
        var proc = makeProceduralChick();
        ch.group = proc.group;
        ch.isProcedural = true;
        finishSpawn();
      }
    });

    function finishSpawn(){
      if(!ch.group) return;
      ch.group.position.set(ch.x, 0, ch.z);
      ch.group.rotation.y = ch.rotY;
      ch.group.traverse(function(c){
        if(c.isMesh){
          c.frustumCulled = true;
          c.castShadow = !isMobile;
          c.receiveShadow = !isMobile;
        }
      });
      scene.add(ch.group);
    }

    chickens.push(ch);
    return ch;
  }

  var _sharedEggMat = null;
  var _sharedGlowMat = null;

  // Create an egg on the ground or in nest (Zero GC overhead)
  function spawnEgg(x, y, z){
    var eggGroup = new THREE.Group();
    if(!_sharedEggMat){
      _sharedEggMat = new THREE.MeshStandardMaterial({
        color: 0xfff6ea, roughness: 0.5, metalness: 0.05
      });
      _sharedGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffd23f, side: THREE.DoubleSide, transparent: true, opacity: 0.6
      });
    }
    var eggMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), _sharedEggMat);
    eggMesh.scale.set(0.85, 1.25, 0.85);
    eggMesh.position.y = 0.12;
    eggMesh.castShadow = !isMobile;
    eggGroup.add(eggMesh);

    // Soft glow ring underneath
    var glowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.22, 12),
      _sharedGlowMat
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.02;
    eggGroup.add(glowRing);

    eggGroup.position.set(x, y || 0, z);
    eggGroup.userData.isEgg = true;
    eggGroup.userData.created = Date.now();
    scene.add(eggGroup);

    eggsInWorld.push(eggGroup);
    return eggGroup;
  }

  // Update loop for chickens and coops
  function stepChickenCoop(dt, now){
    if(dt > 0.1) dt = 0.1;

    // 1. Coops egg generation logic
    for(var c = 0; c < coops.length; c++){
      var coop = coops[c];
      coop.eggTimer = (coop.eggTimer || 0) + dt;
      var interval = coop.isFed ? 25 : 50; // Boosted if fed wheat!

      if(coop.eggTimer >= interval){
        coop.eggTimer = 0;
        // Count nearby eggs without allocating arrays
        var nearbyCount = 0;
        var cx = coop.x, cz = coop.z;
        for(var ei = 0; ei < eggsInWorld.length; ei++){
          var ep = eggsInWorld[ei].position;
          if(Math.hypot(ep.x - cx, ep.z - cz) < 4.0) nearbyCount++;
        }
        if(nearbyCount < 6){
          var ox = (Math.random() - 0.5) * 2.2;
          var oz = (Math.random() - 0.5) * 2.2;
          spawnEgg(cx + ox, 0, cz + oz);
          playCluck();
          if(typeof showFloatingNotice === 'function'){
            showFloatingNotice('🥚 Tavuklar taze bir yumurta yumurtladı!', cx, 1.5, cz);
          }
        }
      }

      // Check fed timer expiry
      if(coop.isFed && coop.fedUntil && now > coop.fedUntil){
        coop.isFed = false;
      }
    }

    // 2. Chicken AI behavior & animations
    for(var i = 0; i < chickens.length; i++){
      var ch = chickens[i];
      if(!ch.group) continue;

      if(ch.mixer) ch.mixer.update(dt);

      ch.timer -= dt;
      ch.cluckTimer -= dt;

      if(ch.cluckTimer <= 0){
        ch.cluckTimer = 12 + Math.random() * 20;
        // Small jump on cluck
        ch.group.position.y = 0.12;
      } else if(ch.group.position.y > 0){
        ch.group.position.y = Math.max(0, ch.group.position.y - dt * 1.5);
      }

      if(ch.timer <= 0){
        // Switch state
        var r = Math.random();
        if(r < 0.45){
          ch.state = 'idle';
          ch.timer = 1.5 + Math.random() * 2.5;
        } else if(r < 0.75){
          ch.state = 'peck';
          ch.timer = 1.0 + Math.random() * 2.0;
        } else {
          ch.state = 'walk';
          ch.timer = 2.0 + Math.random() * 3.0;
          // Target random point inside coop boundary
          var ang = Math.random() * Math.PI * 2;
          var dist = 0.5 + Math.random() * 1.6;
          ch.tx = ch.coop.x + Math.cos(ang) * dist;
          ch.tz = ch.coop.z + Math.sin(ang) * dist;
        }
      }

      if(ch.state === 'walk'){
        var dx = ch.tx - ch.x;
        var dz = ch.tz - ch.z;
        var d = Math.hypot(dx, dz);
        if(d > 0.05){
          var spd = 0.8 * dt;
          ch.x += (dx / d) * Math.min(d, spd);
          ch.z += (dz / d) * Math.min(d, spd);
          var targetAngle = Math.atan2(dx, dz);
          ch.rotY += (targetAngle - ch.rotY) * 0.15;
          // Walking waddle
          ch.group.rotation.z = Math.sin(now * 12) * 0.12;
        } else {
          ch.state = 'peck';
          ch.timer = 1.5;
        }
      } else if(ch.state === 'peck'){
        ch.group.rotation.x = Math.max(0, Math.sin(now * 10)) * 0.45;
        ch.group.rotation.z = 0;
      } else {
        ch.group.rotation.x = 0;
        ch.group.rotation.z = 0;
      }

      ch.group.position.x = ch.x;
      ch.group.position.z = ch.z;
      ch.group.rotation.y = ch.rotY;
    }

    // 3. Egg bobbing & gentle sparkle
    for(var e = 0; e < eggsInWorld.length; e++){
      var egg = eggsInWorld[e];
      if(egg){
        egg.rotation.y += dt * 1.2;
        var mesh = egg.children[0];
        if(mesh){
          mesh.position.y = 0.12 + Math.sin(now * 4 + e) * 0.04;
        }
      }
    }
  }

  // Collect eggs near position or all
  function collectEggs(cx, cz, radius){
    var r = radius || 5.0;
    var collected = 0;
    for(var i = eggsInWorld.length - 1; i >= 0; i--){
      var eg = eggsInWorld[i];
      if(Math.hypot(eg.position.x - cx, eg.position.z - cz) <= r){
        scene.remove(eg);
        eggsInWorld.splice(i, 1);
        collected++;
      }
    }
    if(collected > 0){
      if(typeof inventory !== 'undefined'){
        inventory.egg = (inventory.egg || 0) + collected;
        if(typeof window.save === 'function') window.save();
      }
      playPop(650);
      if(typeof window.triggerHarvestEffect === 'function'){
        window.triggerHarvestEffect(cx, 1.0, cz, 'egg');
      }
      if(typeof showFloatingNotice === 'function'){
        showFloatingNotice('🥚 +' + collected + ' Taze Yumurta Toplandı!', cx, 2.0, cz);
      }
    }
    return collected;
  }

  // Feed chickens with wheat for double speed egg production
  function feedChickens(coop){
    if(typeof inventory === 'undefined' || !inventory.wheat || inventory.wheat < 1){
      if(typeof showNotice === 'function'){
        showNotice('🌾 Tavukları beslemek için buğday gerekiyor!');
      }
      return false;
    }
    inventory.wheat--;
    coop.isFed = true;
    coop.fedUntil = Date.now() + 180000; // 3 minutes double egg speed
    playPop(800);
    if(typeof showFloatingNotice === 'function'){
      showFloatingNotice('🌾 Tavuklar yemlendi! (Yumurtlama hızı 2x)', coop.x, 2.0, coop.z);
    }
    if(typeof window.save === 'function') window.save();
    return true;
  }

  // Open Chicken Coop Interactive Modal
  function openCoopDialog(coop){
    var existing = document.getElementById('chickenCoopModal');
    if(existing) existing.remove();

    var uncollected = eggsInWorld.filter(function(e){
      return Math.hypot(e.position.x - coop.x, e.position.z - coop.z) <= 5.0;
    }).length;

    var wheatCount = (typeof inventory !== 'undefined' && inventory.wheat) ? inventory.wheat : 0;
    var eggCount = (typeof inventory !== 'undefined' && inventory.egg) ? inventory.egg : 0;
    var fedStatus = coop.isFed ? '🌾 <span style="color:#4ade80;font-weight:bold;">Yemlendi (Hızlı Yumurtlama Aktif)</span>' : '⏳ Normal Hız';

    var modal = document.createElement('div');
    modal.id = 'chickenCoopModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    modal.innerHTML = ''
      + '<div style="background:#1e293b;border:2px solid #f59e0b;border-radius:20px;max-width:380px;width:100%;color:#fff;padding:22px;box-shadow:0 20px 40px rgba(0,0,0,0.5);text-align:center;position:relative;">'
      + '  <button id="closeCoopBtn" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:4px 8px;">✕</button>'
      + '  <div style="font-size:42px;margin-bottom:6px;">🐔</div>'
      + '  <h2 style="margin:0 0 6px;color:#fde047;font-size:20px;font-weight:800;">Köy Tavuk Kümesi</h2>'
      + '  <p style="margin:0 0 16px;color:#cbd5e1;font-size:13px;">Tavukların bakımını yap, taze köy yumurtalarını topla ve aşçıya sat veya fırında tarifler yap!</p>'
      + '  <div style="background:#0f172a;border-radius:14px;padding:14px;margin-bottom:16px;text-align:left;font-size:13px;line-height:1.7;">'
      + '    <div>📦 <b>Sepetteki Yumurtalar:</b> <span style="color:#fde047;font-weight:bold;">' + uncollected + ' adet</span></div>'
      + '    <div>🎒 <b>Envanterdeki Yumurta:</b> <span style="color:#67e8f9;font-weight:bold;">' + eggCount + ' adet</span></div>'
      + '    <div>🌾 <b>Mevcut Buğday:</b> <span style="color:#a7f3d0;font-weight:bold;">' + wheatCount + ' adet</span></div>'
      + '    <div>⚡ <b>Durum:</b> ' + fedStatus + '</div>'
      + '  </div>'
      + '  <div style="display:flex;flex-direction:column;gap:10px;">'
      + '    <button id="collectEggsBtn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:12px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(245,158,11,0.3);">'
      + '      🥚 Yumurtaları Topla (' + uncollected + ' Adet)'
      + '    </button>'
      + '    <button id="feedChickensBtn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:12px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);">'
      + '      🌾 Tavukları Besle (-1 Buğday = 2x Hız)'
      + '    </button>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(modal);

    document.getElementById('closeCoopBtn').onclick = function(){ modal.remove(); };
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };

    document.getElementById('collectEggsBtn').onclick = function(){
      var cnt = collectEggs(coop.x, coop.z, 5.0);
      if(cnt === 0){
        if(typeof showNotice === 'function') showNotice('Henüz toplanacak yumurta yok, biraz bekle!');
      }
      modal.remove();
    };

    document.getElementById('feedChickensBtn').onclick = function(){
      feedChickens(coop);
      modal.remove();
    };
  }

  // Register chicken coop in world
  function registerCoop(decoObj){
    if(!decoObj) return;
    var x = decoObj.x || (decoObj.group ? decoObj.group.position.x : 0);
    var z = decoObj.z || (decoObj.group ? decoObj.group.position.z : 0);

    var existing = coops.find(function(c){
      return Math.hypot(c.x - x, c.z - z) < 1.0;
    });
    if(existing) return existing;

    var coop = {
      deco: decoObj,
      mesh: decoObj.group,
      x: x,
      z: z,
      isFed: false,
      eggTimer: 10 + Math.random() * 15,
      chickens: []
    };

    // Attach click listener to mesh
    if(decoObj.group){
      decoObj.group.userData.coopRef = coop;
      decoObj.group.userData.onTap = function(){
        openCoopDialog(coop);
      };
    }

    // Spawn 4 animated chickens around coop
    for(var k = 0; k < 4; k++){
      var ch = spawnChicken(coop, k);
      coop.chickens.push(ch);
    }

    // Spawn 1 initial egg so player sees it right away
    spawnEgg(x + 0.8, 0, z + 0.8);

    coops.push(coop);
    return coop;
  }

  // Scan existing decos for chicken coop
  function bindCoopsFromDecos(){
    if(typeof decos !== 'undefined' && Array.isArray(decos)){
      decos.forEach(function(d){
        if(d && d.type === 'chicken_coop'){
          registerCoop(d);
        }
      });
    }
  }

  // Export to window
  window.createCoopMesh = createCoopMesh;
  window.registerChickenCoop = registerCoop;
  window.bindCoopsFromDecos = bindCoopsFromDecos;
  window.stepChickenCoop = stepChickenCoop;
  window.collectEggs = collectEggs;
  window.openCoopDialog = openCoopDialog;
  window.chickenCoops = coops;
  window.eggsInWorld = eggsInWorld;
})();

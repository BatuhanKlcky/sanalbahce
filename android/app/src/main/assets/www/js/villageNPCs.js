// Village NPCs (Koylu & Balikci) with A-Quality Skinned Skeletal Animations
// Uses Quaternius Farmer/Worker rigs with AnimationMixer (Idle, Wave, Duck, Punch)
(function(){
  var npcs = [];
  var _chefPropGroup = null;

  // Sound effects
  function playVoice(type){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        var baseFreq = type === 'fisherman' ? 190 : 260;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.08);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + 0.16);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.19);
      }
    } catch(e){}
  }

  // Load a decorative GLB model helper
  function loadGlbDecor(url, onDone){
    if(typeof THREE === 'undefined' || !THREE.GLTFLoader){
      setTimeout(function(){ loadGlbDecor(url, onDone); }, 200);
      return;
    }
    var loader = new THREE.GLTFLoader();
    var clean = url.replace(/\?.*$/, '');
    var candidates = [
      clean,
      clean + '?cb=' + Date.now(),
      'https://raw.githubusercontent.com/BatuhanKlcky/sanalbahce/main/' + clean
    ];
    var idx = 0;
    function tryNext(){
      if(idx >= candidates.length){ onDone(null); return; }
      loader.load(candidates[idx++], function(gltf){
        onDone(gltf.scene);
      }, undefined, function(){
        tryNext();
      });
    }
    tryNext();
  }

  // Build Fisherman Accessory: 3D Fishing Rod attached to hand
  function createFishingRodMesh(){
    var rodGroup = new THREE.Group();
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.6 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
    var corkMat = new THREE.MeshStandardMaterial({ color: 0xc49a45, roughness: 0.9 });

    // Handle
    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.45, 8), corkMat);
    handle.position.y = 0.2;
    rodGroup.add(handle);

    // Reel
    var reel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), metalMat);
    reel.rotation.z = Math.PI / 2;
    reel.position.set(0.04, 0.35, 0);
    rodGroup.add(reel);

    // Rod pole (long tapered bamboo)
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.022, 2.2, 8), woodMat);
    pole.position.set(0, 1.45, 0);
    rodGroup.add(pole);

    // Line guides / rings
    for(var i = 0; i < 4; i++){
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12), metalMat);
      ring.position.set(0.02, 0.7 + i * 0.45, 0);
      ring.rotation.y = Math.PI / 2;
      rodGroup.add(ring);
    }

    // Line hanging down with bobber
    var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    var lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.02, 2.5, 0),
      new THREE.Vector3(0.3, 0.2, 0.5)
    ]);
    var line = new THREE.Line(lineGeo, lineMat);
    rodGroup.add(line);

    // Bobber
    var bobberTop = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    bobberTop.position.set(0.3, 0.2, 0.5);
    rodGroup.add(bobberTop);

    return rodGroup;
  }



  // 5 Distinct Village NPC Archetype Palettes (Quaternius Rig Mesh Material Styling)
  var NPC_PALETTES = {
    fisherman: {
      LightBlue: 0x19376d, // Deep sea nautical navy sweater
      Brown: 0xf39c12,     // Golden yellow fisherman slicker straps
      Beige: 0xdce1de,     // Sailor collar / wool under-shirt
      Brown2: 0x1f2421,    // Heavy black sea boots
      Red: 0xd90429        // Sailor red bandana
    },
    baker: {
      Worker_Vest: 0xf8f9fa,   // Pure flour-white baker apron
      Worker_Yellow: 0xdd6e42, // Warm rustic terracotta dress
      White: 0xfff3e2,         // White flour-dusted baker headwrap
      Black: 0x3d312a,         // Kitchen leather clogs
      DarkBrown: 0x5c4033       // Hazel hair
    },
    muhtar: {
      LightBlue: 0x2d6a4f, // Emerald village green waistcoat
      Brown: 0x7f4f24,     // Amber-brown leather belt & trim
      Beige: 0xffeedd,     // Crisp linen cream formal shirt
      Brown2: 0x4a151e,    // Cordovan wine-red polished boots
      Red: 0xee9b00        // Gold pocket watch chain & handkerchief
    },
    blacksmith: {
      LightBlue: 0x2b2d42, // Soot-dark charcoal smithing tunic
      Brown: 0x3d2618,     // Fireproof dark leather smithing apron
      Beige: 0x6c757d,     // Ash-grey work sleeves
      Brown2: 0x1e1e24,    // Steel-capped black work boots
      Red: 0x9e2a2b        // Forgemaster crimson headband
    },
    herbalist: {
      Worker_Vest: 0x5a189a,   // Royal violet embroidered traveling vest
      Worker_Yellow: 0xf4a261, // Saffron amber pleated silk skirt
      White: 0xa3b18a,         // Sage green lace shawl
      Black: 0x2b2d42,         // Soft dark traveling boots
      DarkBrown: 0x1f1f1f       // Raven black hair
    }
  };

  function applyNpcPalette(root, paletteKey){
    var pal = NPC_PALETTES[paletteKey];
    if(!root || !pal) return;
    root.traverse(function(c){
      if(!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material.slice(0) : [c.material];
      var changed = false;
      for(var i = 0; i < mats.length; i++){
        var m = mats[i];
        if(!m) continue;
        var col = pal[m.name];
        if(col != null){
          var cloned = m.clone();
          cloned.color.setHex(col);
          mats[i] = cloned;
          changed = true;
        }
      }
      if(changed){
        c.material = Array.isArray(c.material) ? mats : mats[0];
      }
    });
  }

  // Spawn Fisherman NPC at Shore Pier
  function spawnFisherman(x, y, z, rotY){
    var npc = {
      id: 'fisherman',
      name: 'Balıkçı Reis (Cemil Usta)',
      role: 'Usta Balıkçı',
      x: x, y: y, z: z,
      rotY: rotY != null ? rotY : 1.85, // Looking towards water
      group: null,
      mixer: null,
      clips: null,
      currentAction: null,
      animName: 'Idle',
      talkTimer: 0,
      rodMesh: null
    };

    function attachRig(rec){
      if(!rec){
        console.warn('[VillageNPC] Could not parse farmer rig for Fisherman');
        return;
      }
      npc.group = rec.group;
      npc.mixer = rec.mixer;
      npc.clips = rec.clips;
      npc.body = rec.body;

      // Apply distinct nautical clothing palette
      applyNpcPalette(rec.body, 'fisherman');

      npc.group.position.set(npc.x, npc.y, npc.z);
      npc.group.rotation.y = npc.rotY;

      // Attach Fishing Rod to NPC group at hand position (zero bone matrix explosion)
      var rod = createFishingRodMesh();
      rod.scale.setScalar(0.75);
      rod.position.set(0.28, 0.65, 0.35);
      rod.rotation.set(0.55, -0.25, -0.2);
      npc.group.add(rod);
      npc.rodMesh = rod;

      // Play Idle clip
      if(npc.clips && npc.clips.Idle){
        npc.currentAction = npc.mixer.clipAction(npc.clips.Idle);
        npc.currentAction.play();
      }

      // Raycast & click support
      npc.group.userData.npcRef = npc;
      npc.group.userData.onTap = function(){
        openFishermanDialog();
      };
      npc.group.traverse(function(c){
        if(c.isMesh){
          c.castShadow = !isMobile;
          c.userData.npcRef = npc;
        }
      });

      scene.add(npc.group);
      npcs.push(npc);
    }

    if(typeof window.parseFarmerInstance === 'function'){
      window.parseFarmerInstance('male', attachRig);
    } else {
      setTimeout(function(){
        if(typeof window.parseFarmerInstance === 'function') window.parseFarmerInstance('male', attachRig);
      }, 500);
    }

    return npc;
  }

  // Spawn Village Chef & Baker NPC (Fatma Bacı)
  function spawnVillageChef(x, y, z){
    var npc = {
      id: 'chef',
      name: 'Aşçı & Fırıncı (Fatma Bacı)',
      role: 'Köy Baş Fırıncısı',
      x: x, y: y, z: z,
      rotY: Math.PI,
      group: null,
      mixer: null,
      clips: null,
      currentAction: null,
      animName: 'Idle'
    };

    function attachRig(rec){
      if(!rec){
        console.warn('[VillageNPC] Could not parse farmer rig for Chef');
        return;
      }
      npc.group = rec.group;
      npc.mixer = rec.mixer;
      npc.clips = rec.clips;
      npc.body = rec.body;

      // Apply distinct baker white apron and terracotta dress
      applyNpcPalette(rec.body, 'baker');

      npc.group.position.set(npc.x, npc.y, npc.z);
      npc.group.rotation.y = npc.rotY;

      // Wooden cooking ladle in hand
      var ladle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.7, 6),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
      );
      ladle.position.set(0.2, 0.7, 0.2);
      ladle.rotation.z = -0.6;
      npc.group.add(ladle);

      // Play Idle clip
      if(npc.clips && npc.clips.Idle){
        npc.currentAction = npc.mixer.clipAction(npc.clips.Idle);
        npc.currentAction.play();
      }

      npc.group.userData.npcRef = npc;
      npc.group.userData.onTap = function(){
        openChefDialog();
      };
      npc.group.traverse(function(c){
        if(c.isMesh){
          c.castShadow = !isMobile;
          c.userData.npcRef = npc;
        }
      });

      scene.add(npc.group);
      npcs.push(npc);
    }

    if(typeof window.parseFarmerInstance === 'function'){
      window.parseFarmerInstance('female', attachRig);
    } else {
      setTimeout(function(){
        if(typeof window.parseFarmerInstance === 'function') window.parseFarmerInstance('female', attachRig);
      }, 500);
    }

    return npc;
  }

  // 3D Village Kitchen & Bakery Shop Building (Köy Mutfağı & Fırın Dükkanı)
  function buildVillageKitchenShop(cx, cz){
    var g = new THREE.Group();
    g.position.set(cx, 0, cz);

    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a544c, roughness: 0.95 });
    var woodDark = new THREE.MeshStandardMaterial({ color: 0x4e3118, roughness: 0.85 });
    var woodLight = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8 });
    var clothRed = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
    var clothWhite = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });

    // 1. Organic stepping stones in front of the bakery shop
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x827d74, roughness: 0.9 });
    var shopStoneCoords = [
      [0, 1.8, 0.42], [-0.8, 1.6, 0.36], [0.8, 1.65, 0.38],
      [-0.4, 0.9, 0.35], [0.4, 0.95, 0.34],
      [0, 0.2, 0.4]
    ];
    shopStoneCoords.forEach(function(sc){
      var stone = new THREE.Mesh(new THREE.CylinderGeometry(sc[2], sc[2] * 1.08, 0.04, 7), stoneMat);
      stone.position.set(sc[0], 0.02, sc[1]);
      stone.rotation.y = (sc[0] * 2.8 + sc[1] * 1.7) % Math.PI;
      stone.receiveShadow = !isMobile;
      g.add(stone);
    });

    // 2. The Kitchen Shop Building (Quaternius Inn.glb scaled to ~4.0m)
    loadGlbDecor('models/village/Inn.glb', function(shopMesh){
      if(shopMesh){
        var box = new THREE.Box3().setFromObject(shopMesh);
        var h = Math.max(0.1, box.max.y - box.min.y);
        shopMesh.scale.setScalar(4.0 / h);
        shopMesh.position.set(0, 0, -2.4);
        shopMesh.rotation.y = Math.PI;
        g.add(shopMesh);
      } else {
        // Fallback timber bakery shop
        var bldg = new THREE.Mesh(
          new THREE.BoxGeometry(5.2, 3.4, 4.2),
          new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 })
        );
        bldg.position.set(0, 1.7, -2.4);
        g.add(bldg);
      }
    });

    // 3. Front Bakery Counter & Display Table
    var counterGroup = new THREE.Group();
    counterGroup.position.set(0, 0, 1.2);

    var table = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.9), woodDark);
    table.position.y = 0.45;
    table.castShadow = !isMobile;
    counterGroup.add(table);

    // Striped bakery canopy over counter
    for(var st = 0; st < 5; st++){
      var sMat = (st % 2 === 0) ? clothRed : clothWhite;
      var cStripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 1.2), sMat);
      cStripe.position.set(-1.12 + st * 0.56, 2.3, 0);
      cStripe.rotation.x = 0.12;
      counterGroup.add(cStripe);
    }
    // Canopy posts
    [-1.3, 1.3].forEach(function(px){
      var p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.3, 6), woodDark);
      p.position.set(px, 1.15, 0.4);
      counterGroup.add(p);
    });

    // Fresh baked pies, breads, pastries on counter
    var bread1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }));
    bread1.position.set(-0.7, 0.96, 0);
    counterGroup.add(bread1);

    var pie = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 }));
    pie.position.set(0, 0.94, 0);
    counterGroup.add(pie);

    var jamJar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }));
    jamJar.position.set(0.65, 0.98, 0);
    counterGroup.add(jamJar);

    // Hanging sign: "🥖 KÖY MUTFAĞI & FIRINI"
    var sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.06), woodLight);
    sign.position.set(0, 2.05, 0.62);
    counterGroup.add(sign);

    g.add(counterGroup);

    // 4. Stone Baking Oven & Hearth Cauldron
    loadGlbDecor('models/village/Cauldron.glb', function(cauld){
      if(cauld){
        cauld.scale.setScalar(1.2);
        cauld.position.set(2.4, 0, 0.8);
        g.add(cauld);
      }
    });

    // Glowing warm fire coals under pot
    var coals = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.42, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a1005, emissive: 0xd9480f, emissiveIntensity: 0.85 })
    );
    coals.position.set(2.4, 0.06, 0.8);
    g.add(coals);

    // 5. Village Props: Flour bags, barrels, bench
    loadGlbDecor('models/village/Bags.glb', function(bags){
      if(bags){ bags.scale.setScalar(1.0); bags.position.set(-2.4, 0, 0.5); g.add(bags); }
    });
    loadGlbDecor('models/village/Barrel.glb', function(barrel){
      if(barrel){ barrel.scale.setScalar(0.95); barrel.position.set(-2.6, 0, 1.8); g.add(barrel); }
    });
    loadGlbDecor('models/village/Bench_1.glb', function(bench){
      if(bench){ bench.scale.setScalar(1.1); bench.position.set(2.2, 0, -0.6); bench.rotation.y = -Math.PI / 2; g.add(bench); }
    });

    // Tapping anywhere on the shop opens Chef dialog
    g.userData.isKitchenShop = true;
    g.userData.onTap = function(){
      openChefDialog();
    };

    scene.add(g);
    _chefPropGroup = g;
    return g;
  }

  // Play a specific animation clip on an NPC
  function playNpcClip(npc, clipName, duration){
    if(!npc || !npc.mixer || !npc.clips) return;
    var clip = npc.clips[clipName];
    if(!clip) return;
    var next = npc.mixer.clipAction(clip);
    if(npc.currentAction && npc.currentAction !== next){
      npc.currentAction.fadeOut(0.2);
    }
    next.reset().fadeIn(0.2).play();
    npc.currentAction = next;
    npc.animName = clipName;

    if(duration && clipName !== 'Idle'){
      setTimeout(function(){
        if(npc.clips.Idle && npc.animName === clipName){
          var idleAct = npc.mixer.clipAction(npc.clips.Idle);
          next.fadeOut(0.25);
          idleAct.reset().fadeIn(0.25).play();
          npc.currentAction = idleAct;
          npc.animName = 'Idle';
        }
      }, duration);
    }
  }

  // NPC Update Loop
  function stepVillageNPCs(dt, now){
    if(dt > 0.1) dt = 0.1;
    var cam = (typeof camera !== 'undefined') ? camera : null;
    var fc = (typeof window._fc === 'number') ? window._fc : 0;
    for(var i = 0; i < npcs.length; i++){
      var npc = npcs[i];
      if(!npc || !npc.mixer || !npc.group || npc.group.visible === false) continue;

      if(npc.mixer){
        var nDistSq = cam ? npc.group.position.distanceToSquared(cam.position) : 0;
        if(nDistSq > 1600){
          if((i + fc) % 4 === 0) npc.mixer.update(dt * 4);
        } else if(nDistSq > 625){
          if((i + fc) % 3 === 0) npc.mixer.update(dt * 3);
        } else {
          if((i + fc) % 2 === 0) npc.mixer.update(dt * 2);
        }
      }

      // Periodic natural gestures (wave at player if camera near, or duck/fiddle)
      npc.talkTimer = (npc.talkTimer || 0) + dt;
      if(npc.talkTimer >= 14){
        npc.talkTimer = 0;
        var r = Math.random();
        if(r < 0.4 && npc.clips.Wave){
          playNpcClip(npc, 'Wave', 2400);
        } else if(r < 0.7 && npc.clips.Duck){
          playNpcClip(npc, 'Duck', 2000);
        }
      }

      // Gentle fishing rod flex for fisherman
      if(npc.id === 'fisherman' && npc.rodMesh){
        npc.rodMesh.rotation.x = 0.45 + Math.sin(now * 3) * 0.05;
      }
    }
  }

  // ==========================================
  // INTERACTIVE DIALOGS & TRADING MECHANICS
  // ==========================================

  // 1. Fisherman Reis Dialog (Balıkçı İskelesi)
  function openFishermanDialog(){
    playVoice('fisherman');
    var existing = document.getElementById('villageNpcModal');
    if(existing) existing.remove();

    var fishCount = (typeof inventory !== 'undefined' && inventory.fish) ? inventory.fish : 0;
    var troutCount = (typeof inventory !== 'undefined' && inventory.fish_trout) ? inventory.fish_trout : 0;
    var carpCount = (typeof inventory !== 'undefined' && inventory.fish_carp) ? inventory.fish_carp : 0;
    var goldenCount = (typeof inventory !== 'undefined' && inventory.fish_golden) ? inventory.fish_golden : 0;

    var totalFish = fishCount + troutCount + carpCount + goldenCount;

    var modal = document.createElement('div');
    modal.id = 'villageNpcModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    modal.innerHTML = ''
      + '<div style="background:#0f172a;border:2px solid #38bdf8;border-radius:22px;max-width:420px;width:100%;color:#fff;padding:22px;box-shadow:0 25px 50px rgba(0,0,0,0.6);position:relative;">'
      + '  <button id="closeNpcModal" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">✕</button>'
      + '  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'
      + '    <div style="font-size:44px;background:#1e293b;border-radius:16px;padding:8px 12px;border:1px solid #0284c7;">🎣</div>'
      + '    <div>'
      + '      <h2 style="margin:0;font-size:19px;color:#38bdf8;font-weight:800;">Balıkçı Reis (Hamdi Dayı)</h2>'
      + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Kıyı İskelesi Balık Ustası</div>'
      + '    </div>'
      + '  </div>'
      + '  <p style="background:#1e293b;border-left:4px solid #38bdf8;padding:10px 12px;border-radius:8px;margin:0 0 16px;font-size:13px;line-height:1.5;color:#e2e8f0;">'
      + '    "Rastgele evlat! Göletin suyu bugün berrak. Taze balıklarını bana satabilir ya da yeni olta atıp bereketli avlar yakalayabilirsin!"'
      + '  </p>'
      + '  <div style="background:#1e293b;border-radius:14px;padding:12px;margin-bottom:16px;font-size:13px;line-height:1.6;">'
      + '    <div style="font-weight:700;color:#93c5fd;margin-bottom:6px;">🎒 Kovandaki Balıklar:</div>'
      + '    <div>🐟 Normal Balık: <b>' + fishCount + ' adet</b> (Değeri: 25 Altın)</div>'
      + '    <div>✨ Gümüş Alabalık: <b>' + troutCount + ' adet</b> (Değeri: 50 Altın)</div>'
      + '    <div>🔴 Kızıl Sazan: <b>' + carpCount + ' adet</b> (Değeri: 80 Altın)</div>'
      + '    <div>👑 Altın Sazan: <b>' + goldenCount + ' adet</b> (Değeri: 150 Altın)</div>'
      + '  </div>'
      + '  <div style="display:flex;flex-direction:column;gap:10px;">'
      + '    <button id="npcStartFishBtn" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;border:none;border-radius:12px;padding:13px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">'
      + '      🎣 Oltayı Gölete Fırlat (Balık Tut)'
      + '    </button>'
      + '    <button id="npcSellFishBtn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:12px;padding:13px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">'
      + '      💰 Tüm Balıkları Sat (' + totalFish + ' Adet)'
      + '    </button>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(modal);

    document.getElementById('closeNpcModal').onclick = function(){ modal.remove(); };
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };

    document.getElementById('npcStartFishBtn').onclick = function(){
      modal.remove();
      if(typeof window.startFishingGame === 'function'){
        window.startFishingGame();
      }
    };

    document.getElementById('npcSellFishBtn').onclick = function(){
      if(totalFish <= 0){
        if(typeof showNotice === 'function') showNotice('Satacak balığın yok! Önce göletten balık tutmalısın.');
        return;
      }
      var totalGold = (fishCount * 25) + (troutCount * 50) + (carpCount * 80) + (goldenCount * 150);
      if(typeof inventory !== 'undefined'){
        inventory.fish = 0;
        inventory.fish_trout = 0;
        inventory.fish_carp = 0;
        inventory.fish_golden = 0;
      }
      if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + totalGold;
      if(typeof window.save === 'function') window.save();
      if(typeof window.renderUI === 'function') window.renderUI();

      modal.remove();
      if(typeof showToast === 'function'){
        showToast('🐟 Balıklar Balıkçı Reis\'e satıldı: +' + totalGold + ' 🟡 Altın!');
      }
    };
  }

  // 2. Chef & Baker Dialog (Köy Mutfağı, Yemek Tarifleri & Siparişler)
  function openChefDialog(){
    playVoice('chef');
    var existing = document.getElementById('villageNpcModal');
    if(existing) existing.remove();

    var inv = window.inventory || {};
    var eggCount = inv.egg || 0;
    var tomatoCount = inv.tomato || 0;
    var pepperCount = inv.pepper || 0;
    var cucumberCount = inv.cucumber || 0;
    var carrotCount = inv.carrot || 0;
    var wheatCount = inv.wheat || 0;
    var fishCount = inv.fish || 0;
    var berryCount = inv.strawberry || 0;

    var dishes = [
      {
        id: 'omelet', name: 'Köy Omleti', icon: '🍳',
        req: { egg: 2, tomato: 1 },
        desc: '2x Yumurta + 1x Domates',
        gold: 45
      },
      {
        id: 'bread', name: 'Köy Ekmeği / Pide', icon: '🥐',
        req: { wheat: 2 },
        desc: '2x Buğday',
        gold: 30
      },
      {
        id: 'pie', name: 'Sebzeli Köy Böreği', icon: '🥧',
        req: { egg: 2, pepper: 1, cucumber: 1 },
        desc: '2x Yumurta + 1x Biber + 1x Salatalık',
        gold: 80
      },
      {
        id: 'fish_soup', name: 'Usta Balıkçı Çorbası', icon: '🍲',
        req: { fish: 1, carrot: 1, tomato: 1 },
        desc: '1x Balık + 1x Havuç + 1x Domates',
        gold: 95
      },
      {
        id: 'fish_grilled', name: 'Közde Izgara Balık', icon: '🐟',
        req: { fish: 1, pepper: 1 },
        desc: '1x Balık + 1x Biber',
        gold: 60
      },
      {
        id: 'cake', name: 'Çilekli Köy Pastası', icon: '🍓',
        req: { strawberry: 2, egg: 1, wheat: 1 },
        desc: '2x Çilek + 1x Yumurta + 1x Buğday',
        gold: 110
      }
    ];

    var modal = document.createElement('div');
    modal.id = 'villageNpcModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    var dishesHtml = '';
    dishes.forEach(function(d){
      var canCook = true;
      Object.keys(d.req).forEach(function(k){
        if((inv[k] || 0) < d.req[k]) canCook = false;
      });

      var cookedCount = inv[d.id] || 0;

      dishesHtml += ''
        + '<div style="background:#1e293b;border:1px solid #475569;border-radius:14px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
        + '  <div style="display:flex;align-items:center;gap:10px;">'
        + '    <div style="font-size:32px;">' + d.icon + '</div>'
        + '    <div>'
        + '      <div style="font-weight:700;font-size:14px;color:#fde047;">' + d.name + ' <span style="font-size:12px;color:#94a3b8;">(' + cookedCount + ' hazır)</span></div>'
        + '      <div style="font-size:11px;color:#cbd5e1;">Gereken: ' + d.desc + '</div>'
        + '      <div style="font-size:11px;color:#4ade80;font-weight:600;">Satış: +' + d.gold + ' 🟡 Altın</div>'
        + '    </div>'
        + '  </div>'
        + '  <div style="display:flex;flex-direction:column;gap:4px;">'
        + '    <button class="cookBtn" data-dish="' + d.id + '" style="background:' + (canCook ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#334155') + ';color:' + (canCook ? '#fff' : '#64748b') + ';border:none;border-radius:8px;padding:6px 12px;font-weight:700;font-size:12px;cursor:' + (canCook ? 'pointer' : 'not-allowed') + ';">Pişir</button>'
        + (cookedCount > 0 ? '    <button class="sellDishBtn" data-dish="' + d.id + '" data-gold="' + d.gold + '" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:8px;padding:5px 10px;font-weight:700;font-size:11px;cursor:pointer;">Sat (+'+d.gold+'🟡)</button>' : '')
        + '  </div>'
        + '</div>';
    });

    modal.innerHTML = ''
      + '<div style="background:#0f172a;border:2px solid #f59e0b;border-radius:22px;max-width:440px;width:100%;max-height:90vh;display:flex;flex-direction:column;color:#fff;padding:20px;box-shadow:0 25px 50px rgba(0,0,0,0.6);position:relative;">'
      + '  <button id="closeNpcModal" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">✕</button>'
      + '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">'
      + '    <div style="font-size:38px;background:#1e293b;border-radius:14px;padding:6px 10px;border:1px solid #d97706;">👩‍🍳</div>'
      + '    <div>'
      + '      <h2 style="margin:0;font-size:18px;color:#fde047;font-weight:800;">Köy Mutfağı & Fırını (Aşçı Fatma Bacı)</h2>'
      + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Taş Fırından Taze Ekmekler, Sebzeli Börekler & Nefis Köy Yemekleri</div>'
      + '    </div>'
      + '  </div>'
      + '  <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;background:#1e293b;padding:8px 12px;border-radius:8px;">'
      + '    🎒 <b>Malzemelerin:</b> 🥚' + eggCount + ' | 🍅' + tomatoCount + ' | 🌶️' + pepperCount + ' | 🥒' + cucumberCount + ' | 🥕' + carrotCount + ' | 🌾' + wheatCount + ' | 🐟' + fishCount
      + '  </div>'
      + '  <div style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px;max-height:55vh;">'
      +      dishesHtml
      + '  </div>'
      + '</div>';

    document.body.appendChild(modal);

    document.getElementById('closeNpcModal').onclick = function(){ modal.remove(); };
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };

    // Cooking click handler
    modal.querySelectorAll('.cookBtn').forEach(function(btn){
      btn.onclick = function(){
        var dishId = btn.getAttribute('data-dish');
        var dish = dishes.find(function(d){ return d.id === dishId; });
        if(!dish) return;

        // Check reqs
        var can = true;
        Object.keys(dish.req).forEach(function(k){
          if((inv[k] || 0) < dish.req[k]) can = false;
        });
        if(!can){
          if(typeof showNotice === 'function') showNotice('Bu tarif için gerekli malzemelerin eksik!');
          return;
        }

        // Deduct
        Object.keys(dish.req).forEach(function(k){
          inv[k] -= dish.req[k];
        });
        inv[dish.id] = (inv[dish.id] || 0) + 1;
        if(typeof window.save === 'function') window.save();
        if(typeof window.renderUI === 'function') window.renderUI();

        // Animation on Chef
        var chef = npcs.find(function(n){ return n.id === 'chef'; });
        if(chef) playNpcClip(chef, 'Punch', 1500);

        if(typeof showToast === 'function') showToast(dish.icon + ' ' + dish.name + ' pişti ve envantere eklendi!');
        modal.remove();
        openChefDialog(); // Refresh
      };
    });

    // Sell dish click handler
    modal.querySelectorAll('.sellDishBtn').forEach(function(btn){
      btn.onclick = function(){
        var dishId = btn.getAttribute('data-dish');
        var gold = parseInt(btn.getAttribute('data-gold'), 10) || 50;
        if((inv[dishId] || 0) <= 0) return;

        inv[dishId]--;
        if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + gold;
        if(typeof window.save === 'function') window.save();
        if(typeof window.renderUI === 'function') window.renderUI();

        if(typeof showToast === 'function') showToast('💰 Yemek köylülere satıldı: +' + gold + ' 🟡 Altın!');
        modal.remove();
        openChefDialog(); // Refresh
      };
    });
  }

  // Initialize Village NPCs in world
  function initVillageNPCs(){
    // 1. Spawn Balıkçı Reis on wooden pier of Shore Pond (firmly on the wooden dock planks facing water)
    spawnFisherman(21.35, 0.57, -13.87, 1.85);

    // 2. Build 3D Village Kitchen & Bakery Shop building at South-East quadrant (18.0, 18.0)
    buildVillageKitchenShop(18.0, 18.0);

    // 3. Spawn Chef & Baker Fatma Bacı at bakery counter (18.0, 0, 19.4)
    spawnVillageChef(18.0, 0, 19.4);
  }

  // Export to window
  window.initVillageNPCs = initVillageNPCs;
  window.stepVillageNPCs = stepVillageNPCs;
  window.villageNPCs = npcs;
  window.openFishermanDialog = openFishermanDialog;
  window.openChefDialog = openChefDialog;
  window.applyNpcPalette = applyNpcPalette;
  window.NPC_PALETTES = NPC_PALETTES;
  window.getKitchenShopGroup = function(){ return _chefPropGroup; };
})();

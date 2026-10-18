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

  // Build Fisherman Hat
  function createFishermanHat(){
    var hatGroup = new THREE.Group();
    var strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.9 });
    var bandMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });

    var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.04, 16), strawMat);
    brim.position.y = 0;
    hatGroup.add(brim);

    var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.22, 16), strawMat);
    crown.position.y = 0.12;
    hatGroup.add(crown);

    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.05, 16), bandMat);
    band.position.y = 0.04;
    hatGroup.add(band);

    return hatGroup;
  }

  // Build Chef Hat (Toque)
  function createChefHat(){
    var hat = new THREE.Group();
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.85 });

    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), whiteMat);
    base.position.y = 0.05;
    hat.add(base);

    var puff = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.35, 16), whiteMat);
    puff.position.y = 0.26;
    hat.add(puff);

    var top = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8), whiteMat);
    top.scale.set(1, 0.35, 1);
    top.position.y = 0.42;
    hat.add(top);

    return hat;
  }

  // Spawn Fisherman NPC at Shore Pier
  function spawnFisherman(x, y, z){
    var npc = {
      id: 'fisherman',
      name: 'Balıkçı Reis (Hamdi Dayı)',
      role: 'Usta Balıkçı',
      x: x, y: y, z: z,
      rotY: -1.75, // Looking towards water
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

      npc.group.position.set(npc.x, npc.y, npc.z);
      npc.group.rotation.y = npc.rotY;

      // Attach Fisherman Hat to Head bone if available
      var headBone = null;
      var handBone = null;
      npc.body.traverse(function(b){
        if(b.isBone){
          if(/Head/i.test(b.name) && !headBone) headBone = b;
          if(/Hand.*R|Right.*Hand/i.test(b.name) && !handBone) handBone = b;
        }
      });

      var hat = createFishermanHat();
      if(headBone){
        hat.position.set(0, 0.26, 0);
        hat.rotation.x = -0.1;
        headBone.add(hat);
      } else {
        hat.position.set(0, 1.45, 0);
        npc.group.add(hat);
      }

      // Attach Fishing Rod
      var rod = createFishingRodMesh();
      rod.rotation.x = 0.45;
      rod.rotation.z = -0.3;
      rod.position.set(0.2, 0.6, 0.3);
      if(handBone){
        rod.scale.setScalar(0.7);
        rod.position.set(0, 0, 0);
        rod.rotation.set(Math.PI / 4, 0, -Math.PI / 6);
        handBone.add(rod);
      } else {
        npc.group.add(rod);
      }
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
          c.castShadow = true;
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

  // Spawn Village Chef & Baker NPC
  function spawnVillageChef(x, y, z){
    var npc = {
      id: 'chef',
      name: 'Aşçı & Fırıncı (Usta Mahmut)',
      role: 'Köy Baş Aşçısı',
      x: x, y: y, z: z,
      rotY: 0.8,
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

      npc.group.position.set(npc.x, npc.y, npc.z);
      npc.group.rotation.y = npc.rotY;

      // Head bone search for Chef Toque
      var headBone = null;
      npc.body.traverse(function(b){
        if(b.isBone && /Head/i.test(b.name) && !headBone) headBone = b;
      });

      var toque = createChefHat();
      if(headBone){
        toque.position.set(0, 0.28, 0);
        headBone.add(toque);
      } else {
        toque.position.set(0, 1.48, 0);
        npc.group.add(toque);
      }

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
          c.castShadow = true;
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

    // Build Chef Kitchen Station Surroundings (Market Stand + Cauldron)
    buildChefStationDecor(x, z);

    return npc;
  }

  // Kitchen Scenery Decor (Market Stand + Cauldron with lit coals)
  function buildChefStationDecor(cx, cz){
    var g = new THREE.Group();
    g.position.set(cx, 0, cz);

    // 1. Try to load MarketStand_1.glb or procedural counter
    loadGlbDecor('models/village/MarketStand_1.glb', function(stand){
      if(stand){
        stand.scale.setScalar(1.2);
        stand.position.set(-0.8, 0, -1.2);
        stand.rotation.y = 0.6;
        g.add(stand);
      } else {
        // Fallback wooden counter
        var counter = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.9, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x7c4f2e, roughness: 0.8 })
        );
        counter.position.set(-0.8, 0.45, -1.2);
        counter.rotation.y = 0.6;
        g.add(counter);
      }
    });

    // 2. Try to load Cauldron.glb or procedural boiling pot
    loadGlbDecor('models/village/Cauldron.glb', function(cauld){
      if(cauld){
        cauld.scale.setScalar(1.1);
        cauld.position.set(1.2, 0, -0.4);
        g.add(cauld);
      } else {
        var pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.28, 0.5, 12),
          new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 })
        );
        pot.position.set(1.2, 0.35, -0.4);
        g.add(pot);
      }
    });

    // Glowing warm fire embers under pot (zero GPU overhead)

    var coals = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a1005, emissive: 0xd9480f, emissiveIntensity: 0.8 })
    );
    coals.position.set(1.2, 0.05, -0.4);
    g.add(coals);

    // Barrels & crates
    loadGlbDecor('models/village/Barrel.glb', function(barrel){
      if(barrel){
        barrel.scale.setScalar(0.9);
        barrel.position.set(1.6, 0, -1.2);
        g.add(barrel);
      }
    });

    scene.add(g);
    _chefPropGroup = g;
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
    for(var i = 0; i < npcs.length; i++){
      var npc = npcs[i];
      if(!npc || !npc.mixer) continue;

      npc.mixer.update(dt);

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
      + '    <div style="font-size:38px;background:#1e293b;border-radius:14px;padding:6px 10px;border:1px solid #d97706;">👨‍🍳</div>'
      + '    <div>'
      + '      <h2 style="margin:0;font-size:18px;color:#fde047;font-weight:800;">Köy Mutfağı & Aşçı (Usta Mahmut)</h2>'
      + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Yumurtalar, Sebzeler ve Balıkla Nefis Tarifler</div>'
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
    // Spawn Balıkçı Reis on wooden pier of Shore Pond (13.2, -8.2)
    spawnFisherman(12.3, 0.28, -7.8);

    // Spawn Village Chef near market / village square (-11.5, 0, -7.0)
    spawnVillageChef(-11.5, 0, -7.0);
  }

  // Export to window
  window.initVillageNPCs = initVillageNPCs;
  window.stepVillageNPCs = stepVillageNPCs;
  window.villageNPCs = npcs;
  window.openFishermanDialog = openFishermanDialog;
  window.openChefDialog = openChefDialog;
})();

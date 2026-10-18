// Barn & Dairy Management System (A-Quality 3D Barn, Cows, Milking & Dairy Processing)
// Deep livestock care: Feeding, Watering, Brushing/Petting, Manual Milking & Cheese/Butter Workshop
(function(){
  var barns = [];
  var cows = [];
  var _cowBuf = null;
  var _alpacaBuf = null;
  var _stableScene = null;

  var COW_URL = 'models/animals/Cow.glb';
  var ALPACA_URL = 'models/animals/Alpaca.glb';
  var STABLE_URL = 'models/village/Stable.glb';

  // Sound effects
  function playMilkingSound(){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var now = ctx.currentTime;
        [0, 0.12, 0.24].forEach(function(t, i){
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320 - i * 20, now + t);
          osc.frequency.exponentialRampToValueAtTime(120, now + t + 0.08);
          g.gain.setValueAtTime(0.18, now + t);
          g.gain.linearRampToValueAtTime(0.001, now + t + 0.09);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + t); osc.stop(now + t + 0.1);
        });
      }
    } catch(e){}
  }

  function playMooSound(){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.3);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.8);
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0.001, now + 0.85);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.86);
      }
    } catch(e){}
  }

  // Load GLTF as ArrayBuffer to allow clean parsing without bone matrix corruption
  function loadArrayBuffer(url, onDone){
    var clean = url.replace(/\?.*$/, '');
    var candidates = [
      clean,
      clean + '?cb=' + Date.now(),
      'https://raw.githubusercontent.com/BatuhanKlcky/sanalbahce/main/' + clean
    ];
    var idx = 0;
    function tryNext(){
      if(idx >= candidates.length){ onDone(null); return; }
      var target = candidates[idx++];
      if(typeof fetch === 'function'){
        fetch(target).then(function(r){
          if(!r.ok) throw new Error(r.status);
          return r.arrayBuffer();
        }).then(function(buf){
          onDone(buf);
        }).catch(function(){ tryNext(); });
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', target, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(){
          if(xhr.status === 200 || xhr.status === 0) onDone(xhr.response);
          else tryNext();
        };
        xhr.onerror = tryNext;
        xhr.send(null);
      }
    }
    tryNext();
  }

  // Build Procedural Barn Structure if GLB is unavailable
  function buildFallbackBarn(){
    var root = new THREE.Group();
    var woodDark = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });
    var woodRed = new THREE.MeshStandardMaterial({ color: 0x8b251d, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
    var strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.95 });

    // Foundation
    var floor = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 4.5), woodDark);
    floor.position.set(0, 0.08, 0);
    floor.receiveShadow = !isMobile;
    root.add(floor);

    // Barn Walls
    var body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.6, 4.0), woodRed);
    body.position.set(0, 1.38, 0);
    body.castShadow = !isMobile;
    root.add(body);

    // Barn Doorway
    var doorCut = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.1), new THREE.MeshBasicMaterial({ color: 0x1f140e }));
    doorCut.position.set(0, 1.1, 2.02);
    root.add(doorCut);

    // Roof A-frame
    var roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.8, 4), roofMat);
    roof.position.set(0, 3.5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1, 0.8);
    roof.castShadow = !isMobile;
    root.add(roof);

    // Hay bale on side
    var hay = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), strawMat);
    hay.position.set(2.8, 0.35, 1.2);
    hay.rotation.y = 0.3;
    root.add(hay);

    // Water Trough
    var trough = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.6), woodDark);
    trough.position.set(-2.8, 0.25, 0.8);
    root.add(trough);

    var water = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.45), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.3 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(-2.8, 0.38, 0.8);
    root.add(water);

    return root;
  }

  // Load 3D Barn Model
  function createBarnGroup(onDone){
    var g = new THREE.Group();
    g.name = 'GrandBarnBuilding';

    // Try to load Stable.glb
    if(typeof THREE !== 'undefined' && THREE.GLTFLoader){
      new THREE.GLTFLoader().load(STABLE_URL, function(gltf){
        var m = gltf.scene;
        var box = new THREE.Box3().setFromObject(m);
        var h = Math.max(0.1, box.max.y - box.min.y);
        m.position.y -= box.min.y;
        m.scale.setScalar(4.2 / h);
        m.traverse(function(c){
          if(c.isMesh){
            c.frustumCulled = true;
            c.castShadow = !isMobile;
            c.receiveShadow = !isMobile;
          }
        });
        g.add(m);
        onDone(g);
      }, undefined, function(){
        g.add(buildFallbackBarn());
        onDone(g);
      });
    } else {
      g.add(buildFallbackBarn());
      onDone(g);
    }
  }

  // Spawn an individual animated Cow/Alpaca
  function spawnBarnAnimal(barn, spec){
    var animal = {
      id: spec.id,
      name: spec.name,
      type: spec.type, // 'cow' or 'alpaca'
      breed: spec.breed || 'Holstein',
      barn: barn,
      group: null,
      mixer: null,
      action: null,
      x: barn.x + spec.ox,
      z: barn.z + spec.oz,
      tx: barn.x + spec.ox,
      tz: barn.z + spec.oz,
      rotY: spec.rot || 0,
      state: 'idle', // idle, chew, walk
      timer: 2 + Math.random() * 3,
      chewTimer: 0,
      happiness: 85, // 0 - 100
      hunger: 30,    // 0 - 100
      thirst: 20,    // 0 - 100
      milkReady: true,
      milkQuality: 'normal', // normal, creamy, golden
      milkTimer: 0
    };

    var url = animal.type === 'alpaca' ? ALPACA_URL : COW_URL;

    loadArrayBuffer(url, function(buf){
      if(!buf){
        console.warn('[BarnManagement] Animal buffer failed:', url);
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
          wrap.scale.setScalar(spec.scale / h);

          animal.group = wrap;
          if(gltf.animations && gltf.animations.length > 0){
            animal.mixer = new THREE.AnimationMixer(body);
            animal.action = animal.mixer.clipAction(gltf.animations[0]);
            animal.action.play();
          }

          animal.group.position.set(animal.x, 0, animal.z);
          animal.group.rotation.y = animal.rotY;
          animal.group.traverse(function(c){
            if(c.isMesh){
              c.frustumCulled = true;
              c.castShadow = !isMobile;
              c.receiveShadow = !isMobile;
              c.userData.animalRef = animal;
            }
          });
          animal.group.userData.animalRef = animal;
          animal.group.userData.onTap = function(){
            openBarnDashboard(barn, animal);
          };

          // 3D floating milk pail badge when ready to milk
          var badge = createMilkingBadge();
          badge.position.set(0, 1.45, 0);
          badge.visible = animal.milkReady;
          wrap.add(badge);
          animal.badge = badge;

          scene.add(wrap);
        });
      } catch(e){
        console.warn('GLTF parse error for animal', e);
      }
    });

    cows.push(animal);
    return animal;
  }

  // 3D Milk Bucket Badge
  function createMilkingBadge(){
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.22, 12), mat);
    g.add(bucket);
    var milkSurface = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
    milkSurface.rotation.x = -Math.PI / 2;
    milkSurface.position.y = 0.11;
    g.add(milkSurface);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    rim.position.y = 0.11;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    g.scale.setScalar(0.7);
    return g;
  }

  // Update loop for barn and livestock
  function stepBarn(dt, now){
    if(dt > 0.1) dt = 0.1;

    for(var i = 0; i < cows.length; i++){
      var a = cows[i];
      if(!a.group) continue;

      if(a.mixer) a.mixer.update(dt);

      // Care timers
      a.milkTimer += dt;
      if(a.milkTimer >= 45 && !a.milkReady){
        a.milkReady = true;
        a.milkTimer = 0;
        // Determine quality based on happiness
        if(a.happiness >= 95 && Math.random() < 0.25){
          a.milkQuality = 'golden';
        } else if(a.happiness >= 75){
          a.milkQuality = 'creamy';
        } else {
          a.milkQuality = 'normal';
        }
        if(a.badge) a.badge.visible = true;
      }

      // Bobbing milk badge
      if(a.badge && a.badge.visible){
        a.badge.position.y = 1.45 + Math.sin(now * 3.5 + i) * 0.08;
        a.badge.rotation.y += dt * 1.5;
      }

      // Natural AI: Chewing cud, turning, standing
      a.timer -= dt;
      if(a.timer <= 0){
        a.timer = 3 + Math.random() * 5;
        var r = Math.random();
        if(r < 0.5){
          a.state = 'chew';
          a.rotY += (Math.random() - 0.5) * 0.4;
          a.group.rotation.y = a.rotY;
        } else {
          a.state = 'idle';
        }
      }

      // Head chew motion
      if(a.state === 'chew'){
        a.group.rotation.x = Math.sin(now * 8) * 0.03;
      } else {
        a.group.rotation.x = 0;
      }
    }
  }

  // ==========================================
  // BARN DASHBOARD & DAIRY WORKSHOP MODAL
  // ==========================================
  function openBarnDashboard(barn, selectedAnimal){
    var existing = document.getElementById('barnDashboardModal');
    if(existing) existing.remove();

    var targetAnimal = selectedAnimal || cows[0] || null;
    var inv = window.inventory || {};
    var wheatCount = inv.wheat || 0;
    var milkCount = inv.milk || 0;
    var creamyCount = inv.milk_creamy || 0;
    var goldenMilkCount = inv.milk_golden || 0;
    var butterCount = inv.butter || 0;
    var cheeseCount = inv.cheese || 0;

    var modal = document.createElement('div');
    modal.id = 'barnDashboardModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    function renderModalContent(a){
      var qualityBadge = a.milkQuality === 'golden' ? '<span style="color:#fde047;font-weight:bold;">👑 Altın Süt</span>' : (a.milkQuality === 'creamy' ? '<span style="color:#67e8f9;font-weight:bold;">🌟 Kaymaklı Süt</span>' : '<span style="color:#e2e8f0;">🥛 Köy Sütü</span>');
      var milkBtnText = a.milkReady ? ('🥛 ' + a.name + '\'ı Sağ (' + qualityBadge + ')') : '⏳ Sağım Bekleniyor (Doluyor…)';

      var html = ''
        + '<div style="background:#0f172a;border:2px solid #eab308;border-radius:24px;max-width:440px;width:100%;max-height:92vh;display:flex;flex-direction:column;color:#fff;padding:22px;box-shadow:0 25px 60px rgba(0,0,0,0.7);position:relative;">'
        + '  <button id="closeBarnModal" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">✕</button>'
        + '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
        + '    <div style="font-size:42px;background:#1e293b;border-radius:16px;padding:6px 12px;border:1px solid #ca8a04;">🐄</div>'
        + '    <div>'
        + '      <h2 style="margin:0;font-size:19px;color:#fde047;font-weight:800;">Köy Mandırası & Ahır</h2>'
        + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Canlı İnek Bakımı, Süt Sağımı & Tereyağı Atölyesi</div>'
        + '    </div>'
        + '  </div>'
        + '  <div style="display:flex;gap:6px;margin-bottom:14px;background:#1e293b;padding:4px;border-radius:14px;">'
        +      cows.map(function(cItem){
                 var isSel = cItem === a;
                 return '<button class="animalTabBtn" data-id="' + cItem.id + '" style="flex:1;border:none;border-radius:10px;padding:8px 6px;font-size:12px;font-weight:700;cursor:pointer;background:' + (isSel ? '#eab308' : 'transparent') + ';color:' + (isSel ? '#0f172a' : '#94a3b8') + ';">' + (cItem.type === 'alpaca' ? '🦙 ' : '🐄 ') + cItem.name + '</button>';
               }).join('')
        + '  </div>'
        + '  <div style="background:#1e293b;border-radius:16px;padding:14px;margin-bottom:14px;font-size:13px;line-height:1.7;">'
        + '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
        + '      <span style="font-weight:700;color:#fde047;">❤️ Sevgi & Mutluluk:</span>'
        + '      <span style="font-weight:800;color:#4ade80;">%' + Math.round(a.happiness) + '</span>'
        + '    </div>'
        + '    <div style="width:100%;height:8px;background:#334155;border-radius:4px;overflow:hidden;margin-bottom:10px;">'
        + '      <div style="width:' + a.happiness + '%;height:100%;background:linear-gradient(90deg,#10b981,#4ade80);border-radius:4px;"></div>'
        + '    </div>'
        + '    <div>🌾 <b>Mevcut Yem (Buğday):</b> <span style="color:#fde047;font-weight:bold;">' + wheatCount + ' adet</span></div>'
        + '    <div>🥛 <b>Sağım Durumu:</b> ' + (a.milkReady ? '<span style="color:#4ade80;font-weight:bold;">Dolu (Sağıma Hazır)</span>' : '<span style="color:#cbd5e1;">Bekleniyor…</span>') + '</div>'
        + '    <div>✨ <b>Süt Kalitesi:</b> ' + qualityBadge + '</div>'
        + '  </div>'
        + '  <div style="display:flex;gap:8px;margin-bottom:14px;">'
        + '    <button id="feedAnimalBtn" style="flex:1;background:linear-gradient(135deg,#eab308,#ca8a04);color:#0f172a;border:none;border-radius:12px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;">'
        + '      🌾 Yem Ver (-1)'
        + '    </button>'
        + '    <button id="brushAnimalBtn" style="flex:1;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border:none;border-radius:12px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;">'
        + '      ✨ Tımar Et (+Sevgi)'
        + '    </button>'
        + '    <button id="milkAnimalBtn" style="flex:1.4;background:' + (a.milkReady ? 'linear-gradient(135deg,#10b981,#059669)' : '#334155') + ';color:' + (a.milkReady ? '#fff' : '#64748b') + ';border:none;border-radius:12px;padding:11px;font-weight:800;font-size:12px;cursor:' + (a.milkReady ? 'pointer' : 'not-allowed') + ';">'
        +        (a.milkReady ? '🥛 Sütü Sağ!' : '⏳ Doluyor')
        + '    </button>'
        + '  </div>'
        + '  <div style="background:#020617;border:1px solid #334155;border-radius:14px;padding:12px;font-size:12px;line-height:1.6;">'
        + '    <div style="font-weight:700;color:#93c5fd;margin-bottom:6px;">🧈 Mandıra & Peynir İşleme:</div>'
        + '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
        + '      <span>🧀 <b>Köy Peyniri Yap</b> (2x Süt = +65🟡)</span>'
        + '      <button id="craftCheeseBtn" style="background:#ca8a04;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-weight:700;cursor:pointer;">Üret</button>'
        + '    </div>'
        + '    <div style="display:flex;justify-content:space-between;align-items:center;">'
        + '      <span>🧈 <b>Köy Tereyağı Çalkala</b> (1x Kaymaklı Süt = +85🟡)</span>'
        + '      <button id="craftButterBtn" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-weight:700;cursor:pointer;">Çalkala</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';

      modal.innerHTML = html;

      document.getElementById('closeBarnModal').onclick = function(){ modal.remove(); };

      // Animal tab switches
      modal.querySelectorAll('.animalTabBtn').forEach(function(btn){
        btn.onclick = function(){
          var aid = btn.getAttribute('data-id');
          var found = cows.find(function(c){ return c.id === aid; });
          if(found) renderModalContent(found);
        };
      });

      // Feed button
      document.getElementById('feedAnimalBtn').onclick = function(){
        if(wheatCount <= 0){
          if(typeof showNotice === 'function') showNotice('🌾 Hayvanları beslemek için önce tarladan Buğday hasat etmelisin!');
          return;
        }
        inv.wheat--;
        a.happiness = Math.min(100, a.happiness + 15);
        playMooSound();
        if(typeof window.spawnPetLoveFX === 'function'){
          window.spawnPetLoveFX(a.group.position, '🌾');
        }
        if(typeof showToast === 'function') showToast('🌾 ' + a.name + ' afiyetle beslendi! Sevgi arttı ❤️');
        if(typeof window.save === 'function') window.save();
        renderModalContent(a);
      };

      // Brush / Pet button
      document.getElementById('brushAnimalBtn').onclick = function(){
        a.happiness = Math.min(100, a.happiness + 10);
        playMooSound();
        if(typeof window.spawnPetLoveFX === 'function'){
          window.spawnPetLoveFX(a.group.position, '✨');
        }
        if(typeof showToast === 'function') showToast('✨ ' + a.name + ' fırçalandı ve mutlu oldu!');
        if(typeof window.save === 'function') window.save();
        renderModalContent(a);
      };

      // Milk button
      document.getElementById('milkAnimalBtn').onclick = function(){
        if(!a.milkReady){
          if(typeof showNotice === 'function') showNotice('⏳ Süt henüz dolmadı, biraz bekle!');
          return;
        }
        a.milkReady = false;
        a.milkTimer = 0;
        if(a.badge) a.badge.visible = false;

        var product = 'milk';
        var prodLabel = '🥛 Taze Köy Sütü';
        if(a.milkQuality === 'golden'){
          product = 'milk_golden';
          prodLabel = '👑 Saf Altın Süt (+180 🟡)';
        } else if(a.milkQuality === 'creamy'){
          product = 'milk_creamy';
          prodLabel = '🌟 Kaymaklı Çiftlik Sütü (+90 🟡)';
        }

        inv[product] = (inv[product] || 0) + 1;
        playMilkingSound();
        if(typeof window.spawnPetLoveFX === 'function'){
          window.spawnPetLoveFX(a.group.position, '🥛');
        }
        if(typeof showToast === 'function') showToast(prodLabel + ' sağıldı ve çantana eklendi!');
        if(typeof window.save === 'function') window.save();
        renderModalContent(a);
      };

      // Craft Cheese
      document.getElementById('craftCheeseBtn').onclick = function(){
        if((inv.milk || 0) < 2){
          if(typeof showNotice === 'function') showNotice('🧀 Peynir yapmak için en az 2x Köy Sütü gerekiyor!');
          return;
        }
        inv.milk -= 2;
        inv.cheese = (inv.cheese || 0) + 1;
        if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + 65;
        if(typeof showToast === 'function') showToast('🧀 Taze Köy Peyniri üretildi ve satıldı: +65 🟡 Altın!');
        if(typeof window.save === 'function') window.save();
        renderModalContent(a);
      };

      // Craft Butter
      document.getElementById('craftButterBtn').onclick = function(){
        if((inv.milk_creamy || 0) < 1 && (inv.milk || 0) < 3){
          if(typeof showNotice === 'function') showNotice('🧈 Tereyağı için 1x Kaymaklı Süt veya 3x Normal Süt gerekiyor!');
          return;
        }
        if((inv.milk_creamy || 0) >= 1) inv.milk_creamy--;
        else inv.milk -= 3;

        inv.butter = (inv.butter || 0) + 1;
        if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + 85;
        if(typeof showToast === 'function') showToast('🧈 Mis kokulu Köy Tereyağı çalkalandı: +85 🟡 Altın!');
        if(typeof window.save === 'function') window.save();
        renderModalContent(a);
      };
    }

    renderModalContent(targetAnimal);
    document.body.appendChild(modal);
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };
  }

  // Register and place Grand Barn in garden
  function initBarnSystem(){
    if(barns.length > 0) return;

    var barnX = -13.5;
    var barnZ = 12.0;

    createBarnGroup(function(bg){
      bg.position.set(barnX, 0, barnZ);
      bg.rotation.y = 0.4;
      scene.add(bg);

      var barnRec = {
        group: bg,
        x: barnX,
        z: barnZ
      };

      // Attach click handler to barn building
      bg.userData.onTap = function(){
        openBarnDashboard(barnRec);
      };

      barns.push(barnRec);

      // Spawn 2 cows and 1 alpaca
      spawnBarnAnimal(barnRec, {
        id: 'cow_1', name: 'Sarıkız', type: 'cow', breed: 'Jersey',
        ox: 2.8, oz: 1.4, rot: -0.6, scale: 1.2
      });
      spawnBarnAnimal(barnRec, {
        id: 'cow_2', name: 'Benekli', type: 'cow', breed: 'Holstein',
        ox: 1.8, oz: 3.2, rot: 1.2, scale: 1.25
      });
      spawnBarnAnimal(barnRec, {
        id: 'alpaca_1', name: 'Pamuk', type: 'alpaca', breed: 'Huacaya',
        ox: -2.2, oz: 2.6, rot: 0.3, scale: 1.15
      });
    });
  }

  // Export to window
  window.initBarnSystem = initBarnSystem;
  window.stepBarn = stepBarn;
  window.barns = barns;
  window.cows = cows;
  window.openBarnDashboard = openBarnDashboard;
})();

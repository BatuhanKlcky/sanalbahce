// Village Market Square & High-Performance Customer NPC Shopping System
// Zero runtime GLTF parsing: Pre-pools 2 villager customers to eliminate all frame drops
(function(){
  var marketSquare = null;
  var _stallGroup = null;
  var customerPool = [];
  var activeCustomers = [];
  var stallStock = {}; // itemId -> quantity
  var _poolReady = false;
  var _spawnTimer = 6;

  var MARKET_POS = { x: -24.0, z: -18.0 };

  // Load saved stall stock
  try {
    stallStock = JSON.parse(localStorage.getItem('gdn_stall_stock') || '{}');
  } catch(e){ stallStock = {}; }

  function saveStallStock(){
    try { localStorage.setItem('gdn_stall_stock', JSON.stringify(stallStock)); } catch(e){}
  }

  // Sound effects
  function playCoinChime(){
    try {
      if(window.audioCtx && window.audioCtx.state === 'running'){
        var ctx = window.audioCtx;
        var now = ctx.currentTime;
        [0, 0.08, 0.16].forEach(function(t, i){
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(980 + i * 280, now + t);
          g.gain.setValueAtTime(0.12, now + t);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + t); osc.stop(now + t + 0.19);
        });
      }
    } catch(e){}
  }

  // Build the 3D Market Square at far corner of the map
  function buildMarketSquare(){
    var root = new THREE.Group();
    root.position.set(MARKET_POS.x, 0, MARKET_POS.z);

    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a544c, roughness: 0.95 });
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4f2e, roughness: 0.8 });
    var clothMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 });
    var goldClothMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

    // 1. Cobblestone plaza floor
    var floor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.08, 10.5), stoneMat);
    floor.position.y = 0.04;
    floor.receiveShadow = !isMobile;
    root.add(floor);

    // 2. Main Player Market Stall Counter
    var stall = new THREE.Group();
    stall.position.set(0, 0, -2.5);

    // Counter table
    var counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.2), woodMat);
    counter.position.y = 0.45;
    counter.castShadow = !isMobile;
    stall.add(counter);

    // Canopy pillars
    [-1.5, 1.5].forEach(function(px){
      [-0.5, 0.5].forEach(function(pz){
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), woodMat);
        post.position.set(px, 1.2, pz);
        stall.add(post);
      });
    });

    // Striped Awning Roof
    for(var s = 0; s < 6; s++){
      var stripeMat = (s % 2 === 0) ? clothMat : goldClothMat;
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 1.6), stripeMat);
      stripe.position.set(-1.3 + s * 0.52, 2.38, 0);
      stripe.rotation.x = 0.15;
      stall.add(stripe);
    }

    // Signboard
    var sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.06), woodMat);
    sign.position.set(0, 2.1, 0.82);
    stall.add(sign);

    stall.userData.isMarketStall = true;
    stall.userData.onTap = function(){
      openMarketStallDialog();
    };
    root.add(stall);
    _stallGroup = stall;

    // Decorative Barrels & Crates around plaza
    if(typeof window.spawnModel === 'function'){
      var b1 = window.spawnModel('barrel', 0.9);
      if(b1){ b1.position.set(3.2, 0, -1.8); root.add(b1); }
      var c1 = window.spawnModel('crate', 0.7);
      if(c1){ c1.position.set(-3.2, 0, -1.5); root.add(c1); }
      var cart = window.spawnModel('cart', 1.4);
      if(cart){ cart.position.set(3.5, 0, 2.5); cart.rotation.y = -0.8; root.add(cart); }
    }

    scene.add(root);
    marketSquare = root;

    // Pre-pool 2 customer NPCs once at startup (Zero runtime parse = Zero stutter!)
    initCustomerPool();

    return root;
  }

  // Pre-pool exactly 2 customer NPCs (1 male, 1 female) once
  function initCustomerPool(){
    if(_poolReady) return;
    _poolReady = true;

    var kinds = [
      { kind: 'male', name: 'Demirci Hasan', role: 'Usta Demirci' },
      { kind: 'female', name: 'Ayşe Teyze', role: 'Köy Sakini' }
    ];

    kinds.forEach(function(spec, idx){
      if(typeof window.parseFarmerInstance === 'function'){
        window.parseFarmerInstance(spec.kind, function(rec){
          if(!rec) return;
          var cust = {
            id: 'cust_' + idx,
            profile: spec,
            group: rec.group,
            mixer: rec.mixer,
            clips: rec.clips,
            currentAction: null,
            x: -999, z: -999,
            tx: 0, tz: 0,
            active: false,
            state: 'idle',
            inspectTimer: 0
          };
          cust.group.position.set(-999, -50, -999);
          cust.group.traverse(function(c){
            if(c.isMesh){
              c.frustumCulled = true;
              c.castShadow = !isMobile;
              c.receiveShadow = !isMobile;
            }
          });
          scene.add(cust.group);
          customerPool.push(cust);
        });
      }
    });
  }

  // Activate a pooled customer (Zero allocation, 60 FPS)
  function activateCustomer(){
    var available = customerPool.find(function(c){ return !c.active; });
    if(!available) return;

    var startAngle = Math.random() * Math.PI * 2;
    var startDist = 18.0;
    available.x = MARKET_POS.x + Math.cos(startAngle) * startDist;
    available.z = MARKET_POS.z + Math.sin(startAngle) * startDist;
    available.tx = MARKET_POS.x + (Math.random() - 0.5) * 1.6;
    available.tz = MARKET_POS.z - 1.2;
    available.state = 'walk_in';
    available.active = true;

    available.group.position.set(available.x, 0, available.z);
    available.group.visible = true;

    if(available.clips && available.clips.Walk){
      var act = available.mixer.clipAction(available.clips.Walk);
      if(available.currentAction) available.currentAction.fadeOut(0.2);
      act.reset().fadeIn(0.2).play();
      available.currentAction = act;
    }
  }

  function playCustomerClip(cust, name, dur){
    if(!cust || !cust.mixer || !cust.clips) return;
    var clip = cust.clips[name];
    if(!clip) return;
    var next = cust.mixer.clipAction(clip);
    if(cust.currentAction && cust.currentAction !== next){
      cust.currentAction.fadeOut(0.2);
    }
    next.reset().fadeIn(0.2).play();
    cust.currentAction = next;
  }

  // Customer Buying Item Logic
  function customerMakePurchase(cust){
    var inStockKeys = Object.keys(stallStock).filter(function(k){ return stallStock[k] > 0; });
    if(inStockKeys.length === 0){
      playCustomerClip(cust, 'Wave');
      setTimeout(function(){
        cust.state = 'walk_out';
        pickExitTarget(cust);
      }, 1500);
      return;
    }

    var chosenKey = inStockKeys[Math.floor(Math.random() * inStockKeys.length)];
    stallStock[chosenKey]--;
    if(stallStock[chosenKey] <= 0) delete stallStock[chosenKey];
    saveStallStock();

    var prices = {
      tomato: 6, carrot: 8, pepper: 10, cucumber: 12, strawberry: 15, wheat: 5,
      egg: 14, milk: 22, milk_creamy: 45, milk_golden: 110,
      fish: 18, fish_trout: 35, fish_carp: 60, fish_golden: 120,
      omelet: 40, bread: 28, pie: 65, fish_soup: 80, cheese: 55, butter: 75, cake: 95
    };

    var itemNames = {
      tomato: '🍅 Domates', carrot: '🥕 Havuç', pepper: '🌶️ Biber', cucumber: '🥒 Kabak', strawberry: '🍓 Çilek', wheat: '🌾 Buğday',
      egg: '🥚 Taze Yumurta', milk: '🥛 Köy Sütü', milk_creamy: '🌟 Kaymaklı Süt', milk_golden: '👑 Altın Süt',
      fish: '🐟 Göl Balığı', fish_trout: '✨ Gümüş Alabalık', fish_carp: '🔴 Kızıl Sazan', fish_golden: '👑 Altın Sazan',
      omelet: '🍳 Köy Omleti', bread: '🥐 Köy Ekmeği', pie: '🥧 Sebzeli Börek', fish_soup: '🍲 Balıkçı Çorbası',
      cheese: '🧀 Köy Peyniri', butter: '🧈 Köy Tereyağı', cake: '🍓 Çilekli Pasta'
    };

    var earn = prices[chosenKey] || 15;
    if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + earn;
    if(typeof addXP === 'function') addXP(18);
    if(typeof window.save === 'function') window.save();
    if(typeof window.renderUI === 'function') window.renderUI();

    playCoinChime();
    if(typeof window.spawnPetLoveFX === 'function'){
      window.spawnPetLoveFX(cust.group.position, '💰');
    }

    if(typeof showFloatingNotice === 'function'){
      showFloatingNotice('💰 +' + earn + ' 🟡 (' + cust.profile.name + ')', cust.x, 2.2, cust.z);
    }
    if(typeof showToast === 'function'){
      showToast('🛒 ' + cust.profile.name + ' tezgahından ' + (itemNames[chosenKey] || chosenKey) + ' satın aldı! (+' + earn + ' 🟡 Altın)');
    }

    playCustomerClip(cust, 'Wave');
    setTimeout(function(){
      cust.state = 'walk_out';
      pickExitTarget(cust);
    }, 1800);
  }

  function pickExitTarget(cust){
    var a = Math.random() * Math.PI * 2;
    cust.tx = MARKET_POS.x + Math.cos(a) * 22.0;
    cust.tz = MARKET_POS.z + Math.sin(a) * 22.0;
    if(cust.clips && cust.clips.Walk){
      playCustomerClip(cust, 'Walk');
    }
  }

  // Update loop for Market & Customers (Optimized: zero garbage, throttled updates)
  function stepVillageMarket(dt, now){
    if(dt > 0.1) dt = 0.1;

    _spawnTimer -= dt;
    if(_spawnTimer <= 0){
      _spawnTimer = 16 + Math.random() * 18;
      activateCustomer();
    }

    var cam = (typeof camera !== 'undefined') ? camera : null;
    var fc = (typeof window._fc === 'number') ? window._fc : 0;
    for(var i = 0; i < customerPool.length; i++){
      var c = customerPool[i];
      if(!c.active || !c.group || c.group.visible === false) continue;

      if(c.mixer){
        var cDistSq = cam ? c.group.position.distanceToSquared(cam.position) : 0;
        if(cDistSq > 1400){
          if((i + fc) % 4 === 0) c.mixer.update(dt * 4);
        } else if(cDistSq > 600){
          if((i + fc) % 3 === 0) c.mixer.update(dt * 3);
        } else {
          if((i + fc) % 2 === 0) c.mixer.update(dt * 2);
        }
      }

      if(c.state === 'walk_in' || c.state === 'walk_out'){
        var dx = c.tx - c.x;
        var dz = c.tz - c.z;
        var d = Math.hypot(dx, dz);

        if(d > 0.18){
          var spd = 1.35 * dt;
          c.x += (dx / d) * Math.min(d, spd);
          c.z += (dz / d) * Math.min(d, spd);
          var ang = Math.atan2(dx, dz);
          c.group.rotation.y += (ang - c.group.rotation.y) * 0.15;
        } else {
          if(c.state === 'walk_in'){
            c.state = 'inspect';
            c.inspectTimer = 2.2 + Math.random() * 1.5;
            c.group.rotation.y = 0;
            if(c.clips && c.clips.Duck) playCustomerClip(c, 'Duck');
            else if(c.clips && c.clips.Idle) playCustomerClip(c, 'Idle');
          } else if(c.state === 'walk_out'){
            c.active = false;
            c.group.visible = false;
            c.group.position.set(-999, -50, -999);
            continue;
          }
        }
        c.group.position.x = c.x;
        c.group.position.z = c.z;
      } else if(c.state === 'inspect'){
        c.inspectTimer -= dt;
        if(c.inspectTimer <= 0){
          c.state = 'buy';
          customerMakePurchase(c);
        }
      }
    }
  }

  // Interactive Stall Stocking Dialog
  function openMarketStallDialog(){
    var existing = document.getElementById('marketStallModal');
    if(existing) existing.remove();

    var inv = window.inventory || {};

    var sellables = [
      { id: 'tomato', name: 'Domates', emoji: '🍅', price: 6 },
      { id: 'carrot', name: 'Havuç', emoji: '🥕', price: 8 },
      { id: 'pepper', name: 'Biber', emoji: '🌶️', price: 10 },
      { id: 'cucumber', name: 'Kabak', emoji: '🥒', price: 12 },
      { id: 'strawberry', name: 'Çilek', emoji: '🍓', price: 15 },
      { id: 'wheat', name: 'Buğday', emoji: '🌾', price: 5 },
      { id: 'egg', name: 'Köy Yumurtası', emoji: '🥚', price: 14 },
      { id: 'milk', name: 'Taze Süt', emoji: '🥛', price: 22 },
      { id: 'milk_creamy', name: 'Kaymaklı Süt', emoji: '🌟', price: 45 },
      { id: 'fish', name: 'Göl Balığı', emoji: '🐟', price: 18 },
      { id: 'fish_trout', name: 'Gümüş Alabalık', emoji: '✨', price: 35 },
      { id: 'omelet', name: 'Köy Omleti', emoji: '🍳', price: 40 },
      { id: 'bread', name: 'Köy Ekmeği', emoji: '🥐', price: 28 },
      { id: 'pie', name: 'Sebzeli Börek', emoji: '🥧', price: 65 },
      { id: 'fish_soup', name: 'Balıkçı Çorbası', emoji: '🍲', price: 80 },
      { id: 'cheese', name: 'Köy Peyniri', emoji: '🧀', price: 55 },
      { id: 'butter', name: 'Köy Tereyağı', emoji: '🧈', price: 75 }
    ];

    var modal = document.createElement('div');
    modal.id = 'marketStallModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    function renderDialog(){
      var totalOnStall = 0;
      Object.keys(stallStock).forEach(function(k){ totalOnStall += stallStock[k]; });

      var itemsHtml = sellables.map(function(item){
        var bagCount = inv[item.id] || 0;
        var onStall = stallStock[item.id] || 0;
        return ''
          + '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          + '  <div style="display:flex;align-items:center;gap:10px;">'
          + '    <div style="font-size:26px;">' + item.emoji + '</div>'
          + '    <div>'
          + '      <div style="font-weight:700;font-size:13px;color:#fff;">' + item.name + '</div>'
          + '      <div style="font-size:11px;color:#94a3b8;">Çantanda: <b style="color:#67e8f9;">' + bagCount + '</b> | Tezgâhta: <b style="color:#fde047;">' + onStall + '</b></div>'
          + '    </div>'
          + '  </div>'
          + '  <div style="display:flex;gap:6px;">'
          + (bagCount > 0 ? '    <button class="addStallBtn" data-id="' + item.id + '" style="background:#ca8a04;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-weight:700;font-size:11px;cursor:pointer;">+ Tezgâha Koy</button>' : '')
          + (onStall > 0 ? '    <button class="removeStallBtn" data-id="' + item.id + '" style="background:#475569;color:#cbd5e1;border:none;border-radius:8px;padding:6px 8px;font-weight:700;font-size:11px;cursor:pointer;">Geri Al</button>' : '')
          + '  </div>'
          + '</div>';
      }).join('');

      var html = ''
        + '<div style="background:#0f172a;border:2px solid #ca8a04;border-radius:22px;max-width:440px;width:100%;max-height:90vh;display:flex;flex-direction:column;color:#fff;padding:20px;box-shadow:0 25px 60px rgba(0,0,0,0.7);position:relative;">'
        + '  <button id="closeStallModal" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">✕</button>'
        + '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
        + '    <div style="font-size:38px;background:#1e293b;border-radius:14px;padding:6px 12px;border:1px solid #ca8a04;">🏪</div>'
        + '    <div>'
        + '      <h2 style="margin:0;font-size:18px;color:#fde047;font-weight:800;">Köy Pazar Tezgahım</h2>'
        + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Ürünlerini Tezgâha Diz, Köylüler Gelip Satın Alsın!</div>'
        + '    </div>'
        + '  </div>'
        + '  <div style="background:#1e293b;border-left:4px solid #ca8a04;padding:10px 12px;border-radius:8px;margin-bottom:12px;font-size:12px;color:#cbd5e1;line-height:1.5;">'
        + '    💡 Tezgâha koyduğun ürünleri haritadaki köylüler (Ayşe Teyze, Demirci Hasan vb.) yürüyerek gelip altınla satın alır!'
        + '    <div style="margin-top:4px;font-weight:700;color:#fde047;">Tezgâhtaki Toplam Ürün: ' + totalOnStall + ' adet</div>'
        + '  </div>'
        + '  <div style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;max-height:55vh;padding-right:4px;">'
        +      itemsHtml
        + '  </div>'
        + '</div>';

      modal.innerHTML = html;

      document.getElementById('closeStallModal').onclick = function(){ modal.remove(); };

      modal.querySelectorAll('.addStallBtn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.getAttribute('data-id');
          if((inv[id] || 0) <= 0) return;
          inv[id]--;
          stallStock[id] = (stallStock[id] || 0) + 1;
          saveStallStock();
          if(typeof window.save === 'function') window.save();
          renderDialog();
        };
      });

      modal.querySelectorAll('.removeStallBtn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.getAttribute('data-id');
          if((stallStock[id] || 0) <= 0) return;
          stallStock[id]--;
          if(stallStock[id] <= 0) delete stallStock[id];
          inv[id] = (inv[id] || 0) + 1;
          saveStallStock();
          if(typeof window.save === 'function') window.save();
          renderDialog();
        };
      });
    }

    renderDialog();
    document.body.appendChild(modal);
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };
  }

  // Initialize Market Square in world
  function initVillageMarket(){
    if(!marketSquare){
      buildMarketSquare();
    }
  }

  // Export to window
  window.initVillageMarket = initVillageMarket;
  window.stepVillageMarket = stepVillageMarket;
  window.openMarketStallDialog = openMarketStallDialog;
  window.getMarketStallGroup = function(){ return _stallGroup; };
  window.stallStock = stallStock;
})();

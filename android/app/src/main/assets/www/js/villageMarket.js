// Village Market Square & High-Performance Village Merchant & Customer System
// Authentic Quaternius 3D Village Bazaar (South-West corner, far from train tracks)
// Supports both SELLING to visiting villagers and BUYING rare seeds/goods from merchants.
(function(){
  var marketSquare = null;
  var _stallGroup = null;
  var _muhtarNpc = null;
  var customerPool = [];
  var stallStock = {}; // itemId -> quantity
  var _poolReady = false;
  var _spawnTimer = 5;

  // Located at far South-West quadrant, completely separated from the northern train line (z = -21)
  var MARKET_POS = { x: -22.0, z: 18.0 };

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

  // Load decorative GLB helper with fallback
  function loadGlb(url, cb){
    if(typeof THREE === 'undefined' || !THREE.GLTFLoader){
      setTimeout(function(){ loadGlb(url, cb); }, 200);
      return;
    }
    var loader = new THREE.GLTFLoader();
    loader.load(url, function(gltf){
      if(!gltf || !gltf.scene){ cb(null); return; }
      var obj = gltf.scene;
      var box = new THREE.Box3().setFromObject(obj);
      var h = Math.max(0.05, box.max.y - box.min.y);
      obj.position.y -= box.min.y;
      cb(obj, h);
    }, undefined, function(){
      cb(null);
    });
  }

  // Build the 3D Village Market Square (Köy Pazar Yeri)
  function buildMarketSquare(){
    var root = new THREE.Group();
    root.position.set(MARKET_POS.x, 0, MARKET_POS.z);

    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a544c, roughness: 0.95 });
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4f2e, roughness: 0.8 });
    var clothMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 });
    var goldClothMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

    // 1. Cobblestone plaza floor (11m x 11m)
    var floor = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.08, 11.2), stoneMat);
    floor.position.y = 0.04;
    floor.receiveShadow = !isMobile;
    root.add(floor);

    // 2. Main Player Market Stall Counter
    var stall = new THREE.Group();
    stall.position.set(0, 0, -2.6);

    // Counter table
    var counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 1.2), woodMat);
    counter.position.y = 0.45;
    counter.castShadow = !isMobile;
    stall.add(counter);

    // Canopy pillars
    [-1.6, 1.6].forEach(function(px){
      [-0.5, 0.5].forEach(function(pz){
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), woodMat);
        post.position.set(px, 1.2, pz);
        stall.add(post);
      });
    });

    // Striped Awning Roof
    for(var s = 0; s < 6; s++){
      var stripeMat = (s % 2 === 0) ? clothMat : goldClothMat;
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 1.6), stripeMat);
      stripe.position.set(-1.4 + s * 0.56, 2.38, 0);
      stripe.rotation.x = 0.15;
      stall.add(stripe);
    }

    // Signboard: "🛒 KÖY PAZARI — ÇİFTÇİ TEZGAHI"
    var sign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.06), woodMat);
    sign.position.set(0, 2.12, 0.82);
    stall.add(sign);

    stall.userData.isMarketStall = true;
    stall.userData.onTap = function(){
      openMarketStallDialog();
    };
    root.add(stall);
    _stallGroup = stall;

    // 3. Secondary Quaternius Merchant Stall (MarketStand_1.glb)
    loadGlb('models/village/MarketStand_1.glb', function(secStall, h){
      if(secStall){
        secStall.scale.setScalar(2.0 / h);
        secStall.position.set(-3.6, 0, 1.2);
        secStall.rotation.y = 0.8;
        root.add(secStall);
      }
    });

    // 4. Authentic Merchant Horse Cart (Cart.glb) loaded with produce
    loadGlb('models/village/Cart.glb', function(cart, h){
      if(cart){
        cart.scale.setScalar(1.5 / h);
        cart.position.set(3.8, 0, -1.2);
        cart.rotation.y = -0.7;
        root.add(cart);
      }
    });

    // 5. Village Props: Grain sacks, wooden crates, and barrels
    loadGlb('models/village/Bags.glb', function(bags, h){
      if(bags){ bags.scale.setScalar(1.0 / h); bags.position.set(3.2, 0, 1.8); root.add(bags); }
    });
    loadGlb('models/village/Barrel.glb', function(barrel, h){
      if(barrel){ barrel.scale.setScalar(0.9 / h); barrel.position.set(-3.8, 0, -1.8); root.add(barrel); }
    });
    loadGlb('models/village/Crate.glb', function(crate, h){
      if(crate){ crate.scale.setScalar(0.8 / h); crate.position.set(-2.0, 0, -3.2); root.add(crate); }
    });

    // 6. Warm Market Street Lantern
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6), woodMat);
    pole.position.set(-4.2, 1.3, -4.2);
    root.add(pole);

    var lanternBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 }));
    lanternBox.position.set(-4.2, 2.6, -4.2);
    root.add(lanternBox);

    var lanternGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    lanternGlow.position.set(-4.2, 2.6, -4.2);
    root.add(lanternGlow);

    var mLight = new THREE.PointLight(0xffdf78, 1.8, 8.0);
    mLight.position.set(-4.2, 2.5, -4.2);
    root.add(mLight);

    scene.add(root);
    marketSquare = root;

    // Spawn Resident Village Elder: Köy Muhtarı & Baş Tüccar Şinasi Bey
    spawnMuhtarNpc();

    // Pre-pool customer NPCs once at startup (Zero runtime parse = 60 FPS!)
    initCustomerPool();

    return root;
  }

  // Spawn Köy Muhtarı & Baş Tüccar Şinasi Bey (Resident NPC in Market)
  function spawnMuhtarNpc(){
    if(_muhtarNpc) return;
    if(typeof window.parseFarmerInstance !== 'function'){
      setTimeout(spawnMuhtarNpc, 400);
      return;
    }

    window.parseFarmerInstance('male', function(rec){
      if(!rec) return;

      // Apply distinct noble emerald green waistcoat & cordovan leather boots
      if(typeof window.applyNpcPalette === 'function'){
        window.applyNpcPalette(rec.body, 'muhtar');
      }

      var muhtar = {
        id: 'muhtar',
        name: 'Köy Muhtarı & Baş Tüccar (Şinasi Bey)',
        role: 'Köy Meclis Başkanı & Pazar Denetmeni',
        group: rec.group,
        mixer: rec.mixer,
        clips: rec.clips,
        currentAction: null,
        animName: 'Idle'
      };

      // Positioned proudly behind the secondary stall in the market square
      muhtar.group.position.set(MARKET_POS.x + 0.4, 0, MARKET_POS.z - 3.4);
      muhtar.group.rotation.y = 0; // Looking out over the market plaza

      if(muhtar.clips && muhtar.clips.Idle){
        muhtar.currentAction = muhtar.mixer.clipAction(muhtar.clips.Idle);
        muhtar.currentAction.play();
      }

      muhtar.group.userData.npcRef = muhtar;
      muhtar.group.userData.onTap = function(){
        openMarketStallDialog();
      };
      muhtar.group.traverse(function(c){
        if(c.isMesh){
          c.castShadow = !isMobile;
          c.userData.npcRef = muhtar;
        }
      });

      scene.add(muhtar.group);
      _muhtarNpc = muhtar;
    });
  }

  // Pre-pool Customer NPCs with Distinct Archetype Palettes
  function initCustomerPool(){
    if(_poolReady) return;
    _poolReady = true;

    var archetypes = [
      {
        id: 'cust_smith',
        kind: 'male',
        name: 'Demirci Selim Usta',
        role: 'Köy Demircisi & Nalbur',
        palette: 'blacksmith'
      },
      {
        id: 'cust_herbalist',
        kind: 'female',
        name: 'Gezgin Aktar & Şifacı (Elif Hanım)',
        role: 'Nadir Tohum & Dağ Baharatı Uzmanı',
        palette: 'herbalist'
      },
      {
        id: 'cust_villager',
        kind: 'female',
        name: 'Köy Sakini (Ayşe Teyze)',
        role: 'Çiftlik Komşusu',
        palette: 'baker'
      }
    ];

    archetypes.forEach(function(spec, idx){
      if(typeof window.parseFarmerInstance === 'function'){
        window.parseFarmerInstance(spec.kind, function(rec){
          if(!rec) return;

          // Apply unique archetype clothing colors
          if(typeof window.applyNpcPalette === 'function'){
            window.applyNpcPalette(rec.body, spec.palette);
          }

          var cust = {
            id: spec.id,
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
          cust.group.userData.isCustomer = true;
          cust.group.userData.onTap = function(){
            openMarketStallDialog();
          };
          cust.group.traverse(function(c){
            if(c.isMesh){
              c.frustumCulled = true;
              c.castShadow = !isMobile;
              c.receiveShadow = !isMobile;
              c.userData.customerRef = cust;
            }
          });
          scene.add(cust.group);
          customerPool.push(cust);
        });
      }
    });
  }

  // Activate a pooled customer from the meadow path
  function activateCustomer(){
    var available = customerPool.find(function(c){ return !c.active; });
    if(!available) return;

    var startAngle = Math.random() * Math.PI * 2;
    var startDist = 18.0;
    available.x = MARKET_POS.x + Math.cos(startAngle) * startDist;
    available.z = MARKET_POS.z + Math.sin(startAngle) * startDist;
    available.tx = MARKET_POS.x + (Math.random() - 0.5) * 1.8;
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

  function playCustomerClip(cust, name){
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

    // Pick a random product from stall
    var chosenKey = inStockKeys[Math.floor(Math.random() * inStockKeys.length)];
    stallStock[chosenKey]--;
    if(stallStock[chosenKey] <= 0) delete stallStock[chosenKey];
    saveStallStock();

    var prices = {
      tomato: 8, carrot: 10, pepper: 12, cucumber: 14, strawberry: 18, wheat: 7,
      egg: 16, milk: 25, milk_creamy: 50, milk_golden: 120,
      fish: 22, fish_trout: 40, fish_carp: 70, fish_golden: 140,
      omelet: 45, bread: 32, pie: 75, fish_soup: 90, cheese: 60, butter: 80
    };

    var itemNames = {
      tomato: '🍅 Domates', carrot: '🥕 Havuç', pepper: '🌶️ Biber', cucumber: '🥒 Kabak',
      strawberry: '🍓 Çilek', wheat: '🌾 Buğday', egg: '🥚 Yumurta', milk: '🥛 Süt',
      milk_creamy: '🌟 Kaymaklı Süt', milk_golden: '👑 Altın Süt', fish: '🐟 Göl Balığı',
      fish_trout: '✨ Gümüş Alabalık', fish_carp: '🔴 Kızıl Sazan', fish_golden: '👑 Altın Sazan',
      omelet: '🍳 Köy Omleti', bread: '🥐 Köy Ekmeği', pie: '🥧 Sebzeli Börek',
      fish_soup: '🍲 Balıkçı Çorbası', cheese: '🧀 Köy Peyniri', butter: '🧈 Köy Tereyağı'
    };

    var earn = prices[chosenKey] || 15;
    if(typeof coins !== 'undefined') window.coins = (window.coins || 0) + earn;
    if(typeof window.save === 'function') window.save();
    if(typeof window.renderUI === 'function') window.renderUI();

    playCoinChime();
    if(typeof showToast === 'function'){
      showToast('🛒 ' + cust.profile.name + ' tezgâhından ' + (itemNames[chosenKey] || chosenKey) + ' satın aldı! (+' + earn + ' 🟡 Altın)');
    }

    playCustomerClip(cust, 'Wave');
    setTimeout(function(){
      cust.state = 'walk_out';
      pickExitTarget(cust);
    }, 1800);
  }

  function pickExitTarget(cust){
    var exitAngle = Math.random() * Math.PI * 2;
    var exitDist = 22.0;
    cust.tx = MARKET_POS.x + Math.cos(exitAngle) * exitDist;
    cust.tz = MARKET_POS.z + Math.sin(exitAngle) * exitDist;
    if(cust.clips && cust.clips.Walk){
      playCustomerClip(cust, 'Walk');
    }
  }

  // Update loop for Market & Customers
  function stepVillageMarket(dt, now){
    if(dt > 0.1) dt = 0.1;

    // Muhtar animation update
    if(_muhtarNpc && _muhtarNpc.mixer){
      var fc0 = (typeof window._fc === 'number') ? window._fc : 0;
      if(fc0 % 2 === 0) _muhtarNpc.mixer.update(dt * 2);
    }

    _spawnTimer -= dt;
    if(_spawnTimer <= 0){
      _spawnTimer = 15 + Math.random() * 15;
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

  // Items Player Can BUY from Village Merchants & Visiting NPCs
  var VILLAGE_BUY_ITEMS = [
    {
      id: 'seed_golden_berry',
      name: 'Nadir Altın Çilek Tohumu',
      emoji: '🌟',
      desc: 'Özel parlak altın çilekler yetiştirir. Yüksek kazanç!',
      price: 30,
      rewardType: 'seed',
      rewardId: 'strawberry'
    },
    {
      id: 'seed_royal_wheat',
      name: 'Kraliyet Buğdayı Tohumu',
      emoji: '🌾',
      desc: 'Hızlı büyüyen dolgun başaklı köy buğdayı tohumu.',
      price: 25,
      rewardType: 'seed',
      rewardId: 'wheat'
    },
    {
      id: 'mountain_spices',
      name: 'Dağ Baharatı & Aşçı Mayası',
      emoji: '🧂',
      desc: 'Köy fırınında lezzetli börek ve ekmekler pişirmek için gerekli.',
      price: 20,
      rewardType: 'item',
      rewardId: 'spices'
    },
    {
      id: 'village_cheese',
      name: 'Eski Kaşar & Köy Peyniri',
      emoji: '🧀',
      desc: 'Hakiki dinlenmiş köy gravyeri. Siparişlerde yüksek değer!',
      price: 35,
      rewardType: 'item',
      rewardId: 'cheese'
    },
    {
      id: 'master_bait',
      name: 'Usta Balıkçı Yemi',
      emoji: '🪱',
      desc: 'Kıyı göletinde Alabalık ve Altın Sazan vurma şansını katlar.',
      price: 15,
      rewardType: 'item',
      rewardId: 'bait'
    },
    {
      id: 'rich_fertilizer',
      name: 'Meşe Kerestesi & Zengin Gübre',
      emoji: '🪵',
      desc: 'Bahçe bitkilerinin ve ağaçların daha gür yetişmesini sağlar.',
      price: 25,
      rewardType: 'item',
      rewardId: 'wood'
    }
  ];

  // Interactive Village Market Dialog (Both SELLING and BUYING Tabs)
  function openMarketStallDialog(){
    var existing = document.getElementById('marketStallModal');
    if(existing) existing.remove();

    var inv = window.inventory || {};
    var currentTab = 'sell'; // 'sell' or 'buy'

    var sellables = [
      { id: 'tomato', name: 'Domates', emoji: '🍅', price: 8 },
      { id: 'carrot', name: 'Havuç', emoji: '🥕', price: 10 },
      { id: 'pepper', name: 'Biber', emoji: '🌶️', price: 12 },
      { id: 'cucumber', name: 'Kabak', emoji: '🥒', price: 14 },
      { id: 'strawberry', name: 'Çilek', emoji: '🍓', price: 18 },
      { id: 'wheat', name: 'Buğday', emoji: '🌾', price: 7 },
      { id: 'egg', name: 'Köy Yumurtası', emoji: '🥚', price: 16 },
      { id: 'milk', name: 'Taze Süt', emoji: '🥛', price: 25 },
      { id: 'milk_creamy', name: 'Kaymaklı Süt', emoji: '🌟', price: 50 },
      { id: 'fish', name: 'Göl Balığı', emoji: '🐟', price: 22 },
      { id: 'fish_trout', name: 'Gümüş Alabalık', emoji: '✨', price: 40 },
      { id: 'omelet', name: 'Köy Omleti', emoji: '🍳', price: 45 },
      { id: 'bread', name: 'Köy Ekmeği', emoji: '🥐', price: 32 },
      { id: 'pie', name: 'Sebzeli Börek', emoji: '🥧', price: 75 },
      { id: 'fish_soup', name: 'Balıkçı Çorbası', emoji: '🍲', price: 90 },
      { id: 'cheese', name: 'Köy Peyniri', emoji: '🧀', price: 60 },
      { id: 'butter', name: 'Köy Tereyağı', emoji: '🧈', price: 80 }
    ];

    var modal = document.createElement('div');
    modal.id = 'marketStallModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;';

    function renderDialog(){
      var totalOnStall = 0;
      Object.keys(stallStock).forEach(function(k){ totalOnStall += stallStock[k]; });
      var playerCoins = window.coins || 0;

      // Tab 1: Sell to villagers
      var sellHtml = sellables.map(function(item){
        var bagCount = inv[item.id] || 0;
        var onStall = stallStock[item.id] || 0;
        return ''
          + '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          + '  <div style="display:flex;align-items:center;gap:10px;">'
          + '    <div style="font-size:26px;">' + item.emoji + '</div>'
          + '    <div>'
          + '      <div style="font-weight:700;font-size:13px;color:#fff;">' + item.name + ' <span style="font-size:11px;color:#4ade80;">(~' + item.price + ' 🟡)</span></div>'
          + '      <div style="font-size:11px;color:#94a3b8;">Çantanda: <b style="color:#67e8f9;">' + bagCount + '</b> | Tezgâhta: <b style="color:#fde047;">' + onStall + '</b></div>'
          + '    </div>'
          + '  </div>'
          + '  <div style="display:flex;gap:6px;">'
          + (bagCount > 0 ? '    <button class="addStallBtn" data-id="' + item.id + '" style="background:#ca8a04;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-weight:700;font-size:11px;cursor:pointer;">+ Tezgâha Koy</button>' : '')
          + (onStall > 0 ? '    <button class="removeStallBtn" data-id="' + item.id + '" style="background:#475569;color:#cbd5e1;border:none;border-radius:8px;padding:6px 8px;font-weight:700;font-size:11px;cursor:pointer;">Geri Al</button>' : '')
          + '  </div>'
          + '</div>';
      }).join('');

      // Tab 2: Buy from village merchants
      var buyHtml = VILLAGE_BUY_ITEMS.map(function(item){
        var canAfford = playerCoins >= item.price;
        return ''
          + '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          + '  <div style="display:flex;align-items:center;gap:10px;">'
          + '    <div style="font-size:30px;">' + item.emoji + '</div>'
          + '    <div>'
          + '      <div style="font-weight:700;font-size:13px;color:#fde047;">' + item.name + '</div>'
          + '      <div style="font-size:11px;color:#cbd5e1;max-width:210px;line-height:1.3;">' + item.desc + '</div>'
          + '      <div style="font-size:11px;color:#38bdf8;font-weight:700;margin-top:2px;">Fiyat: ' + item.price + ' 🟡 Altın</div>'
          + '    </div>'
          + '  </div>'
          + '  <button class="buyItemBtn" data-id="' + item.id + '" data-price="' + item.price + '" style="background:' + (canAfford ? 'linear-gradient(135deg,#0284c7,#0369a1)' : '#334155') + ';color:' + (canAfford ? '#fff' : '#64748b') + ';border:none;border-radius:8px;padding:8px 12px;font-weight:700;font-size:11px;cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';">Satın Al</button>'
          + '</div>';
      }).join('');

      var html = ''
        + '<div style="background:#0f172a;border:2px solid #ca8a04;border-radius:22px;max-width:440px;width:100%;max-height:92vh;display:flex;flex-direction:column;color:#fff;padding:18px;box-shadow:0 25px 60px rgba(0,0,0,0.7);position:relative;">'
        + '  <button id="closeStallModal" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">✕</button>'
        + '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
        + '    <div style="font-size:36px;background:#1e293b;border-radius:14px;padding:6px 12px;border:1px solid #ca8a04;">🛒</div>'
        + '    <div>'
        + '      <h2 style="margin:0;font-size:18px;color:#fde047;font-weight:800;">Köy Pazar Yeri & Ticaret</h2>'
        + '      <div style="font-size:12px;color:#94a3b8;font-weight:600;">Muhtar Şinasi & Köy Tüccarları Meydanı | 🟡 ' + playerCoins + ' Altın</div>'
        + '    </div>'
        + '  </div>'
        + '  <div style="display:flex;gap:6px;margin-bottom:12px;">'
        + '    <button id="tabSellBtn" style="flex:1;padding:8px;border-radius:10px;border:none;font-weight:700;font-size:12px;cursor:pointer;background:' + (currentTab === 'sell' ? '#ca8a04;color:#fff;' : '#1e293b;color:#94a3b8;') + '">🏷️ Ürünlerimi Sat (' + totalOnStall + ')</button>'
        + '    <button id="tabBuyBtn" style="flex:1;padding:8px;border-radius:10px;border:none;font-weight:700;font-size:12px;cursor:pointer;background:' + (currentTab === 'buy' ? '#0284c7;color:#fff;' : '#1e293b;color:#94a3b8;') + '">🛍️ Köylüden Alışveriş Yap</button>'
        + '  </div>'
        + (currentTab === 'sell'
          ? '  <div style="background:#1e293b;border-left:4px solid #ca8a04;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:11px;color:#cbd5e1;line-height:1.4;">'
            + '    💡 Tezgâha koyduğun ürünleri haritadaki köylüler (Demirci Selim, Ayşe Teyze vb.) gelip altınla satın alır!'
            + '  </div>'
            + '  <div style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;max-height:50vh;padding-right:4px;">' + sellHtml + '</div>'
          : '  <div style="background:#1e293b;border-left:4px solid #0284c7;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:11px;color:#cbd5e1;line-height:1.4;">'
            + '    ✨ Köy tüccarlarının ve gezgin aktarın getirdiği özel tohumlar, baharatlar ve çiftlik malzemeleri!'
            + '  </div>'
            + '  <div style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;max-height:50vh;padding-right:4px;">' + buyHtml + '</div>'
        )
        + '</div>';

      modal.innerHTML = html;

      document.getElementById('closeStallModal').onclick = function(){ modal.remove(); };

      document.getElementById('tabSellBtn').onclick = function(){
        currentTab = 'sell';
        renderDialog();
      };
      document.getElementById('tabBuyBtn').onclick = function(){
        currentTab = 'buy';
        renderDialog();
      };

      // Add to stall
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

      // Remove from stall
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

      // Buy item from merchant
      modal.querySelectorAll('.buyItemBtn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.getAttribute('data-id');
          var price = parseInt(btn.getAttribute('data-price'), 10) || 20;
          if((window.coins || 0) < price){
            if(typeof showNotice === 'function') showNotice('Yeterli altının yok!');
            return;
          }
          var it = VILLAGE_BUY_ITEMS.find(function(b){ return b.id === id; });
          if(!it) return;

          window.coins -= price;
          var targetKey = it.rewardId;
          inv[targetKey] = (inv[targetKey] || 0) + 1;

          playCoinChime();
          if(typeof window.save === 'function') window.save();
          if(typeof window.renderUI === 'function') window.renderUI();
          if(typeof showToast === 'function') showToast('🛒 ' + it.name + ' satın alındı! (-' + price + ' 🟡 Altın)');
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

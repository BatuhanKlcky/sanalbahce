// aQuality.js — Sanal Bahçe A-Kalite 4'lü Paket:
// 1) Çiftlik Pazarı, Ambar & Sipariş/Üretim Sistemi
// 2) Akıllı Evcil Dost Etkileşimi (3D Kalpler, İsimlendirme, Zararlı Avcısı Köpek & Hazine Kaşifi Kedi)
// 3) 4 Mevsim Atmosferi (Sakura İlkbahar, Yaz, Sonbahar, Kış) & Canlı 3D Su Dalgaları
// 4) Gece Sıcak Pencere Işıkları & Filtreli Cozy Fotoğraf Stüdyosu (PNG Kaydetme)
(function(){
  'use strict';

  var BARN_KEY = 'gdn_barn_v1';
  var ORDERS_KEY = 'gdn_orders_v1';
  var PET_META_KEY = 'gdn_pet_meta_v1';
  var SEASON_KEY = 'gdn_season_v1';

  // ═══════════════════════════════════════════════════════════════════════════
  // PAKET 1: ÇİFTLİK AMBARI, MUTFAK ÜRETİMİ VE KÖYLÜ SİPARİŞ TAHTASI
  // ═══════════════════════════════════════════════════════════════════════════
  var ITEMS_META = {
    tomato:     { emoji: '🍅', name: 'Domates',        kind: 'raw' },
    strawberry: { emoji: '🍓', name: 'Çilek',          kind: 'raw' },
    cucumber:   { emoji: '🥒', name: 'Kabak',          kind: 'raw' },
    pepper:     { emoji: '🌶️', name: 'Biber',          kind: 'raw' },
    carrot:     { emoji: '🥕', name: 'Havuç',          kind: 'raw' },
    jam:        { emoji: '🍯', name: 'Çilek Reçeli',   kind: 'craft' },
    soup:       { emoji: '🥣', name: 'Bahçe Çorbası',  kind: 'craft' },
    salad:      { emoji: '🥗', name: 'Köy Salatası',   kind: 'craft' },
    sauce:      { emoji: '🔥', name: 'Acı Çiftlik Sosu',kind: 'craft' }
  };

  var RECIPES = [
    {
      id: 'jam',
      emoji: '🍯',
      name: 'Çilek Reçeli',
      desc: '2x 🍓 Çilek',
      cost: { strawberry: 2 },
      xp: 15
    },
    {
      id: 'soup',
      emoji: '🥣',
      name: 'Bahçe Çorbası',
      desc: '1x 🍅 Domates + 1x 🥕 Havuç',
      cost: { tomato: 1, carrot: 1 },
      xp: 20
    },
    {
      id: 'salad',
      emoji: '🥗',
      name: 'Köy Salatası',
      desc: '1x 🥒 Kabak + 1x 🍅 Domates',
      cost: { cucumber: 1, tomato: 1 },
      xp: 20
    },
    {
      id: 'sauce',
      emoji: '🔥',
      name: 'Acı Çiftlik Sosu',
      desc: '2x 🌶️ Biber + 1x 🍅 Domates',
      cost: { pepper: 2, tomato: 1 },
      xp: 25
    }
  ];

  var VILLAGERS = [
    { name: 'Fırıncı Hasan',   avatar: '👨‍🍳', line: 'Taze mahsullerin kokusu bütün köyü sardı!' },
    { name: 'Çiçekçi Zehra',   avatar: '👩‍🌾', line: 'Pazar tezgâhım için organik ürün lazım.' },
    { name: 'Hanımeli Teyze',  avatar: '👵',   line: 'Torunlara akşam yemeği hazırlıyorum.' },
    { name: 'Gezgin Tüccar',   avatar: '🧔',   line: 'Başkent kervanı için en iyi ürünleri alırım!' },
    { name: 'Değirmenci Kemal',avatar: '🧓',   line: 'Değirmen molasında sıcak bir şeyler iyi gider.' }
  ];

  var ORDER_TEMPLATES = [
    { req: { tomato: 2 },                  coin: 48,  xp: 25 },
    { req: { strawberry: 2 },              coin: 42,  xp: 22 },
    { req: { carrot: 2, cucumber: 1 },     coin: 65,  xp: 30 },
    { req: { pepper: 2 },                  coin: 52,  xp: 25 },
    { req: { jam: 1 },                     coin: 68,  xp: 35 },
    { req: { soup: 1 },                    coin: 78,  xp: 40 },
    { req: { salad: 1 },                   coin: 82,  xp: 40 },
    { req: { sauce: 1 },                   coin: 95,  xp: 48 },
    { req: { strawberry: 1, carrot: 2 },   coin: 60,  xp: 28 },
    { req: { jam: 1, soup: 1 },            coin: 145, xp: 65 }
  ];

  var barn = {
    tomato: 1, strawberry: 1, cucumber: 1, pepper: 1, carrot: 1,
    jam: 0, soup: 0, salad: 0, sauce: 0
  };
  var activeOrders = [];

  function loadBarn(){
    try {
      var raw = localStorage.getItem(BARN_KEY);
      if(raw){
        var parsed = JSON.parse(raw);
        for(var k in ITEMS_META){
          if(typeof parsed[k] === 'number' && parsed[k] >= 0) barn[k] = Math.floor(parsed[k]);
        }
      }
    } catch(e){}
  }

  function saveBarn(){
    try { localStorage.setItem(BARN_KEY, JSON.stringify(barn)); } catch(e){}
    updateOrderBadge();
  }

  function makeOrder(idx){
    var v = VILLAGERS[Math.floor(Math.random() * VILLAGERS.length)];
    var t = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
    var reqCopy = {};
    for(var k in t.req) reqCopy[k] = t.req[k];
    return {
      id: 'ord_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random()*999),
      villager: v.name,
      avatar: v.avatar,
      line: v.line,
      req: reqCopy,
      coin: t.coin,
      xp: t.xp
    };
  }

  function loadOrders(){
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      if(raw){
        var arr = JSON.parse(raw);
        if(Array.isArray(arr) && arr.length === 3){
          activeOrders = arr;
          return;
        }
      }
    } catch(e){}
    activeOrders = [makeOrder(0), makeOrder(1), makeOrder(2)];
    saveOrders();
  }

  function saveOrders(){
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(activeOrders)); } catch(e){}
    updateOrderBadge();
  }

  function canAffordCost(cost){
    for(var k in cost){
      if((barn[k] || 0) < cost[k]) return false;
    }
    return true;
  }

  function updateOrderBadge(){
    var readyCount = 0;
    for(var i = 0; i < activeOrders.length; i++){
      if(activeOrders[i] && canAffordCost(activeOrders[i].req)) readyCount++;
    }
    var badge = document.getElementById('marketReadyBadge');
    if(badge){
      badge.style.display = readyCount > 0 ? 'inline-flex' : 'none';
      badge.textContent = readyCount;
    }
  }

  window.addBarnItem = function(key, qty){
    if(!ITEMS_META[key]) return;
    barn[key] = (barn[key] || 0) + (qty || 1);
    saveBarn();
    renderMarketPanel();
  };

  window.onCropHarvested = function(type){
    if(ITEMS_META[type]){
      barn[type] = (barn[type] || 0) + 1;
      saveBarn();
      renderMarketPanel();
    }
    // Sonbahar bereketi bonusu (+%20 coin)
    if(currentSeason === 'autumn' && typeof HARVEST_TYPES !== 'undefined' && HARVEST_TYPES[type]){
      var bonus = Math.max(3, Math.round(HARVEST_TYPES[type].coin * 0.25));
      if(typeof addCoin === 'function') addCoin(bonus, true);
    }
  };

  window.craftRecipe = function(recipeId){
    var rec = null;
    for(var i = 0; i < RECIPES.length; i++){
      if(RECIPES[i].id === recipeId){ rec = RECIPES[i]; break; }
    }
    if(!rec) return;
    if(!canAffordCost(rec.cost)){
      showToast('Ambarda yeterli malzeme yok 🧺');
      return;
    }
    for(var k in rec.cost){
      barn[k] -= rec.cost[k];
    }
    barn[rec.id] = (barn[rec.id] || 0) + 1;
    if(typeof addXP === 'function') addXP(rec.xp);
    if(typeof sndTask === 'function') sndTask();
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('success');
    saveBarn();
    renderMarketPanel();
    showToast(rec.emoji + ' ' + rec.name + ' üretildi! (+' + rec.xp + ' XP)');
  };

  window.deliverOrder = function(index){
    var ord = activeOrders[index];
    if(!ord) return;
    if(!canAffordCost(ord.req)){
      showToast('Sipariş için gerekli ürünler ambarda yok 📦');
      return;
    }
    for(var k in ord.req){
      barn[k] -= ord.req[k];
    }
    var pay = ord.coin + Math.max(0, ((typeof level !== 'undefined' ? level : 1) - 1) * 4);
    if(currentSeason === 'autumn') pay = Math.round(pay * 1.2);
    if(typeof addCoin === 'function') addCoin(pay, true);
    if(typeof addXP === 'function') addXP(ord.xp);
    if(typeof sndLvl === 'function') sndLvl();
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('harvest');

    showToast('🎉 ' + ord.villager + ' siparişi teslim alındı! +' + pay + '💰 +' + ord.xp + ' XP');
    activeOrders[index] = makeOrder(index);
    saveBarn();
    saveOrders();
    renderMarketPanel();
  };

  window.rerollOrder = function(index){
    activeOrders[index] = makeOrder(index);
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
    saveOrders();
    renderMarketPanel();
    showToast('🔄 Yeni köylü siparişi geldi!');
  };

  function renderMarketPanel(){
    var body = document.getElementById('marketPanelBody');
    if(!body) return;

    var rawKeys = ['tomato','strawberry','cucumber','pepper','carrot'];
    var craftKeys = ['jam','soup','salad','sauce'];

    var rawHtml = rawKeys.map(function(k){
      var m = ITEMS_META[k];
      var cnt = barn[k] || 0;
      return '<div class="aq-chip' + (cnt > 0 ? ' has' : '') + '">' +
        '<span class="aq-chip-em">' + m.emoji + '</span>' +
        '<span class="aq-chip-nm">' + m.name + '</span>' +
        '<span class="aq-chip-ct">x' + cnt + '</span>' +
      '</div>';
    }).join('');

    var craftInvHtml = craftKeys.map(function(k){
      var m = ITEMS_META[k];
      var cnt = barn[k] || 0;
      return '<div class="aq-chip craft' + (cnt > 0 ? ' has' : '') + '">' +
        '<span class="aq-chip-em">' + m.emoji + '</span>' +
        '<span class="aq-chip-nm">' + m.name + '</span>' +
        '<span class="aq-chip-ct">x' + cnt + '</span>' +
      '</div>';
    }).join('');

    var recipesHtml = RECIPES.map(function(r){
      var ok = canAffordCost(r.cost);
      return '<div class="aq-recipe-card">' +
        '<div class="aq-rc-left">' +
          '<span class="aq-rc-em">' + r.emoji + '</span>' +
          '<div>' +
            '<div class="aq-rc-title">' + r.name + '</div>' +
            '<div class="aq-rc-sub">' + r.desc + ' · +' + r.xp + ' XP</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="aq-btn' + (ok ? ' primary' : ' disabled') + '" onclick="window.craftRecipe(\'' + r.id + '\')">' +
          (ok ? '🍳 Üret' : 'Eksik') +
        '</button>' +
      '</div>';
    }).join('');

    var ordersHtml = activeOrders.map(function(ord, idx){
      var ok = canAffordCost(ord.req);
      var reqTags = Object.keys(ord.req).map(function(k){
        var m = ITEMS_META[k] || { emoji: '📦', name: k };
        var have = barn[k] || 0;
        var need = ord.req[k];
        var enough = have >= need;
        return '<span class="aq-req-tag' + (enough ? ' ok' : '') + '">' +
          m.emoji + ' ' + m.name + ' <b>' + have + '/' + need + '</b>' +
        '</span>';
      }).join(' ');
      var pay = ord.coin + Math.max(0, ((typeof level !== 'undefined' ? level : 1) - 1) * 4);
      if(currentSeason === 'autumn') pay = Math.round(pay * 1.2);
      return '<div class="aq-order-card' + (ok ? ' ready' : '') + '">' +
        '<div class="aq-ord-top">' +
          '<span class="aq-ord-av">' + ord.avatar + '</span>' +
          '<div class="aq-ord-who">' +
            '<div class="aq-ord-nm">' + ord.villager + '</div>' +
            '<div class="aq-ord-ln">"' + ord.line + '"</div>' +
          '</div>' +
          '<button type="button" class="aq-reroll" title="Siparişi Değiştir" onclick="window.rerollOrder(' + idx + ')">🔄</button>' +
        '</div>' +
        '<div class="aq-ord-reqs">' + reqTags + '</div>' +
        '<div class="aq-ord-foot">' +
          '<span class="aq-ord-rew">Ödül: <b>+' + pay + ' 💰</b> · <b>+' + ord.xp + ' ⭐</b></span>' +
          '<button type="button" class="aq-btn' + (ok ? ' deliver' : ' disabled') + '" onclick="window.deliverOrder(' + idx + ')">' +
            (ok ? '📦 Teslim Et' : 'Hazır Değil') +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    body.innerHTML =
      '<h3>🧺 Çiftlik Ambarı (Hasat Edilenler)</h3>' +
      '<div class="aq-chip-grid">' + rawHtml + '</div>' +
      '<div class="aq-chip-grid" style="margin-top:6px">' + craftInvHtml + '</div>' +
      '<h3>📋 Köylü Sipariş Tahtası</h3>' +
      '<div class="aq-orders-list">' + ordersHtml + '</div>' +
      '<h3>🍳 Çiftlik Mutfağı (Üretim)</h3>' +
      '<div class="aq-recipes-list">' + recipesHtml + '</div>';
  }
  window.renderMarketPanel = renderMarketPanel;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAKET 2: AKILLI EVCİL DOST ETKİLEŞİMİ (KEDİ & KÖPEK) VE 3D KALP EFEKTLERİ
  // ═══════════════════════════════════════════════════════════════════════════
  var petMeta = {}; // { 'cat_0': { name: 'Pamuk', happy: 85 }, ... }
  var floatingHearts = []; // { mesh, vy, life, maxLife }
  var _dogSkillTimer = 14;
  var _catSkillTimer = 28;

  function loadPetMeta(){
    try {
      var raw = localStorage.getItem(PET_META_KEY);
      if(raw) petMeta = JSON.parse(raw) || {};
    } catch(e){ petMeta = {}; }
  }
  function savePetMeta(){
    try { localStorage.setItem(PET_META_KEY, JSON.stringify(petMeta)); } catch(e){}
  }

  function getPetKey(pet, idx){
    return (pet.type || 'pet') + '_' + (idx || 0);
  }

  function getPetInfo(pet, idx){
    var key = getPetKey(pet, idx);
    if(!petMeta[key]){
      var defCats = ['Pamuk', 'Tarçın', 'Mırmır', 'Boncuk'];
      var defDogs = ['Karabaş', 'Paşa', 'Dost', 'Fındık'];
      var pool = pet.type === 'cat' ? defCats : defDogs;
      petMeta[key] = {
        name: pool[idx % pool.length],
        happy: 80
      };
      savePetMeta();
    }
    return petMeta[key];
  }
  window.getPetInfo = getPetInfo;

  function makeHeartSprite(emoji){
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var g = c.getContext('2d');
    g.font = '44px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(emoji || '❤️', 32, 34);
    var tex = new THREE.CanvasTexture(c);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    var sp = new THREE.Sprite(mat);
    sp.scale.set(0.45, 0.45, 0.45);
    return sp;
  }

  window.spawnPetLoveFX = function(pos, emoji){
    if(typeof scene === 'undefined' || !pos) return;
    for(var i = 0; i < 4; i++){
      var sp = makeHeartSprite(i % 2 === 0 ? (emoji || '❤️') : '✨');
      sp.position.set(
        pos.x + (Math.random() - 0.5) * 0.7,
        0.75 + i * 0.18,
        pos.z + (Math.random() - 0.5) * 0.7
      );
      scene.add(sp);
      floatingHearts.push({
        mesh: sp,
        vy: 0.9 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        life: 0,
        maxLife: 1.3 + Math.random() * 0.4
      });
    }
  };

  window.petActionLove = function(petIdx){
    if(typeof pets === 'undefined' || !pets[petIdx]) return;
    var pet = pets[petIdx];
    var info = getPetInfo(pet, petIdx);
    info.happy = Math.min(100, (info.happy || 75) + 15);
    savePetMeta();
    window.spawnPetLoveFX(pet.mesh.position, '❤️');
    pet._reactTimer = 2.1;
    if(typeof window.playAnimalClip === 'function'){
      var loveCandidates = pet.type === 'cat'
        ? [pet.spec && pet.spec.loveClip, 'knead', 'wiggle', 'arch', 'head_tilt', 'jump']
        : [pet.spec && pet.spec.loveClip, 'get_pet', 'excited_bounce', 'play_bow', 'happy', 'tail_wag'];
      window.playAnimalClip(pet, loveCandidates, { fade: 0.16, force: true });
    }
    if(typeof sndPet === 'function') sndPet();
    if(typeof addXP === 'function') addXP(8);
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('medium');
    var breedTag = pet.breedName ? (' (' + pet.breedName + ')') : '';
    showToast((pet.type === 'cat' ? '🐱 ' : '🐶 ') + info.name + breedTag + ' çok mutlu oldu! ❤️ (+8 XP)');
  };

  window.petActionFeed = function(petIdx){
    if(typeof pets === 'undefined' || !pets[petIdx]) return;
    var pet = pets[petIdx];
    var info = getPetInfo(pet, petIdx);
    if(typeof stats !== 'undefined' && stats.coin < 5){
      showToast('Mama için 5 💰 gerekli');
      return;
    }
    if(typeof stats !== 'undefined'){
      stats.coin -= 5;
      if(typeof updStats === 'function') updStats();
      if(typeof saveStats === 'function') saveStats();
    }
    info.happy = 100;
    savePetMeta();
    window.spawnPetLoveFX(pet.mesh.position, '🍖');
    pet._reactTimer = 2.4;
    if(typeof window.playAnimalClip === 'function'){
      var feedCandidates = pet.type === 'cat'
        ? [pet.spec && pet.spec.feedClip, 'stretch', 'groom', 'jump', 'wiggle']
        : [pet.spec && pet.spec.feedClip, 'eat', 'receive_treat', 'chew', 'happy'];
      window.playAnimalClip(pet, feedCandidates, { fade: 0.16, force: true });
    }
    if(typeof sndPet === 'function') sndPet();
    if(typeof addXP === 'function') addXP(15);
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('success');

    if(pet.type === 'dog' && typeof badBugs !== 'undefined' && badBugs.length > 0){
      triggerDogChaseBug(pet, info);
    } else if(pet.type === 'cat'){
      triggerCatGift(pet, info, true);
    } else {
      showToast('🍖 ' + info.name + ' karnını doyurdu! Enerjisi %100 (+15 XP)');
    }
  };

  window.petActionRename = function(petIdx){
    if(typeof pets === 'undefined' || !pets[petIdx]) return;
    var pet = pets[petIdx];
    var info = getPetInfo(pet, petIdx);
    var nextName = window.prompt('Evcil dostunun yeni adı (2-14 karakter):', info.name || '');
    if(!nextName) return;
    nextName = nextName.trim().slice(0, 14);
    if(nextName.length < 2){
      showToast('İsim en az 2 harf olmalı');
      return;
    }
    info.name = nextName;
    savePetMeta();
    showToast('✨ Yeni isim kaydedildi: ' + info.name);
  };

  function triggerDogChaseBug(dog, info){
    if(typeof badBugs === 'undefined' || !badBugs.length) return false;
    var bg = badBugs.pop();
    if(bg && bg.group){
      window.spawnPetLoveFX(bg.group.position, '🐾');
      dog.target = bg.group.position.clone();
      dog._restTimer = 0;
      dog._reactTimer = 0;
      dog._chasing = true;
      if(typeof window.playAnimalClip === 'function'){
        window.playAnimalClip(dog, ['run', 'trot', 'zoomies', 'walk'], { fade: 0.14, timeScale: 1.2, force: true });
      }
      bg.group.traverse(function(c){
        if(c.geometry) c.geometry.dispose();
        if(c.material) c.material.dispose();
      });
      scene.remove(bg.group);
    }
    if(typeof badM !== 'undefined' && bg){
      var mi = badM.findIndex(function(m){ return m.userData && m.userData.id === bg.id; });
      if(mi > -1) badM.splice(mi, 1);
    }
    var bdEl = document.getElementById('bdC');
    if(bdEl) bdEl.innerText = badBugs.length;
    if(typeof stats !== 'undefined'){ stats.kill = (stats.kill || 0) + 1; }
    if(typeof addXP === 'function') addXP(10);
    if(typeof sndKill === 'function') sndKill();
    showToast('🐶 ' + (info ? info.name : 'Köpeğin') + ' bir zararlı böceği kovaladı! (+10 XP)');
    return true;
  }

  function triggerCatGift(cat, info, forced){
    window.spawnPetLoveFX(cat.mesh.position, '🎁');
    cat._reactTimer = 1.9;
    if(typeof window.playAnimalClip === 'function'){
      window.playAnimalClip(cat, ['pounce', 'jump', 'wiggle', 'arch'], { fade: 0.15, force: true });
    }
    var bonusCoin = 10 + Math.floor(Math.random() * 8);
    if(typeof addCoin === 'function') addCoin(bonusCoin, true);
    if(typeof sndCoin === 'function') sndCoin();
    showToast('🐱 ' + (info ? info.name : 'Kedin') + ' bahçede parlak +' + bonusCoin + ' 💰 bulup getirdi!');
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAKET 3: 4 MEVSİM ATMOSFERİ (SAKURA, YAZ, SONBAHAR, KIŞ) & SU DALGALARI
  // ═══════════════════════════════════════════════════════════════════════════
  var currentSeason = localStorage.getItem(SEASON_KEY) || 'summer';
  var waterRipples = [];
  var _rippleSpawnAcc = 0;

  var SEASON_CONFIG = {
    spring: {
      name: 'İlkbahar', emoji: '🌸',
      toast: '🌸 İlkbahar geldi! Kiraz çiçekleri uçuşuyor',
      grade: 'linear-gradient(180deg,rgba(255,195,220,.16),transparent 42%,rgba(180,240,210,.08))',
      filter: 'saturate(1.32) contrast(1.08) brightness(1.03)'
    },
    summer: {
      name: 'Yaz', emoji: '☀️',
      toast: '☀️ Yaz güneşi! Bitkiler %15 daha hızlı büyür',
      grade: 'linear-gradient(180deg,rgba(255,215,140,.14),transparent 40%,rgba(120,200,150,.06))',
      filter: 'saturate(1.28) contrast(1.1) brightness(1.0)'
    },
    autumn: {
      name: 'Sonbahar', emoji: '🍂',
      toast: '🍂 Sonbahar bereketi! Hasat ve siparişler +%20 altın verir',
      grade: 'linear-gradient(180deg,rgba(255,160,90,.20),transparent 45%,rgba(160,90,40,.10))',
      filter: 'saturate(1.34) sepia(0.12) contrast(1.1) brightness(0.99)'
    },
    winter: {
      name: 'Kış', emoji: '❄️',
      toast: '❄️ Kış masalı! Kar taneleri ve sıcak ev ışıkları',
      grade: 'linear-gradient(180deg,rgba(185,225,255,.18),transparent 45%,rgba(110,150,220,.10))',
      filter: 'saturate(1.12) contrast(1.08) brightness(1.04)'
    }
  };

  window.getSeason = function(){ return currentSeason; };

  window.setSeason = function(seasonId, silent){
    if(!SEASON_CONFIG[seasonId]) seasonId = 'summer';
    currentSeason = seasonId;
    try { localStorage.setItem(SEASON_KEY, seasonId); } catch(e){}

    var cfg = SEASON_CONFIG[seasonId];
    var gradeEl = document.getElementById('fxGrade');
    if(gradeEl) gradeEl.style.background = cfg.grade;
    if(typeof renderer !== 'undefined' && renderer && renderer.domElement && !document.body.classList.contains('photo-mode')){
      renderer.domElement.style.filter = cfg.filter;
    }

    // Hava durumu parçacıklarını mevsime göre senkronize et
    if(seasonId === 'spring'){
      startSakuraPetals();
    } else if(seasonId === 'autumn'){
      if(typeof window.setWeather === 'function') window.setWeather('leaves');
    } else if(seasonId === 'winter'){
      if(typeof window.setWeather === 'function') window.setWeather('snow');
    } else {
      if(typeof window.setWeather === 'function') window.setWeather('clear');
    }

    // Mevsim butonlarını aktif işaretle
    var btns = document.querySelectorAll('[data-season]');
    btns.forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-season') === seasonId);
    });

    if(!silent && typeof showToast === 'function'){
      showToast(cfg.toast);
    }
    renderMarketPanel();
  };

  function startSakuraPetals(){
    if(typeof wCvs === 'undefined' || typeof wxParts === 'undefined') return;
    curWeather = 'sakura';
    wxParts = [];
    var n = (typeof isMobile !== 'undefined' && isMobile) ? 45 : 85;
    var cols = ['#ffb7c5', '#ffc8d6', '#ff9ebb', '#fff0f5'];
    for(var i = 0; i < n; i++){
      wxParts.push({
        x: Math.random() * wCvs.width,
        y: Math.random() * wCvs.height,
        sz: 6 + Math.random() * 8,
        sp: (1.2 + Math.random() * 1.8) * 55,
        dr: (Math.random() - 0.3) * 42,
        rot: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 2.5,
        o: 0.55 + Math.random() * 0.4,
        col: cols[i % cols.length]
      });
    }
    wCvs.style.opacity = '1';
  }

  function spawnWaterRipple(){
    if(typeof scene === 'undefined') return;
    // Gölet veya merkez havuz konumu bul
    var rx = 0, rz = 0.2;
    if(typeof decos !== 'undefined' && decos.length){
      var ponds = decos.filter(function(d){
        return d && d.group && d.group.visible !== false && (d.type === 'pond' || d.type === 'crystal_pond');
      });
      if(ponds.length > 0){
        var p = ponds[Math.floor(Math.random() * ponds.length)];
        rx = p.group.position.x + (Math.random() - 0.5) * 0.8;
        rz = p.group.position.z + (Math.random() - 0.5) * 0.8;
      }
    }
    var geo = new THREE.RingGeometry(0.08, 0.13, 20);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xd8f6ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(rx, 0.055, rz);
    scene.add(ring);
    waterRipples.push({ mesh: ring, mat: mat, geo: geo, age: 0, maxAge: 1.8 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAKET 4: SİNEMATİK GECE PENCERELERİ & COZY FOTOĞRAF STÜDYOSU
  // ═══════════════════════════════════════════════════════════════════════════
  var PHOTO_FILTERS = [
    { id: 'natural', name: '🌿 Doğal',       css: 'saturate(1.28) contrast(1.1) brightness(1.0)' },
    { id: 'golden',  name: '🌅 Altın Saat',  css: 'saturate(1.42) sepia(0.18) contrast(1.12) brightness(1.04)' },
    { id: 'pastel',  name: '🌸 Pastel Rüya', css: 'saturate(1.18) contrast(0.96) brightness(1.1) hue-rotate(-6deg)' },
    { id: 'cinema',  name: '🌙 Gece Sinema', css: 'saturate(1.35) contrast(1.22) brightness(0.92) hue-rotate(8deg)' },
    { id: 'vintage', name: '🎞️ Nostalji',    css: 'sepia(0.38) saturate(1.15) contrast(1.08) brightness(0.98)' }
  ];
  var activePhotoFilter = PHOTO_FILTERS[0];

  function updateNightWindows(){
    if(typeof decos === 'undefined' || !decos) return;
    var isNightOrDusk = (typeof dayPhase === 'number')
      ? (dayPhase < 0.25 || dayPhase >= 0.82)
      : (currentSeason === 'winter');

    for(var i = 0; i < decos.length; i++){
      var d = decos[i];
      if(!d || !d.group) continue;
      if(d.type === 'farmer_house' || d.type === 'house' || d.type === 'inn'){
        if(!d._winLight){
          var wl = new THREE.PointLight(0xffb85c, 0, 5.5);
          wl.position.set(0, 1.1, 1.45);
          d.group.add(wl);
          d._winLight = wl;
        }
        d._winLight.intensity = isNightOrDusk ? 1.35 : 0;
      }
    }
  }

  function ensurePhotoStudioDOM(){
    var bar = document.getElementById('photoStudioBar');
    if(bar) return bar;
    bar = document.createElement('div');
    bar.id = 'photoStudioBar';
    var filterBtns = PHOTO_FILTERS.map(function(f, i){
      return '<button type="button" class="ps-filter-btn' + (i === 0 ? ' active' : '') + '" data-pf="' + f.id + '" onclick="window.setPhotoFilter(\'' + f.id + '\')">' + f.name + '</button>';
    }).join('');
    bar.innerHTML =
      '<div class="ps-filters">' + filterBtns + '</div>' +
      '<div class="ps-actions">' +
        '<button type="button" class="ps-snap-btn" onclick="window.captureGardenPhoto()">📸 Fotoğraf Çek & İndir</button>' +
        '<button type="button" class="ps-exit-btn" onclick="window.exitPhotoStudio()">✕ Çıkış</button>' +
      '</div>';
    document.body.appendChild(bar);

    var flash = document.createElement('div');
    flash.id = 'photoFlash';
    document.body.appendChild(flash);
    return bar;
  }

  window.setPhotoFilter = function(filterId){
    for(var i = 0; i < PHOTO_FILTERS.length; i++){
      if(PHOTO_FILTERS[i].id === filterId){
        activePhotoFilter = PHOTO_FILTERS[i];
        break;
      }
    }
    if(typeof renderer !== 'undefined' && renderer && renderer.domElement){
      renderer.domElement.style.filter = activePhotoFilter.css;
    }
    var btns = document.querySelectorAll('.ps-filter-btn');
    btns.forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-pf') === activePhotoFilter.id);
    });
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
  };

  window.photoMode = function(){
    ensurePhotoStudioDOM();
    if(typeof window.closeAllPanelsAndDrawers === 'function') window.closeAllPanelsAndDrawers();
    var entering = !document.body.classList.contains('photo-mode');
    document.body.classList.toggle('photo-mode', entering);
    var bar = document.getElementById('photoStudioBar');
    if(entering){
      if(bar) bar.classList.add('open');
      window.setPhotoFilter(activePhotoFilter.id);
      showToast('📷 Cozy Fotoğraf Stüdyosu — Filtre seç ve çek!');
    } else {
      window.exitPhotoStudio();
    }
  };

  window.exitPhotoStudio = function(){
    document.body.classList.remove('photo-mode');
    var bar = document.getElementById('photoStudioBar');
    if(bar) bar.classList.remove('open');
    var cfg = SEASON_CONFIG[currentSeason] || SEASON_CONFIG.summer;
    if(typeof renderer !== 'undefined' && renderer && renderer.domElement){
      renderer.domElement.style.filter = cfg.filter;
    }
  };

  window.captureGardenPhoto = function(){
    if(typeof renderer === 'undefined' || !renderer || typeof scene === 'undefined' || typeof camera === 'undefined') return;
    try {
      // Hemen sahneyi render et ki WebGL buffer dolu olsun
      if(typeof window.renderWithFX === 'function' && window._fxBloom) window.renderWithFX();
      else renderer.render(scene, camera);

      var srcCanvas = renderer.domElement;
      var out = document.createElement('canvas');
      out.width = srcCanvas.width;
      out.height = srcCanvas.height;
      var ctx = out.getContext('2d');
      if(ctx.filter !== undefined){
        ctx.filter = activePhotoFilter.css;
      }
      ctx.drawImage(srcCanvas, 0, 0);
      ctx.filter = 'none';

      // Zarif köşe filigranı
      var pad = Math.round(out.width * 0.025);
      ctx.font = 'bold ' + Math.max(16, Math.round(out.width * 0.022)) + 'px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 248, 225, 0.88)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 8;
      var who = (typeof accountName === 'function' && accountName()) ? (accountName() + ' · ') : '';
      ctx.fillText('🌿 ' + who + 'Sanal Bahçe', pad, out.height - pad);

      // Deklanşör flaş efekti
      var fl = document.getElementById('photoFlash');
      if(fl){
        fl.classList.add('on');
        setTimeout(function(){ fl.classList.remove('on'); }, 220);
      }
      if(typeof sndTask === 'function') sndTask();
      if(typeof window.triggerHaptic === 'function') window.triggerHaptic('heavy');

      var dataUrl = out.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'sanal-bahce-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('📸 Fotoğraf indirildi!');
    } catch(e){
      console.warn('capture photo', e);
      showToast('📷 Ekran görüntüsü alındı!');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANA DÖNGÜ ENTEGRASYONU (stepAQuality)
  // ═══════════════════════════════════════════════════════════════════════════
  var _winLightTick = 0;
  window.stepAQuality = function(dt, now){
    if(!(dt > 0)) return;

    // 1) 3D Uçuşan Kalp / Yıldız Efektleri
    for(var i = floatingHearts.length - 1; i >= 0; i--){
      var fh = floatingHearts[i];
      fh.life += dt;
      if(fh.life >= fh.maxLife){
        if(fh.mesh.parent) fh.mesh.parent.remove(fh.mesh);
        if(fh.mesh.material && fh.mesh.material.map) fh.mesh.material.map.dispose();
        if(fh.mesh.material) fh.mesh.material.dispose();
        floatingHearts.splice(i, 1);
        continue;
      }
      fh.mesh.position.y += fh.vy * dt;
      fh.mesh.position.x += fh.vx * dt;
      var u = fh.life / fh.maxLife;
      fh.mesh.material.opacity = u < 0.7 ? 1 : (1 - (u - 0.7) / 0.3);
      var sc = 0.42 + Math.sin(u * Math.PI) * 0.16;
      fh.mesh.scale.set(sc, sc, sc);
    }

    // 2) Evcil Dost Aktif Yetenekler (Köpek & Kedi — İskelet Animasyonlu)
    if(typeof pets !== 'undefined' && pets.length){
      // Köpek: Zararlı Böcek Avcısı
      _dogSkillTimer -= dt;
      if(_dogSkillTimer <= 0){
        _dogSkillTimer = 16 + Math.random() * 8;
        if(typeof badBugs !== 'undefined' && badBugs.length > 0){
          for(var dIdx = 0; dIdx < pets.length; dIdx++){
            if(pets[dIdx] && pets[dIdx].type === 'dog'){
              triggerDogChaseBug(pets[dIdx], getPetInfo(pets[dIdx], dIdx));
              break;
            }
          }
        }
      }

      // Kedi: Şanslı Hazine Kaşifi
      _catSkillTimer -= dt;
      if(_catSkillTimer <= 0){
        _catSkillTimer = 38 + Math.random() * 15;
        for(var cIdx = 0; cIdx < pets.length; cIdx++){
          if(pets[cIdx] && pets[cIdx].type === 'cat'){
            triggerCatGift(pets[cIdx], getPetInfo(pets[cIdx], cIdx), false);
            break;
          }
        }
      }
    }

    // 3) Yaz Mevsimi Hasat Büyüme Bonusu (+%15)
    if(currentSeason === 'summer' && typeof harvestItems !== 'undefined' && harvestItems.length){
      for(var hi = 0; hi < harvestItems.length; hi++){
        var hv = harvestItems[hi];
        if(hv && hv.stage < 2){
          hv.growTimer = (hv.growTimer || 0) + dt * 0.15;
        }
      }
    }

    // 4) Canlı 3D Su Dalgaları (Ripples)
    _rippleSpawnAcc += dt;
    if(_rippleSpawnAcc >= 1.6){
      _rippleSpawnAcc = 0;
      if(waterRipples.length < 4) spawnWaterRipple();
    }
    for(var ri = waterRipples.length - 1; ri >= 0; ri--){
      var rp = waterRipples[ri];
      rp.age += dt;
      if(rp.age >= rp.maxAge){
        if(rp.mesh.parent) rp.mesh.parent.remove(rp.mesh);
        rp.geo.dispose();
        rp.mat.dispose();
        waterRipples.splice(ri, 1);
        continue;
      }
      var ru = rp.age / rp.maxAge;
      var rScale = 1 + ru * 7.5;
      rp.mesh.scale.set(rScale, rScale, 1);
      rp.mat.opacity = (1 - ru) * 0.45;
    }

    // 5) Gece Sıcak Pencere Işıkları (her ~1.5 saniyede kontrol)
    _winLightTick += dt;
    if(_winLightTick >= 1.5){
      _winLightTick = 0;
      updateNightWindows();
    }
  };

  // Başlangıç yüklemesi
  function initAQuality(){
    loadBarn();
    loadOrders();
    loadPetMeta();
    ensurePhotoStudioDOM();
    renderMarketPanel();
    updateOrderBadge();
    setTimeout(function(){
      window.setSeason(currentSeason, true);
      updateNightWindows();
    }, 350);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initAQuality);
  } else {
    initAQuality();
  }
})();

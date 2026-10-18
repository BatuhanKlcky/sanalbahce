// trainTrade.js — Sanal Bahçe: Büyük Çiftlik Treni, Toptan İhracat İskelesi & Ticaret Sistemi
(function(){
  'use strict';

  var CONTRACTS_KEY = 'gdn_train_contracts_v1';
  var TRAIN_TIMER_KEY = 'gdn_train_timer_v1';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1) SES SENTEZLEYİCİ: BUHARLI TREN DÜDÜĞÜ, PİSTON VE İSTASYON ÇANI
  // ═══════════════════════════════════════════════════════════════════════════
  function getAudioCtx(){
    if(typeof ac === 'function') return ac();
    var AC = window.AudioContext || window.webkitAudioContext;
    return AC ? new AC() : null;
  }

  function sndTrainWhistle(){
    try {
      var ctx = getAudioCtx();
      if(!ctx) return;
      var now = ctx.currentTime;
      var master = (typeof _master !== 'undefined') ? _master : ctx.destination;

      // Nostaljik 2'li akor düdük: 587 Hz (D5) & 740 Hz (F#5)
      var f1 = 587.33;
      var f2 = 739.99;

      [f1, f2].forEach(function(freq, idx){
        var osc = ctx.createOscillator();
        var osc2 = ctx.createOscillator(); // 1 oktav yumuşak overtone
        var gain = ctx.createGain();
        var filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc2.type = 'sine';

        // Hafif düdük vibratosu
        osc.frequency.setValueAtTime(freq * 0.98, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.12);
        osc2.frequency.setValueAtTime(freq * 2, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(1900, now + 0.15);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.95);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain.gain.setValueAtTime(0.16, now + 0.75);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 1.18);
        osc2.stop(now + 1.18);
      });

      // Tıslayan buhar gürültüsü
      var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.9), ctx.sampleRate);
      var da = b.getChannelData(0);
      for(var i = 0; i < da.length; i++) da[i] = (Math.random() * 2 - 1) * 0.12;
      var s = ctx.createBufferSource();
      var nf = ctx.createBiquadFilter();
      var ng = ctx.createGain();
      nf.type = 'bandpass';
      nf.frequency.setValueAtTime(2200, now);
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.linearRampToValueAtTime(0.07, now + 0.06);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      s.buffer = b;
      s.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      s.start(now);
      s.stop(now + 0.92);
    } catch(e){}
  }

  function sndTrainChug(){
    try {
      var ctx = getAudioCtx();
      if(!ctx) return;
      var now = ctx.currentTime;
      var master = (typeof _master !== 'undefined') ? _master : ctx.destination;

      var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
      var da = b.getChannelData(0);
      for(var i = 0; i < da.length; i++) da[i] = (Math.random() * 2 - 1) * 0.25;
      var s = ctx.createBufferSource();
      var f = ctx.createBiquadFilter();
      var g = ctx.createGain();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(450, now);
      f.frequency.exponentialRampToValueAtTime(140, now + 0.11);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      s.buffer = b;
      s.connect(f);
      f.connect(g);
      g.connect(master);
      s.start(now);
      s.stop(now + 0.12);
    } catch(e){}
  }

  function sndTrainBell(){
    try {
      var ctx = getAudioCtx();
      if(!ctx) return;
      var now = ctx.currentTime;
      var master = (typeof _master !== 'undefined') ? _master : ctx.destination;

      [1175, 2350].forEach(function(freq, i){
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(i === 0 ? 0.22 : 0.08, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 0.9);
      });
    } catch(e){}
  }

  window.sndTrainWhistle = sndTrainWhistle;
  window.sndTrainChug = sndTrainChug;
  window.sndTrainBell = sndTrainBell;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2) 3D CANLI BUHARLI TREN VE VAGONLARI (MODELLEME)
  // ═══════════════════════════════════════════════════════════════════════════
  var trainGroup = null;
  var trainWheels = [];
  var trainSmokeEmitter = null;
  var smokeParticles = [];
  var trainHeadlight = null;

  function createTrainModel(){
    var root = new THREE.Group();
    trainWheels = [];

    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.38, metalness: 0.65 });
    var brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    var woodCarMat = new THREE.MeshStandardMaterial({ color: 0x6e4324, roughness: 0.85 });
    var redPaint = new THREE.MeshStandardMaterial({ color: 0x8b1c1c, roughness: 0.5 });
    var windowGlass = new THREE.MeshStandardMaterial({ color: 0xffea78, emissive: 0xf59e0b, emissiveIntensity: 0.95, roughness: 0.2 });

    // ─────────────────────────────────────────────────────────────────────────
    // LOKOMOTİF (Buharlı Lokomotif Motoru)
    // ─────────────────────────────────────────────────────────────────────────
    var loco = new THREE.Group();
    loco.position.set(0, 0, 0);

    // Ana Şasi
    var chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 2.9), darkSteel);
    chassis.position.y = 0.42;
    loco.add(chassis);

    // Kazan (Boiler)
    var boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.8, 16), darkSteel);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 0.92, 0.35);
    loco.add(boiler);

    // Kazan Ön Kapağı & Pirinç Halka
    var boilerFront = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), darkSteel);
    boilerFront.rotation.x = -Math.PI / 2;
    boilerFront.position.set(0, 0.92, 1.25);
    loco.add(boilerFront);

    var brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.035, 8, 20), brassMat);
    brassRing.position.set(0, 0.92, 1.22);
    loco.add(brassRing);

    // Makinist Kabini (Cab)
    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.05), redPaint);
    cab.position.set(0, 1.05, -0.92);
    loco.add(cab);

    // Kabin Kavisli Çatısı
    var cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 1.15), darkSteel);
    cabRoof.position.set(0, 1.66, -0.92);
    loco.add(cabRoof);

    // Sıcak Işık Veren Kabin Pencereleri (Her İki Taraf)
    [-0.58, 0.58].forEach(function(wx){
      var win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.55), windowGlass);
      win.position.set(wx, 1.18, -0.92);
      loco.add(win);
    });

    // Baca (Smokestack / Chimney)
    var stack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.6, 12), darkSteel);
    stack.position.set(0, 1.65, 0.98);
    loco.add(stack);

    var stackCap = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 16), brassMat);
    stackCap.rotation.x = Math.PI / 2;
    stackCap.position.set(0, 1.95, 0.98);
    loco.add(stackCap);

    // Buhar Dumanı Çıkış Noktası
    trainSmokeEmitter = new THREE.Group();
    trainSmokeEmitter.position.set(0, 2.05, 0.98);
    loco.add(trainSmokeEmitter);

    // Pirinç Buhar Kubbesi & Düdük
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), brassMat);
    dome.position.set(0, 1.48, 0.15);
    loco.add(dome);

    var whistleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), brassMat);
    whistleMesh.position.set(0.24, 1.76, -0.42);
    loco.add(whistleMesh);

    // Ön Fener (Büyük Pirinç Projektör)
    var headLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.32, 12), brassMat);
    headLamp.rotation.x = Math.PI / 2;
    headLamp.position.set(0, 1.1, 1.42);
    loco.add(headLamp);

    var lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), windowGlass);
    lampLens.position.set(0, 1.1, 1.58);
    loco.add(lampLens);

    trainHeadlight = new THREE.PointLight(0xffea78, 2.8, 9.5);
    trainHeadlight.position.set(0, 1.15, 1.75);
    loco.add(trainHeadlight);

    // Ön Ray Süpürgesi (Cowcatcher)
    var cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.45, 4), darkSteel);
    cowcatcher.rotation.y = Math.PI / 4;
    cowcatcher.rotation.x = Math.PI / 2;
    cowcatcher.position.set(0, 0.32, 1.6);
    loco.add(cowcatcher);

    // 6 Büyük Lokomotif Tekerleği & Yan Biyel Kolu
    [-0.62, 0.62].forEach(function(wx){
      var rod = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 1.6), brassMat);
      rod.position.set(wx > 0 ? 0.68 : -0.68, 0.28, 0.1);
      loco.add(rod);

      [-0.65, 0.1, 0.85].forEach(function(wz){
        var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), darkSteel);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.28, wz);
        loco.add(wheel);
        trainWheels.push(wheel);

        var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 10), brassMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx > 0 ? wx + 0.01 : wx - 0.01, 0.28, wz);
        loco.add(hub);
      });
    });

    root.add(loco);

    // ─────────────────────────────────────────────────────────────────────────
    // VAGON 1: TARIM & HASAT TOPTAN VAGONU (Açık Yük Kasası)
    // ─────────────────────────────────────────────────────────────────────────
    var wagon1 = new THREE.Group();
    wagon1.position.set(0, 0, -2.6);

    var w1Base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 2.2), woodCarMat);
    w1Base.position.y = 0.4;
    wagon1.add(w1Base);

    // Yan Çıtalar
    [-0.58, 0.58].forEach(function(sx){
      var side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 2.15), woodCarMat);
      side.position.set(sx, 0.64, 0);
      wagon1.add(side);
    });

    // Hasat Ürünleri (Sandıklar & Çuvallar & Balkabağı)
    var crateA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.55), woodCarMat);
    crateA.position.set(-0.25, 0.65, 0.45);
    wagon1.add(crateA);

    var crateB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.52), woodCarMat);
    crateB.position.set(0.25, 0.65, -0.42);
    wagon1.add(crateB);

    var pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 7), new THREE.MeshStandardMaterial({ color: 0xe06611, roughness: 0.8 }));
    pumpkin.scale.set(1.15, 0.85, 1.15);
    pumpkin.position.set(0.22, 0.65, 0.45);
    wagon1.add(pumpkin);

    // Vagon 1 Tekerlekleri
    [-0.6, 0.6].forEach(function(wx){
      [-0.7, 0.7].forEach(function(wz){
        var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 12), darkSteel);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.22, wz);
        wagon1.add(wh);
        trainWheels.push(wh);
      });
    });

    root.add(wagon1);

    // ─────────────────────────────────────────────────────────────────────────
    // VAGON 2: MANDIRA & ŞARKÜTERİ VAGONU (Kapalı Ahşap Kasa)
    // ─────────────────────────────────────────────────────────────────────────
    var wagon2 = new THREE.Group();
    wagon2.position.set(0, 0, -5.1);

    var w2Body = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.85, 2.2), redPaint);
    w2Body.position.y = 0.82;
    wagon2.add(w2Body);

    var w2Roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 2.3), darkSteel);
    w2Roof.position.y = 1.28;
    wagon2.add(w2Roof);

    // Vagon 2 Tekerlekleri
    [-0.6, 0.6].forEach(function(wx){
      [-0.7, 0.7].forEach(function(wz){
        var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 12), darkSteel);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.22, wz);
        wagon2.add(wh);
        trainWheels.push(wh);
      });
    });

    root.add(wagon2);

    // ─────────────────────────────────────────────────────────────────────────
    // VAGON 3: GURME & LÜKS TİCARET VAGONU (Altın Çıtalı Başkent Vagonu)
    // ─────────────────────────────────────────────────────────────────────────
    var wagon3 = new THREE.Group();
    wagon3.position.set(0, 0, -7.6);

    var w3Body = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.9, 2.2), new THREE.MeshStandardMaterial({ color: 0x224433, roughness: 0.55 }));
    w3Body.position.y = 0.85;
    wagon3.add(w3Body);

    var w3Roof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 2.3), darkSteel);
    w3Roof.position.y = 1.34;
    wagon3.add(w3Roof);

    var w3GoldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.06, 2.22), brassMat);
    w3GoldTrim.position.y = 0.85;
    wagon3.add(w3GoldTrim);

    // Arka Fener
    var tailLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.2, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xd91111, emissiveIntensity: 0.9 })
    );
    tailLamp.position.set(0, 1.05, -1.15);
    wagon3.add(tailLamp);

    // Vagon 3 Tekerlekleri
    [-0.6, 0.6].forEach(function(wx){
      [-0.7, 0.7].forEach(function(wz){
        var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 12), darkSteel);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.22, wz);
        wagon3.add(wh);
        trainWheels.push(wh);
      });
    });

    root.add(wagon3);

    root.scale.set(0.85, 0.85, 0.85);
    return root;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3) BUHAR DUMANI PARÇACIK SİSTEMİ (Optimizasyon: Object Pool & Zero-GC)
  // ═══════════════════════════════════════════════════════════════════════════
  var _sharedSmokeGeo = new THREE.SphereGeometry(0.18, 6, 6);
  var _smokeMeshPool = [];
  function getPooledSmokeMesh(){
    if(_smokeMeshPool.length > 0){
      var m = _smokeMeshPool.pop();
      m.visible = true;
      m.material.opacity = 0.78;
      m.scale.set(1, 1, 1);
      return m;
    }
    var puffMat = new THREE.MeshStandardMaterial({
      color: 0xefefef,
      roughness: 0.9,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(_sharedSmokeGeo, puffMat);
    scene.add(mesh);
    return mesh;
  }

  function spawnSmokePuff(pos, isHeavy){
    if(typeof scene === 'undefined' || !pos) return;
    var mesh = getPooledSmokeMesh();
    mesh.position.copy(pos);
    var initScale = isHeavy ? 1.25 : 0.85;
    mesh.scale.set(initScale, initScale, initScale);

    smokeParticles.push({
      mesh: mesh,
      initScale: initScale,
      life: 0,
      maxLife: 1.4 + Math.random() * 0.4,
      vy: 1.1 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.35,
      scaleSpd: 1.8 + Math.random() * 0.6
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4) TOPTAN İHRACAT SİPARİŞLERİ & VERİ YÖNETİMİ
  // ═══════════════════════════════════════════════════════════════════════════
  var activeContracts = [];
  var trainState = 'docked'; // 'away' | 'arriving' | 'docked' | 'departing'
  var trainTimer = 180;      // Saniye (8 dakika periyodik sefer)
  var freeWhistleTimer = 0;  // Düdük bekleme süresi (sn)
  var trainPos = { x: -4.5, y: 0.1, z: -12.5 }; // Varsayılan çevre yanaşma koordinatı
  var trainMoveProgress = 1.0;
  var _chugPuffAcc = 0;

  var CONTRACT_PRESETS = [
    // Slot 1: Tarım & Hasat İhracatı
    [
      { name: 'Başkent Manavı Sevkiyatı', emoji: '🍅', req: { tomato: 5, carrot: 4, strawberry: 3 }, coin: 420, xp: 140, stamps: 1 },
      { name: 'Saray Aşevi Sebze Alımı',  emoji: '🌶️', req: { pepper: 5, cucumber: 4, tomato: 4 },    coin: 450, xp: 150, stamps: 1 },
      { name: 'Kışlık Reçel İhracatı',    emoji: '🍓', req: { strawberry: 6, carrot: 5 },              coin: 410, xp: 130, stamps: 1 }
    ],
    // Slot 2: Hayvancılık & Şarküteri İhracatı
    [
      { name: 'Kraliyet Mandıra Sözleşmesi', emoji: '🧀', req: { milk: 4, cheese: 3, egg: 4 }, coin: 620, xp: 200, stamps: 1 },
      { name: 'Kuzey Limanı Kumanya Gemisi', emoji: '🧶', req: { wool: 3, milk: 4, fish: 3 },  coin: 660, xp: 220, stamps: 1 },
      { name: 'Şehir Pastanesi Toplu Alım', emoji: '🥛', req: { cheese: 4, egg: 5, milk: 3 }, coin: 590, xp: 190, stamps: 1 }
    ],
    // Slot 3: Gurme Mutfak & Zanaat İhracatı
    [
      { name: 'Büyükelçi Ziyafet Paketi',  emoji: '🍰', req: { jam: 3, cake: 2, scarf: 2 },     coin: 880, xp: 280, stamps: 2 },
      { name: 'Kış Festivali İkram Kervanı',emoji: '🥣', req: { soup: 3, salad: 3, sauce: 2 },   coin: 840, xp: 260, stamps: 2 },
      { name: 'Lüks Saray Menüsü Sevkiyatı',emoji: '🍣', req: { cake: 3, fish_dish: 2, jam: 2 }, coin: 940, xp: 310, stamps: 2 }
    ]
  ];

  function makeNewContracts(){
    var arr = [];
    for(var slot = 0; slot < 3; slot++){
      var pool = CONTRACT_PRESETS[slot];
      var chosen = pool[Math.floor(Math.random() * pool.length)];
      var reqCopy = {};
      for(var k in chosen.req) reqCopy[k] = chosen.req[k];
      arr.push({
        id: 'cnt_' + Date.now() + '_' + slot,
        slot: slot,
        title: chosen.name,
        emoji: chosen.emoji,
        req: reqCopy,
        coin: chosen.coin,
        xp: chosen.xp,
        stamps: chosen.stamps,
        done: false
      });
    }
    return arr;
  }

  function loadContracts(){
    try {
      var raw = localStorage.getItem(CONTRACTS_KEY);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length === 3){
          activeContracts = parsed;
          return;
        }
      }
    } catch(e){}
    activeContracts = makeNewContracts();
    saveContracts();
  }

  function saveContracts(){
    try { localStorage.setItem(CONTRACTS_KEY, JSON.stringify(activeContracts)); } catch(e){}
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5) TREN HAREKETİ, YANAŞMA VE GÜNCELLEME DÖNGÜSÜ (stepTrainTrade)
  // ═══════════════════════════════════════════════════════════════════════════
  var scenicTracks = null;
  function ensureScenicTracks(){
    if(scenicTracks || typeof scene === 'undefined') return;
    scenicTracks = new THREE.Group();

    var gravelMat = new THREE.MeshStandardMaterial({ color: 0x484540, roughness: 0.95 });
    var steelMat = new THREE.MeshStandardMaterial({ color: 0x363a40, roughness: 0.38, metalness: 0.8 });
    var woodDark = new THREE.MeshStandardMaterial({ color: 0x3a2515, roughness: 0.88 });
    var tunnelStone = new THREE.MeshStandardMaterial({ color: 0x6e6963, roughness: 0.9 });
    var pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x1b3820, roughness: 0.85 });
    var pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2618, roughness: 0.9 });
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8a603c, roughness: 0.82 });
    var drumMat = new THREE.MeshStandardMaterial({ color: 0x314652, roughness: 0.5, metalness: 0.6 });
    var darkVoidMat = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });

    // ─────────────────────────────────────────────────────────────────────────
    // 1) GENİŞ DEMİRYOLU HATTI (Balast, Raylar ve 175 Travers - Harita Boydan Boya)
    // ─────────────────────────────────────────────────────────────────────────
    var ballast = new THREE.Mesh(new THREE.BoxGeometry(165, 0.09, 2.3), gravelMat);
    ballast.position.set(0, 0.045, -21.0);
    scenicTracks.add(ballast);

    for(var tx = -75; tx <= 75; tx += 0.85){
      var tie = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 1.6), woodDark);
      tie.position.set(tx, 0.075, -21.0);
      scenicTracks.add(tie);
    }

    [-21.45, -20.55].forEach(function(rz){
      var rail = new THREE.Mesh(new THREE.BoxGeometry(165, 0.12, 0.08), steelMat);
      rail.position.set(0, 0.16, rz);
      scenicTracks.add(rail);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2) DOĞU DAĞI VE DEMİRYOLU TÜNEL PORTALI (Haritanın En Sağ Ucu: x = 72.0, z = -21.0)
    // ─────────────────────────────────────────────────────────────────────────
    var eastMountain = new THREE.Group();
    eastMountain.position.set(72.0, 0, -21.0);

    var mPeaks = [
      { x: 6, z: -6, r: 8.5, h: 16, col: 0x484d52 },
      { x: 14, z: 0, r: 10.5, h: 20, col: 0x585d62 },
      { x: 8, z: 7, r: 7.8, h: 14, col: 0x3d4246 },
      { x: 18, z: -5, r: 11.2, h: 22, col: 0x52565b },
      { x: 16, z: 8, r: 9.0, h: 15, col: 0x464a4f },
      { x: 4, z: 8, r: 6.5, h: 11.5, col: 0x3e4245 }
    ];

    mPeaks.forEach(function(mp){
      var peakMat = new THREE.MeshStandardMaterial({ color: mp.col, roughness: 0.94 });
      var peak = new THREE.Mesh(new THREE.ConeGeometry(mp.r, mp.h, 7), peakMat);
      peak.position.set(mp.x, mp.h * 0.48, mp.z);
      peak.rotation.y = (mp.x + mp.z) * 0.3;
      eastMountain.add(peak);

      for(var kb = 0; kb < 3; kb++){
        var bMat = new THREE.MeshStandardMaterial({ color: mp.col, roughness: 0.96 });
        var boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(mp.r * 0.42, 0), bMat);
        boulder.scale.set(1.1, 0.7, 1.2);
        boulder.position.set(mp.x + (kb - 1) * 2.8, 1.8 + kb * 0.9, mp.z + (kb % 2 === 0 ? 2.5 : -2.5));
        eastMountain.add(boulder);
      }
    });

    var pineSpots = [
      [3, -5, 1.2], [5, -8, 1.4], [6, 6, 1.1], [10, 5, 1.3],
      [12, -7, 1.5], [14, 2, 1.4], [4, 7, 1.0], [8, -9, 1.3]
    ];
    pineSpots.forEach(function(ps){
      var pt = new THREE.Group();
      pt.position.set(ps[0], 0, ps[1]);
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 5), pineTrunkMat);
      tr.position.y = 0.7;
      pt.add(tr);
      for(var li = 0; li < 3; li++){
        var lc = new THREE.Mesh(new THREE.ConeGeometry(1.2 - li * 0.28, 1.6, 6), pineLeafMat);
        lc.position.y = 1.4 + li * 0.9;
        pt.add(lc);
      }
      pt.scale.setScalar(ps[2]);
      eastMountain.add(pt);
    });

    // Doğu Taş Tünel Portalı (x = 0, z = 0 yerel, dünya: x = 72.0, z = -21.0)
    var eastPortal = new THREE.Group();
    eastPortal.position.set(0, 0, 0);

    var jambL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.0, 1.2), tunnelStone);
    jambL.position.set(0, 2.5, -2.1);
    eastPortal.add(jambL);

    var jambR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.0, 1.2), tunnelStone);
    jambR.position.set(0, 2.5, 2.1);
    eastPortal.add(jambR);

    var lintel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 5.4), tunnelStone);
    lintel.position.set(0, 4.6, 0);
    eastPortal.add(lintel);

    var keystone = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.95), new THREE.MeshStandardMaterial({ color: 0x827d75, roughness: 0.85 }));
    keystone.position.set(0, 4.7, 0);
    eastPortal.add(keystone);

    var plaque = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 2.4), new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.5, metalness: 0.6 }));
    plaque.position.set(-0.76, 4.6, 0);
    eastPortal.add(plaque);

    var tunnelLamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: 0xffea78, emissive: 0xf59e0b, emissiveIntensity: 0.95 }));
    tunnelLamp.position.set(-0.8, 3.8, 0);
    eastPortal.add(tunnelLamp);

    var tLight = new THREE.PointLight(0xffb74d, 2.2, 7.5);
    tLight.position.set(-0.8, 3.8, 0);
    eastPortal.add(tLight);

    // Tünel İçi Derin Karanlık Hacmi (Tren bu tünele girip dağın ardında kaybolur)
    var tunnelVoid = new THREE.Mesh(new THREE.BoxGeometry(32, 4.2, 3.2), darkVoidMat);
    tunnelVoid.position.set(16.0, 2.1, 0);
    eastPortal.add(tunnelVoid);

    eastMountain.add(eastPortal);
    scenicTracks.add(eastMountain);

    // ─────────────────────────────────────────────────────────────────────────
    // 3) BATI DAĞ GEÇİDİ VE GİRİŞ TÜNELİ (Haritanın En Sol Ucu: x = -72.0, z = -21.0)
    // ─────────────────────────────────────────────────────────────────────────
    var westMountain = new THREE.Group();
    westMountain.position.set(-72.0, 0, -21.0);

    var wPeaks = [
      { x: -6, z: -6, r: 8.5, h: 16, col: 0x464b50 },
      { x: -14, z: 0, r: 10.5, h: 20, col: 0x505459 },
      { x: -8, z: 7, r: 7.8, h: 14, col: 0x43474b },
      { x: -18, z: -5, r: 11.2, h: 22, col: 0x4d5156 },
      { x: -16, z: 8, r: 9.0, h: 15, col: 0x464a4f },
      { x: -4, z: 8, r: 6.5, h: 11.5, col: 0x3e4245 }
    ];
    wPeaks.forEach(function(wp){
      var wpm = new THREE.MeshStandardMaterial({ color: wp.col, roughness: 0.94 });
      var wPeak = new THREE.Mesh(new THREE.ConeGeometry(wp.r, wp.h, 7), wpm);
      wPeak.position.set(wp.x, wp.h * 0.48, wp.z);
      westMountain.add(wPeak);
    });

    var wPineSpots = [
      [-3, -5, 1.2], [-5, -8, 1.4], [-6, 6, 1.1], [-10, 5, 1.3],
      [-12, -7, 1.5], [-14, 2, 1.4], [-4, 7, 1.0], [-8, -9, 1.3]
    ];
    wPineSpots.forEach(function(ps){
      var wpt = new THREE.Group();
      wpt.position.set(ps[0], 0, ps[1]);
      var tr2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 5), pineTrunkMat);
      tr2.position.y = 0.7;
      wpt.add(tr2);
      for(var li2 = 0; li2 < 3; li2++){
        var lc2 = new THREE.Mesh(new THREE.ConeGeometry(1.2 - li2 * 0.28, 1.6, 6), pineLeafMat);
        lc2.position.y = 1.4 + li2 * 0.9;
        wpt.add(lc2);
      }
      wpt.scale.setScalar(ps[2]);
      westMountain.add(wpt);
    });

    var wJambL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.0, 1.2), tunnelStone);
    wJambL.position.set(0, 2.5, -2.1);
    westMountain.add(wJambL);

    var wJambR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.0, 1.2), tunnelStone);
    wJambR.position.set(0, 2.5, 2.1);
    westMountain.add(wJambR);

    var wLintel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 5.4), tunnelStone);
    wLintel.position.set(0, 4.6, 0);
    westMountain.add(wLintel);

    var wKeystone = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.95), new THREE.MeshStandardMaterial({ color: 0x827d75, roughness: 0.85 }));
    wKeystone.position.set(0, 4.7, 0);
    westMountain.add(wKeystone);

    var wLamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: 0xffea78, emissive: 0xf59e0b, emissiveIntensity: 0.95 }));
    wLamp.position.set(0.8, 3.8, 0);
    westMountain.add(wLamp);

    var wVoid = new THREE.Mesh(new THREE.BoxGeometry(32, 4.2, 3.2), darkVoidMat);
    wVoid.position.set(-16.0, 2.1, 0);
    westMountain.add(wVoid);

    scenicTracks.add(westMountain);

    // ─────────────────────────────────────────────────────────────────────────
    // 4) TELGRAF DİREKLERİ VE HATLARI
    // ─────────────────────────────────────────────────────────────────────────
    var poleXCoords = [-54, -36, -18, 0, 18, 36, 54];
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.9 });
    var insulatorMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
    var wireMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    poleXCoords.forEach(function(px){
      var poleGroup = new THREE.Group();
      poleGroup.position.set(px, 0, -23.4);

      var poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 6), poleMat);
      poleMesh.position.y = 2.1;
      poleGroup.add(poleMesh);

      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.6), poleMat);
      arm.position.y = 3.9;
      poleGroup.add(arm);

      [-0.65, 0.65].forEach(function(iz){
        var ins = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 5), insulatorMat);
        ins.position.set(0, 4.02, iz);
        poleGroup.add(ins);
      });

      scenicTracks.add(poleGroup);
    });

    for(var wi = 0; wi < poleXCoords.length - 1; wi++){
      var x1 = poleXCoords[wi], x2 = poleXCoords[wi + 1];
      [-0.65, 0.65].forEach(function(offZ){
        var wireLen = x2 - x1;
        var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, wireLen, 4), wireMat);
        wire.rotation.z = Math.PI / 2;
        wire.position.set((x1 + x2) / 2, 4.0, -23.4 + offZ);
        scenicTracks.add(wire);
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5) DEMİRYOLU GEÇİT UYARI SİNYALİ (CROSSBUCK X)
    // ─────────────────────────────────────────────────────────────────────────
    var crossingSignal = new THREE.Group();
    crossingSignal.position.set(-9.2, 0, -18.8);

    var sigPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6), steelMat);
    sigPost.position.y = 1.3;
    crossingSignal.add(sigPost);

    [-0.45, 0.45].forEach(function(rotZ){
      var xArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      xArm.position.y = 2.4;
      xArm.rotation.y = Math.PI / 2;
      xArm.rotation.x = rotZ;
      crossingSignal.add(xArm);
    });

    [-0.32, 0.32].forEach(function(lx){
      var redLamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({
        color: 0xff2222, emissive: 0xcc1111, emissiveIntensity: 0.85
      }));
      redLamp.position.set(0, 2.1, lx);
      crossingSignal.add(redLamp);
    });

    scenicTracks.add(crossingSignal);

    // ─────────────────────────────────────────────────────────────────────────
    // 6) İSTASYON PERONU VE DETAYLI KARGO YIĞINLARI
    // ─────────────────────────────────────────────────────────────────────────
    var plat = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.32, 2.3), new THREE.MeshStandardMaterial({ color: 0x614022, roughness: 0.8 }));
    plat.position.set(0, 0.16, -19.0);
    scenicTracks.add(plat);

    var lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 6), steelMat);
    lanternPost.position.set(4.5, 0.95, -19.0);
    scenicTracks.add(lanternPost);

    var lanternGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.24, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xffea78, emissive: 0xf59e0b, emissiveIntensity: 0.95 })
    );
    lanternGlass.position.set(4.5, 1.8, -19.0);
    scenicTracks.add(lanternGlass);

    var stLight = new THREE.PointLight(0xffdf78, 2.8, 9);
    stLight.position.set(4.5, 1.8, -19.0);
    scenicTracks.add(stLight);

    // Sandıklar
    [
      [-5.2, 0.42, -18.9, 0.65],
      [-4.6, 0.38, -19.1, 0.55],
      [-4.8, 0.85, -19.0, 0.48],
      [5.8, 0.42, -18.9, 0.62],
      [6.4, 0.38, -19.0, 0.52]
    ].forEach(function(cr){
      var crate = new THREE.Mesh(new THREE.BoxGeometry(cr[3], cr[3], cr[3]), crateMat);
      crate.position.set(cr[0], cr[1], cr[2]);
      crate.rotation.y = cr[0] * 0.4;
      scenicTracks.add(crate);
    });

    // Variller
    [
      [8.5, 0.5, -18.9],
      [9.1, 0.5, -19.0]
    ].forEach(function(dr){
      var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 8), drumMat);
      drum.position.set(dr[0], dr[1], dr[2]);
      scenicTracks.add(drum);
    });

    // Kömür Yığını
    var coalGeo = new THREE.DodecahedronGeometry(0.72, 1);
    var coalMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.96 });
    var coalPile = new THREE.Mesh(coalGeo, coalMat);
    coalPile.scale.set(1.4, 0.55, 1.1);
    coalPile.position.set(-7.5, 0.35, -18.9);
    scenicTracks.add(coalPile);

    // Yedek Travers Yığını
    for(var ty = 0; ty < 4; ty++){
      for(var tz = -0.3; tz <= 0.3; tz += 0.3){
        var stie = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.22), woodDark);
        stie.position.set(10.2, 0.38 + ty * 0.09, -18.9 + tz);
        scenicTracks.add(stie);
      }
    }

    scene.add(scenicTracks);
    window._scenicTracks = scenicTracks;
    if(typeof isCozy === 'function' && isCozy()){
      scenicTracks.visible = false;
    }
  }

  function findStationTargetPos(){
    // Oyuncunun bahçesinde yerleştirdiği 'train_station' varsa ona yanaşır!
    if(typeof decos !== 'undefined' && decos && decos.length){
      for(var i = 0; i < decos.length; i++){
        var d = decos[i];
        if(d && d.type === 'train_station' && d.group){
          var wp = new THREE.Vector3();
          d.group.getWorldPosition(wp);
          var ang = d.group.rotation.y;
          var offsetZ = -0.85;
          var ox = Math.cos(ang) * offsetZ;
          var oz = -Math.sin(ang) * offsetZ;
          return {
            x: wp.x + ox,
            y: wp.y + 0.12,
            z: wp.z + oz,
            rotY: ang + Math.PI / 2
          };
        }
      }
    }
    // Varsayılan özel demiryolu koridoru: Çitlerin ve bahçenin tamamen dışında, kuzey manzara hattında
    return {
      x: 0,
      y: 0.12,
      z: -21.0,
      rotY: Math.PI / 2
    };
  }

  function ensureTrainMeshInScene(){
    ensureScenicTracks();
    if(!trainGroup && typeof scene !== 'undefined'){
      trainGroup = createTrainModel();
      var target = findStationTargetPos();
      trainGroup.position.set(target.x, target.y, target.z);
      trainGroup.rotation.y = target.rotY;
      scene.add(trainGroup);
      window._trainGroup = trainGroup;
      if(typeof isCozy === 'function' && isCozy()){
        trainGroup.visible = false;
      }
    }
  }

  window.syncTrainVisibility = function(){
    var cozy = typeof isCozy === 'function' && isCozy();
    var show = !cozy;
    if(scenicTracks) scenicTracks.visible = show;
    if(trainGroup){
      trainGroup.visible = show ? (trainState !== 'away') : false;
    }
    if(!show && typeof smokeParticles !== 'undefined' && smokeParticles && smokeParticles.length){
      for(var i = 0; i < smokeParticles.length; i++){
        if(smokeParticles[i] && smokeParticles[i].mesh) smokeParticles[i].mesh.visible = false;
      }
    }
  };

  window.getTradeTrainGroup = function(){ return trainGroup; };
  window.getTrainState = function(){ return trainState; };

  window.callTradeTrain = function(forceFree){
    if(typeof isCozy === 'function' && isCozy()){
      if(typeof showToast === 'function') showToast('🚂 Büyük Çiftlik Treni sadece Klasik Bahçe modundadır.');
      return;
    }
    if(trainState === 'docked'){
      sndTrainWhistle();
      if(typeof showToast === 'function') showToast('📢 TUUUT TUUUT! Tren zaten istasyonda bekliyor!');
      return;
    }
    if(!forceFree && freeWhistleTimer > 0){
      // 1 Ticaret Mührü harcayarak anında çağır
      if(typeof stats !== 'undefined' && (stats.tradeStamps || 0) >= 1){
        stats.tradeStamps -= 1;
        if(typeof saveStats === 'function') saveStats();
        if(typeof showToast === 'function') showToast('🎫 1 Mühür kullanıldı! Tren anında yola çıktı!');
      } else {
        if(typeof showToast === 'function') showToast('⏳ Düdük beklemede: ' + Math.ceil(freeWhistleTimer) + 'sn (veya 1🎫 ile çağır)');
        return;
      }
    }
    freeWhistleTimer = 180; // 3 dk ücretsiz düdük bekleme süresi
    trainState = 'arriving';
    trainMoveProgress = 0;
    sndTrainWhistle();
    if(typeof showToast === 'function') showToast('📢 TUUUT! Çiftlik Treni istasyona yanaşıyor!');
  };

  window.stepTrainTrade = function(dt, now){
    if(!(dt > 0)) return;

    var cozy = typeof isCozy === 'function' && isCozy();
    if(cozy){
      if(scenicTracks && scenicTracks.visible) scenicTracks.visible = false;
      if(trainGroup && trainGroup.visible) trainGroup.visible = false;
      return;
    }

    ensureTrainMeshInScene();
    if(scenicTracks && !scenicTracks.visible) scenicTracks.visible = true;
    if(freeWhistleTimer > 0) freeWhistleTimer -= dt;

    var stationTarget = findStationTargetPos();

    // 1) Tren Durum Makinesi
    if(trainState === 'away'){
      trainGroup.visible = false;
      trainTimer -= dt;
      if(trainTimer <= 0){
        trainState = 'arriving';
        trainMoveProgress = 0;
        sndTrainWhistle();
        if(typeof showToast === 'function') showToast('🚂 Çiftlik Treni istasyona yanaşıyor!');
      }
    }
    else if(trainState === 'arriving'){
      trainGroup.visible = true;
      trainMoveProgress += dt * 0.30; // ~3.3 saniyede yanaşır
      if(trainMoveProgress >= 1.0){
        trainMoveProgress = 1.0;
        trainState = 'docked';
        sndTrainBell();
        sndTrainWhistle();
        if(typeof showToast === 'function') showToast('🟢 Çiftlik Treni yanaştı! Toptan ihracat siparişleri hazır.');
      }
      // Batı dağ tünelinden (x = -72) istasyona (x = 0) doğru yanaşır
      var startX = stationTarget.x - 72;
      var curX = startX + (stationTarget.x - startX) * Math.sin(trainMoveProgress * Math.PI * 0.5);
      trainGroup.position.set(curX, stationTarget.y, stationTarget.z);
      trainGroup.rotation.y = stationTarget.rotY;

      // Tekerlekler dönüyor & piston sesi
      var rollSpeed = dt * 14;
      for(var wi = 0; wi < trainWheels.length; wi++) trainWheels[wi].rotation.z += rollSpeed;
      _chugPuffAcc += dt;
      if(_chugPuffAcc >= 0.22){
        _chugPuffAcc = 0;
        sndTrainChug();
        if(trainSmokeEmitter && curX > (stationTarget.x - 68)){
          var ep = new THREE.Vector3();
          trainSmokeEmitter.getWorldPosition(ep);
          spawnSmokePuff(ep, true);
        }
      }
    }
    else if(trainState === 'docked'){
      trainGroup.visible = true;
      trainGroup.position.set(stationTarget.x, stationTarget.y, stationTarget.z);
      trainGroup.rotation.y = stationTarget.rotY;

      // İstasyonda rölantide hafif buhar pufu
      _chugPuffAcc += dt;
      if(_chugPuffAcc >= 1.4){
        _chugPuffAcc = 0;
        if(trainSmokeEmitter){
          var ep2 = new THREE.Vector3();
          trainSmokeEmitter.getWorldPosition(ep2);
          spawnSmokePuff(ep2, false);
        }
      }
    }
    else if(trainState === 'departing'){
      trainGroup.visible = true;
      trainMoveProgress += dt * 0.16; // Harita boydan boya uzun olduğu için akıcı hız
      // İstasyondan (x = 0) Doğu Dağı Tüneline (x = 72) ve dağın arkasına doğru hareket
      var departDist = 78.0;
      var departX = stationTarget.x + trainMoveProgress * departDist;
      trainGroup.position.set(departX, stationTarget.y, stationTarget.z);

      var rollSpd = dt * 18;
      for(var w2 = 0; w2 < trainWheels.length; w2++) trainWheels[w2].rotation.z += rollSpd;

      _chugPuffAcc += dt;
      if(_chugPuffAcc >= 0.18){
        _chugPuffAcc = 0;
        sndTrainChug();
        // Tünel içine girdikten sonra duman tünel dışına taşmasın
        if(trainSmokeEmitter && departX < (stationTarget.x + 71.5)){
          var ep3 = new THREE.Vector3();
          trainSmokeEmitter.getWorldPosition(ep3);
          spawnSmokePuff(ep3, true);
        }
      }

      // Trenin tamamı (tüm vagonlarıyla) haritanın ucundaki dağın içine girip kaybolana kadar gözükür!
      if(departX >= (stationTarget.x + 76.5)){
        trainState = 'away';
        trainTimer = 480; // 8 dakika sonraki sefere kadar yolda
        activeContracts = makeNewContracts();
        saveContracts();
        trainGroup.visible = false;
        renderTrainPanel();
      }
    }

    // 2) Buhar Dumanı Parçacıkları Fiziği (Geri dönüşümlü havuz - Zero GC)
    for(var pi = smokeParticles.length - 1; pi >= 0; pi--){
      var sp = smokeParticles[pi];
      sp.life += dt;
      if(sp.life >= sp.maxLife){
        sp.mesh.visible = false;
        _smokeMeshPool.push(sp.mesh);
        smokeParticles.splice(pi, 1);
        continue;
      }
      var prog = sp.life / sp.maxLife;
      sp.mesh.position.y += sp.vy * dt;
      sp.mesh.position.x += sp.vx * dt;
      sp.mesh.position.z += sp.vz * dt;
      var curScale = (sp.initScale || 1.0) * (1.0 + prog * sp.scaleSpd);
      sp.mesh.scale.set(curScale, curScale, curScale);
      sp.mesh.material.opacity = (1 - prog) * 0.7;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 6) VAGON DOLDURMA, TOPTAN İHRACAT & ÖDÜLLER
  // ═══════════════════════════════════════════════════════════════════════════
  window.fillTrainWagon = function(slotIdx){
    var contract = activeContracts[slotIdx];
    if(!contract || contract.done) return;

    var barn = (typeof window.getBarn === 'function') ? window.getBarn() : null;
    if(!barn){
      if(typeof showToast === 'function') showToast('Ambar bilgisi alınamadı 🧺');
      return;
    }

    // Yeterli malzeme kontrolü
    for(var k in contract.req){
      if((barn[k] || 0) < contract.req[k]){
        var meta = (window.ITEMS_META && window.ITEMS_META[k]) ? window.ITEMS_META[k] : { emoji: '📦', name: k };
        if(typeof showToast === 'function') showToast('Eksik ürün: ' + meta.emoji + ' ' + meta.name + ' (' + (barn[k] || 0) + '/' + contract.req[k] + ')');
        return;
      }
    }

    // Malzemeleri ambardan düş
    if(typeof window.consumeBarnItems === 'function'){
      window.consumeBarnItems(contract.req);
    }

    // Ödülleri hesapla (Altın Lokomotif sahibi ise +%15 bonus)
    var bonusMult = (typeof stats !== 'undefined' && stats.goldenLocoBonus) ? 1.15 : 1.0;
    var payCoin = Math.round(contract.coin * bonusMult);
    var payXP = Math.round(contract.xp * bonusMult);
    var payStamps = contract.stamps || 1;

    if(typeof addCoin === 'function') addCoin(payCoin, true);
    if(typeof addXP === 'function') addXP(payXP);
    if(typeof window.addTradeStamps === 'function') window.addTradeStamps(payStamps, true);

    contract.done = true;
    saveContracts();

    if(typeof sndTrainBell === 'function') sndTrainBell();
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('success');
    if(typeof showToast === 'function'){
      showToast('🎉 ' + contract.title + ' yüklendi! +' + payCoin + '💰 +' + payXP + '⭐ +' + payStamps + '🎫 Mühür');
    }

    renderTrainPanel();
  };

  window.departTrainToCapital = function(){
    if(trainState !== 'docked') return;

    var allDone = activeContracts.every(function(c){ return c && c.done; });
    if(allDone){
      // BÜYÜK İHRACAT BONUSU!
      var grandCoin = 500;
      var grandXP = 350;
      var grandStamps = 2;
      if(typeof addCoin === 'function') addCoin(grandCoin, true);
      if(typeof addXP === 'function') addXP(grandXP);
      if(typeof window.addTradeStamps === 'function') window.addTradeStamps(grandStamps, true);

      sndTrainWhistle();
      setTimeout(sndTrainWhistle, 380);
      if(typeof showToast === 'function'){
        showToast('🌟 BÜYÜK İHRACAT TAMAMLANDI! +' + grandCoin + '💰 +' + grandXP + '⭐ +' + grandStamps + '🎫 Bonusla Tren Uğurlandı!');
      }
    } else {
      sndTrainWhistle();
      if(typeof showToast === 'function'){
        showToast('🚂 Çiftlik Treni başkente uğurlandı!');
      }
    }

    trainState = 'departing';
    trainMoveProgress = 0;
    closeTrainTradeModal();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 7) TÜCCAR ÖZEL TEZGÂHI (MÜHÜR HARCAMA MAĞAZASI)
  // ═══════════════════════════════════════════════════════════════════════════
  var MERCHANT_REWARDS = [
    {
      id: 'express_whistle',
      emoji: '📢',
      name: 'Ekspres Tren Düdüğü',
      desc: 'Treni beklemeden istasyona anında çağırır.',
      cost: 3,
      onBuy: function(){
        window.callTradeTrain(true);
      }
    },
    {
      id: 'mini_train',
      emoji: '🚂',
      name: 'Minyatür Buharlı Tren',
      desc: 'Bahçenize yerleştirilebilir canlı buharlı minyatür tren maketi.',
      cost: 5,
      decoType: 'mini_train',
      onBuy: function(){
        if(typeof window.startPlace === 'function') window.startPlace('mini_train');
      }
    },
    {
      id: 'pier_lantern',
      emoji: '⚓',
      name: 'Nostaljik İskele Feneri',
      desc: 'Gece sıcacık altın ışık huzmeleri saçan pirinç istasyon feneri.',
      cost: 8,
      decoType: 'pier_lantern',
      onBuy: function(){
        if(typeof window.startPlace === 'function') window.startPlace('pier_lantern');
      }
    },
    {
      id: 'golden_loco',
      emoji: '🏆',
      name: 'Altın Lokomotif Heykeli',
      desc: 'Efsanevi prestij heykeli! Kalıcı olarak tüm satışlara +%15 gelir bonusu kazandırır.',
      cost: 12,
      decoType: 'golden_loco',
      onBuy: function(){
        if(typeof stats !== 'undefined') stats.goldenLocoBonus = true;
        if(typeof window.startPlace === 'function') window.startPlace('golden_loco');
      }
    }
  ];

  window.buyMerchantReward = function(idx){
    var item = MERCHANT_REWARDS[idx];
    if(!item) return;

    var curStamps = (typeof stats !== 'undefined') ? (stats.tradeStamps || 0) : 0;
    if(curStamps < item.cost){
      if(typeof showToast === 'function') showToast('Yeterli Altın Mühür yok! (Gerekli: ' + item.cost + ' 🎫)');
      return;
    }

    stats.tradeStamps = curStamps - item.cost;
    if(typeof saveStats === 'function') saveStats();
    if(typeof updStats === 'function') updStats();

    closeTrainTradeModal();
    if(item.onBuy) item.onBuy();
    if(typeof showToast === 'function') showToast('🎉 ' + item.name + ' alındı!');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 8) HTML MODAL & ARAYÜZ (renderTrainPanel)
  // ═══════════════════════════════════════════════════════════════════════════
  var activeTab = 'contracts'; // 'contracts' | 'merchant'

  function ensureModalDOM(){
    if(document.getElementById('trainTradeModal')) return;

    var style = document.createElement('style');
    style.textContent = [
      '#trainTradeModal{position:fixed;inset:0;background:rgba(10,14,16,.82);backdrop-filter:blur(20px);z-index:2800;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s;padding:14px}',
      '#trainTradeModal.open{opacity:1;pointer-events:auto}',
      '.tt-card{background:linear-gradient(180deg,rgba(24,32,38,.98),rgba(14,20,24,.98));border:1px solid rgba(255,215,0,.35);box-shadow:0 16px 50px rgba(0,0,0,.85),0 0 30px rgba(255,190,40,.12);border-radius:24px;width:min(520px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}',
      '.tt-header{background:linear-gradient(135deg,rgba(217,119,6,.2),rgba(245,158,11,.1));border-bottom:1px solid rgba(255,255,255,.08);padding:14px 18px;display:flex;align-items:center;justify-content:space-between}',
      '.tt-title-box{display:flex;align-items:center;gap:10px}',
      '.tt-title-icon{font-size:32px;animation:trainBob 2s infinite ease-in-out}',
      '@keyframes trainBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}',
      '.tt-title{font-size:16px;font-weight:900;color:#fff;letter-spacing:.3px}',
      '.tt-sub{font-size:11px;color:#fcd34d;margin-top:2px;font-weight:700}',
      '.tt-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:50%;width:32px;height:32px;color:#fff;font-size:14px;cursor:pointer}',
      '.tt-tabs{display:flex;background:rgba(0,0,0,.35);padding:4px;border-bottom:1px solid rgba(255,255,255,.06)}',
      '.tt-tab{flex:1;text-align:center;padding:8px 12px;font-size:12px;font-weight:800;color:rgba(255,255,255,.6);cursor:pointer;border-radius:12px;transition:all .15s}',
      '.tt-tab.active{background:rgba(251,191,36,.2);color:#fde047;border:1px solid rgba(251,191,36,.4)}',
      '.tt-body{padding:14px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;flex:1}',
      '.tt-wagon-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden}',
      '.tt-wagon-card.done{border-color:rgba(34,197,94,.5);background:rgba(34,197,94,.08)}',
      '.tt-wc-top{display:flex;align-items:center;justify-content:space-between}',
      '.tt-wc-info{display:flex;align-items:center;gap:10px}',
      '.tt-wc-em{font-size:24px;background:rgba(0,0,0,.25);padding:6px;border-radius:12px}',
      '.tt-wc-name{font-size:13px;font-weight:800;color:#fff}',
      '.tt-wc-slot{font-size:10px;color:rgba(255,255,255,.5);font-weight:700}',
      '.tt-req-row{display:flex;flex-wrap:wrap;gap:6px}',
      '.tt-req-pill{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:4px 8px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;color:#e2e8f0}',
      '.tt-req-pill.ok{border-color:rgba(34,197,94,.5);color:#86efac;background:rgba(34,197,94,.15)}',
      '.tt-wc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:2px}',
      '.tt-rew-box{font-size:11px;color:#fde047;font-weight:800}',
      '.tt-btn{border:none;border-radius:14px;padding:8px 16px;font-size:12px;font-weight:800;cursor:pointer;transition:transform .12s}',
      '.tt-btn:active{transform:scale(.94)}',
      '.tt-btn.fill{background:linear-gradient(135deg,#059669,#10b981);color:#fff;box-shadow:0 4px 14px rgba(16,185,129,.4)}',
      '.tt-btn.disabled{background:rgba(255,255,255,.08);color:rgba(255,255,255,.35);cursor:default}',
      '.tt-btn.whistle{background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;box-shadow:0 4px 14px rgba(245,158,11,.4)}',
      '.tt-btn.depart{background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;box-shadow:0 6px 20px rgba(59,130,246,.5);padding:12px;font-size:13px;width:100%}',
      '.tt-btn.depart.grand{background:linear-gradient(135deg,#d97706,#f59e0b);animation:grandPulse 1.2s infinite alternate}',
      '@keyframes grandPulse{0%{box-shadow:0 0 10px rgba(251,191,36,.4)}100%{box-shadow:0 0 25px rgba(251,191,36,.8)}}',
      '.tt-store-grid{display:flex;flex-direction:column;gap:10px}',
      '.tt-store-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,215,0,.2);border-radius:18px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.tt-sc-left{display:flex;align-items:center;gap:10px}',
      '.tt-sc-em{font-size:26px;background:rgba(251,191,36,.12);padding:8px;border-radius:14px;border:1px solid rgba(251,191,36,.25)}',
      '.tt-sc-title{font-size:13px;font-weight:800;color:#fff}',
      '.tt-sc-desc{font-size:10px;color:rgba(255,255,255,.6);margin-top:2px}',
      '.tt-sc-cost{font-size:12px;color:#fde047;font-weight:900}',
      '.tt-stamp-badge{background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.4);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:800;color:#fde047;display:inline-flex;align-items:center;gap:4px}'
    ].join('\n');
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'trainTradeModal';
    modal.innerHTML = [
      '<div class="tt-card">',
      '  <div class="tt-header">',
      '    <div class="tt-title-box">',
      '      <span class="tt-title-icon">🚂</span>',
      '      <div>',
      '        <div class="tt-title">Büyük Çiftlik Treni</div>',
      '        <div class="tt-sub" id="ttStatusLine">🟢 İstasyonda · Toptan Teslimat Bekliyor</div>',
      '      </div>',
      '    </div>',
      '    <div style="display:flex;align-items:center;gap:8px">',
      '      <span class="tt-stamp-badge" id="ttHeaderStamps">0 🎫 Mühür</span>',
      '      <button type="button" class="tt-close" onclick="window.closeTrainTradeModal()">✕</button>',
      '    </div>',
      '  </div>',
      '  <div class="tt-tabs">',
      '    <div class="tt-tab active" id="ttTabContracts" onclick="window.switchTrainTab(\'contracts\')">🚂 Toptan İhracat (Vagonlar)</div>',
      '    <div class="tt-tab" id="ttTabMerchant" onclick="window.switchTrainTab(\'merchant\')">🎫 Tüccar Tezgâhı</div>',
      '  </div>',
      '  <div class="tt-body" id="ttBody"></div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e){
      if(e.target === modal) window.closeTrainTradeModal();
    });
  }

  function renderTrainPanel(){
    ensureModalDOM();
    var body = document.getElementById('ttBody');
    if(!body) return;

    var curStamps = (typeof stats !== 'undefined') ? (stats.tradeStamps || 0) : 0;
    var headerStamps = document.getElementById('ttHeaderStamps');
    if(headerStamps) headerStamps.textContent = curStamps + ' 🎫 Mühür';

    var statusLine = document.getElementById('ttStatusLine');
    if(statusLine){
      if(trainState === 'docked') statusLine.textContent = '🟢 İstasyonda · Toptan Teslimat Bekliyor';
      else if(trainState === 'arriving') statusLine.textContent = '🚂 İstasyona Yanaşıyor…';
      else if(trainState === 'departing') statusLine.textContent = '🚀 Başkente Uğurlandı!';
      else statusLine.textContent = '⏳ Yolda: ' + Math.ceil(trainTimer) + 'sn kaldı';
    }

    if(activeTab === 'merchant'){
      var storeHtml = MERCHANT_REWARDS.map(function(item, idx){
        var canAfford = curStamps >= item.cost;
        return [
          '<div class="tt-store-card">',
          '  <div class="tt-sc-left">',
          '    <span class="tt-sc-em">' + item.emoji + '</span>',
          '    <div>',
          '      <div class="tt-sc-title">' + item.name + '</div>',
          '      <div class="tt-sc-desc">' + item.desc + '</div>',
          '    </div>',
          '  </div>',
          '  <button type="button" class="tt-btn ' + (canAfford ? 'whistle' : 'disabled') + '" onclick="window.buyMerchantReward(' + idx + ')">',
          '    ' + item.cost + ' 🎫 Al',
          '  </button>',
          '</div>'
        ].join('');
      }).join('');

      body.innerHTML = [
        '<div style="font-size:11px;color:rgba(255,255,255,.7);line-height:1.4">',
        '  Toptan ihracat sözleşmelerini tamamlayarak <b>Altın Ticaret Mührü (🎫)</b> kazanabilir, nadir dekorlar ve tren düdüğü satın alabilirsiniz.',
        '</div>',
        '<div class="tt-store-grid">' + storeHtml + '</div>'
      ].join('');
      return;
    }

    // ── CONTRACTS TAB ──
    var barn = (typeof window.getBarn === 'function') ? window.getBarn() : {};
    var wagonNames = ['1. Vagon (Tarım & Hasat)', '2. Vagon (Mandıra & Hayvancılık)', '3. Vagon (Gurme & Zanaat)'];

    var wagonsHtml = activeContracts.map(function(cnt, idx){
      var isDone = cnt.done;
      var canFill = true;

      var reqPills = Object.keys(cnt.req).map(function(k){
        var have = barn[k] || 0;
        var need = cnt.req[k];
        var enough = have >= need;
        if(!enough) canFill = false;
        var meta = (window.ITEMS_META && window.ITEMS_META[k]) ? window.ITEMS_META[k] : { emoji: '📦', name: k };
        return '<span class="tt-req-pill ' + (enough ? 'ok' : '') + '">' +
          meta.emoji + ' ' + meta.name + ' <b>' + have + '/' + need + '</b>' +
        '</span>';
      }).join(' ');

      return [
        '<div class="tt-wagon-card ' + (isDone ? 'done' : '') + '">',
        '  <div class="tt-wc-top">',
        '    <div class="tt-wc-info">',
        '      <span class="tt-wc-em">' + cnt.emoji + '</span>',
        '      <div>',
        '        <div class="tt-wc-name">' + cnt.title + '</div>',
        '        <div class="tt-wc-slot">' + wagonNames[idx] + '</div>',
        '      </div>',
        '    </div>',
        '    <div class="tt-rew-box">+' + cnt.coin + ' 💰 · +' + cnt.xp + ' ⭐ · +' + cnt.stamps + ' 🎫</div>',
        '  </div>',
        '  <div class="tt-req-row">' + reqPills + '</div>',
        '  <div class="tt-wc-foot">',
        '    <span style="font-size:10px;color:rgba(255,255,255,.5)">' + (isDone ? '✅ Vagon Dolu ve Mühürlendi' : 'Toptan İhracat Yükü') + '</span>',
        '    <button type="button" class="tt-btn ' + (isDone ? 'disabled' : (canFill ? 'fill' : 'disabled')) + '" onclick="window.fillTrainWagon(' + idx + ')">',
        '      ' + (isDone ? 'Hazır' : (canFill ? '📦 Vagonu Doldur' : 'Eksik')) + '',
        '    </button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    var allDone = activeContracts.every(function(c){ return c && c.done; });

    var actionFooter = '';
    if(trainState === 'docked'){
      if(allDone){
        actionFooter = '<button type="button" class="tt-btn depart grand" onclick="window.departTrainToCapital()">' +
          '🚀 Treni Başkente Uğurla (+500💰 +350⭐ +2🎫 BÜYÜK BONUS!)' +
        '</button>';
      } else {
        actionFooter = '<button type="button" class="tt-btn depart" onclick="window.departTrainToCapital()">' +
          '🚂 Treni Mevcut Yüklerle Uğurla' +
        '</button>';
      }
    } else {
      actionFooter = '<button type="button" class="tt-btn whistle" style="width:100%" onclick="window.callTradeTrain()">' +
        '📢 Tren Düdüğü Çal (Hemen Çağır)' +
      '</button>';
    }

    body.innerHTML = wagonsHtml + actionFooter;
  }

  window.openTrainTradeModal = function(){
    ensureModalDOM();
    renderTrainPanel();
    var modal = document.getElementById('trainTradeModal');
    if(modal) modal.classList.add('open');
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
  };

  window.closeTrainTradeModal = function(){
    var modal = document.getElementById('trainTradeModal');
    if(modal) modal.classList.remove('open');
  };

  window.switchTrainTab = function(tab){
    activeTab = tab;
    var t1 = document.getElementById('ttTabContracts');
    var t2 = document.getElementById('ttTabMerchant');
    if(t1) t1.classList.toggle('active', tab === 'contracts');
    if(t2) t2.classList.toggle('active', tab === 'merchant');
    renderTrainPanel();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BAŞLATMA
  // ═══════════════════════════════════════════════════════════════════════════
  function initTrainTrade(){
    loadContracts();
    ensureModalDOM();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTrainTrade);
  } else {
    initTrainTrade();
  }
})();

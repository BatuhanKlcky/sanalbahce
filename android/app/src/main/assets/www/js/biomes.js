// Multi-biome circular diorama islands — auto ring layout, theme per pad.
(function(){
  var RING_DIST = 48;
  var _built = false;
  var _focus = localStorage.getItem('gdn_biome') || 'meadow';
  var _camTween = null;

  var BIOMES = [
    {
      id: 'meadow', name: 'Çayır', emoji: '🌸',
      center: true, R: 20,
      grass: 0x7ec85a, rim: 0xc4895a, mid: 0xa86f45, cork: 0x7a4a2e, moss: 0x4fa84a,
      fog: 0xd9c4b0, sun: 0xffe2c4, glow: 0xffd2a0,
      phase: 0.62
    },
    {
      id: 'forest', name: 'Orman', emoji: '🌲',
      ang: -Math.PI * 0.85, R: 15,
      grass: 0x3f6e3a, rim: 0x5a4030, mid: 0x4a3428, cork: 0x3a281c, moss: 0x2f5a2a,
      fog: 0x6a8a6a, sun: 0xc8e0b0, glow: 0x88cc66,
      phase: 0.55
    },
    {
      id: 'farm', name: 'Çiftlik', emoji: '🌾',
      ang: -Math.PI * 0.25, R: 15,
      grass: 0xc8b86a, rim: 0xb08a4a, mid: 0x9a7340, cork: 0x7a5528, moss: 0xa8c45a,
      fog: 0xe8d8a8, sun: 0xffe8b0, glow: 0xffcc66,
      phase: 0.48
    },
    {
      id: 'lake', name: 'Göl', emoji: '💧',
      ang: Math.PI * 0.25, R: 15,
      grass: 0x6db89a, rim: 0x8a7a5a, mid: 0x6a5a48, cork: 0x4a4038, moss: 0x4aa888,
      fog: 0xa8d0d8, sun: 0xd0f0ff, glow: 0x88dde8,
      phase: 0.58
    },
    {
      id: 'village', name: 'Köy', emoji: '🏠',
      ang: Math.PI * 0.85, R: 15,
      grass: 0x8fbf6a, rim: 0xb09070, mid: 0x8a6a50, cork: 0x6a4a38, moss: 0x6aaa58,
      fog: 0xd8c8b0, sun: 0xffe0c0, glow: 0xffb070,
      phase: 0.68
    }
  ];

  function rnd(seed){
    var s = (seed * 1664525 + 1013904223) >>> 0;
    return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function makePad(b){
    var g = new THREE.Group();
    g.name = 'biome_' + b.id;
    var R = b.R;
    var grassMat = typeof window.createLawnMaterial === 'function'
      ? window.createLawnMaterial({
          key: 'biome-' + b.id,
          tint: b.grass,
          warm: b.glow,
          cool: b.moss,
          dirt: b.rim,
          repeat: b.center ? 4.5 : 3.8,
          normalScale: 0.75,
          color: 0xffffff
        })
      : new THREE.MeshStandardMaterial({ color: b.grass, roughness: 0.92 });
    var segs = isMobile ? 40 : 72;
    var top = new THREE.Mesh(new THREE.CircleGeometry(R, segs), grassMat);
    top.position.y = 0.03;
    top.receiveShadow = !!(renderer && renderer.shadowMap && renderer.shadowMap.enabled);
    if(typeof window.sculptGroundCircle === 'function'){
      window.sculptGroundCircle(top, R, b.center ? 0.4 : 0.32);
    }
    top.rotation.x = -Math.PI / 2;
    g.add(top);

    var rim = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.15, R + 0.85, 2.2, isMobile ? 32 : 48, 1, true),
      new THREE.MeshStandardMaterial({ color: b.rim, roughness: 0.92, side: THREE.DoubleSide })
    );
    rim.position.y = -1.05;
    g.add(rim);
    var mid = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.1, R * 0.82, 1.2, isMobile ? 28 : 40),
      new THREE.MeshStandardMaterial({ color: b.mid, roughness: 0.95 })
    );
    mid.position.y = -2.0;
    g.add(mid);
    var cork = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.8, R * 0.42, 1.3, isMobile ? 24 : 36),
      new THREE.MeshStandardMaterial({ color: b.cork, roughness: 1 })
    );
    cork.position.y = -3.0;
    g.add(cork);
    var moss = new THREE.Mesh(
      new THREE.TorusGeometry(R - 0.1, 0.18, 8, isMobile ? 36 : 56),
      new THREE.MeshStandardMaterial({ color: b.moss, roughness: 0.9 })
    );
    moss.rotation.x = Math.PI / 2;
    moss.position.y = 0.04;
    g.add(moss);

    var glow = new THREE.PointLight(b.glow, 0.4, R * 2.2);
    glow.position.set(0, -1.2, 0);
    g.add(glow);

    return g;
  }

  function addAt(root, obj, x, z, scale, rotY){
    if(!obj) return null;
    if(scale != null) obj.scale.multiplyScalar(scale);
    obj.position.x += x;
    obj.position.z += z;
    if(rotY != null) obj.rotation.y += rotY;
    root.add(obj);
    return obj;
  }

  function spawn(key, h){
    if(typeof window.spawnModel === 'function'){
      var m = window.spawnModel(key, h);
      if(m) return m;
    }
    // Procedural fallback if GLB model is still loading or unavailable
    if(/^tree_|^pine_|^birch_|^willow_|^apple_tree|^palm|^bamboo|^dead_tree/.test(key)){
      if(typeof buildTree === 'function') return buildTree(0, 0);
    }
    if(/^bush_|^berry_bush|^plant_|^grass/.test(key)){
      if(typeof buildBush === 'function') return buildBush(0, 0);
    }
    if(/^rock_|^stump|^log/.test(key)){
      if(typeof buildStone === 'function') return buildStone(0, 0);
    }
    if(/^shroom_/.test(key)){
      if(typeof buildMushroom === 'function') return buildMushroom(0, 0);
    }
    if(/^house_|^inn|^stable|^blacksmith|^sawmill/.test(key)){
      if(typeof buildHouse === 'function'){
        var ho = buildHouse(0, 0, 0);
        return ho && ho.group ? ho.group : ho;
      }
    }
    if(key === 'mill' && typeof buildWindmill === 'function'){
      var ml = buildWindmill(0, 0);
      return ml && ml.group ? ml.group : ml;
    }
    if(key === 'well' && typeof buildWell === 'function') return buildWell(0, 0);
    if(key === 'gazebo' && typeof buildPergola === 'function') return buildPergola(0, 0, 0);
    if(/^bench_/.test(key) && typeof buildBench === 'function') return buildBench(0, 0, 0);
    if(key === 'fence' && typeof buildFence === 'function') return buildFence(0, 0, 0);
    if(/^stand/.test(key) && typeof buildTable === 'function') return buildTable(0, 0, 0);
    if(/^barrel|^crate|^hay|^cauldron|^bags|^bag|^package_/.test(key) && typeof buildPot === 'function') return buildPot(0, 0);
    return null;
  }

  function spawnBloom(kind, col, sc){
    if(typeof window.mkPerfectBloom === 'function'){
      return window.mkPerfectBloom(kind || 'daisy', col || 0xffd056, sc == null ? 1 : sc);
    }
    return spawn(kind === 'lotus' ? 'flower_3' : 'flower_1', 0.45);
  }

  function spawnWildPatch(x, z){
    if(typeof window.buildPerfectWild === 'function') return window.buildPerfectWild(x, z);
    return spawn('flowers', 0.55);
  }

  function ringSlots(n, r0, r1, seed){
    var r = rnd(seed);
    var out = [];
    for(var i = 0; i < n; i++){
      var a = (i / n) * Math.PI * 2 + r() * 0.35;
      var rr = r0 + r() * (r1 - r0);
      out.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, a: a, r: r });
    }
    return out;
  }

  function fillMeadow(root, b){
    var R = b.R - 2.2;
    var nTree = isMobile ? 6 : 10;
    ringSlots(nTree, R * 0.58, R * 0.9, 11).forEach(function(s, i){
      addAt(root, spawn(['tree_1','tree_2','tree_3','birch_1','apple_tree'][i % 5], 2.7 + (i % 3) * 0.25), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 5 : 8, R * 0.45, R * 0.78, 22).forEach(function(s, i){
      addAt(root, spawn(['bush_1','bush_berry_1','bush_2','berry_bush'][i % 4], 0.9), s.x, s.z, 1, s.a);
    });
    addAt(root, spawn('house_2', 3.3), -6.2, -4.2, 1, 0.4);
    addAt(root, spawn('house_1', 3.0), 6.8, -2.5, 0.9, -0.5);
    addAt(root, spawn('mill', 4.3), 1.2, -11.0, 0.95, 0.1);
    addAt(root, spawn('well', 1.8), 5.2, 3.0, 1, 0);
    addAt(root, spawn('gazebo', 2.6), -7.2, 3.2, 0.92, 0.2);
    addAt(root, spawn('bench_1', 0.75), 2.2, 4.4, 1, -0.3);
    addAt(root, spawn('bench_2', 0.75), -2.5, 5.2, 1, 0.3);
    addAt(root, spawn('cart', 1.25), 8.2, 1.5, 0.9, -0.8);
    addAt(root, spawn('barrel', 0.65), 6.2, 4.0, 1, 0);
    if(typeof buildLantern === 'function'){
      [[-8.5, 5.5],[8.2, 4.8],[-3.5, -8.8]].forEach(function(p, i){
        if(isMobile && i > 1) return;
        var lan = buildLantern(p[0], p[1]);
        if(lan && lan.group) root.add(lan.group);
      });
    }
    // center pond via builder if available
    if(typeof buildPond === 'function'){
      var pond = buildPond(0, 0.2);
      if(pond && pond.group){ pond.group.scale.setScalar(0.85); root.add(pond.group); }
    }
    ringSlots(isMobile ? 7 : 12, 3, R * 0.52, 33).forEach(function(s){
      var kinds = ['daisy','rose','tulip','cherry','peony','lotus'];
      var cols = [0xff5a9a,0xffd056,0xffffff,0xffb7c5,0x9b7efa,0xff3366];
      var patch = spawnWildPatch(s.x, s.z);
      if(patch){
        patch.rotation.y = s.a;
        root.add(patch);
      } else {
        addAt(root, spawnBloom(kinds[Math.floor(s.r()*kinds.length)], cols[Math.floor(s.r()*cols.length)], 0.9), s.x, s.z, 1, s.a);
      }
    });
  }

  function fillForest(root, b){
    var R = b.R - 1.6;
    // Dense pine, birch, oak, and deadwood forest
    ringSlots(isMobile ? 10 : 16, R * 0.35, R * 0.92, 101).forEach(function(s, i){
      var treeKeys = ['pine_1','pine_2','pine_3','pine_4','pine_5','birch_1','birch_2','tree_4','tree_5','dead_tree'];
      addAt(root, spawn(treeKeys[i % treeKeys.length], 2.9 + (i % 4) * 0.35), s.x, s.z, 1, s.a);
    });
    // Sawmill & lumberjack camp in the forest clearing
    addAt(root, spawn('sawmill', 3.1), -2.8, -3.2, 0.95, 0.45);
    addAt(root, spawn('cauldron', 0.8), 1.8, 0.8, 1, 0);
    addAt(root, spawn('bonfire', 1.0), 0.2, 0.3, 1.15, 0);
    addAt(root, spawn('log_moss', 0.6), 2.4, -1.4, 1, 1.1);
    addAt(root, spawn('log', 0.55), -1.8, 2.2, 1, 0.4);
    addAt(root, spawn('stump', 0.55), -3.8, 0.5, 1, 0.2);
    addAt(root, spawn('stump_plain', 0.5), 3.6, -2.5, 1, 0.9);
    // Mossy boulders & rocks
    ringSlots(isMobile ? 6 : 10, R * 0.22, R * 0.68, 102).forEach(function(s, i){
      var rockKeys = ['rock_m1','rock_m2','rock_m3','rock_m4','rock_1','rock_3','stump'];
      addAt(root, spawn(rockKeys[i % rockKeys.length], 0.55 + s.r() * 0.45), s.x, s.z, 1, s.a);
    });
    // Forest mushroom rings & ferns
    ringSlots(isMobile ? 6 : 10, R * 0.15, R * 0.55, 103).forEach(function(s, i){
      addAt(root, spawn(['shroom_1','shroom_2','shroom_3','shroom_4'][i % 4], 0.38 + (i % 2)*0.1), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 5 : 8, R * 0.25, R * 0.75, 104).forEach(function(s, i){
      addAt(root, spawn(['bush_2','bush_berry_2','plant_1','plant_3','bamboo'][i % 5], 0.85 + (i % 3)*0.2), s.x, s.z, 1, s.a);
    });
  }

  function fillFarm(root, b){
    var R = b.R - 1.6;
    // Grand Windmill, Stable, Apple Orchard & Farmstead (Decorative Showcase)
    addAt(root, spawn('stable', 3.0), -3.6, -4.2, 0.95, 0.3);
    addAt(root, spawn('mill', 4.1), 4.2, -4.5, 0.92, -0.35);
    addAt(root, spawn('cart', 1.4), 3.8, -0.8, 1, -0.6);
    addAt(root, spawn('hay', 1.05), 5.2, 1.6, 1.1, 0.2);
    addAt(root, spawn('hay', 0.92), 4.1, 2.9, 1, 0.8);
    addAt(root, spawn('hay', 0.88), -5.2, -1.2, 1, 1.4);
    addAt(root, spawn('barrel', 0.72), -5.0, 1.2, 1, 0);
    addAt(root, spawn('crate', 0.58), -4.2, 2.2, 1, 0.4);
    addAt(root, spawn('bags', 0.55), -3.3, 2.5, 1, -0.2);
    addAt(root, spawn('well', 1.65), -0.8, -1.8, 0.95, 0);
    if(typeof buildScarecrow === 'function'){
      var sc = buildScarecrow(1.2, 0.8);
      if(sc) root.add(sc);
    } else {
      addAt(root, spawn('wheat', 1.1), 1.2, 0.8, 1.2, 0);
    }
    // Apple trees & fruit trees around the farm perimeter
    [[-6.5, -2.5],[6.8, -1.5],[-5.8, 4.5],[5.5, 5.2],[0.0, -6.8]].forEach(function(p, i){
      if(isMobile && i > 3) return;
      addAt(root, spawn(i % 2 === 0 ? 'apple_tree' : 'tree_3', 2.5), p[0], p[1], 1, i * 1.1);
    });
    // Decorative crop rows (wheat, corn, pumpkin, watermelon, carrot, tomato, lettuce)
    ringSlots(isMobile ? 10 : 16, 2.2, R * 0.72, 201).forEach(function(s, i){
      var keys = ['wheat','corn','pumpkin','watermelon','carrot','tomato','lettuce','plant_5'];
      addAt(root, spawn(keys[i % keys.length], 0.6 + s.r() * 0.35), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 6 : 8, R * 0.76, R * 0.92, 202).forEach(function(s){
      addAt(root, spawn('fence', 1.0), s.x, s.z, 1, s.a + Math.PI / 2);
    });
  }

  function fillLake(root, b){
    var R = b.R - 1.6;
    if(typeof buildPond === 'function'){
      var pond = buildPond(0, 0);
      if(pond && pond.group){ pond.group.scale.setScalar(1.25); root.add(pond.group); }
    }
    if(typeof buildBridge === 'function'){
      var br = buildBridge(0, 0.2, 0.35);
      if(br){ br.scale.setScalar(1.1); root.add(br); }
    }
    // Weeping willows, palms, bamboo, and birches around the water
    ringSlots(isMobile ? 7 : 11, R * 0.55, R * 0.92, 301).forEach(function(s, i){
      var lakeTrees = ['willow_1','willow_2','bamboo','palm','birch_1','birch_3','tree_2'];
      addAt(root, spawn(lakeTrees[i % lakeTrees.length], 2.75), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 6 : 10, 1.8, 4.6, 302).forEach(function(s){
      addAt(root, spawn('lilypad', 0.42), s.x * 0.55, s.z * 0.55, 1, s.a);
    });
    addAt(root, spawn('gazebo', 2.55), 0.5, -6.5, 0.9, 0);
    addAt(root, spawn('bench_2', 0.75), 5.5, 1.2, 1, -1.2);
    addAt(root, spawn('bench_1', 0.75), -5.2, -0.8, 1, 1.0);
    ringSlots(isMobile ? 5 : 8, R * 0.4, R * 0.72, 303).forEach(function(s, i){
      addAt(root, spawn(['rock_m1','rock_m2','rock_m3','rock_2','rock_4'][i % 5], 0.5), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 6 : 10, 4.8, R * 0.82, 304).forEach(function(s){
      if(s.r() > 0.4){
        var patch = spawnWildPatch(s.x, s.z);
        if(patch){ patch.rotation.y = s.a; root.add(patch); }
        else addAt(root, spawnBloom('lotus', 0xff69b4, 0.95), s.x, s.z, 1, s.a);
      } else {
        addAt(root, spawn(['plant_2','grass_2','bamboo'][Math.floor(s.r()*3)], 0.65), s.x, s.z, 1, s.a);
      }
    });
  }

  function fillVillage(root, b){
    var R = b.R - 1.6;
    // Bustling cozy village square: Inn, Blacksmith, Houses, Market Stands, Bell Tower, Well
    addAt(root, spawn('inn', 3.5), -1.2, -5.0, 0.95, 0.15);
    addAt(root, spawn('blacksmith', 3.2), -5.8, -1.8, 0.92, 0.65);
    addAt(root, spawn('house_3', 3.1), 5.4, -2.2, 0.9, -0.55);
    addAt(root, spawn('house_4', 2.95), -5.2, 3.2, 0.88, 0.7);
    addAt(root, spawn('house_1', 2.85), 5.2, 2.8, 0.86, -0.85);
    addAt(root, spawn('bell', 1.65), -2.6, -1.2, 1, 0.2);
    addAt(root, spawn('well', 1.75), 0.8, 0.6, 1, 0);
    addAt(root, spawn('stand', 1.5), 3.2, 3.6, 1, -0.4);
    addAt(root, spawn('stand_2', 1.5), -2.5, 4.2, 1, 0.5);
    addAt(root, spawn('barrel', 0.68), 4.4, 4.5, 1, 0);
    addAt(root, spawn('crate', 0.55), -3.8, 4.8, 1, 0.3);
    addAt(root, spawn('package_1', 0.45), -3.2, 5.1, 1, 0.1);
    addAt(root, spawn('bags', 0.5), 2.4, 4.4, 1, -0.3);
    addAt(root, spawn('cart', 1.3), 0.2, 5.8, 0.95, Math.PI);
    addAt(root, spawn('bench_1', 0.72), 2.2, -1.2, 1, -0.5);
    ringSlots(isMobile ? 5 : 8, R * 0.68, R * 0.92, 401).forEach(function(s, i){
      addAt(root, spawn(['tree_1','birch_2','bush_1','plant_4','apple_tree'][i % 5], 2.3), s.x, s.z, 1, s.a);
    });
    ringSlots(isMobile ? 5 : 8, R * 0.78, R * 0.95, 402).forEach(function(s){
      addAt(root, spawn('fence', 1.0), s.x, s.z, 1, s.a + Math.PI / 2);
    });
    addAt(root, spawnBloom('rose', 0xcc0022, 1.05), 2.0, 2.5, 1, 0);
    addAt(root, spawnBloom('tulip', 0xff3366, 1.05), -2.2, 2.8, 1, 0);
    var villagePatch = spawnWildPatch(0.5, 3.8);
    if(villagePatch) root.add(villagePatch);
    if(typeof buildLantern === 'function'){
      [[6.2, 5.5],[-6.5, -5.0],[0.5, 6.8]].forEach(function(p, i){
        if(isMobile && i > 1) return;
        var lan = buildLantern(p[0], p[1]);
        if(lan && lan.group) root.add(lan.group);
      });
    }
  }

  var FILLERS = {
    meadow: fillMeadow,
    forest: fillForest,
    farm: fillFarm,
    lake: fillLake,
    village: fillVillage
  };

  function clearBiomes(){
    if(window._biomeRoot && window._biomeRoot.parent){
      window._biomeRoot.parent.remove(window._biomeRoot);
    }
    window._biomeRoot = null;
    window._biomes = [];
    _built = false;
  }

  function buildAllBiomes(){
    if(typeof THREE === 'undefined' || !scene) return;
    clearBiomes();
    var root = new THREE.Group();
    root.name = 'biomeArchipelago';
    var cozy = typeof isCozy === 'function' ? isCozy() : false;
    root.visible = cozy;
    scene.add(root);
    window._biomeRoot = root;
    window._biomes = [];

    BIOMES.forEach(function(def){
      var b = Object.assign({}, def);
      if(b.center){ b.cx = 0; b.cz = 0; }
      else {
        b.cx = Math.cos(b.ang) * RING_DIST;
        b.cz = Math.sin(b.ang) * RING_DIST;
      }
      var pad = makePad(b);
      pad.position.set(b.cx, 0, b.cz);
      var props = new THREE.Group();
      props.name = 'props_' + b.id;
      pad.add(props);
      var filler = FILLERS[b.id];
      if(filler) filler(props, b);
      root.add(pad);
      b.root = pad;
      b.props = props;
      window._biomes.push(b);
    });

    // Keep legacy island root in sync with meadow for grass/life helpers
    var meadow = window._biomes.find(function(x){ return x.id === 'meadow'; });
    if(meadow){
      window._islandR = meadow.R;
      if(window._islandRoot){
        window._islandRoot.visible = false; // replaced by biome meadow pad
      }
    }
    // Freeze static pad shells (discs/rims) — props/lights keep updating as needed.
    root.traverse(function(c){
      if(!c.isMesh) return;
      if(c.parent && c.parent.name && c.parent.name.indexOf('props_') === 0) return;
      if(c.parent && c.parent.name && c.parent.name.indexOf('biome_') === 0){
        c.matrixAutoUpdate = false;
        c.updateMatrix();
      }
    });
    _built = true;
    paintBiomeBar();
    applyBiomeTheme(_focus, false);
  }

  function findBiome(id){
    if(!window._biomes) return null;
    for(var i = 0; i < window._biomes.length; i++){
      if(window._biomes[i].id === id) return window._biomes[i];
    }
    return window._biomes[0] || null;
  }

  function applyBiomeTheme(id, toast){
    var b = findBiome(id);
    if(!b) return;
    _focus = b.id;
    localStorage.setItem('gdn_biome', _focus);
    if(typeof _cozyPhase !== 'undefined') window._cozyPhase = b.phase;
    // hoist for cozy.js wrapDayClock
    if(typeof window !== 'undefined') window._biomePhase = b.phase;
    if(window.mLight){ mLight.color.setHex(b.sun); }
    if(scene && scene.fog){ scene.fog.color.setHex(b.fog); scene.fog.density = 0.0042; }
    var amb = scene.children.filter(function(c){ return c.isAmbientLight; })[0];
    if(amb) amb.color.setHex(b.sun);
    paintBiomeBar();
    if(toast && typeof showToast === 'function'){
      if(b.id === 'meadow') showToast(b.emoji + ' ' + b.name + ' (Ana Bahçe · Ekim & Hasat)');
      else showToast(b.emoji + ' ' + b.name + ' Biyomu · Sadece Süs & Dekor (Hasat Yok)');
    }
  }

  function focusBiome(id, animate){
    var b = findBiome(id);
    if(!b || !camera || !controls) return;
    applyBiomeTheme(b.id, true);
    var tx = b.cx, tz = b.cz;
    var camDist = b.R * 1.15;
    var goal = {
      x: tx + camDist * 0.15,
      y: b.R * 0.85,
      z: tz + camDist * 1.05,
      tx: tx, ty: 0.5, tz: tz
    };
    if(animate === false){
      camera.position.set(goal.x, goal.y, goal.z);
      controls.target.set(goal.tx, goal.ty, goal.tz);
      controls.minDistance = b.R * 0.55;
      controls.maxDistance = b.R * 2.4;
      controls.update();
      return;
    }
    var start = {
      x: camera.position.x, y: camera.position.y, z: camera.position.z,
      tx: controls.target.x, ty: controls.target.y, tz: controls.target.z
    };
    var t0 = performance.now();
    var dur = 700;
    if(_camTween) cancelAnimationFrame(_camTween);
    function step(now){
      var u = Math.min(1, (now - t0) / dur);
      var e = u * u * (3 - 2 * u);
      camera.position.set(
        start.x + (goal.x - start.x) * e,
        start.y + (goal.y - start.y) * e,
        start.z + (goal.z - start.z) * e
      );
      controls.target.set(
        start.tx + (goal.tx - start.tx) * e,
        start.ty + (goal.ty - start.ty) * e,
        start.tz + (goal.tz - start.tz) * e
      );
      controls.minDistance = b.R * 0.55;
      controls.maxDistance = b.R * 2.4;
      controls.update();
      if(u < 1) _camTween = requestAnimationFrame(step);
      else _camTween = null;
    }
    _camTween = requestAnimationFrame(step);
  }

  function paintBiomeBar(){
    var bar = document.getElementById('biomeBar');
    if(!bar) return;
    var cozy = typeof isCozy === 'function' && isCozy();
    bar.classList.toggle('show', !!cozy);
    bar.innerHTML = '';
    var tag = document.createElement('div');
    tag.style.cssText = 'font-size:8px;font-weight:800;color:#fce282;text-align:center;line-height:1.15;padding:2px 2px 4px;border-bottom:1px solid rgba(255,210,160,0.18);width:100%';
    tag.innerHTML = _focus === 'meadow' ? 'ANA<br>ADA' : 'SADECE<br>SÜS';
    bar.appendChild(tag);
    BIOMES.forEach(function(b){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'biomeChip' + (_focus === b.id ? ' on' : '');
      btn.title = b.id === 'meadow' ? (b.name + ' (Ana Bahçe)') : (b.name + ' (Sadece Süs - Hasat Yok)');
      btn.setAttribute('aria-label', b.name);
      btn.innerHTML = '<span class="be">' + b.emoji + '</span><span class="bn">' + b.name + '</span>';
      btn.onclick = function(){ window.focusBiome(b.id); };
      bar.appendChild(btn);
    });
  }

  function setBiomesVisible(v){
    if(window._biomeRoot) window._biomeRoot.visible = !!v;
    var bar = document.getElementById('biomeBar');
    if(bar) bar.classList.toggle('show', !!v);
    if(v){
      paintBiomeBar();
      // Snap to last biome without long tween on mode enter
      focusBiome(_focus, false);
    }
  }

  window.BIOMES = BIOMES;
  window.buildAllBiomes = buildAllBiomes;
  window.clearBiomes = clearBiomes;
  window.focusBiome = focusBiome;
  window.setBiomesVisible = setBiomesVisible;
  window.getActiveBiome = function(){ return findBiome(_focus); };
  window.paintBiomeBar = paintBiomeBar;

  // Build immediately so biomes are never empty while GLBs download, then rebuild with GLBs when ready
  setTimeout(function(){ if(!_built) buildAllBiomes(); }, 0);
  if(typeof window.whenModelsReady === 'function'){
    window.whenModelsReady(function(){
      setTimeout(function(){ buildAllBiomes(); }, 40);
    });
  }
})();

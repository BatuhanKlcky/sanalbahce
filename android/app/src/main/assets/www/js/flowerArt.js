// Kusursuz procedural flower art — shared by player plants, wild clusters, biomes.
(function(){
  var _petalCache = {};
  var _leafCache = {};

  var _matCache = {};
  var _shareDecorMats = false;
  function softMat(col, opts){
    opts = opts || {};
    if(_shareDecorMats && opts.keep == null) opts.keep = true;
    // Decorative (keep) mats are immutable — share across identical blooms.
    var cacheable = !!opts.keep;
    var ck = cacheable
      ? [col, opts.roughness, opts.metalness, opts.transparent, opts.opacity, opts.emissive, opts.eInt].join('|')
      : null;
    if(ck && _matCache[ck]) return _matCache[ck];
    var m = new THREE.MeshStandardMaterial({
      color: col,
      side: THREE.DoubleSide,
      roughness: opts.roughness != null ? opts.roughness : 0.42,
      metalness: opts.metalness != null ? opts.metalness : 0.02,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1
    });
    if(opts.emissive != null){
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = opts.eInt != null ? opts.eInt : 0.22;
    }
    if(opts.keep) m.userData.keep = true;
    if(ck) _matCache[ck] = m;
    return m;
  }

  function tintCol(col, toward, amt){
    var c = new THREE.Color(col);
    c.lerp(new THREE.Color(toward), amt);
    return c;
  }

  // Soft teardrop petal with slight thickness (cached).
  function makePetalGeo(w, h, curl){
    curl = curl == null ? 0.78 : curl;
    var key = (w * 200 | 0) + '_' + (h * 200 | 0) + '_' + (curl * 100 | 0);
    if(_petalCache[key]) return _petalCache[key];
    var sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.bezierCurveTo(w * 0.95, h * 0.12, w * curl, h * 0.55, 0, h);
    sh.bezierCurveTo(-w * curl, h * 0.55, -w * 0.95, h * 0.12, 0, 0);
    var geo;
    var depth = Math.max(0.008, Math.min(w, h) * 0.08);
    try {
      geo = new THREE.ExtrudeGeometry(sh, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.003,
        bevelSegments: 1,
        curveSegments: 7
      });
      geo.translate(0, 0, -depth * 0.5);
    } catch(e){
      geo = new THREE.ShapeGeometry(sh, 8);
    }
    geo.computeVertexNormals();
    _petalCache[key] = geo;
    return geo;
  }

  function makeLeafGeo(){
    if(_leafCache.std) return _leafCache.std;
    var sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.quadraticCurveTo(0.22, 0.12, 0.02, 0.52);
    sh.quadraticCurveTo(-0.08, 0.22, 0, 0);
    var geo = new THREE.ShapeGeometry(sh, 10);
    geo.computeVertexNormals();
    _leafCache.std = geo;
    return geo;
  }

  function addPetalRing(g, geo, mat, n, tilt, spin, y, r){
    for(var i = 0; i < n; i++){
      var a = (i / n) * Math.PI * 2 + (spin || 0);
      var p = new THREE.Mesh(geo, mat);
      p.rotation.order = 'YXZ';
      p.rotation.y = a;
      p.rotation.x = tilt;
      p.userData.px = tilt;
      p.userData.pi = i;
      p.position.set(Math.sin(a) * (r || 0), y || 0.02, Math.cos(a) * (r || 0));
      g.add(p);
    }
  }

  // ── Individual bloom heads ────────────────────────────────────────────────
  function headDaisy(col){
    var g = new THREE.Group();
    var petal = makePetalGeo(0.11, 0.34, 0.88);
    var pm = softMat(tintCol(col, 0xffffff, 0.18), { roughness: 0.38, emissive: col, eInt: 0.18 });
    addPetalRing(g, petal, pm, 12, 1.22, 0.04, 0.02, 0.02);
    var inner = makePetalGeo(0.07, 0.2, 0.8);
    addPetalRing(g, inner, softMat(tintCol(col, 0xffffff, 0.35), { roughness: 0.4, emissive: col, eInt: 0.12 }), 8, 1.05, 0.2, 0.04, 0.01);
    var center = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 8),
      softMat(0xffe066, { roughness: 0.55, emissive: 0xffcc44, eInt: 0.35 })
    );
    center.scale.set(1, 0.55, 1);
    center.position.y = 0.06;
    g.add(center);
    return g;
  }

  function headRose(col){
    var g = new THREE.Group();
    var bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 8),
      softMat(tintCol(col, 0x3a0010, 0.4), { roughness: 0.45, emissive: col, eInt: 0.15 })
    );
    bud.scale.set(1, 0.78, 1);
    bud.position.y = 0.08;
    g.add(bud);
    [
      { n: 5, r: 0.04, t: 0.38, s: 0.48, y: 0.1, light: 0.38, spin: 0.2 },
      { n: 7, r: 0.085, t: 0.72, s: 0.72, y: 0.04, light: 0.18, spin: 0.45 },
      { n: 9, r: 0.14, t: 1.12, s: 0.98, y: -0.01, light: 0.05, spin: 0.1 },
      { n: 8, r: 0.18, t: 1.32, s: 1.12, y: -0.05, light: 0, spin: 0.3 }
    ].forEach(function(l){
      var geo = makePetalGeo(0.15 * l.s, 0.32 * l.s, 0.92);
      var pc = tintCol(col, 0xffe8ef, l.light);
      var mat = softMat(pc, { roughness: 0.36, emissive: col, eInt: 0.2 + l.light * 0.15 });
      for(var i = 0; i < l.n; i++){
        var a = (i / l.n) * Math.PI * 2 + l.spin;
        var p = new THREE.Mesh(geo, mat);
        p.rotation.order = 'YXZ';
        p.rotation.y = a;
        p.rotation.x = l.t;
        p.userData.px = l.t;
        p.userData.pi = i;
        p.position.set(Math.sin(a) * l.r, l.y, Math.cos(a) * l.r);
        g.add(p);
      }
    });
    var sepal = makePetalGeo(0.07, 0.15, 0.5);
    var sm = softMat(0x1f6a32, { roughness: 0.82 });
    for(var s = 0; s < 5; s++){
      var sa = (s / 5) * Math.PI * 2;
      var sep = new THREE.Mesh(sepal, sm);
      sep.rotation.order = 'YXZ';
      sep.rotation.y = sa;
      sep.rotation.x = 1.38;
      sep.position.set(Math.sin(sa) * 0.07, -0.05, Math.cos(sa) * 0.07);
      g.add(sep);
    }
    return g;
  }

  function headTulip(col){
    var g = new THREE.Group();
    // Cup via lathe silhouette
    var pts = [
      new THREE.Vector2(0.02, 0),
      new THREE.Vector2(0.1, 0.05),
      new THREE.Vector2(0.14, 0.22),
      new THREE.Vector2(0.12, 0.42),
      new THREE.Vector2(0.08, 0.55),
      new THREE.Vector2(0.02, 0.58)
    ];
    var cup = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 16),
      softMat(tintCol(col, 0xfff0f5, 0.12), { roughness: 0.34, emissive: col, eInt: 0.28, transparent: true, opacity: 0.96 })
    );
    g.add(cup);
    var outer = makePetalGeo(0.1, 0.52, 0.5);
    for(var i = 0; i < 3; i++){
      var a = (i / 3) * Math.PI * 2;
      var p = new THREE.Mesh(outer, softMat(tintCol(col, 0xffffff, 0.08), { roughness: 0.36, emissive: col, eInt: 0.2 }));
      p.rotation.order = 'YXZ';
      p.rotation.y = a;
      p.rotation.x = 0.42;
      p.userData.px = 0.42;
      p.userData.pi = i;
      p.position.set(Math.sin(a) * 0.03, 0.02, Math.cos(a) * 0.03);
      g.add(p);
    }
    var tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      softMat(tintCol(col, 0xffffff, 0.4), { roughness: 0.4, emissive: col, eInt: 0.25 })
    );
    tip.position.y = 0.52;
    g.add(tip);
    return g;
  }

  function headLotus(col){
    var g = new THREE.Group();
    [
      { n: 8, w: 0.1, h: 0.32, tilt: 0.92, spin: 0, shade: 0.12 },
      { n: 10, w: 0.15, h: 0.4, tilt: 1.22, spin: 0.16, shade: 0.02 },
      { n: 12, w: 0.13, h: 0.28, tilt: 1.45, spin: 0.08, shade: -0.12 }
    ].forEach(function(l){
      var c = l.shade >= 0 ? tintCol(col, 0xfff5fb, l.shade) : tintCol(col, 0x802050, -l.shade);
      var mat = softMat(c, { roughness: 0.38, emissive: col, eInt: 0.16 });
      addPetalRing(g, makePetalGeo(l.w, l.h, 0.82), mat, l.n, l.tilt, l.spin, 0.02, 0.01);
    });
    var c = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 8),
      softMat(0xf0c14a, { roughness: 0.65, emissive: 0xe8b030, eInt: 0.25 })
    );
    c.scale.y = 0.3;
    c.position.y = 0.05;
    g.add(c);
    return g;
  }

  function headSunflower(col){
    var g = new THREE.Group();
    var disk = new THREE.Mesh(
      new THREE.CircleGeometry(0.17, 22),
      softMat(0x5a2e0c, { roughness: 0.92 })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.05;
    g.add(disk);
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 10),
      softMat(0x8a4b12, { roughness: 0.85, emissive: 0x6a3810, eInt: 0.12 })
    );
    dome.scale.y = 0.38;
    dome.position.y = 0.07;
    g.add(dome);
    for(var i = 0; i < 18; i++){
      var a = (i / 18) * Math.PI * 2;
      var r = 0.04 + 0.05 * (i % 2);
      var seed = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 5, 4),
        softMat(i % 2 ? 0xc47820 : 0x4a240c, { roughness: 1 })
      );
      seed.position.set(Math.cos(a) * r, 0.11, Math.sin(a) * r);
      g.add(seed);
    }
    var petal = makePetalGeo(0.16, 0.34, 0.95);
    var pm = softMat(tintCol(col, 0xfff6c0, 0.18), { roughness: 0.4, emissive: col, eInt: 0.32 });
    addPetalRing(g, petal, pm, 16, 1.18, 0.03, 0.03, 0.08);
    var petal2 = makePetalGeo(0.12, 0.26, 0.9);
    addPetalRing(g, petal2, softMat(tintCol(col, 0xffee88, 0.1), { roughness: 0.42, emissive: col, eInt: 0.22 }), 12, 1.05, 0.14, 0.04, 0.05);
    return g;
  }

  function headBell(col){
    var g = new THREE.Group();
    var stemM = softMat(0x2c6a38, { roughness: 0.9 });
    var mat = softMat(col, { roughness: 0.4, emissive: col, eInt: 0.28 });
    for(var i = 0; i < 5; i++){
      var a = (i / 5) * Math.PI * 2;
      var spr = new THREE.Group();
      spr.rotation.y = a;
      spr.rotation.z = 0.55;
      spr.userData.bz = 0.55;
      spr.userData.pi = i;
      spr.position.y = 0.02;
      g.add(spr);
      var st = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.18, 5), stemM);
      st.position.y = -0.09;
      spr.add(st);
      var bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat);
      bell.scale.set(0.88, 1.2, 0.88);
      bell.position.y = -0.2;
      spr.add(bell);
      var lip = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.01, 5, 10), mat);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = -0.245;
      spr.add(lip);
    }
    return g;
  }

  function headCherry(col){
    var g = new THREE.Group();
    var geo = makePetalGeo(0.11, 0.18, 0.92);
    var mat = softMat(tintCol(col, 0xffffff, 0.28), { roughness: 0.36, emissive: col, eInt: 0.22 });
    addPetalRing(g, geo, mat, 5, 1.18, 0, 0.02, 0.01);
    var c = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 8),
      softMat(0xffe14a, { roughness: 0.5, emissive: 0xffd040, eInt: 0.35 })
    );
    c.position.y = 0.05;
    g.add(c);
    var stM = softMat(0xf2d24a, { roughness: 0.55 });
    for(var i = 0; i < 7; i++){
      var a = (i / 7) * Math.PI * 2;
      var st = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.055, 3), stM);
      st.position.set(Math.cos(a) * 0.02, 0.07, Math.sin(a) * 0.02);
      g.add(st);
    }
    return g;
  }

  function headPeony(col){
    var g = new THREE.Group();
    [
      { n: 8, s: 0.7, t: 0.7, r: 0.04, y: 0.06 },
      { n: 10, s: 0.95, t: 1.05, r: 0.09, y: 0.02 },
      { n: 12, s: 1.15, t: 1.28, r: 0.14, y: -0.02 }
    ].forEach(function(l, li){
      var geo = makePetalGeo(0.12 * l.s, 0.26 * l.s, 0.85);
      var mat = softMat(tintCol(col, 0xffffff, 0.08 * (2 - li)), { roughness: 0.4, emissive: col, eInt: 0.2 });
      addPetalRing(g, geo, mat, l.n, l.t, li * 0.15, l.y, l.r);
    });
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 8),
      softMat(0xfff0a0, { roughness: 0.5, emissive: 0xffe070, eInt: 0.3 })
    ));
    return g;
  }

  var KIND_BUILDERS = {
    rose: headRose,
    tulip: headTulip,
    lotus: headLotus,
    sunflower: headSunflower,
    bluebell: headBell,
    cherry: headCherry,
    daisy: headDaisy,
    peony: headPeony,
    0: headRose,
    1: headDaisy,
    2: headSunflower,
    3: headPeony,
    bell: headBell
  };

  function buildHead(kind, col){
    var fn = KIND_BUILDERS[kind];
    if(fn) return fn(col);
    if(kind === 'tulip') return headTulip(col);
    if(kind === 'lotus') return headLotus(col);
    if(kind === 'bell') return headBell(col);
    if(kind === 'cherry') return headCherry(col);
    return headDaisy(col);
  }

  // Single decorative bloom on a stem (for biomes / accents).
  window.mkPerfectBloom = function(kind, col, sc){
    sc = sc == null ? 1 : sc;
    var g = new THREE.Group();
    var hh = 0.32 + (typeof kind === 'string' && kind === 'tulip' ? 0.08 : 0);
    _shareDecorMats = true;
    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, hh, 6),
      softMat(0x2f8a42, { roughness: 0.9, keep: true })
    );
    stem.position.y = hh * 0.5;
    g.add(stem);
    var leaf = new THREE.Mesh(makeLeafGeo(), softMat(0x1f6b34, { roughness: 0.8, keep: true }));
    leaf.position.set(0.04, hh * 0.45, 0);
    leaf.rotation.set(0.2, 0.4, 0.85);
    leaf.scale.setScalar(0.55);
    g.add(leaf);
    var head = buildHead(kind, col);
    _shareDecorMats = false;
    head.position.y = hh;
    head.scale.setScalar(0.55 * sc);
    g.add(head);
    g.userData.head = head;
    g.userData.by = head.position.y;
    return g;
  };

  var WILD_KINDS = ['daisy', 'rose', 'tulip', 'cherry', 'peony', 'sunflower', 'lotus'];
  var WILD_COLS = [0xff5a9a, 0xffd056, 0x9b7efa, 0x5ecfff, 0xff8c42, 0xffffff, 0xff6b6b, 0xffb7c5, 0x66ddaa, 0xff3366];

  // Dense wild flower patch — replaces Quaternius flower clusters.
  window.buildPerfectWild = function(x, z){
    var g = new THREE.Group();
    g.userData.heads = [];
    var seed = ((x * 97 + z * 53) * 1000) | 0;
    var r = function(){
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    var n = (typeof isMobile !== 'undefined' && isMobile) ? 6 : 9;
    for(var i = 0; i < n; i++){
      var kind = WILD_KINDS[Math.floor(r() * WILD_KINDS.length)];
      var col = WILD_COLS[Math.floor(r() * WILD_COLS.length)];
      var bloom = window.mkPerfectBloom(kind, col, 0.75 + r() * 0.45);
      bloom.position.set((r() - 0.5) * 0.75, 0, (r() - 0.5) * 0.75);
      bloom.rotation.y = r() * Math.PI * 2;
      bloom.userData.by = bloom.position.y;
      if(bloom.userData.head) bloom.userData.head.userData.by = bloom.userData.head.position.y;
      g.add(bloom);
      g.userData.heads.push(bloom);
    }
    // Tiny grass tufts between stems
    for(var j = 0; j < 4; j++){
      var blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.18 + r() * 0.1, 4),
        softMat(0x4cb85a, { roughness: 0.92, keep: true })
      );
      blade.position.set((r() - 0.5) * 0.6, 0.1, (r() - 0.5) * 0.6);
      blade.rotation.z = (r() - 0.5) * 0.35;
      g.add(blade);
    }
    if(typeof sitShadow === 'function') g.add(sitShadow(0.48));
    g.position.set(x, 0, z);
    return g;
  };

  window._flowerArt = {
    buildHead: buildHead,
    makePetalGeo: makePetalGeo,
    softMat: softMat,
    kinds: WILD_KINDS,
    cols: WILD_COLS
  };

  // Override flower.js builders once they exist.
  function installPlayerHooks(){
    if(typeof bldHead !== 'function') return false;
    headRose = function(c){ return buildHead('rose', c); };
    headTulip = function(c){ return buildHead('tulip', c); };
    headLotus = function(c){ return buildHead('lotus', c); };
    headBell = function(c){ return buildHead('bell', c); };
    headCherry = function(c){ return buildHead('cherry', c); };
    bldHead = function(tp, col){
      if(tp === 'tulip') return buildHead('tulip', col);
      if(tp === 'lotus') return buildHead('lotus', col);
      if(tp === 'bell') return buildHead('bell', col);
      if(tp === 'cherry') return buildHead('cherry', col);
      if(tp === 0 || tp === 'rose') return buildHead('rose', col);
      if(tp === 1) return buildHead('daisy', col);
      if(tp === 2 || tp === 'sunflower') return buildHead('sunflower', col);
      return buildHead('peony', col);
    };
    petalGeo = function(w, h, curl){ return makePetalGeo(w, h, curl); };
    petalMat = function(col, glow){
      var opts = { roughness: 0.4 };
      if(glow){ opts.emissive = col; opts.eInt = glow; }
      return softMat(col, opts);
    };
    return true;
  }
  if(!installPlayerHooks()) setTimeout(installPlayerHooks, 0);
})();

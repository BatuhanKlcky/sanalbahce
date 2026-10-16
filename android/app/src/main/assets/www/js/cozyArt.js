// Cozyrama-inspired stylized 3D props (procedural toy/diorama look).
(function(){
  function cMat(hex, rough, emissive, eInt){
    if(!cMat.cache) cMat.cache = {};
    var key = hex+':'+rough+':'+(emissive||0)+':'+(eInt||0);
    if(!cMat.cache[key]){
      var o = { color:hex, roughness:rough==null?.78:rough, metalness:0 };
      if(emissive!=null){ o.emissive = emissive; o.emissiveIntensity = eInt==null?.35:eInt; }
      var m = new THREE.MeshStandardMaterial(o);
      m.userData.keep = true;
      cMat.cache[key] = m;
    }
    return cMat.cache[key];
  }
  function puff(g, x, y, z, rx, ry, rz, mat){
    var m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), mat);
    m.scale.set(rx, ry, rz);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  function roundBox(w, h, d, mat){
    // Soft box via scaled sphere + slight flatten — toy look.
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 2, 2, 2), mat);
    return m;
  }

  // ── TREE: candy canopy layers ─────────────────────────────────────────────
  buildTree = function(x, z){
    var g = new THREE.Group();
    g.userData.leaves = [];
    var rnd = gardenRand(x + 3.1, z + 1.7);
    var greens = [0x7ecf6a, 0x5bb86a, 0x8fd96a, 0x49a85a, 0xa8e86a];
    var trunkM = cMat(0xc4895a, .92);
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 1.45, 12), trunkM);
    trunk.position.y = .72;
    g.add(trunk);
    var base = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 10), trunkM);
    base.scale.set(1.4, .48, 1.4);
    base.position.y = .14;
    g.add(base);
    var h = 1.65 + rnd() * .4;
    [[0, h, 0, 1.25],[.6, h-.28, .22, .9],[-.55, h-.22, -.28, .86],[.18, h+.42, -.18, .78],[-.24, h+.2, .48, .74],[.4, h-.55, -.45, .7],[-.42, h-.48, .35, .66]].forEach(function(p, i){
      var leaf = puff(g, p[0], p[1], p[2], p[3], p[3]*0.82, p[3], cMat(greens[i%greens.length], .84));
      leaf.userData.rx = 0; leaf.userData.rz = 0; leaf.userData.by = p[1];
      g.userData.leaves.push(leaf);
    });
    for(var i = 0; i < 8; i++){
      var a = rnd()*Math.PI*2;
      var berry = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), cMat([0xff7a8a,0xffd166,0xff9ecd,0xffb347][i%4], .5, [0xff7a8a,0xffd166,0xff9ecd,0xffb347][i%4], .28));
      berry.position.set(Math.cos(a)*.75, h-.15+rnd()*.5, Math.sin(a)*.75);
      g.add(berry);
    }
    g.add(sitShadow(1.25));
    g.position.set(x, 0, z);
    g.rotation.y = rnd()*Math.PI*2;
    return g;
  };

  // ── BUSH: fluffy pastel mound ─────────────────────────────────────────────
  buildBush = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x + 8, z + 2);
    var cols = [0x8ed97a, 0x6ecf7a, 0xa8e686];
    [[0,.38,0,.95],[.38,.32,.1,.7],[-.34,.3,-.12,.68],[.08,.52,-.28,.55],[-.15,.48,.3,.52]].forEach(function(p,i){
      puff(g, p[0], p[1], p[2], p[3], p[3]*0.78, p[3], cMat(cols[i%cols.length], .88));
    });
    for(var i = 0; i < 6; i++){
      var blossom = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), cMat([0xffb3c7,0xfff1a8,0xffd6e8,0xffffff][i%4], .5, 0xffd0e0, .15));
      blossom.position.set((rnd()-.5)*.9, .45+rnd()*.35, (rnd()-.5)*.85);
      g.add(blossom);
    }
    g.add(sitShadow(.85));
    g.position.set(x, 0, z);
    g.rotation.y = rnd()*Math.PI*2;
    return g;
  };

  // ── STONE: smooth river pebbles ───────────────────────────────────────────
  buildStone = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x + 1, z + 9);
    var cols = [0xb8b0a6, 0x9a948c, 0xc9c2b8, 0x8a847c];
    var n = 3 + Math.floor(rnd()*2);
    for(var i = 0; i < n; i++){
      var s = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), cMat(cols[i%cols.length], .95));
      s.scale.set(.7+rnd()*.7, .35+rnd()*.35, .65+rnd()*.6);
      s.position.set((rnd()-.5)*.45, s.scale.y*.22, (rnd()-.5)*.4);
      s.rotation.y = rnd()*Math.PI;
      g.add(s);
    }
    g.add(sitShadow(.55));
    g.position.set(x, 0, z);
    return g;
  };

  // ── MUSHROOM: toadstool cluster ───────────────────────────────────────────
  buildMushroom = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x+4, z+4);
    function one(ox, oz, sc, capCol){
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(.05*sc, .07*sc, .28*sc, 10), cMat(0xfff6e8, .75));
      stem.position.set(ox, .14*sc, oz);
      g.add(stem);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(.22*sc, 16, 12), cMat(capCol, .55, capCol, .18));
      cap.scale.set(1, .55, 1);
      cap.position.set(ox, .32*sc, oz);
      cap.userData.by = cap.position.y;
      if(!g.userData.caps) g.userData.caps = [];
      g.userData.caps.push(cap);
      g.add(cap);
      for(var k = 0; k < 5; k++){
        var a = (k/5)*Math.PI*2;
        var spot = new THREE.Mesh(new THREE.SphereGeometry(.035*sc, 6, 5), cMat(0xfffaf0, .4));
        spot.scale.y = .4;
        spot.position.set(Math.cos(a)*.12*sc, .05*sc, Math.sin(a)*.12*sc);
        cap.add(spot);
      }
    }
    one(0, 0, 1.25, 0xff5a6a);
    one(.28, .12, .7, 0xff8a3a);
    one(-.22, .16, .55, 0xff6b8a);
    g.add(sitShadow(.48));
    g.position.set(x, 0, z);
    g.rotation.y = rnd()*Math.PI*2;
    return g;
  };

  // ── FENCE: cute picket ────────────────────────────────────────────────────
  buildFence = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe8c89a, .85);
    var dark = cMat(0xc9a06e, .88);
    [-.55, .55].forEach(function(px){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .055, .95, 8), dark);
      post.position.set(px, .48, 0);
      g.add(post);
      var ball = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), cMat(0xffd9a0, .6));
      ball.position.set(px, .98, 0);
      g.add(ball);
    });
    [.38, .68].forEach(function(py){
      var rail = new THREE.Mesh(new THREE.BoxGeometry(1.15, .05, .05), wood);
      rail.position.y = py;
      g.add(rail);
    });
    for(var i = 0; i < 5; i++){
      var px = -.46 + i * .23;
      var pick = new THREE.Mesh(new THREE.BoxGeometry(.07, .72, .04), wood);
      pick.position.set(px, .48, .02);
      g.add(pick);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), wood);
      tip.position.set(px, .88, .02);
      g.add(tip);
    }
    g.add(sitShadow(.65));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── BENCH: chunky park bench ──────────────────────────────────────────────
  buildBench = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe0b07a, .82);
    var iron = cMat(0x5a6a7a, .45);
    [[-.5,-.18],[.5,-.18],[-.5,.18],[.5,.18]].forEach(function(p){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .38, 8), iron);
      leg.position.set(p[0], .19, p[1]);
      g.add(leg);
    });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, .08, .42), wood);
    seat.position.y = .42;
    g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.2, .38, .07), wood);
    back.position.set(0, .68, -.18);
    g.add(back);
    // soft cushion
    var cush = new THREE.Mesh(new THREE.BoxGeometry(1.05, .06, .32), cMat(0xffb4c8, .75, 0xffb4c8, .08));
    cush.position.set(0, .48, .02);
    g.add(cush);
    g.add(sitShadow(.7));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── LANTERN: glowing paper lantern ────────────────────────────────────────
  buildLantern = function(x, z){
    var g = new THREE.Group();
    var poleM = cMat(0x8b6a4a, .85);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, 1.4, 8), poleM);
    pole.position.y = .7;
    g.add(pole);
    var paper = new THREE.Mesh(
      new THREE.SphereGeometry(.28, 16, 14),
      new THREE.MeshStandardMaterial({ color:0xffc878, emissive:0xff9944, emissiveIntensity:1.1, roughness:.45, transparent:true, opacity:.92 })
    );
    paper.scale.set(.85, 1.05, .85);
    paper.position.y = 1.65;
    g.add(paper);
    g.userData.flame = paper;
    var top = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, .1, 12), cMat(0x5a3a28, .7));
    top.position.y = 1.95;
    g.add(top);
    var bot = new THREE.Mesh(new THREE.CylinderGeometry(.2, .12, .08, 12), cMat(0x5a3a28, .7));
    bot.position.y = 1.38;
    g.add(bot);
    var tass = new THREE.Mesh(new THREE.ConeGeometry(.04, .18, 6), cMat(0xff6b6b, .6));
    tass.position.y = 1.22;
    g.add(tass);
    var lt = new THREE.PointLight(0xffb060, 1.45, 6);
    lt.position.y = 1.65;
    g.add(lt);
    g.add(sitShadow(.3));
    g.position.set(x, 0, z);
    return { group:g, light:lt };
  };

  // ── POT: ceramic planter ──────────────────────────────────────────────────
  buildPot = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x+7, z+1);
    var clay = cMat([0xf0a070,0xe87a6a,0xd4a574][Math.floor(rnd()*3)], .8);
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .16, .36, 14), clay);
    pot.position.y = .18;
    g.add(pot);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(.24, .035, 8, 16), clay);
    rim.rotation.x = Math.PI/2;
    rim.position.y = .36;
    g.add(rim);
    var soil = new THREE.Mesh(new THREE.CircleGeometry(.2, 12), cMat(0x4a3220, 1));
    soil.rotation.x = -Math.PI/2;
    soil.position.y = .35;
    g.add(soil);
    // chubby flower
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(.02, .025, .32, 6), cMat(0x3d9a4a, .85));
    stem.position.y = .52;
    g.add(stem);
    var col = [0xff6b9d, 0xffd166, 0x9b7efa, 0xff8c42][Math.floor(rnd()*4)];
    for(var k = 0; k < 7; k++){
      var petal = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), cMat(col, .55, col, .2));
      petal.scale.set(1, .45, .7);
      petal.position.set(Math.sin(k/7*Math.PI*2)*.1, .72, Math.cos(k/7*Math.PI*2)*.1);
      petal.lookAt(0, .72, 0);
      g.add(petal);
    }
    var center = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), cMat(0xfff3a0, .5, 0xffe066, .3));
    center.position.y = .72;
    g.add(center);
    g.add(sitShadow(.3));
    g.position.set(x, 0, z);
    return g;
  };

  // ── POND: soft oval oasis ─────────────────────────────────────────────────
  buildPond = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x+2, z+6);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .14, 8, 28), cMat(0xc4b49a, .95));
    ring.rotation.x = Math.PI/2;
    ring.position.y = .04;
    ring.scale.set(1.25, 1, .85);
    g.add(ring);
    var bed = new THREE.Mesh(new THREE.CircleGeometry(1.55, 28), cMat(0x3d6a5c, 1));
    bed.rotation.x = -Math.PI/2;
    bed.position.y = .015;
    bed.scale.set(1.25, 1, .85);
    g.add(bed);
    var w = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), window._waterMat);
    w.rotation.x = -Math.PI/2;
    w.position.y = .04;
    w.scale.set(1.25, 1, .85);
    g.add(w);
    // lily pads
    for(var i = 0; i < 5; i++){
      var a = rnd()*Math.PI*2;
      var pad = new THREE.Mesh(new THREE.CircleGeometry(.22+rnd()*.1, 12), cMat(0x5ecf7a, .8));
      pad.rotation.x = -Math.PI/2;
      pad.position.set(Math.cos(a)*(.5+rnd()*.7), .055, Math.sin(a)*(.4+rnd()*.5));
      g.add(pad);
      if(rnd()>.45){
        var lily = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), cMat(0xff9ec8, .5, 0xff9ec8, .25));
        lily.scale.set(1, .4, 1);
        lily.position.copy(pad.position);
        lily.position.y = .08;
        g.add(lily);
      }
    }
    var lt = new THREE.PointLight(0x88e0d0, .35, 4);
    lt.position.set(0, .4, 0);
    g.add(lt);
    g.add(sitShadow(1.6));
    g.position.set(x, 0, z);
    return { group:g, light:lt };
  };

  // ── WELL: storybook stone well ────────────────────────────────────────────
  buildWell = function(x, z){
    var g = new THREE.Group();
    var stone = cMat(0xb0a89c, .92);
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, .7, 16, 1, true), stone);
    wall.position.y = .35;
    g.add(wall);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(.58, .08, 8, 20), cMat(0xc8c0b4, .9));
    rim.rotation.x = Math.PI/2;
    rim.position.y = .72;
    g.add(rim);
    var water = new THREE.Mesh(new THREE.CircleGeometry(.48, 16), window._waterMat);
    water.rotation.x = -Math.PI/2;
    water.position.y = .4;
    g.add(water);
    var postL = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.1, 8), cMat(0xd4a574, .85));
    postL.position.set(-.45, 1.15, 0);
    g.add(postL);
    var postR = postL.clone();
    postR.position.x = .45;
    g.add(postR);
    var beam = new THREE.Mesh(new THREE.BoxGeometry(1.1, .08, .08), cMat(0xc4895a, .85));
    beam.position.y = 1.7;
    g.add(beam);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(.7, .35, 4), cMat(0xff8a6a, .7));
    roof.position.y = 1.95;
    roof.rotation.y = Math.PI/4;
    g.add(roof);
    var bucket = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .14, 10), cMat(0xe8a060, .8));
    bucket.position.set(0, 1.35, 0);
    g.add(bucket);
    g.add(sitShadow(.85));
    g.position.set(x, 0, z);
    return g;
  };

  // ── HOUSE: storybook cottage ──────────────────────────────────────────────
  buildHouse = function(x, z, angle){
    var g = new THREE.Group();
    var plaster = cMat(0xfff1e4, .88);
    var roofM = cMat(0xff7a6a, .72);
    var wood = cMat(0xd4a06a, .85);
    var found = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.0, .22, 20), cMat(0xc4b8a8, .95));
    found.scale.set(1.15, 1, 1);
    found.position.y = .1;
    g.add(found);
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.55, 2.2, 2, 2, 2), plaster);
    body.position.y = 1.0;
    g.add(body);
    // soft round roof (half-sphere squashed)
    var roof = new THREE.Mesh(new THREE.SphereGeometry(1.85, 20, 12, 0, Math.PI*2, 0, Math.PI/2), roofM);
    roof.scale.set(1.05, .72, .95);
    roof.position.y = 1.72;
    g.add(roof);
    var chimney = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .55, 8), cMat(0xc4a090, .9));
    chimney.position.set(.7, 2.55, -.3);
    g.add(chimney);
    var smoke = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), cMat(0xffffff, .9));
    smoke.scale.set(1, .6, 1);
    smoke.position.set(.7, 2.95, -.3);
    smoke.material.transparent = true;
    smoke.material.opacity = .55;
    g.add(smoke);
    var door = new THREE.Mesh(new THREE.BoxGeometry(.45, .85, .06), wood);
    door.position.set(0, .58, 1.12);
    g.add(door);
    var arch = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 8, 0, Math.PI*2, 0, Math.PI/2), wood);
    arch.scale.set(1, .55, .2);
    arch.position.set(0, 1.05, 1.12);
    g.add(arch);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), cMat(0xffd866, .35, 0xffd866, .4));
    knob.position.set(.14, .55, 1.16);
    g.add(knob);
    var glass = new THREE.MeshStandardMaterial({ color:0xa8e0ff, emissive:0x88c8e8, emissiveIntensity:.45, transparent:true, opacity:.75, roughness:.2 });
    glass.userData.keep = true;
    [[-.85, 1.05],[.85, 1.05]].forEach(function(p){
      var frame = new THREE.Mesh(new THREE.BoxGeometry(.5, .45, .08), cMat(0xfffaf4, .7));
      frame.position.set(p[0], p[1], 1.12);
      g.add(frame);
      var win = new THREE.Mesh(new THREE.BoxGeometry(.36, .32, .04), glass);
      win.position.set(p[0], p[1], 1.15);
      g.add(win);
      // flower box
      var box = new THREE.Mesh(new THREE.BoxGeometry(.55, .1, .16), cMat(0xe8a060, .85));
      box.position.set(p[0], .78, 1.22);
      g.add(box);
      for(var f = 0; f < 3; f++){
        var fl = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), cMat([0xff7aad,0xffd166,0xb28dff][f], .5, 0xffa0c8, .2));
        fl.position.set(p[0]-.12+f*.12, .9, 1.22);
        g.add(fl);
      }
    });
    var lt = new THREE.PointLight(0xffe0a8, .95, 4);
    lt.position.set(0, 1.1, .3);
    g.add(lt);
    g.add(sitShadow(1.85));
    g.position.set(x, 0, z);
    g.rotation.y = angle || 0;
    return { group:g, light:lt };
  };

  // ── TABLE: picnic table ───────────────────────────────────────────────────
  buildTable = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe8c49a, .84);
    var top = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .07, 16), wood);
    top.position.y = .52;
    g.add(top);
    var cloth = new THREE.Mesh(new THREE.CircleGeometry(.5, 16), cMat(0xffe0f0, .75));
    cloth.rotation.x = -Math.PI/2;
    cloth.position.y = .56;
    g.add(cloth);
    for(var i = 0; i < 3; i++){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .5, 8), cMat(0xc49a6a, .88));
      var ang = (i/3)*Math.PI*2;
      leg.position.set(Math.cos(ang)*.28, .25, Math.sin(ang)*.28);
      g.add(leg);
    }
    // tiny teapot
    var pot = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), cMat(0x7ec8ff, .55, 0x7ec8ff, .15));
    pot.position.set(.1, .66, 0);
    g.add(pot);
    g.add(sitShadow(.6));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── WINDMILL: toy mill ────────────────────────────────────────────────────
  buildWindmill = function(x, z){
    var g = new THREE.Group();
    var tower = new THREE.Mesh(new THREE.CylinderGeometry(.35, .55, 2.2, 12), cMat(0xfff0e0, .88));
    tower.position.y = 1.1;
    g.add(tower);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(.55, .55, 8), cMat(0xff7a6a, .7));
    roof.position.y = 2.45;
    g.add(roof);
    var hub = new THREE.Group();
    hub.position.set(0, 1.85, .45);
    g.add(hub);
    for(var i = 0; i < 4; i++){
      var blade = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.15, .04), cMat(0xffe0a0, .75));
      blade.position.y = .55;
      var arm = new THREE.Group();
      arm.rotation.z = (i/4)*Math.PI*2;
      arm.add(blade);
      hub.add(arm);
    }
    var door = new THREE.Mesh(new THREE.BoxGeometry(.28, .45, .06), cMat(0xd4a06a, .85));
    door.position.set(0, .35, .52);
    g.add(door);
    g.add(sitShadow(.9));
    g.position.set(x, 0, z);
    return { group:g, blades:hub };
  };

  // ── SCARECROW: cute friend ────────────────────────────────────────────────
  buildScarecrow = function(x, z){
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.5, 8), cMat(0xc4895a, .9));
    pole.position.y = .75;
    g.add(pole);
    var body = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 12), cMat(0xffb347, .75));
    body.scale.set(1, 1.15, .7);
    body.position.y = 1.15;
    g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 12), cMat(0xffe0b0, .7));
    head.position.y = 1.55;
    g.add(head);
    var hat = new THREE.Mesh(new THREE.CylinderGeometry(.08, .28, .12, 12), cMat(0x5a3a28, .8));
    hat.position.y = 1.72;
    g.add(hat);
    [-1,1].forEach(function(s){
      var eye = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), cMat(0x2a2018, .5));
      eye.position.set(s*.07, 1.58, .16);
      g.add(eye);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 6), cMat(0xd4a06a, .85));
      arm.rotation.z = s * 1.1;
      arm.position.set(s*.35, 1.25, 0);
      g.add(arm);
    });
    var smile = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 6, 10, Math.PI), cMat(0xff6b8a, .6));
    smile.position.set(0, 1.48, .17);
    smile.rotation.x = Math.PI;
    g.add(smile);
    g.add(sitShadow(.4));
    g.position.set(x, 0, z);
    return g;
  };

  // ── ARCH: flower gate ─────────────────────────────────────────────────────
  buildArch = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe8c89a, .85);
    [-.7, .7].forEach(function(px){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 1.8, 10), wood);
      post.position.set(px, .9, 0);
      g.add(post);
    });
    var beam = new THREE.Mesh(new THREE.TorusGeometry(.75, .07, 8, 20, Math.PI), wood);
    beam.rotation.z = Math.PI;
    beam.position.y = 1.75;
    g.add(beam);
    for(var i = 0; i < 14; i++){
      var t = i/13;
      var ang = -Math.PI/2 + t*Math.PI;
      var fl = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), cMat([0xff7aad,0xffd166,0xb79bff,0x7ecfff,0xffffff][i%5], .5, 0xffa0c8, .22));
      fl.position.set(Math.cos(ang)*.75, 1.75+Math.sin(ang)*.75, (i%2)*.08);
      g.add(fl);
    }
    g.add(sitShadow(1.0));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── PERGOLA: vine canopy ──────────────────────────────────────────────────
  buildPergola = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe0b07a, .86);
    [[-1,-.8],[1,-.8],[-1,.8],[1,.8]].forEach(function(p){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 1.6, 8), wood);
      post.position.set(p[0], .8, p[1]);
      g.add(post);
    });
    for(var i = 0; i < 5; i++){
      var beam = new THREE.Mesh(new THREE.BoxGeometry(2.2, .06, .08), wood);
      beam.position.set(0, 1.62, -0.8 + i*.4);
      g.add(beam);
    }
    for(var j = 0; j < 18; j++){
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), cMat([0x6ecf7a,0x8ed97a,0x5bb86a][j%3], .85));
      leaf.scale.set(1, .45, 1);
      leaf.position.set((Math.random()-.5)*2, 1.7+Math.random()*.15, (Math.random()-.5)*1.5);
      g.add(leaf);
      if(j%3===0){
        var grape = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), cMat(0xb28dff, .55, 0xb28dff, .2));
        grape.position.copy(leaf.position);
        grape.position.y -= .15;
        g.add(grape);
      }
    }
    g.add(sitShadow(1.3));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── BRIDGE: arched footbridge ─────────────────────────────────────────────
  buildBridge = function(x, z, a){
    var g = new THREE.Group();
    var wood = cMat(0xe8c49a, .84);
    for(var i = 0; i < 7; i++){
      var t = (i/6)*2 - 1;
      var plank = new THREE.Mesh(new THREE.BoxGeometry(.95, .06, .28), wood);
      plank.position.set(0, .2 + (1-t*t)*.45, t*1.05);
      plank.rotation.x = t * -.35;
      g.add(plank);
    }
    [-.42, .42].forEach(function(sx){
      for(var k = 0; k < 5; k++){
        var t2 = (k/4)*2 - 1;
        var post = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .35, 6), cMat(0xc49a6a, .88));
        post.position.set(sx, .35+(1-t2*t2)*.4, t2*1.0);
        g.add(post);
      }
      var rail = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.2, 6), wood);
      rail.rotation.x = Math.PI/2;
      rail.position.set(sx, .55, 0);
      g.add(rail);
    });
    g.add(sitShadow(1.1));
    g.position.set(x, 0, z);
    g.rotation.y = a || 0;
    return g;
  };

  // ── WILD: flower cluster ──────────────────────────────────────────────────
  buildWild = function(x, z){
    var g = new THREE.Group();
    g.userData.heads = [];
    var rnd = gardenRand(x+5, z+3);
    var cols = [0xff6b9d, 0xffd166, 0x9b7efa, 0x7ecfff, 0xff8c42, 0xffffff];
    for(var i = 0; i < 7; i++){
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(.015, .02, .35+rnd()*.25, 5), cMat(0x3d9a4a, .88));
      var ox = (rnd()-.5)*.55, oz = (rnd()-.5)*.55;
      stem.position.set(ox, .2, oz);
      g.add(stem);
      var head = new THREE.Group();
      head.position.set(ox, .42+rnd()*.15, oz);
      head.userData.by = head.position.y;
      var col = cols[Math.floor(rnd()*cols.length)];
      for(var k = 0; k < 6; k++){
        var p = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), cMat(col, .5, col, .22));
        p.scale.set(1, .4, .7);
        p.position.set(Math.sin(k/6*Math.PI*2)*.07, 0, Math.cos(k/6*Math.PI*2)*.07);
        head.add(p);
      }
      var c = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), cMat(0xfff3a0, .45, 0xffe066, .3));
      head.add(c);
      g.add(head);
      g.userData.heads.push(head);
    }
    g.add(sitShadow(.45));
    g.position.set(x, 0, z);
    return g;
  };

  // Soften sit shadow for cozy look
  if(typeof sitShadow === 'function'){
    var _sit = sitShadow;
    sitShadow = function(r){
      var m = _sit(r);
      if(m && m.material){ m.material.opacity = .18; m.material.color.setHex(0x4a3828); }
      return m;
    };
  }
})();

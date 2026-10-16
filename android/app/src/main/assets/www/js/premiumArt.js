// Higher-craft procedural props — silhouette, material, micro-detail.
(function(){
  function texNoise(size, paint){
    var c = document.createElement('canvas'); c.width = c.height = size;
    paint(c.getContext('2d'), size);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function mat(opts){
    var m = new THREE.MeshStandardMaterial(opts);
    m.userData.keep = true;
    return m;
  }
  function barkTex(){
    if(barkTex.t) return barkTex.t;
    barkTex.t = texNoise(128, function(g, s){
      g.fillStyle = '#7a4e32'; g.fillRect(0,0,s,s);
      for(var i=0;i<80;i++){
        g.strokeStyle = 'rgba(40,20,10,'+(0.15+Math.random()*0.35)+')';
        g.lineWidth = 1+Math.random()*2;
        var x = Math.random()*s;
        g.beginPath(); g.moveTo(x,0); g.lineTo(x+(Math.random()-0.5)*8,s); g.stroke();
      }
      for(var j=0;j<120;j++){
        g.fillStyle = 'rgba(160,110,70,'+(Math.random()*0.2)+')';
        g.fillRect(Math.random()*s, Math.random()*s, 2, 3);
      }
    });
    barkTex.t.repeat.set(1, 2);
    return barkTex.t;
  }
  function leafMat(hex){
    return mat({ color:hex, roughness:.72, metalness:0, flatShading:false });
  }
  function latheCanopy(r, h, col){
    var pts = [];
    for(var i=0;i<=10;i++){
      var t = i/10;
      var rr = Math.sin(t*Math.PI) * r * (0.75 + 0.25*Math.sin(t*4));
      pts.push(new THREE.Vector2(Math.max(0.02, rr), t*h));
    }
    return new THREE.Mesh(new THREE.LatheGeometry(pts, 20), leafMat(col));
  }
  function addContact(g, r){
    var sh = new THREE.Mesh(
      new THREE.CircleGeometry(r, 20),
      mat({ color:0x2a1c12, transparent:true, opacity:.22, depthWrite:false })
    );
    sh.rotation.x = -Math.PI/2;
    sh.position.y = .015;
    g.add(sh);
  }

  // ── TREE ──────────────────────────────────────────────────────────────────
  buildTree = function(x, z){
    var g = new THREE.Group();
    g.userData.leaves = [];
    var rnd = gardenRand(x+2.2, z+4.1);
    var barkM = mat({ map:barkTex(), color:0xffffff, roughness:.94 });
    // Flared trunk via lathe
    var trunkPts = [];
    for(var i=0;i<=12;i++){
      var t=i/12;
      var rr = 0.18*(1-t*0.55) + (t<0.12?0.14*(1-t/0.12):0);
      trunkPts.push(new THREE.Vector2(rr, t*1.7));
    }
    var trunk = new THREE.Mesh(new THREE.LatheGeometry(trunkPts, 16), barkM);
    g.add(trunk);
    // Roots
    for(var r=0;r<5;r++){
      var a = r/5*Math.PI*2 + rnd();
      var root = new THREE.Mesh(new THREE.CylinderGeometry(.035,.08,.32,8), barkM);
      root.position.set(Math.cos(a)*.22, .1, Math.sin(a)*.22);
      root.rotation.z = Math.cos(a)*.9;
      root.rotation.x = Math.sin(a)*.9;
      g.add(root);
    }
    var greens = [0x5fbf62, 0x79d16a, 0x3fa85a, 0x92e070, 0x4cb87a];
    var layers = [
      {y:1.55, r:1.05, h:.95, c:0},
      {y:2.05, r:.82, h:.75, c:1},
      {y:2.45, r:.58, h:.55, c:2},
      {y:1.75, r:.55, h:.5, c:3, x:.55, z:.2},
      {y:1.85, r:.5, h:.48, c:4, x:-.5, z:-.25}
    ];
    layers.forEach(function(L, idx){
      var canopy = latheCanopy(L.r, L.h, greens[L.c%greens.length]);
      canopy.position.set(L.x||0, L.y, L.z||0);
      canopy.userData.by = L.y;
      canopy.userData.rx = 0; canopy.userData.rz = 0;
      // subtle color variation
      canopy.material = canopy.material.clone();
      canopy.material.userData.keep = true;
      canopy.material.color.offsetHSL((rnd()-0.5)*.04, 0.05, (rnd()-0.5)*.06);
      g.add(canopy);
      g.userData.leaves.push(canopy);
    });
    // hanging blossoms
    for(var b=0;b<10;b++){
      var ba = rnd()*Math.PI*2;
      var blossom = new THREE.Mesh(
        new THREE.SphereGeometry(.07, 10, 8),
        mat({ color:[0xff7eb0,0xffd56a,0xff9ecd,0xffffff][b%4], roughness:.45, emissive:[0xff7eb0,0xffd56a,0xff9ecd,0xffffff][b%4], emissiveIntensity:.25 })
      );
      blossom.position.set(Math.cos(ba)*.7, 1.9+rnd()*.6, Math.sin(ba)*.7);
      g.add(blossom);
      for(var p=0;p<5;p++){
        var petal = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), blossom.material);
        petal.scale.set(1.2, .35, .7);
        petal.position.set(Math.sin(p/5*6.28)*.08, 0, Math.cos(p/5*6.28)*.08);
        blossom.add(petal);
      }
    }
    addContact(g, 1.15);
    g.position.set(x,0,z);
    g.rotation.y = rnd()*Math.PI*2;
    return g;
  };

  // ── BUSH ──────────────────────────────────────────────────────────────────
  buildBush = function(x, z){
    var g = new THREE.Group();
    g.userData.leaves = [];
    g.userData.heads = [];
    var rnd = gardenRand(x+9, z+1);
    [[0,.42,0,1.05],[.4,.36,.15,.78],[-.38,.34,-.12,.74],[.12,.58,-.3,.6],[-.2,.55,.32,.58],[.35,.5,.35,.5]].forEach(function(p,i){
      var m = latheCanopy(p[3]*0.55, p[3]*0.7, [0x6edc78,0x8ae68a,0x55c96a][i%3]);
      m.position.set(p[0], p[1]-.15, p[2]);
      m.userData.by = m.position.y;
      m.userData.rx=0; m.userData.rz=0;
      g.add(m); g.userData.leaves.push(m);
    });
    for(var i=0;i<9;i++){
      var head = new THREE.Group();
      head.position.set((rnd()-.5)*1.0, .55+rnd()*.35, (rnd()-.5)*.9);
      head.userData.by = head.position.y;
      var col = [0xff6b9d,0xffd166,0xb79bff,0xffffff,0xff8c42][Math.floor(rnd()*5)];
      var cm = mat({ color:col, roughness:.48, emissive:col, emissiveIntensity:.28 });
      for(var k=0;k<7;k++){
        var petal = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), cm);
        petal.scale.set(1.15, .32, .75);
        petal.position.set(Math.sin(k/7*6.28)*.09, 0, Math.cos(k/7*6.28)*.09);
        head.add(petal);
      }
      head.add(new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), mat({ color:0xfff2a0, emissive:0xffe066, emissiveIntensity:.4, roughness:.4 })));
      g.add(head); g.userData.heads.push(head);
    }
    addContact(g, .9);
    g.position.set(x,0,z);
    g.rotation.y = rnd()*Math.PI*2;
    return g;
  };

  // ── HOUSE ─────────────────────────────────────────────────────────────────
  buildHouse = function(x, z, angle){
    var g = new THREE.Group();
    var plaster = mat({ color:0xfff6ec, roughness:.82 });
    var timber = mat({ color:0xc4895a, roughness:.88 });
    var roofM = mat({ color:0xe85d5d, roughness:.68, emissive:0x802020, emissiveIntensity:.05 });
    // Stone foundation
    var found = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, .28, 24), mat({ color:0xb8aea0, roughness:.95 }));
    found.scale.set(1.2, 1, 1.05);
    found.position.y = .14;
    g.add(found);
    // Soft body
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.65, 2.3), plaster);
    body.position.y = 1.05;
    g.add(body);
    // Timber frame accents
    [[-1.35,0],[1.35,0],[0,-1.15],[0,1.15]].forEach(function(p, i){
      var beam = new THREE.Mesh(new THREE.BoxGeometry(i<2?.1:2.7, 1.65, i<2?2.3:.1), timber);
      beam.position.set(p[0], 1.05, p[1]);
      if(i>=2) beam.position.z = p[1] > 0 ? 1.15 : -1.15;
      if(i<2) beam.position.x = p[0];
      g.add(beam);
    });
    // Domed roof
    var roof = new THREE.Mesh(new THREE.SphereGeometry(1.95, 28, 16, 0, Math.PI*2, 0, Math.PI/2), roofM);
    roof.scale.set(1.08, .78, .98);
    roof.position.y = 1.78;
    g.add(roof);
    // Roof tiles hint — rings
    for(var ti=0;ti<4;ti++){
      var ring = new THREE.Mesh(new THREE.TorusGeometry(1.1+ti*.2, .03, 6, 28), mat({ color:0xd44a4a, roughness:.7 }));
      ring.rotation.x = Math.PI/2;
      ring.position.y = 2.05 + ti*.12;
      ring.scale.set(1.05, .95, 1);
      g.add(ring);
    }
    var chim = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .7, 10), mat({ color:0xc4a898, roughness:.9 }));
    chim.position.set(.75, 2.7, -.35);
    g.add(chim);
    // Glowing windows
    var glass = mat({ color:0xb8ecff, emissive:0xffd28a, emissiveIntensity:.85, roughness:.15, transparent:true, opacity:.9 });
    [[-.9,1.1],[.9,1.1]].forEach(function(p){
      var frame = new THREE.Mesh(new THREE.BoxGeometry(.55, .5, .1), mat({ color:0xfffaf5, roughness:.7 }));
      frame.position.set(p[0], p[1], 1.16);
      g.add(frame);
      var win = new THREE.Mesh(new THREE.BoxGeometry(.4, .36, .05), glass);
      win.position.set(p[0], p[1], 1.2);
      g.add(win);
      var box = new THREE.Mesh(new THREE.BoxGeometry(.58, .12, .18), timber);
      box.position.set(p[0], .78, 1.28);
      g.add(box);
      for(var f=0;f<4;f++){
        var fl = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), mat({ color:[0xff7aad,0xffd166,0xb28dff,0x7ecfff][f], emissive:0xffa0c0, emissiveIntensity:.3, roughness:.5 }));
        fl.position.set(p[0]-.18+f*.12, .95, 1.3);
        g.add(fl);
      }
    });
    var door = new THREE.Mesh(new THREE.BoxGeometry(.5, .95, .08), timber);
    door.position.set(0, .62, 1.16);
    g.add(door);
    var arch = new THREE.Mesh(new THREE.TorusGeometry(.28, .05, 8, 16, Math.PI), timber);
    arch.position.set(0, 1.1, 1.16);
    arch.rotation.x = Math.PI;
    g.add(arch);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), mat({ color:0xffd866, emissive:0xffd866, emissiveIntensity:.55, roughness:.3, metalness:.4 }));
    knob.position.set(.16, .6, 1.22);
    g.add(knob);
    var lt = new THREE.PointLight(0xffe0b0, 1.15, 5);
    lt.position.set(0, 1.2, .4);
    g.add(lt);
    addContact(g, 1.9);
    g.position.set(x,0,z);
    g.rotation.y = angle||0;
    return { group:g, light:lt };
  };

  // ── LANTERN ───────────────────────────────────────────────────────────────
  buildLantern = function(x, z){
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .055, 1.55, 10), mat({ map:barkTex(), color:0xffffff, roughness:.9 }));
    pole.position.y = .78;
    g.add(pole);
    var paper = new THREE.Mesh(
      new THREE.SphereGeometry(.32, 20, 16),
      mat({ color:0xffc878, emissive:0xff8a33, emissiveIntensity:1.35, roughness:.4, transparent:true, opacity:.9 })
    );
    paper.scale.set(.8, 1.1, .8);
    paper.position.y = 1.72;
    g.add(paper);
    g.userData.flame = paper;
    // Frame ribs
    for(var i=0;i<6;i++){
      var rib = new THREE.Mesh(new THREE.BoxGeometry(.02, .55, .02), mat({ color:0x5a3a28, roughness:.7 }));
      rib.position.set(Math.cos(i/6*6.28)*.22, 1.72, Math.sin(i/6*6.28)*.22);
      g.add(rib);
    }
    var top = new THREE.Mesh(new THREE.ConeGeometry(.22, .16, 8), mat({ color:0x5a3a28, roughness:.7 }));
    top.position.y = 2.1;
    g.add(top);
    var tass = new THREE.Mesh(new THREE.ConeGeometry(.045, .22, 8), mat({ color:0xff5a6a, roughness:.55, emissive:0xff3040, emissiveIntensity:.2 }));
    tass.position.y = 1.32;
    g.add(tass);
    var lt = new THREE.PointLight(0xffb060, 1.8, 7);
    lt.position.y = 1.72;
    g.add(lt);
    addContact(g, .32);
    g.position.set(x,0,z);
    return { group:g, light:lt };
  };

  // ── POND ──────────────────────────────────────────────────────────────────
  buildPond = function(x, z){
    var g = new THREE.Group();
    var rnd = gardenRand(x+3, z+7);
    // Stone rim with individual rocks
    for(var i=0;i<18;i++){
      var a = i/18*Math.PI*2;
      var rock = new THREE.Mesh(new THREE.SphereGeometry(.16+rnd()*.1, 10, 8), mat({ color:0xb0a89c, roughness:.95 }));
      rock.scale.set(1.1, .55, .9);
      rock.position.set(Math.cos(a)*1.7, .06, Math.sin(a)*1.2);
      g.add(rock);
    }
    var bed = new THREE.Mesh(new THREE.CircleGeometry(1.55, 32), mat({ color:0x2a5a4e, roughness:1 }));
    bed.rotation.x = -Math.PI/2; bed.position.y = .02; bed.scale.set(1.2,1,.85);
    g.add(bed);
    var w = new THREE.Mesh(new THREE.CircleGeometry(1.45, 32), window._waterMat);
    w.rotation.x = -Math.PI/2; w.position.y = .05; w.scale.set(1.2,1,.85);
    g.add(w);
    for(var j=0;j<6;j++){
      var pa = rnd()*Math.PI*2;
      var pad = new THREE.Mesh(new THREE.CircleGeometry(.2+rnd()*.12, 14), leafMat(0x4ecf72));
      pad.rotation.x = -Math.PI/2;
      pad.position.set(Math.cos(pa)*.7, .06, Math.sin(pa)*.5);
      g.add(pad);
      var lily = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat({ color:0xff9ec8, emissive:0xff7ab0, emissiveIntensity:.35, roughness:.45 }));
      lily.scale.set(1,.35,1);
      lily.position.copy(pad.position); lily.position.y = .09;
      g.add(lily);
    }
    // reeds
    for(var k=0;k<8;k++){
      var ra = rnd()*Math.PI*2;
      var reed = new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.55+rnd()*.3,5), leafMat(0x3d9a4a));
      reed.position.set(Math.cos(ra)*1.5, .3, Math.sin(ra)*1.05);
      reed.rotation.z = (rnd()-.5)*.25;
      g.add(reed);
    }
    var lt = new THREE.PointLight(0x88e8d0, .5, 5);
    lt.position.set(0,.5,0); g.add(lt);
    addContact(g, 1.7);
    g.position.set(x,0,z);
    return { group:g, light:lt };
  };

  // Keep other cozyArt overrides (fence/bench/etc) — re-upgrade wild + windmill lightly
  buildWild = function(x, z){
    if(typeof window.buildPerfectWild === 'function'){
      var g = window.buildPerfectWild(x, z);
      if(typeof addContact === 'function') addContact(g, .5);
      return g;
    }
    var g = new THREE.Group();
    g.userData.heads = [];
    var rnd = gardenRand(x+5, z+3);
    var cols = [0xff5a9a, 0xffd056, 0x9b7efa, 0x5ecfff, 0xff8c42, 0xffffff, 0xff6b6b];
    for(var i=0;i<9;i++){
      var ox=(rnd()-.5)*.65, oz=(rnd()-.5)*.65;
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.4+rnd()*.3,6), leafMat(0x2f8f44));
      stem.position.set(ox,.22,oz); g.add(stem);
      var head = new THREE.Group();
      head.position.set(ox,.48+rnd()*.2,oz);
      head.userData.by = head.position.y;
      var col = cols[Math.floor(rnd()*cols.length)];
      var cm = mat({ color:col, roughness:.42, emissive:col, emissiveIntensity:.32 });
      for(var k=0;k<8;k++){
        var petal = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), cm);
        petal.scale.set(1.3,.3,.8);
        petal.position.set(Math.sin(k/8*6.28)*.1, 0, Math.cos(k/8*6.28)*.1);
        head.add(petal);
      }
      head.add(new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), mat({ color:0xfff1a0, emissive:0xffe066, emissiveIntensity:.45, roughness:.35 })));
      g.add(head); g.userData.heads.push(head);
    }
    addContact(g, .5);
    g.position.set(x,0,z);
    return g;
  };

  // Dense grass field on island
  window.spawnIslandGrass = function(){
    if(window._grassField || !window._islandRoot) return;
    var count = isMobile ? 140 : 260;
    var blade = new THREE.ConeGeometry(.035, .28, 3);
    blade.translate(0, .14, 0);
    var gmat = mat({ color:0x5fd16a, roughness:.9 });
    var mesh = new THREE.InstancedMesh(blade, gmat, count);
    var dummy = new THREE.Object3D();
    var R = (window._islandR||20) - 1.2;
    for(var i=0;i<count;i++){
      var a = Math.random()*Math.PI*2;
      var r = Math.sqrt(Math.random())*R;
      dummy.position.set(Math.cos(a)*r, 0.02, Math.sin(a)*r);
      dummy.rotation.y = Math.random()*Math.PI;
      dummy.rotation.z = (Math.random()-.5)*.35;
      dummy.rotation.x = (Math.random()-.5)*.2;
      var s = .7+Math.random()*.8;
      dummy.scale.set(s, s*(.8+Math.random()*.6), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    window._islandRoot.add(mesh);
    window._grassField = mesh;
  };
})();

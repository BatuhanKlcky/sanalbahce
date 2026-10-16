// Dekor, yerlestirme ve silme.
function gardenRand(x, z){
  var s = (Math.imul(Math.floor(x * 100) + 4000, 374761393) ^ Math.imul(Math.floor(z * 100) + 4000, 668265263)) >>> 0;
  return function(){
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function kept(hex, rough, metal){
  if(!kept.map) kept.map = {};
  var key = hex + ':' + (rough==null?1:rough) + ':' + (metal||0);
  var m = kept.map[key];
  if(!m){
    m = new THREE.MeshStandardMaterial({color:hex, roughness:rough==null?1:rough, metalness:metal||0});
    m.userData.keep = true;
    kept.map[key] = m;
  }
  return m;
}
function sitShadow(r){
  if(!sitShadow.mat){
    sitShadow.mat = new THREE.MeshBasicMaterial({color:0x1a2a14, transparent:true, opacity:.26, depthWrite:false});
    sitShadow.mat.userData.keep = true;
  }
  var m = new THREE.Mesh(new THREE.CircleGeometry(r, 12), sitShadow.mat);
  m.rotation.x = -Math.PI/2;
  m.position.y = .02;
  return m;
}
function pushDeco(g, type, extra){
  scene.add(g);
  var rec = {group:g, type:type};
  if(extra){ for(var k in extra) rec[k] = extra[k]; }
  decos.push(rec);
  markDirty();
}
function sailCloth(){
  if(!sailCloth.m){
    sailCloth.m = new THREE.MeshStandardMaterial({color:0xcbb892, roughness:.8, side:THREE.DoubleSide});
    sailCloth.m.userData.keep = true;
  }
  return sailCloth.m;
}

function foliage(g, x, y, z, s, rnd){
  var mat = rnd() > .55 ? window.surf.leaf : window.surf.leafDark;
  [1.28, .62].forEach(function(tilt, i){
    var p = new THREE.Mesh(new THREE.PlaneGeometry(s, s * (i ? .7 : .92)), mat);
    p.position.set(x, y + (i ? 0 : s * .04), z);
    p.rotation.order = 'YXZ';
    p.rotation.y = rnd() * 6.28 + i * 1.2;
    p.rotation.x = tilt + (rnd() - .5) * .12;
    p.userData.rx = p.rotation.x;
    p.userData.rz = p.rotation.z;
    if(!g.userData.leaves) g.userData.leaves = [];
    g.userData.leaves.push(p);
    g.add(p);
  });
}
function buildTree(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x + 3.1, z + 1.7);
  var th = 2.15 + rnd() * .55;
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(.09, .16, th, 8), window.surf.bark);
  trunk.position.y = th * .48;
  g.add(trunk);
  var flare = new THREE.Mesh(new THREE.CylinderGeometry(.14, .28, .28, 8), window.surf.bark);
  flare.position.y = .08;
  g.add(flare);
  for(var b = 0; b < 3; b++){
    var ang = rnd() * Math.PI * 2;
    var limb = new THREE.Mesh(new THREE.CylinderGeometry(.02, .035, .45, 5), window.surf.bark);
    limb.position.set(Math.cos(ang) * .12, th * .72 + b * .06, Math.sin(ang) * .12);
    limb.rotation.z = Math.cos(ang) * .9;
    limb.rotation.y = ang;
    g.add(limb);
  }
  [[0, th + .05, 0, 2.05],[.62, th - .2, .22, 1.45],[-.58, th - .12, -.16, 1.4],[.18, th + .42, -.22, 1.2],[-.22, th + .28, .4, 1.15],[.28, th - .55, -.35, 1.15]].forEach(function(p){
    foliage(g, p[0], p[1], p[2], p[3], rnd);
  });
  g.add(sitShadow(1.15));
  g.position.set(x, 0, z);
  g.rotation.y = rnd() * Math.PI * 2;
  return g;
}
function buildBush(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x + 8, z + 2);
  [[0, .32, 0, 1.15],[.32, .28, .12, .8],[-.28, .26, -.1, .75],[.05, .42, -.22, .62]].forEach(function(p){
    foliage(g, p[0], p[1], p[2], p[3], rnd);
  });
  if(typeof petalGeo === 'function'){
    for(var i = 0; i < 4; i++){
      var head = new THREE.Group();
      head.position.set((rnd()-.5)*.65, .52 + rnd()*.15, (rnd()-.5)*.55);
      head.userData.by = head.position.y;
      if(!g.userData.heads) g.userData.heads = [];
      g.userData.heads.push(head);
      var col = [0xf2d24a, 0xf28cb0, 0xf7f4ee][Math.floor(rnd()*3)];
      for(var k = 0; k < 5; k++){
        var p = new THREE.Mesh(petalGeo(.04, .075, .75), petalMat(col));
        p.rotation.order = 'YXZ';
        p.rotation.y = (k/5)*Math.PI*2;
        p.rotation.x = 1.2;
        head.add(p);
      }
      g.add(head);
    }
  }
  g.add(sitShadow(.8));
  g.position.set(x, 0, z);
  g.rotation.y = rnd()*Math.PI*2;
  return g;
}
function buildStone(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x + 1, z + 9);
  var cols = [0x6e6a66, 0x5c5854, 0x7a736c];
  var n = 2 + Math.floor(rnd()*2);
  for(var i = 0; i < n; i++){
    var w = .26 + rnd()*.32, h = .14 + rnd()*.16, d = .22 + rnd()*.28;
    var geo = new THREE.SphereGeometry(.3, 7, 5);
    geo.scale(w, h, d);
    var s = new THREE.Mesh(geo, window.surf.stone);
    s.position.set((rnd()-.5)*.4, h*.2, (rnd()-.5)*.35);
    s.rotation.y = rnd()*Math.PI;
    g.add(s);
  }
  g.add(sitShadow(.5));
  g.position.set(x, 0, z);
  return g;
}
function shroom(g, ox, oz, sc, rnd){
  var stemPts = [];
  for(var i = 0; i <= 6; i++){
    var t = i / 6;
    stemPts.push(new THREE.Vector2((.05 + Math.sin(t * Math.PI) * .018) * sc, t * .24 * sc));
  }
  var stem = new THREE.Mesh(new THREE.LatheGeometry(stemPts, 8), window.surf.stem);
  stem.position.set(ox, 0, oz);
  g.add(stem);
  var capPts = [new THREE.Vector2(.012*sc,.18*sc), new THREE.Vector2(.1*sc,.16*sc), new THREE.Vector2(.2*sc,.09*sc), new THREE.Vector2(.25*sc,.02*sc), new THREE.Vector2(.18*sc,-.03*sc)];
  var cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 14), window.surf.cap);
  cap.position.set(ox, .2*sc, oz);
  cap.userData.by = cap.position.y;
  if(!g.userData.caps) g.userData.caps = [];
  g.userData.caps.push(cap);
  g.add(cap);
  for(var k = 0; k < 5; k++){
    var a = (k/5)*Math.PI*2;
    var spot = new THREE.Mesh(new THREE.SphereGeometry(.035*sc, 5, 4), kept(0xfff6ea, .5));
    spot.scale.y = .35;
    spot.position.set(Math.cos(a)*.12*sc, .12*sc, Math.sin(a)*.12*sc);
    cap.add(spot);
  }
}
function buildMushroom(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x+4, z+4);
  shroom(g, 0, 0, 1.2, rnd);
  shroom(g, .26, .1, .62, rnd);
  shroom(g, -.2, .14, .48, rnd);
  g.add(sitShadow(.42));
  g.position.set(x, 0, z);
  g.rotation.y = rnd()*Math.PI*2;
  return g;
}
function buildFence(x, z, a){
  var g = new THREE.Group();
  var wood = window.surf.wood;
  var dark = window.surf.woodDark;
  [-.58, .58].forEach(function(px){
    var post = new THREE.Mesh(new THREE.BoxGeometry(.08, .9, .08), dark);
    post.position.set(px, .45, 0);
    g.add(post);
    var cap = new THREE.Mesh(new THREE.ConeGeometry(.065, .1, 4), dark);
    cap.position.set(px, .94, 0);
    cap.rotation.y = Math.PI/4;
    g.add(cap);
  });
  [.34, .62].forEach(function(py){
    var rail = new THREE.Mesh(new THREE.BoxGeometry(1.12, .045, .04), wood);
    rail.position.y = py;
    g.add(rail);
  });
  for(var i = 0; i < 5; i++){
    var px = -.46 + i * .23;
    var pick = new THREE.Mesh(new THREE.BoxGeometry(.065, .68, .03), wood);
    pick.position.set(px, .46, .02);
    g.add(pick);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(.048, .09, 4), wood);
    tip.position.set(px, .84, .02);
    tip.rotation.y = Math.PI/4;
    g.add(tip);
  }
  g.add(sitShadow(.65));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildBench(x, z, a){
  var g = new THREE.Group();
  var wood = window.surf.wood;
  var iron = kept(0x3a3a3a, .45, .45);
  [[-.52,-.16],[.52,-.16],[-.52,.16],[.52,.16]].forEach(function(p){
    var leg = new THREE.Mesh(new THREE.BoxGeometry(.06, .42, .06), iron);
    leg.position.set(p[0], .21, p[1]);
    g.add(leg);
  });
  for(var i = 0; i < 3; i++){
    var slat = new THREE.Mesh(new THREE.BoxGeometry(1.15, .045, .09), wood);
    slat.position.set(0, .44, -.1 + i * .1);
    g.add(slat);
  }
  for(var j = 0; j < 2; j++){
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.15, .07, .04), wood);
    back.position.set(0, .64 + j * .14, -.18);
    g.add(back);
  }
  g.add(sitShadow(.65));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildLantern(x, z){
  // Fallback classic lamp-post (modelPack replaces with richer version when ready).
  var g = new THREE.Group();
  var iron = kept(0x2a2430, .45, .55);
  var brass = kept(0xb8893a, .35, .65);
  var stone = kept(0x8a8074, .95);
  var plinth = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, .14, 10), stone);
  plinth.position.y = .07; g.add(plinth);
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 1.55, 10), iron);
  pole.position.y = 1.0; g.add(pole);
  var headY = 1.95, cageW = .38, cageH = .42, hw = cageW * .5;
  var floor = new THREE.Mesh(new THREE.BoxGeometry(cageW+.06, .05, cageW+.06), brass);
  floor.position.y = headY - cageH*.5; g.add(floor);
  var ceiling = new THREE.Mesh(new THREE.BoxGeometry(cageW+.04, .045, cageW+.04), brass);
  ceiling.position.y = headY + cageH*.5; g.add(ceiling);
  [[-hw,-hw],[hw,-hw],[-hw,hw],[hw,hw]].forEach(function(p){
    var bar = new THREE.Mesh(new THREE.BoxGeometry(.04, cageH+.04, .04), iron);
    bar.position.set(p[0], headY, p[1]); g.add(bar);
  });
  var glassMat = new THREE.MeshStandardMaterial({color:0xffe8b0, emissive:0xffaa44, emissiveIntensity:1.75, transparent:true, opacity:.88, roughness:.18, side:THREE.DoubleSide});
  glassMat.userData.keep = true;
  var paneGeo = new THREE.PlaneGeometry(cageW-.08, cageH-.08);
  [[0,hw],[0,-hw],[hw,0],[-hw,0]].forEach(function(p,i){
    var pane = new THREE.Mesh(paneGeo, glassMat);
    pane.position.set(p[0], headY, p[1]);
    if(i>=2) pane.rotation.y = Math.PI/2;
    g.add(pane);
  });
  var flame = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), new THREE.MeshStandardMaterial({color:0xfff2c8, emissive:0xff9944, emissiveIntensity:2.35, roughness:.3}));
  flame.material.userData.keep = true;
  flame.scale.set(.85, 1.15, .85); flame.position.y = headY; g.add(flame);
  g.userData.flame = flame;
  var roof = new THREE.Mesh(new THREE.ConeGeometry(.34, .22, 4), iron);
  roof.position.y = headY + cageH*.5 + .14; roof.rotation.y = Math.PI/4; g.add(roof);
  var finial = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), brass);
  finial.position.y = headY + cageH*.5 + .28; g.add(finial);
  var lt = new THREE.PointLight(0xffc278, 2.85, 12);
  lt.position.y = headY; g.add(lt);
  var fill = new THREE.PointLight(0xffaa55, 1.15, 8);
  fill.position.y = .85; g.add(fill);
  g.userData.fillLight = fill;
  g.add(sitShadow(.4));
  g.position.set(x, 0, z);
  return {group:g, light:lt};
}
function buildPot(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x+7, z+1);
  var clay = kept(0xc56a3e, .82);
  var pot = new THREE.Mesh(new THREE.CylinderGeometry(.22, .15, .32, 12), clay);
  pot.position.y = .16;
  g.add(pot);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(.22, .03, 6, 14), clay);
  rim.rotation.x = Math.PI/2;
  rim.position.y = .32;
  g.add(rim);
  var soil = new THREE.Mesh(new THREE.CircleGeometry(.18, 10), kept(0x3a2614, 1));
  soil.rotation.x = -Math.PI/2;
  soil.position.y = .31;
  g.add(soil);
  var stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .26, 5), kept(0x2d6e30, .9));
  stem.position.y = .45;
  g.add(stem);
  var col = [0xe23b4a, 0xf2b43a, 0xf48ab4, 0xf7f4ee][Math.floor(rnd()*4)];
  var head = new THREE.Group();
  head.position.y = .6;
  if(typeof petalGeo === 'function'){
    for(var k = 0; k < 6; k++){
      var p = new THREE.Mesh(petalGeo(.065, .11, .8), petalMat(col, .1));
      p.rotation.order = 'YXZ';
      p.rotation.y = (k/6)*Math.PI*2;
      p.rotation.x = 1.05;
      head.add(p);
    }
    var c = new THREE.Mesh(new THREE.SphereGeometry(.028, 6, 5), kept(0xf2d35a, .5));
    c.position.y = .03;
    head.add(c);
  }
  g.add(head);
  var leafM = kept(0x2f7a38, .85);
  [-.12, .12].forEach(function(px, i){
    var lf = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), leafM);
    lf.scale.set(1.4, .35, .7);
    lf.position.set(px, .4, .04);
    lf.rotation.z = i ? -.6 : .6;
    g.add(lf);
  });
  g.add(sitShadow(.28));
  g.position.set(x, 0, z);
  return g;
}
function buildPond(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x+2, z+6);
  var bed = new THREE.Mesh(new THREE.CircleGeometry(2.05, 20), kept(0x3d3428, 1));
  bed.rotation.x = -Math.PI/2;
  bed.position.y = .012;
  bed.scale.set(1.22, .8, 1);
  g.add(bed);
  var w = new THREE.Mesh(new THREE.CircleGeometry(1.65, 22), window._waterMat);
  w.rotation.x = -Math.PI/2;
  w.position.y = .03;
  w.scale.set(1.22, .8, 1);
  g.add(w);
  for(var i = 0; i < 16; i++){
    var a = (i/16)*Math.PI*2;
    var s = new THREE.Mesh(new THREE.SphereGeometry(.14+rnd()*.08, 6, 5), kept(0x5a5856, .96));
    s.scale.set(1.2, .4, .9);
    s.position.set(Math.cos(a)*2.15, .04, Math.sin(a)*1.4);
    g.add(s);
  }
  for(var r = 0; r < 7; r++){
    var a2 = rnd()*Math.PI*2;
    var h = .5 + rnd()*.4;
    var stalk = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, h, 4), kept(0x2f6a32, .9));
    stalk.position.set(Math.cos(a2)*(1.1+rnd()*.4), h/2, Math.sin(a2)*.7);
    stalk.rotation.z = (rnd()-.5)*.25;
    g.add(stalk);
  }
  for(var p = 0; p < 3; p++){
    var pad = new THREE.Mesh(new THREE.CircleGeometry(.14+rnd()*.06, 8), kept(0x1e6b38, .8));
    pad.rotation.x = -Math.PI/2;
    pad.position.set((rnd()-.5)*1.1, .04, (rnd()-.5)*.7);
    g.add(pad);
  }
  var lt = new THREE.PointLight(0x4488bb, .35, 4);
  lt.position.y = .4;
  g.add(lt);
  g.position.set(x, 0, z);
  return {group:g, light:lt};
}
function buildWall(x, z, a){
  var g = new THREE.Group();
  var stone = kept(0x8d7d68, .95);
  var dark = kept(0x6a5e50, 1);
  for(var row = 0; row < 4; row++){
    var n = row%2 ? 4 : 5;
    var y = .12 + row * .2;
    for(var i = 0; i < n; i++){
      var block = new THREE.Mesh(new THREE.BoxGeometry(row%2?.34:.28, .18, .26), row%2 ? dark : stone);
      block.position.set(-.6 + i*(row%2?.36:.3) + (row%2?.1:0), y, 0);
      g.add(block);
    }
  }
  var cap = new THREE.Mesh(new THREE.BoxGeometry(1.55, .08, .32), kept(0x9a8b74, .9));
  cap.position.y = .96;
  g.add(cap);
  g.add(sitShadow(.8));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildArch(x, z, a){
  var g = new THREE.Group();
  var stone = kept(0xc8a882, .85);
  var ivy = kept(0x2d7a20, 1);
  [-.7, .7].forEach(function(px){
    var col = new THREE.Mesh(new THREE.CylinderGeometry(.11, .15, 1.7, 8), stone);
    col.position.set(px, .85, 0);
    g.add(col);
  });
  var top = new THREE.Mesh(new THREE.TorusGeometry(.7, .11, 8, 18, Math.PI), stone);
  top.rotation.z = Math.PI;
  top.position.set(0, 1.7, 0);
  g.add(top);
  for(var i = 0; i < 9; i++){
    var ai = (i/8)*Math.PI;
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(.11, 5, 4), ivy);
    leaf.position.set(Math.cos(ai+Math.PI)*.72, 1.7+Math.sin(ai+Math.PI)*.72, .06);
    leaf.scale.set(1.3, .7, .5);
    g.add(leaf);
  }
  g.add(sitShadow(.9));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildPergola(x, z, a){
  var g = new THREE.Group();
  var rnd = gardenRand(x+6, z+8);
  var wood = kept(0x8b6914, .85);
  var ivy = kept(0x1e6b28, 1);
  [[-1,-.8],[1,-.8],[-1,.8],[1,.8]].forEach(function(p){
    var post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.15, 8), wood);
    post.position.set(p[0], 1.05, p[1]);
    g.add(post);
  });
  [-.8, .8].forEach(function(z2){
    var beam = new THREE.Mesh(new THREE.BoxGeometry(2.3, .1, .1), wood);
    beam.position.set(0, 2.15, z2);
    g.add(beam);
  });
  for(var i = 0; i < 5; i++){
    var cr = new THREE.Mesh(new THREE.BoxGeometry(.08, .07, 1.75), wood);
    cr.position.set(-1 + i * .5, 2.22, 0);
    g.add(cr);
  }
  for(var j = 0; j < 10; j++){
    var lf = new THREE.Mesh(new THREE.SphereGeometry(.13, 5, 4), ivy);
    lf.position.set(-1 + rnd()*2, 2.05 + rnd()*.2, -.7 + rnd()*1.4);
    lf.scale.set(1.4, .45, 1);
    g.add(lf);
  }
  g.add(sitShadow(1.3));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildBridge(x, z, a){
  var g = new THREE.Group();
  var wood = kept(0x8b5e2a, .9);
  var railM = kept(0xc8a060, .8);
  for(var i = 0; i < 7; i++){
    var pl = new THREE.Mesh(new THREE.BoxGeometry(.16, .05, .85), wood);
    pl.position.set(-.72 + i * .24, .12, 0);
    g.add(pl);
  }
  [-.4, .4].forEach(function(z2){
    var rail = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.7, 6), railM);
    rail.rotation.z = Math.PI/2;
    rail.position.set(0, .42, z2);
    g.add(rail);
    [-.6, 0, .6].forEach(function(px){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .38, 6), wood);
      post.position.set(px, .26, z2);
      g.add(post);
    });
  });
  g.add(sitShadow(.9));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildWell(x, z){
  var g = new THREE.Group();
  var stone = window.surf.stone;
  var wood = window.surf.wood;
  var body = new THREE.Mesh(new THREE.CylinderGeometry(.48, .52, .62, 12), stone);
  body.position.y = .3;
  g.add(body);
  var water = new THREE.Mesh(new THREE.CircleGeometry(.38, 12), window._waterMat);
  water.rotation.x = -Math.PI/2;
  water.position.y = .5;
  g.add(water);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(.5, .055, 6, 14), stone);
  rim.rotation.x = Math.PI/2;
  rim.position.y = .62;
  g.add(rim);
  [-.4, .4].forEach(function(px){
    var post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .045, 1.05, 6), wood);
    post.position.set(px, 1.05, 0);
    g.add(post);
  });
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .9, 6), wood);
  beam.rotation.z = Math.PI/2;
  beam.position.y = 1.55;
  g.add(beam);
  var roofL = new THREE.Mesh(new THREE.BoxGeometry(.85, .05, .7), window.surf.tile);
  roofL.position.set(-.18, 1.78, 0);
  roofL.rotation.z = .5;
  g.add(roofL);
  var roofR = new THREE.Mesh(new THREE.BoxGeometry(.85, .05, .7), window.surf.tile);
  roofR.position.set(.18, 1.78, 0);
  roofR.rotation.z = -.5;
  g.add(roofR);
  var bucket = new THREE.Mesh(new THREE.CylinderGeometry(.09, .07, .14, 8), wood);
  bucket.position.set(.15, .85, .1);
  g.add(bucket);
  g.add(sitShadow(.65));
  g.position.set(x, 0, z);
  return g;
}
function buildTable(x, z, a){
  var g = new THREE.Group();
  var wood = kept(0x7a5230, .85);
  for(var i = 0; i < 4; i++){
    var slat = new THREE.Mesh(new THREE.BoxGeometry(1.05, .045, .14), wood);
    slat.position.set(0, .7, -.21 + i * .14);
    g.add(slat);
  }
  [[-.42,-.24],[.42,-.24],[-.42,.24],[.42,.24]].forEach(function(p){
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .68, 6), wood);
    leg.position.set(p[0], .34, p[1]);
    g.add(leg);
  });
  g.add(sitShadow(.6));
  g.position.set(x, 0, z);
  g.rotation.y = a || 0;
  return g;
}
function buildWindmill(x, z){
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.CylinderGeometry(.22, .55, 2.7, 10), window.surf.stucco);
  body.position.y = 1.35;
  g.add(body);
  var band = new THREE.Mesh(new THREE.CylinderGeometry(.34, .36, .12, 10), window.surf.woodDark);
  band.position.y = 2.15;
  g.add(band);
  var cap = new THREE.Mesh(new THREE.ConeGeometry(.48, .55, 10), window.surf.tile);
  cap.position.y = 2.85;
  g.add(cap);
  var door = new THREE.Mesh(new THREE.BoxGeometry(.26, .46, .08), window.surf.wood);
  door.position.set(0, .42, .5);
  g.add(door);
  var sails = new THREE.Group();
  sails.add(new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), window.surf.woodDark));
  for(var i = 0; i < 4; i++){
    var arm = new THREE.Group();
    arm.rotation.z = (i/4)*Math.PI*2;
    var spar = new THREE.Mesh(new THREE.BoxGeometry(.045, 1.35, .04), window.surf.woodDark);
    spar.position.y = .78;
    arm.add(spar);
    var sh = new THREE.Shape();
    sh.moveTo(.02, .18);
    sh.lineTo(.5, 1.15);
    sh.lineTo(.06, 1.28);
    sh.lineTo(0, .22);
    var sail = new THREE.Mesh(new THREE.ShapeGeometry(sh, 3), window.surf.cloth);
    sail.position.z = .03;
    arm.add(sail);
    sails.add(arm);
  }
  sails.position.set(0, 2.2, .5);
  g.add(sails);
  g.add(sitShadow(.75));
  g.position.set(x, 0, z);
  return {group:g, blades:sails};
}
function buildScarecrow(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x+5, z+3);
  var wood = kept(0x6b4a1e, 1);
  var post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.85, 6), wood);
  post.position.y = .88;
  g.add(post);
  var armPivot = new THREE.Group();
  armPivot.position.y = 1.38;
  var arm = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.2, 5), wood);
  arm.rotation.z = Math.PI/2;
  armPivot.add(arm);
  g.add(armPivot);
  g.userData.arm = armPivot;
  var shirt = new THREE.Mesh(new THREE.BoxGeometry(.42, .46, .14), kept(0x9d2a1c, .9));
  shirt.position.y = 1.16;
  g.add(shirt);
  [-.52, .52].forEach(function(px){
    var cuff = new THREE.Mesh(new THREE.BoxGeometry(.1, .14, .08), kept(0xf0d090, .85));
    cuff.position.set(px, 1.38, 0);
    g.add(cuff);
  });
  var head = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 7), kept(0xf0d7a0, .8));
  head.position.y = 1.58;
  g.add(head);
  var brim = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .035, 10), kept(0xc6a15a, .85));
  brim.position.y = 1.72;
  g.add(brim);
  var crown = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .2, 8), kept(0xc6a15a, .85));
  crown.position.y = 1.84;
  g.add(crown);
  g.add(sitShadow(.35));
  g.position.set(x, 0, z);
  g.rotation.y = rnd()*Math.PI*2;
  return g;
}
function buildWild(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x+11, z+6);
  var cols = [0xffd24a, 0xf28a3a, 0xee5b9a, 0x8a6ae0, 0x6eb6f2, 0xf7f4ee];
  var cnt = 5 + Math.floor(rnd()*3);
  for(var i = 0; i < cnt; i++){
    var ox = (rnd()-.5)*.7, oz = (rnd()-.5)*.7, hh = .2 + rnd()*.26;
    var stm = new THREE.Mesh(new THREE.CylinderGeometry(.008, .01, hh, 4), kept(0x2d6e30, .9));
    stm.position.set(ox, hh/2, oz);
    g.add(stm);
    var head = new THREE.Group();
    head.position.set(ox, hh, oz);
    var fc = cols[Math.floor(rnd()*cols.length)];
    for(var k = 0; k < 5; k++){
      var p = new THREE.Mesh(petalGeo(.042, .08, .8), petalMat(fc));
      p.rotation.order = 'YXZ';
      p.rotation.y = (k/5)*Math.PI*2;
      p.rotation.x = 1.2;
      head.add(p);
    }
    var c = new THREE.Mesh(new THREE.SphereGeometry(.016, 5, 4), kept(0xffe36a, .55));
    c.position.y = .02;
    head.add(c);
    g.add(head);
  }
  g.add(sitShadow(.4));
  g.position.set(x, 0, z);
  return g;
}
function buildHouse(x, z, angle){
  var g = new THREE.Group();
  var found = new THREE.Mesh(new THREE.BoxGeometry(3.4, .24, 3.05), window.surf.stone);
  found.position.y = .1;
  g.add(found);
  var walls = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.7, 2.6), window.surf.stucco);
  walls.position.y = 1.05;
  g.add(walls);
  [1, -1].forEach(function(sign){
    var slope = new THREE.Mesh(new THREE.BoxGeometry(2.05, .12, 3.35), window.surf.tile);
    slope.position.set(sign * -.9, 2.38, 0);
    slope.rotation.z = sign * .48;
    g.add(slope);
  });
  var gableGeo = new THREE.Shape();
  gableGeo.moveTo(-1.52, 0); gableGeo.lineTo(1.52, 0); gableGeo.lineTo(0, .92);
  [1.32, -1.32].forEach(function(z){
    var gable = new THREE.Mesh(new THREE.ShapeGeometry(gableGeo), window.surf.stucco);
    gable.position.set(0, 1.9, z);
    if(z < 0) gable.rotation.y = Math.PI;
    g.add(gable);
  });
  var ridge = new THREE.Mesh(new THREE.BoxGeometry(.18, .1, 3.4), window.surf.woodDark);
  ridge.position.y = 2.86;
  g.add(ridge);
  var door = new THREE.Mesh(new THREE.BoxGeometry(.5, .9, .06), window.surf.wood);
  door.position.set(0, .6, 1.3);
  g.add(door);
  var knob = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 6), kept(0xd4a017, .3, .55));
  knob.position.set(.16, .6, 1.34);
  g.add(knob);
  var frame = kept(0xf7f1e8, .8);
  var glass = new THREE.MeshStandardMaterial({color:0x9fd4ee, transparent:true, opacity:.62, roughness:.15});
  [[-1.0, 1.02],[1.0, 1.02]].forEach(function(p){
    var wf = new THREE.Mesh(new THREE.BoxGeometry(.48, .42, .06), frame);
    wf.position.set(p[0], p[1], 1.3);
    g.add(wf);
    var wg = new THREE.Mesh(new THREE.BoxGeometry(.32, .28, .04), glass);
    wg.position.set(p[0], p[1], 1.33);
    g.add(wg);
  });
  var step = new THREE.Mesh(new THREE.BoxGeometry(.78, .08, .36), kept(0x8b7355, .95));
  step.position.set(0, .05, 1.5);
  g.add(step);
  for(var i = 0; i < 5; i++){
    var stone = new THREE.Mesh(new THREE.BoxGeometry(.4, .045, .3), kept(0x6b5340, 1));
    stone.position.set(i%2 ? .05 : -.05, .035, 1.85 + i * .38);
    g.add(stone);
  }
  var chim = new THREE.Mesh(new THREE.BoxGeometry(.26, .62, .26), kept(0x6b4e3a, .9));
  chim.position.set(.65, 2.55, -.15);
  g.add(chim);
  var lt = new THREE.PointLight(0xffeeaa, .8, 3.2);
  lt.position.set(0, 1.05, .5);
  g.add(lt);
  g.add(sitShadow(1.9));
  g.position.set(x, 0, z);
  g.rotation.y = angle || 0;
  return {group:g, light:lt};
}

function mkLantern(x,z){var o=buildLantern(x,z); pushDeco(o.group,'lantern',{light:o.light, flame:o.group.userData.flame});}
function mkBench(x,z,a){pushDeco(buildBench(x,z,a),'bench');}
function mkStone(x,z){pushDeco(buildStone(x,z),'stone');}
function mkMushroom(x,z){pushDeco(buildMushroom(x,z),'mushroom');}
function mkPot(x,z){pushDeco(buildPot(x,z),'pot');}
function mkFence(x,z,a){pushDeco(buildFence(x,z,a),'fence');}
function mkTree(x,z){pushDeco(buildTree(x,z),'tree');}
function mkBush(x,z){pushDeco(buildBush(x,z),'bush');}
function mkPond(x,z){var o=buildPond(x,z); pushDeco(o.group,'pond',{light:o.light});}
function mkWall(x,z,a){pushDeco(buildWall(x,z,a),'wall');}
function mkArch(x,z,a){pushDeco(buildArch(x,z,a),'arch');}
function mkPergola(x,z,a){pushDeco(buildPergola(x,z,a),'pergola');}
function mkBridge(x,z,a){pushDeco(buildBridge(x,z,a),'bridge');}
function mkWell(x,z){pushDeco(buildWell(x,z),'well');}
function mkTable(x,z,a){pushDeco(buildTable(x,z,a),'table');}
function mkWindmill(x,z){var o=buildWindmill(x,z); pushDeco(o.group,'windmill',{blades:o.blades});}
function mkScarecrow(x,z){pushDeco(buildScarecrow(x,z),'scarecrow');}
function mkWildFlower(x,z){pushDeco(buildWild(x,z),'flower_wild');}
function mkHouse(x,z,angle){var o=buildHouse(x,z,angle); pushDeco(o.group,'house',{light:o.light});}

var PLACE_SPAN = {fence:1.16, wall:1.5, bench:1.35, table:1.3, arch:1.65, pergola:2.3, bridge:1.7, house:0};
function tidyPlace(tp, x, z){
  // Cozy free-place: no fence/wall snapping — drop exactly where you tap.
  if(typeof isCozy==='function' && isCozy()) return {x:x, z:z, a:0};
  var span = PLACE_SPAN[tp];
  if(span === undefined) return {x:x, z:z, a:0};
  var best = null, bestD = 2.3;
  for(var i = 0; i < decos.length; i++){
    var d = decos[i];
    if(d.type !== tp) continue;
    var p = d.group.position;
    var dist = Math.hypot(p.x - x, p.z - z);
    if(dist < bestD){ bestD = dist; best = d; }
  }
  if(best){
    var a = best.group.rotation.y;
    if(span > 0){
      var sideX = Math.cos(a), sideZ = -Math.sin(a);
      var fwdX = Math.sin(a), fwdZ = Math.cos(a);
      var vx = x - best.group.position.x, vz = z - best.group.position.z;
      var along = vx * sideX + vz * sideZ;
      var across = vx * fwdX + vz * fwdZ;
      if(Math.abs(across) < .9 && Math.abs(along) > span * .3){
        var sign = along >= 0 ? 1 : -1;
        var nx = best.group.position.x + sideX * span * sign;
        var nz = best.group.position.z + sideZ * span * sign;
        if(Math.hypot(nx, nz) <= GARDEN_R) return {x:nx, z:nz, a:a};
      }
    }
    return {x:x, z:z, a:a};
  }
  var a0 = Math.atan2(-x, -z);
  var step = Math.PI / 4;
  a0 = Math.round(a0 / step) * step;
  return {x:x, z:z, a:a0};
}

var BLOOM_COLS = [0xffd23a, 0xfff6ea, 0xff5a2a, 0xe23b6a, 0xc44ad0, 0xff8a3a, 0xffffff, 0xfff2c4];
function bedBloom(parent, x, y, z, col, sc){
  var g = new THREE.Group();
  var geo = petalGeo(.13 * sc, .24 * sc, .85);
  var mat = petalMat(col, .2);
  for(var k = 0; k < 6; k++){
    var p = new THREE.Mesh(geo, mat);
    p.rotation.order = 'YXZ';
    p.rotation.y = (k / 6) * Math.PI * 2;
    p.rotation.x = 1.25;
    g.add(p);
  }
  var heart = new THREE.Mesh(new THREE.SphereGeometry(.05 * sc, 6, 4), kept(0xffe08a, .5));
  heart.position.y = .035;
  g.add(heart);
  g.position.set(x, y, z);
  g.userData.spin = x * 1.7 + z;
  parent.add(g);
  if(!window._blooms) window._blooms = [];
  window._blooms.push(g);
}
function soilBed(x, z, r){
  var g = new THREE.Group();
  var soilMat = typeof window.createSoilMaterial==='function'
    ? window.createSoilMaterial({ key:'bed-'+Math.round(x*10)+'-'+Math.round(z*10), tint:0x5a3c28, repeat:2.8 })
    : kept(0x4e3424, 1);
  var soil = new THREE.Mesh(new THREE.CircleGeometry(r, 36), soilMat);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = .028;
  soil.receiveShadow = !!(renderer && renderer.shadowMap && renderer.shadowMap.enabled);
  g.add(soil);
  var n = isMobile ? 12 : 18;
  for(var i = 0; i < n; i++){
    var a = (i / n) * Math.PI * 2;
    var rock = new THREE.Mesh(new THREE.SphereGeometry(.18, 6, 4), window.surf.stone);
    var s = .82 + (i % 4) * .08;
    rock.scale.set(1.2 * s, .4, .95 * s);
    rock.position.set(Math.cos(a) * (r + .06), .055, Math.sin(a) * (r + .06));
    rock.rotation.y = a;
    g.add(rock);
  }
  var rnd = gardenRand(x + 2.2, z + 4.4);
  var blooms = isMobile ? 12 : 22;
  for(var b = 0; b < blooms; b++){
    var ba = (b / blooms) * Math.PI * 2 + rnd() * .25;
    var ring = b % 3;
    var br = r * (ring === 0 ? .78 : ring === 1 ? .56 : .36) + (rnd() - .5) * .2;
    if(br < 1.05) br = 1.05;
    bedBloom(g, Math.cos(ba) * br, .07, Math.sin(ba) * br, BLOOM_COLS[Math.floor(rnd() * BLOOM_COLS.length)], .75 + rnd() * .55);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}
function yardPost(x, z){
  var post = new THREE.Mesh(new THREE.CylinderGeometry(.085, .11, 1.22, 6), window.surf.bark);
  post.position.set(x, .56, z);
  scene.add(post);
}
function yardRails(x, z, rot, len){
  var g = new THREE.Group();
  [.42, .78].forEach(function(py){
    var rail = new THREE.Mesh(new THREE.BoxGeometry(len, .07, .06), window.surf.wood);
    rail.position.y = py;
    g.add(rail);
  });
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  scene.add(g);
  return g;
}
function railEdge(x0, z0, x1, z1){
  var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
  var ux = dx / L, uz = dz / L, rot = Math.atan2(-uz, ux);
  var n = Math.max(1, Math.round(L / (isMobile ? 3.15 : 2.45)));
  var step = L / n, pts = [];
  for(var i = 0; i <= n; i++) pts.push([x0 + ux * step * i, z0 + uz * step * i]);
  for(var p = 0; p < pts.length; p++){
    if(Math.abs(pts[p][0]) < 1.55 && pts[p][1] > 10.5) continue;
    yardPost(pts[p][0], pts[p][1]);
  }
  for(var s = 0; s < n; s++){
    var ax = pts[s][0], az = pts[s][1], bx = pts[s + 1][0], bz = pts[s + 1][1];
    var mx = (ax + bx) / 2, mz = (az + bz) / 2;
    if(Math.abs(mx) < 1.9 && mz > 10.5) continue;
    yardRails(mx, mz, rot, step * .94);
    if(s % 4 === 1){
      var vine = new THREE.Group();
      var rnd = gardenRand(mx + 1, mz + 2);
      foliage(vine, (rnd() - .5) * step * .35, .95, .08, .95, rnd);
      foliage(vine, (rnd() - .5) * step * .25, 1.15, -.02, .7, rnd);
      vine.position.set(mx, 0, mz);
      scene.add(vine);
    }
  }
}
function sceneryBarrel(x, z){
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.CylinderGeometry(.34, .3, .58, 10), window.surf.wood);
  body.position.y = .3;
  g.add(body);
  [.1, .5].forEach(function(py){
    var band = new THREE.Mesh(new THREE.TorusGeometry(.34, .028, 6, 12), window.surf.woodDark);
    band.rotation.x = Math.PI / 2;
    band.position.y = py;
    g.add(band);
  });
  g.position.set(x, 0, z);
  g.rotation.y = .4;
  scene.add(g);
}
function clearDressProps(){
  function wipe(arr){
    if(!arr) return;
    for(var i=0;i<arr.length;i++){
      var o = arr[i];
      if(!o) continue;
      if(o.parent) o.parent.remove(o);
      else scene.remove(o);
    }
    arr.length = 0;
  }
  wipe(window._dress);
  wipe(window._dressStones);
  wipe(window._dressSprigs);
  wipe(window._millGroups);
  wipe(window._cozyDress);
  wipe(window._meadow);
  window._mills = [];
  window._dress = [];
  window._dressStones = [];
  window._dressSprigs = [];
  window._millGroups = [];
  window._cozyDress = [];
  window._meadow = [];
}

function placeDressProps(){
  window._dress = window._dress || [];
  window._mills = window._mills || [];
  window._millGroups = window._millGroups || [];
  window._dressStones = window._dressStones || [];
  window._dressSprigs = window._dressSprigs || [];
  window._blooms = window._blooms || [];

  var mill = buildWindmill(1.4, -16.6);
  mill.group.scale.setScalar(isMobile ? 1.05 : 1.28);
  scene.add(mill.group);
  window._millGroups.push(mill.group);
  if(mill.blades) window._mills.push(mill.blades);

  // Corner trees — Quaternius already sized; light parent scale only
  [[-16.5, 9.5, 1.15],[17.2, 8.2, 1.1],[-17.4, -9.2, 1.12],[18.4, -6.4, 1.14]].forEach(function(p, i){
    if(isMobile && i > 1) return;
    var tree = buildTree(p[0], p[1]);
    tree.scale.setScalar(p[2]);
    scene.add(tree);
    window._dress.push(tree);
  });

  var yard = [[-20, 4], [16, 16], [-9, 19], [22, -14], [-21, -16], [6, 22], [-24, 14], [24, 6]];
  yard.forEach(function(p, i){
    if(isMobile && i % 2) return;
    var stone = buildStone(p[0], p[1]);
    scene.add(stone);
    window._dressStones.push(stone);
  });

  var nTree = isMobile ? 8 : 16;
  var nBush = isMobile ? 6 : 12;
  for(var t = 0; t < nTree; t++){
    var at = (t / nTree) * Math.PI * 2 + .35;
    if(Math.abs(Math.atan2(Math.sin(at), Math.cos(at)) - Math.PI / 2) < .38) continue;
    var rt = 42 + (t % 4) * 1.8;
    var tree = buildTree(Math.cos(at) * rt, Math.sin(at) * rt);
    tree.scale.setScalar(1.2 + (t % 3) * .08);
    scene.add(tree);
    window._dress.push(tree);
  }
  for(var b = 0; b < nBush; b++){
    var ab = (b / nBush) * Math.PI * 2 + .2;
    var bx = Math.cos(ab) * (34 + (b % 2) * 2.4);
    var bz = Math.sin(ab) * (34 + (b % 2) * 2.4);
    if(Math.abs(bx) < 3.2 && bz > 8) continue;
    var bush = buildBush(bx, bz);
    bush.scale.setScalar(1.05);
    scene.add(bush);
    window._dress.push(bush);
  }

  var sprig = gardenRand(3, 9);
  var sprigs = isMobile ? 6 : 14;
  for(var s = 0; s < sprigs; s++){
    var holder = new THREE.Group();
    var ang = sprig() * Math.PI * 2, rad = 16 + sprig() * 12;
    var sx = Math.cos(ang) * rad, sz = Math.sin(ang) * rad;
    if(Math.abs(sx) < 14 && Math.abs(sz) < 13) continue;
    if(typeof buildWild === 'function' && window.modelPackReady && window.modelPackReady()){
      holder = buildWild(sx, sz);
    } else {
      bedBloom(holder, 0, .05, 0, BLOOM_COLS[Math.floor(sprig() * BLOOM_COLS.length)], .7 + sprig() * .4);
      holder.position.set(sx, 0, sz);
    }
    scene.add(holder);
    window._dressSprigs.push(holder);
  }
}

// Cozy island showcase — stays visible in cozy mode (unlike outer _dress ring).
function dressCozyIsland(){
  window._cozyDress = window._cozyDress || [];
  var cozy = typeof isCozy === 'function' ? isCozy() : true;
  function add(obj, scale){
    if(!obj) return;
    if(scale) obj.scale.setScalar(scale);
    scene.add(obj);
    obj.visible = cozy;
    window._cozyDress.push(obj);
  }
  function addRec(rec, scale){
    if(!rec || !rec.group) return;
    if(scale) rec.group.scale.setScalar(scale);
    scene.add(rec.group);
    rec.group.visible = cozy;
    window._cozyDress.push(rec.group);
  }

  // Cottage nestled on the back half of the island
  addRec(buildHouse(-5.5, -4.2, 0.35), 1.0);
  addRec(buildHouse(7.2, -2.8, -0.55), 0.85);

  // Grove + pines framing the beds
  [[-11, 6],[11, 5],[-10, -8],[9.5, -9],[-3, 10],[4, 9],[-13, -1],[13, 0]].forEach(function(p, i){
    if(isMobile && i > 4) return;
    add(buildTree(p[0], p[1]), 1.05 + (i%3)*0.06);
  });

  // Bushes along fence inside
  [[-12, 10],[12, 9],[-12, -10],[11, -11],[-6, 11],[6, 11]].forEach(function(p, i){
    if(isMobile && i > 3) return;
    add(buildBush(p[0], p[1]), 1.0);
  });

  add(buildWell(5.5, 3.2), 1.0);
  add(buildPergola(-7.5, 3.8, 0.2), 0.95);
  add(buildBench(2.2, 4.5, -0.4), 1.0);
  add(buildBench(-2.8, -9.5, 0.2), 1.0);
  addRec(buildPond(-0.5, -0.2), 0.9);
  add(buildStone(-8, 1.5), 1.1);
  add(buildStone(8.5, 2.2), 1.0);
  add(buildMushroom(-9.5, -5.5), 1.1);
  add(buildTable(3.8, -8.5, 0.3), 0.95);
  add(buildScarecrow(10.5, 2.5), 1.0);

  // Replace classic mill with island landmark mill (visible in cozy)
  var mill = buildWindmill(1.2, -12.5);
  if(mill && mill.group){
    mill.group.scale.setScalar(isMobile ? 0.9 : 1.05);
    scene.add(mill.group);
    mill.group.visible = cozy;
    window._cozyDress.push(mill.group);
    if(mill.blades) window._mills.push(mill.blades);
  }
}

function dressGarden(){
  window._dress = [];
  window._mills = [];
  window._millGroups = [];
  window._dressStones = [];
  window._dressSprigs = [];
  window._blooms = [];
  window._cozyDress = [];
  var xL = -14.5, xR = 14.5, zB = -12.6, zF = 13.2;
  railEdge(xL, zF, xR, zF);
  railEdge(xR, zF, xR, zB);
  railEdge(xR, zB, xL, zB);
  railEdge(xL, zB, xL, zF);
  soilBed(0, 6.2, 3.55);
  soilBed(-8.2, -1.3, 3.15);
  soilBed(8.2, -1.3, 3.15);
  soilBed(0, -7.1, 2.85);
  var pathMat = kept(0x6b5340, 1);
  var path = new THREE.Mesh(new THREE.BoxGeometry(1.85, .04, 8.4), pathMat);
  path.position.set(0, .02, 17.6);
  scene.add(path);
  sceneryBarrel(11.4, -7.4);

  placeDressProps();

  window._cozyHills = [];
  [[-70,-8,-58,44,.42],[62,-6,-78,36,.4],[86,-7,16,32,.38],[-28,-5,72,40,.36]].forEach(function(h){
    var hill = new THREE.Mesh(new THREE.SphereGeometry(h[3], 22, 14), kept(0x345c30, 1));
    hill.scale.y = h[4];
    hill.position.set(h[0], h[1], h[2]);
    scene.add(hill);
    window._cozyHills.push(hill);
  });
}

// Rebuild props once real GLBs are ready (dressGarden runs before async model pack).
window.redressGardenModels = function(){
  clearDressProps();
  placeDressProps();
  // Legacy single-island dress replaced by multi-biome archipelago when available.
  if(typeof window.buildAllBiomes === 'function'){
    try{ window.buildAllBiomes(); }
    catch(e){ console.warn('biomes', e); dressCozyIsland(); }
  } else {
    dressCozyIsland();
  }
  if(typeof window.reseedMeadowPatches === 'function') window.reseedMeadowPatches();
  if(typeof applyCozyScenery === 'function') applyCozyScenery();
  else if(typeof window.applyCozyMode === 'function') window.applyCozyMode(false);
};

dressGarden();

// ── SİLME MODU ───────────────────────────────────────────────────────────────
var deleteMode = false;
var allDecoMeshes = []; // tüm deco mesh'leri raycast için

window.toggleDeleteMode = function() {
    if (placementMode) { window.cancelPlace(); return; }
    if (flowerPlaceMode) { window.cancelFlowerPlace(); return; }
    deleteMode = !deleteMode;
    var bar = document.getElementById('delBar');
    var btn = document.getElementById('btnDel');
    if (deleteMode) {
        bar.classList.add('show');
        btn.classList.add('on');
        controls.enabled = false;
        // Close panels
        openP = null;
        document.getElementById('decoPanel').classList.remove('open');
        document.getElementById('btnDeco').classList.remove('on');
        showToast('Silmek için objeye dokun 🗑️');
    } else {
        bar.classList.remove('show');
        btn.classList.remove('on');
        controls.enabled = true;
    }
};

function deleteDeco(group) {
    var idx = decos.findIndex(function(d) { return d.group === group; });
    if (idx === -1) return;
    var d = decos[idx];
    if (d.light) d.light.dispose && d.light.dispose();
    group.traverse(function(c) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
            var mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(function(m){ if(m && m!==window._waterMat && !(m.userData&&m.userData.keep)) m.dispose(); });
        }
    });
    scene.remove(group);
    decos.splice(idx, 1);
    markDirty(); save(true);
    showToast('Silindi! 🗑️');
}
// ── PLACEMENT ────────────────────────────────────────────────────────────────
var placementMode=false,placementType=null;
var planeR=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));
planeR.rotation.x=-Math.PI/2;scene.add(planeR);
var plRay=new THREE.Raycaster(),plM=new THREE.Vector2();
var prevGhost=null,ghostMat=new THREE.MeshBasicMaterial({color:0x00ff88,wireframe:true,transparent:true,opacity:.5});
window.startPlace=function(tp){placementType=tp;placementMode=true;controls.enabled=false;document.getElementById('pBar').classList.add('show');openP=null;document.getElementById('decoPanel').classList.remove('open');document.getElementById('btnDeco').classList.remove('on');showToast('Nereye koymak istiyorsun? 👆');};
window.cancelPlace=function(){placementMode=false;placementType=null;controls.enabled=true;var bar=document.getElementById('pBar');bar.classList.remove('show');var sp=bar.querySelector('span');if(sp)sp.textContent='👆 Sahneye dokun';if(prevGhost){scene.remove(prevGhost);prevGhost=null;}};
window.cancelFlowerPlace=window.cancelFlowerPlace||function(){flowerPlaceMode=false;controls.enabled=true;document.getElementById('pBar').classList.remove('show');};
window.addEventListener('pointermove',function(e){if(!placementMode)return;plM.x=(e.clientX/innerWidth)*2-1;plM.y=-(e.clientY/innerHeight)*2+1;plRay.setFromCamera(plM,camera);var hits=plRay.intersectObject(planeR);if(!hits.length)return;var pt=hits[0].point;if(!prevGhost){prevGhost=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.05,16),ghostMat.clone());scene.add(prevGhost);}prevGhost.position.set(pt.x,.03,pt.z);});
window.addEventListener('pointerup',function(e){
  var uiHit = e.target.closest('.ui-container')||e.target.closest('.spanel')||e.target.closest('#sidebar')||e.target.closest('#pBar')||e.target.closest('#delBar');

  // DELETE MODE
  if(deleteMode && !uiHit){
    plM.x=(e.clientX/innerWidth)*2-1;plM.y=-(e.clientY/innerHeight)*2+1;
    plRay.setFromCamera(plM,camera);
    // collect all deco meshes
    var allGroups=[];
    decos.forEach(function(d){d.group.traverse(function(ch){if(ch.isMesh)allGroups.push(ch);});});
    var hits=plRay.intersectObjects(allGroups,true);
    if(hits.length>0){
      var hitObj=hits[0].object;
      var foundGroup=null;
      decos.forEach(function(d){d.group.traverse(function(ch){if(ch===hitObj)foundGroup=d.group;});});
      if(foundGroup)deleteDeco(foundGroup);
    } else {
      showToast('Objeye dokun 👆');
    }
    return;
  }

  // FLOWER PLACEMENT MODE
  if(flowerPlaceMode && !uiHit){
    plM.x=(e.clientX/innerWidth)*2-1;plM.y=-(e.clientY/innerHeight)*2+1;
    plRay.setFromCamera(plM,camera);
    var hits=plRay.intersectObject(planeR);
    if(!hits.length)return;
    var pt=hits[0].point;
    if(!window.plantSeedAt(pt.x,pt.z) && !window.hasSeed()) window.cancelFlowerPlace();
    return;
  }

  // DECO PLACEMENT MODE
  if(!placementMode)return;
  if(uiHit)return;
  plM.x=(e.clientX/innerWidth)*2-1;plM.y=-(e.clientY/innerHeight)*2+1;
  plRay.setFromCamera(plM,camera);
  var hits=plRay.intersectObject(planeR);
  if(!hits.length)return;
  var pt=hits[0].point;
  var tp=placementType,spot=tidyPlace(tp,pt.x,pt.z);
  var placeLim=(typeof isCozy==='function'&&isCozy()&&window._islandR)?window._islandR-1.2:GARDEN_R;
  if(Math.sqrt(spot.x*spot.x+spot.z*spot.z)>placeLim){showToast('Çok uzak! 🚫');return;}
  pt.x=spot.x; pt.z=spot.z;
  var ang=spot.a;
  if((tp==='tomato'||tp==='strawberry'||tp==='cucumber'||tp==='pepper'||tp==='carrot'||tp==='flower_wild') && window.gardenBlocked){
    var blocked=window.gardenBlocked(pt.x,pt.z);
    if(blocked){ showToast(blocked); return; }
  }
  if(tp==='lantern')mkLantern(pt.x,pt.z);else if(tp==='bench')mkBench(pt.x,pt.z,ang);else if(tp==='stone')mkStone(pt.x,pt.z);else if(tp==='mushroom')mkMushroom(pt.x,pt.z);else if(tp==='pot')mkPot(pt.x,pt.z);else if(tp==='fence')mkFence(pt.x,pt.z,ang);else if(tp==='tree')mkTree(pt.x,pt.z);else if(tp==='bush')mkBush(pt.x,pt.z);else if(tp==='pond')mkPond(pt.x,pt.z);else if(tp==='wall')mkWall(pt.x,pt.z,ang);else if(tp==='arch')mkArch(pt.x,pt.z,ang);else if(tp==='pergola')mkPergola(pt.x,pt.z,ang);else if(tp==='bridge')mkBridge(pt.x,pt.z,ang);else if(tp==='well')mkWell(pt.x,pt.z);else if(tp==='table')mkTable(pt.x,pt.z,ang);else if(tp==='windmill')mkWindmill(pt.x,pt.z);else if(tp==='scarecrow')mkScarecrow(pt.x,pt.z);else if(tp==='flower_wild')mkWildFlower(pt.x,pt.z);
  else if(tp==='house')mkHouse(pt.x,pt.z,ang);
  else if(tp==='tomato')mkHarvestPlant(pt.x,pt.z,'tomato');
  else if(tp==='strawberry')mkHarvestPlant(pt.x,pt.z,'strawberry');
  else if(tp==='cucumber')mkHarvestPlant(pt.x,pt.z,'cucumber');
  else if(tp==='pepper')mkHarvestPlant(pt.x,pt.z,'pepper');
  else if(tp==='carrot')mkHarvestPlant(pt.x,pt.z,'carrot');
  else if(!(window.placeShopDeco && window.placeShopDeco(tp, pt.x, pt.z, ang))){ showToast('Bu eşya konamıyor'); return; }
  sndPlant();showToast('✅ Yerleştirildi!');save(true);
});
window.addEventListener('keydown',function(e){if(e.key==='Escape'){window.cancelPlace();if(typeof window.deselectDeco==='function')window.deselectDeco();}});

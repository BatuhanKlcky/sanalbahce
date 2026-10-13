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

function buildTree(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x + 3.1, z + 1.7);
  var th = 2.45 + rnd() * 1.05;
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .18, th, 7), kept(0x6b4632, .96));
  trunk.position.y = th * .48;
  g.add(trunk);
  var flare = new THREE.Mesh(new THREE.CylinderGeometry(.16, .32, .26, 7), kept(0x5c3b2a, .96));
  flare.position.y = .08;
  g.add(flare);
  for(var b = 0; b < 2; b++){
    var ang = rnd() * Math.PI * 2;
    var limb = new THREE.Mesh(new THREE.CylinderGeometry(.032, .05, .8, 5), kept(0x6b4632, .96));
    limb.position.set(Math.cos(ang) * .26, th * .68, Math.sin(ang) * .26);
    limb.rotation.z = (b ? 1 : -1) * .8;
    limb.rotation.y = ang;
    g.add(limb);
  }
  var greens = [0x2c7438, 0x3c8a46, 0x245f30, 0x4b9a50];
  [[0, th+.22, 0, .98, .58],[.55, th-.02, .2, .6, .38],[-.48, th+.04, -.16, .56, .36],[.16, th+.55, -.26, .5, .32],[-.2, th+.4, .3, .48, .3],[.06, th-.38, .38, .4, .26],[-.32, th-.22, .12, .38, .24]].forEach(function(p){
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(p[3], 8, 6), kept(greens[Math.floor(rnd()*greens.length)], .92));
    leaf.scale.y = p[4] / p[3];
    leaf.position.set(p[0], p[1], p[2]);
    g.add(leaf);
  });
  g.add(sitShadow(1.2));
  g.position.set(x, 0, z);
  g.rotation.y = rnd() * Math.PI * 2;
  return g;
}
function buildBush(x, z){
  var g = new THREE.Group();
  var rnd = gardenRand(x + 8, z + 2);
  var cols = [0x246b34, 0x2f7c3e, 0x1d5c2c];
  [[0,0,0,.62,.4],[.36,.06,.14,.4,.26],[-.32,.02,-.12,.36,.24],[.06,.14,-.3,.3,.2],[-.08,.1,.28,.26,.18]].forEach(function(s){
    var b = new THREE.Mesh(new THREE.SphereGeometry(s[3], 8, 6), kept(cols[Math.floor(rnd()*cols.length)], .9));
    b.scale.y = s[4] / s[3];
    b.position.set(s[0], s[1] + s[4] * .5, s[2]);
    g.add(b);
  });
  if(typeof petalGeo === 'function'){
    for(var i = 0; i < 4; i++){
      var head = new THREE.Group();
      head.position.set((rnd()-.5)*.65, .52 + rnd()*.15, (rnd()-.5)*.55);
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
    var s = new THREE.Mesh(geo, kept(cols[Math.floor(rnd()*cols.length)], .97));
    s.position.set((rnd()-.5)*.4, h*.2, (rnd()-.5)*.35);
    s.rotation.y = rnd()*Math.PI;
    g.add(s);
  }
  g.add(sitShadow(.5));
  g.position.set(x, 0, z);
  return g;
}
function shroom(g, ox, oz, sc, rnd){
  var stem = new THREE.Mesh(new THREE.CylinderGeometry(.05*sc, .08*sc, .28*sc, 7), kept(0xf3e6d0, 1));
  stem.position.set(ox, .12*sc, oz);
  g.add(stem);
  var cap = new THREE.Mesh(new THREE.SphereGeometry(.22*sc, 10, 8, 0, Math.PI*2, 0, Math.PI*.55), kept(0xc0392b, .72));
  cap.position.set(ox, .24*sc, oz);
  g.add(cap);
  for(var i = 0; i < 5; i++){
    var a = (i/5)*Math.PI*2;
    var rr = .11*sc;
    var spot = new THREE.Mesh(new THREE.SphereGeometry(.04*sc, 5, 4), kept(0xfff8ee, .55));
    spot.position.set(ox+Math.cos(a)*rr, .4*sc, oz+Math.sin(a)*rr);
    spot.scale.y = .4;
    g.add(spot);
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
  var wood = kept(0x8d6434, .9);
  var dark = kept(0x6a4a24, .92);
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
  var wood = kept(0x7a5230, .9);
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
  var g = new THREE.Group();
  var iron = kept(0x2c2418, .5, .35);
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .055, 1.65, 8), iron);
  pole.position.y = .82;
  g.add(pole);
  var glass = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .22), new THREE.MeshStandardMaterial({color:0xffcc66, emissive:0xffaa22, emissiveIntensity:1.35, transparent:true, opacity:.82, roughness:.25}));
  glass.position.y = 1.78;
  g.add(glass);
  [-.13,.13].forEach(function(ox){ [-.13,.13].forEach(function(oz){
    var bar = new THREE.Mesh(new THREE.BoxGeometry(.035, .38, .035), iron);
    bar.position.set(ox, 1.78, oz);
    g.add(bar);
  }); });
  var lip = new THREE.Mesh(new THREE.BoxGeometry(.32, .04, .32), iron);
  lip.position.y = 1.58;
  g.add(lip);
  var cap = new THREE.Mesh(new THREE.ConeGeometry(.24, .18, 4), iron);
  cap.position.y = 2.04;
  cap.rotation.y = Math.PI/4;
  g.add(cap);
  var lt = new THREE.PointLight(0xffaa33, 1.2, 5);
  lt.position.y = 1.78;
  g.add(lt);
  g.add(sitShadow(.28));
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
  var stone = kept(0x8d7b62, .95);
  var wood = kept(0x6b4a1e, .9);
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
  var roofL = new THREE.Mesh(new THREE.BoxGeometry(.85, .05, .7), kept(0x7a3a28, .85));
  roofL.position.set(-.18, 1.78, 0);
  roofL.rotation.z = .5;
  g.add(roofL);
  var roofR = new THREE.Mesh(new THREE.BoxGeometry(.85, .05, .7), kept(0x7a3a28, .85));
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
  var body = new THREE.Mesh(new THREE.CylinderGeometry(.26, .52, 2.5, 8), kept(0xd7c4a4, .85));
  body.position.y = 1.25;
  g.add(body);
  var cap = new THREE.Mesh(new THREE.ConeGeometry(.4, .5, 8), kept(0x6e3a2a, .8));
  cap.position.y = 2.65;
  g.add(cap);
  var door = new THREE.Mesh(new THREE.BoxGeometry(.22, .38, .06), kept(0x5c3a1e, .85));
  door.position.set(0, .38, .48);
  g.add(door);
  var sails = new THREE.Group();
  sails.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), kept(0x4a3424, .6)));
  for(var i = 0; i < 4; i++){
    var arm = new THREE.Group();
    arm.rotation.z = (i/4)*Math.PI*2;
    var spar = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.25, .04), kept(0x5c4030, .85));
    spar.position.y = .72;
    arm.add(spar);
    var sail = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.15), sailCloth());
    sail.position.set(.2, .78, .04);
    arm.add(sail);
    sails.add(arm);
  }
  sails.position.set(0, 2.05, .46);
  g.add(sails);
  g.add(sitShadow(.7));
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
  var arm = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.2, 5), wood);
  arm.rotation.z = Math.PI/2;
  arm.position.y = 1.38;
  g.add(arm);
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
  var found = new THREE.Mesh(new THREE.BoxGeometry(3.35, .22, 2.95), kept(0x7d6a52, .95));
  found.position.y = .1;
  g.add(found);
  var walls = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.65, 2.55), kept(0xf3e2cc, .88));
  walls.position.y = 1.02;
  g.add(walls);
  var roofShape = new THREE.Shape();
  roofShape.moveTo(-1.85, 0);
  roofShape.lineTo(1.85, 0);
  roofShape.lineTo(0, 1.12);
  roofShape.lineTo(-1.85, 0);
  var roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, {depth:3.0, bevelEnabled:false}), kept(0xa33b24, .82));
  roof.position.set(0, 1.84, -1.5);
  g.add(roof);
  var door = new THREE.Mesh(new THREE.BoxGeometry(.5, .9, .06), kept(0x5c3a1e, .8));
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

function mkLantern(x,z){var o=buildLantern(x,z); pushDeco(o.group,'lantern',{light:o.light});}
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
        if(Math.hypot(nx, nz) <= 28) return {x:nx, z:nz, a:a};
      }
    }
    return {x:x, z:z, a:a};
  }
  var a0 = Math.atan2(-x, -z);
  var step = Math.PI / 4;
  a0 = Math.round(a0 / step) * step;
  return {x:x, z:z, a:a0};
}

function dressGarden(){
  window._dress = [];
  var pathMat = kept(0x6b5340, 1);
  var walk = new THREE.Mesh(new THREE.RingGeometry(13.2, 15.15, 72), pathMat);
  walk.rotation.x = -Math.PI/2;
  walk.position.y = .016;
  walk.scale.set(1.12, .88, 1);
  scene.add(walk);
  var tongue = new THREE.Mesh(new THREE.BoxGeometry(10.5, .04, 1.8), pathMat);
  tongue.position.set(14.2, .02, 14.2);
  tongue.rotation.y = -Math.PI/4;
  scene.add(tongue);
  for(var i = 0; i < 20; i++){
    var a = (i/20)*Math.PI*2;
    var rock = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 4), kept(0x3f3b36, .97));
    rock.scale.set(1.35, .38, 1);
    rock.position.set(Math.cos(a)*17.2, .035, Math.sin(a)*13.6);
    scene.add(rock);
  }
  var nTree = isMobile ? 8 : 14;
  var nBush = isMobile ? 8 : 12;
  for(var t = 0; t < nTree; t++){
    var at = (t / nTree) * Math.PI * 2 + .4;
    var rt = 34 + (t % 3) * 3.1;
    var tree = buildTree(Math.cos(at)*rt, Math.sin(at)*rt);
    tree.scale.setScalar(1.4);
    scene.add(tree);
    window._dress.push(tree);
  }
  for(var b = 0; b < nBush; b++){
    var ab = (b / nBush) * Math.PI * 2 + .15;
    var rb = 30.5 + (b % 2) * 2.2;
    var bush = buildBush(Math.cos(ab)*rb, Math.sin(ab)*rb);
    bush.scale.setScalar(1.25);
    scene.add(bush);
    window._dress.push(bush);
  }
  [[-70,-8,-58,44,.42],[62,-6,-78,36,.4],[86,-7,16,32,.38],[-28,-5,72,40,.36]].forEach(function(h){
    var hill = new THREE.Mesh(new THREE.SphereGeometry(h[3], 22, 14), kept(0x345c30, 1));
    hill.scale.y = h[4];
    hill.position.set(h[0], h[1], h[2]);
    scene.add(hill);
  });
}

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
  if(Math.sqrt(spot.x*spot.x+spot.z*spot.z)>28){showToast('Çok uzak! 🚫');return;}
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
window.addEventListener('keydown',function(e){if(e.key==='Escape')window.cancelPlace();});

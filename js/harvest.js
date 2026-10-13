// Hasat bitkileri: domates, cilek, kabak.
// ── HAsat BİTKİLERİ ────────────────────────────────────────────────────────
var harvestItems = []; // {group, type, stage, growTimer, x, z}

var HARVEST_TYPES = {
  tomato:    {emoji:'🍅', color:0xcc2200, stages:['🌱','🌿','🍅'], growTime:90,  coin:15, statKey:'tom'},
  strawberry:{emoji:'🍓', color:0xff2244, stages:['🌱','🌿','🍓'], growTime:60,  coin:10, statKey:'str'},
  cucumber:  {emoji:'🥒', color:0x228822, stages:['🌱','🌿','🥒'], growTime:120, coin:20, statKey:'cuc'},
  pepper:    {emoji:'🌶️', color:0xcc1e1e, stages:['🌱','🌿','🌶️'], growTime:75,  coin:18, statKey:'pep'},
  carrot:    {emoji:'🥕', color:0xff7a1a, stages:['🌱','🌿','🥕'], growTime:80,  coin:12, statKey:'car'}
};

var _cropTex={};
function cropTexture(type){
  if(_cropTex[type]) return _cropTex[type];
  var c=document.createElement('canvas');c.width=c.height=64;
  var g=c.getContext('2d');
  if(type==='strawberry'){
    g.fillStyle='#d4143a';g.fillRect(0,0,64,64);
    g.fillStyle='#f3d27a';
    for(var i=0;i<32;i++){g.beginPath();g.arc((i*19)%60+2,(i*13)%58+3,1.4,0,6.28);g.fill();}
  }else if(type==='cucumber'){
    g.fillStyle='#3c9a3a';g.fillRect(0,0,64,64);
    g.strokeStyle='#1e5c24';g.lineWidth=4;
    for(var i=0;i<6;i++){g.beginPath();g.moveTo(0,i*11);g.lineTo(64,i*11+6);g.stroke();}
  }else if(type==='pepper'){
    var grd=g.createLinearGradient(0,0,64,64);
    grd.addColorStop(0,'#ff5a42');grd.addColorStop(1,'#8a140e');
    g.fillStyle=grd;g.fillRect(0,0,64,64);
  }else if(type==='carrot'){
    var grd=g.createLinearGradient(0,0,0,64);
    grd.addColorStop(0,'#ffc56a');grd.addColorStop(1,'#e25800');
    g.fillStyle=grd;g.fillRect(0,0,64,64);
  }else{
    var grd=g.createRadialGradient(24,20,4,32,34,34);
    grd.addColorStop(0,'#ff6844');grd.addColorStop(1,'#9c1a0c');
    g.fillStyle=grd;g.fillRect(0,0,64,64);
  }
  var tex=new THREE.CanvasTexture(c);
  _cropTex[type]=tex;
  return tex;
}
function fruitMat(type){
  return new THREE.MeshStandardMaterial({map:cropTexture(type),color:0xffffff,roughness:.62,metalness:0,emissive:0x000000,emissiveIntensity:0});
}
function cropLeaf(pivot, px, py, pz, rz, s){
  var sh = new THREE.Shape();
  sh.moveTo(0,0); sh.quadraticCurveTo(.24,.1,0,.5); sh.quadraticCurveTo(-.08,.18,0,0);
  var m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), new THREE.MeshStandardMaterial({color:0x2d7a38, side:THREE.DoubleSide, roughness:.75}));
  m.position.set(px, py, pz);
  m.rotation.set(.35, .2, rz);
  m.scale.setScalar(s||1);
  pivot.add(m);
  return m;
}
function mkHarvestPlant(x, z, type, stage) {
  stage = stage || 0;
  var cfg = HARVEST_TYPES[type];
  if (!cfg) return;
  var g = new THREE.Group();
  var soilMat = new THREE.MeshStandardMaterial({color:0x6a4428, roughness:1});
  var disc = new THREE.Mesh(new THREE.CircleGeometry(.5, 14), soilMat);
  disc.rotation.x = -Math.PI/2; disc.position.y = .02; disc.scale.set(1.25, .8, 1); g.add(disc);
  var mound = new THREE.Mesh(new THREE.SphereGeometry(.36, 10, 8), soilMat);
  mound.scale.set(1.45, .42, 1.15); mound.position.y = .06; g.add(mound);
  var pivot = new THREE.Group(); g.add(pivot);
  var grown = stage > 0;
  var ripe = stage === 2;
  if(type==='strawberry'){
    for(var i=0;i<5;i++){
      var a=i/5*Math.PI*2;
      var lf=cropLeaf(pivot, Math.cos(a)*.14, .08, Math.sin(a)*.12, .9, grown?1:.5);
      lf.rotation.x = 1.05; lf.rotation.y = a;
    }
    if(ripe){
      [[.12,.12,.04],[-.1,.11,-.05],[.02,.13,-.12]].forEach(function(p){
        var pts=[];
        for(var t=0;t<=10;t++){
          var u=t/10, bulge=Math.sin(Math.pow(u,.65)*Math.PI);
          pts.push(new THREE.Vector2(Math.max(.006,bulge*.09), .12-u*.24));
        }
        var fr=new THREE.Mesh(new THREE.LatheGeometry(pts,10), fruitMat('strawberry'));
        fr.position.set(p[0], p[1], p[2]); pivot.add(fr);
        for(var k=0;k<5;k++){
          var a=k/5*Math.PI*2;
          var sep=new THREE.Mesh(new THREE.ConeGeometry(.012,.05,4), new THREE.MeshStandardMaterial({color:0x2c7a34,roughness:.8}));
          sep.position.set(p[0]+Math.cos(a)*.03, p[1]+.12, p[2]+Math.sin(a)*.03);
          sep.rotation.z=Math.cos(a)*.6; sep.rotation.x=Math.sin(a)*.6; pivot.add(sep);
        }
      });
    }
  }else if(type==='carrot'){
    for(var i=0;i<5;i++){
      var a=i/5*Math.PI*2;
      var lf=cropLeaf(pivot, Math.cos(a)*.05, ripe?.34:.2, Math.sin(a)*.05, .2, grown?1:.55);
      lf.rotation.y=a; lf.rotation.x=1.15;
    }
    if(ripe){
      var cpts=[];
      for(var t=0;t<=8;t++){var u=t/8; cpts.push(new THREE.Vector2(Math.max(.008,(1-u)*.11*(1+.06*Math.sin(u*18))), .28-u*.5));}
      var root=new THREE.Mesh(new THREE.LatheGeometry(cpts,10), fruitMat('carrot'));
      root.position.y=.16; pivot.add(root);
    }
  }else if(type==='cucumber'){
    var vine=new THREE.Mesh(new THREE.CylinderGeometry(.016,.022,.6,5), new THREE.MeshStandardMaterial({color:0x2f6b32, roughness:.9}));
    vine.rotation.z=1.15; vine.position.set(.2, grown?.16:.1, 0); pivot.add(vine);
    cropLeaf(pivot, .08, .16, .02, .55, grown?1:.55);
    cropLeaf(pivot, -.06, .12, -.04, -.6, grown?.85:.45);
    if(ripe){
      var cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.12,.03,.02),new THREE.Vector3(.28,.01,.03),new THREE.Vector3(.46,-.02,.01)]);
      var cuke=new THREE.Mesh(new THREE.TubeGeometry(cv,8,.055,8,false), fruitMat('cucumber'));
      cuke.position.set(.08,.08,0); pivot.add(cuke);
    }
  }else{
    var stemH = ripe ? .7 : (grown ? .46 : .22);
    var stem=new THREE.Mesh(new THREE.CylinderGeometry(.016,.024,stemH,6), new THREE.MeshStandardMaterial({color:0x2f6b32, roughness:.9}));
    stem.position.y=stemH/2; pivot.add(stem);
    if(grown){
      cropLeaf(pivot, .08, stemH*.55, 0, .6, 1);
      cropLeaf(pivot, -.06, stemH*.4, .03, -.55, .9);
    }
    if(ripe && type==='pepper'){
      var ppts=[];
      for(var t=0;t<=10;t++){var u=t/10; ppts.push(new THREE.Vector2(Math.max(.01,Math.sin(u*Math.PI)*.07*(u<.2?u*4:1)), u*.32));}
      var pep=new THREE.Mesh(new THREE.LatheGeometry(ppts,10), fruitMat('pepper'));
      pep.position.set(.12, stemH*.45, .05); pep.rotation.z=.7; pivot.add(pep);
      var stem2=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.12,4), new THREE.MeshStandardMaterial({color:0x2c7a34, roughness:.8}));
      stem2.position.set(.06, stemH*.95, .02); pivot.add(stem2);
    }else if(ripe){
      [[0,.02],[.12,-.06],[-.1,0]].forEach(function(p){
        var tom=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10), fruitMat('tomato'));
        tom.position.set(p[0], stemH*.72+p[1], p[0]*.25); pivot.add(tom);
        var cap=new THREE.Mesh(new THREE.SphereGeometry(.045,5,4), new THREE.MeshStandardMaterial({color:0x2c7a34, roughness:.8}));
        cap.scale.set(1.2,.35,1.2); cap.position.set(p[0], stemH*.72+p[1]+.07, p[0]*.25); pivot.add(cap);
      });
    }
  }
  if(ripe){
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.28,.012,6,20),
      new THREE.MeshStandardMaterial({color:0xe2b340, emissive:0xaa8800, emissiveIntensity:.45, roughness:.6}));
    ring.rotation.x = Math.PI/2; ring.position.y = .045; g.add(ring);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  var item = {group:g, type:type, stage:stage, growTimer:0, x:x, z:z, cfg:cfg, sway:pivot};
  harvestItems.push(item);
  var hb = new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.8,8),
    new THREE.MeshBasicMaterial({visible:false}));
  hb.userData.harvestIdx = harvestItems.length - 1;
  hb.position.y = .4; g.add(hb);
  markDirty();
  return item;
}

function harvestPlant(idx) {
  var item = harvestItems[idx];
  if (!item || item.stage < 2) { showToast('Henüz hazır değil! ⏳'); return; }
  var cfg = item.cfg;
  stats[cfg.statKey]++;
  var pay=cfg.coin+Math.max(0,(level||1)-1);
  addCoin(pay, true);
  // Sahne temizle
  item.group.traverse(function(c){if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});
  scene.remove(item.group);
  harvestItems.splice(idx, 1);
  // Re-index hitboxes
  harvestItems.forEach(function(it, i){ it.group.children.forEach(function(ch){ if(ch.userData.harvestIdx!==undefined) ch.userData.harvestIdx=i; }); });
  updStats(); saveStats();
  showToast(cfg.emoji+' Hasat edildi! +'+pay+' 💰');
  sndCoin();
  markDirty();
}

// growTime saniye cinsinden. Kare hızından bağımsız; sekme kapalıyken biriken süre de uygulanır.
function advanceHarvest(seconds){
  seconds=Number(seconds)||0;
  if(seconds<=0) return 0;
  var live=seconds<5;
  var ripened=0, rebuilt=false;
  var pending=harvestItems.slice();
  pending.forEach(function(h){
    if(!h||h.stage>=2||!h.cfg||!(h.cfg.growTime>0)) return;
    var idx=harvestItems.indexOf(h);
    if(idx<0) return;
    var left=seconds, stage=h.stage, timer=h.growTimer||0, grow=h.cfg.growTime;
    while(stage<2&&left>0){
      if(timer>=grow){timer=0;stage++;continue;}
      var need=grow-timer;
      if(left<need){timer+=left;left=0;}
      else{left-=need;timer=0;stage++;}
    }
    if(stage===h.stage){h.growTimer=timer;return;}
    var hx=h.x,hz=h.z,htp=h.type;
    h.group.traverse(function(ch){if(ch.geometry)ch.geometry.dispose();if(ch.material)ch.material.dispose();});
    scene.remove(h.group);
    harvestItems.splice(idx,1);
    mkHarvestPlant(hx,hz,htp,stage);
    var created=harvestItems[harvestItems.length-1];
    if(created) created.growTimer=timer;
    rebuilt=true;
    if(stage===2){
      ripened++;
      if(live) showToast(HARVEST_TYPES[htp].emoji+' Hasat zamanı! Dokun! 🎉');
    }
  });
  if(rebuilt){
    harvestItems.forEach(function(it,i){
      it.group.children.forEach(function(ch){if(ch.userData.harvestIdx!==undefined) ch.userData.harvestIdx=i;});
    });
  }
  if(!live&&ripened) showToast(ripened+' ürün hasat için hazır! 🎉');
  return ripened;
}

// Hasat tıklama
window.addEventListener('pointerdown', function(e){
  if(e.target.closest('.ui-container')||e.target.closest('.spanel')||e.target.closest('#sidebar'))return;
  if(placementMode||deleteMode||flowerPlaceMode)return;
  var m2 = new THREE.Vector2((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  var r2 = new THREE.Raycaster(); r2.setFromCamera(m2, camera);
  var hbs = [];
  harvestItems.forEach(function(it){ it.group.children.forEach(function(ch){ if(ch.userData.harvestIdx!==undefined) hbs.push(ch); }); });
  var hits2 = r2.intersectObjects(hbs);
  if(!hits2.length)return;
  var idx = hits2[0].object.userData.harvestIdx;
  harvestPlant(idx);
});

// startPlace için hasat ekle
var _origStartPlace = window.startPlace;
window.startPlace = function(tp) {
  if(tp==='tomato'||tp==='strawberry'||tp==='cucumber') {
    placementType = tp; placementMode = true; controls.enabled = false;
    document.getElementById('pBar').classList.add('show');
    document.getElementById('pBar').querySelector('span').textContent = '🌱 Nereye dikelim?';
    document.getElementById('pBar').querySelector('button').setAttribute('onclick','window.cancelPlace()');
    openP = null;
    document.getElementById('decoPanel').classList.remove('open');
    document.getElementById('btnDeco').classList.remove('on');
    showToast('Nereye dikmek istiyorsun? 👆');
  } else { _origStartPlace(tp); }
};

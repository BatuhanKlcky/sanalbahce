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
function mkHarvestPlant(x, z, type, stage) {
  stage = stage || 0;
  var cfg = HARVEST_TYPES[type];
  if (!cfg) return;
  var g = new THREE.Group();
  var soil = new THREE.Mesh(new THREE.CircleGeometry(.62, 12),
    new THREE.MeshStandardMaterial({color:0x6a4428, roughness:1}));
  soil.rotation.x = -Math.PI/2; soil.position.y = .008; g.add(soil);
  var pivot = new THREE.Group(); g.add(pivot);
  var stemH=.36+stage*.22;
  var stem = new THREE.Mesh(new THREE.CylinderGeometry(.018,.026,stemH,6),
    new THREE.MeshStandardMaterial({color:0x2f6b32, roughness:.9}));
  stem.position.y = stemH/2; pivot.add(stem);
  if (stage > 0) {
    var lMat = new THREE.MeshStandardMaterial({color:0x217838, side:THREE.DoubleSide, roughness:.75});
    var lSh = new THREE.Shape(); lSh.moveTo(0,0); lSh.quadraticCurveTo(.22,.08,0,.42); lSh.quadraticCurveTo(-.06,.18,0,0);
    var lGeo = new THREE.ShapeGeometry(lSh, 6);
    var lf = new THREE.Mesh(lGeo, lMat); lf.position.set(.04,stemH*.55,0); lf.rotation.set(.2,.3,.6); pivot.add(lf);
    var lf2 = new THREE.Mesh(lGeo, lMat); lf2.position.set(-.04,stemH*.4,.02); lf2.rotation.set(-.15,-.4,-.55); pivot.add(lf2);
  }
  if (stage === 2) {
    var fruitGeo, fruitY=stemH*.72, fruitScale=null, fruitRot=null;
    if(type==='cucumber'){fruitGeo=new THREE.CylinderGeometry(.065,.05,.32,10);fruitY=stemH*.62;fruitRot=[0,0,.7];}
    else if(type==='pepper'){fruitGeo=new THREE.SphereGeometry(.1,12,10);fruitY=stemH*.78;fruitScale=[.7,1.25,.7];fruitRot=[.2,0,.35];}
    else if(type==='carrot'){fruitGeo=new THREE.ConeGeometry(.07,.36,10);fruitY=.16;}
    else if(type==='strawberry'){fruitGeo=new THREE.SphereGeometry(.1,12,10);fruitY=stemH*.7;fruitScale=[1,.82,1];}
    else fruitGeo=new THREE.SphereGeometry(.12,12,12);
    var fruit = new THREE.Mesh(fruitGeo,
      new THREE.MeshStandardMaterial({map:cropTexture(type),color:0xffffff,roughness:.62,metalness:0,emissive:0x000000,emissiveIntensity:0}));
    fruit.position.y = fruitY;
    if(fruitScale) fruit.scale.set(fruitScale[0],fruitScale[1],fruitScale[2]);
    if(fruitRot) fruit.rotation.set(fruitRot[0],fruitRot[1],fruitRot[2]);
    pivot.add(fruit);
    if(type==='carrot'){
      for(var li=0;li<3;li++){
        var leaf=new THREE.Mesh(new THREE.ConeGeometry(.02,.16,5), new THREE.MeshStandardMaterial({color:0x2f8a34,roughness:.8}));
        leaf.position.set(Math.cos(li*2.1)*.03,.4,Math.sin(li*2.1)*.03);
        leaf.rotation.z=(li-1)*.35; pivot.add(leaf);
      }
    }else{
      var cap=new THREE.Mesh(new THREE.SphereGeometry(.055,6,5), new THREE.MeshStandardMaterial({color:0x2c7a34,roughness:.8}));
      cap.scale.set(1.15,.4,1.15); cap.position.y=fruitY+(type==='strawberry'?.06:.1); pivot.add(cap);
    }
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.22,.012,6,20),
      new THREE.MeshStandardMaterial({color:0xe2b340, emissive:0xaa8800, emissiveIntensity:.45, roughness:.6}));
    ring.rotation.x = Math.PI/2; ring.position.y = .04; g.add(ring);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  var item = {group:g, type:type, stage:stage, growTimer:0, x:x, z:z, cfg:cfg, sway:pivot};
  harvestItems.push(item);
  // Tıklanabilir hitbox
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

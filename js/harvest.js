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

function mkHarvestPlant(x, z, type, stage) {
  stage = stage || 0;
  var cfg = HARVEST_TYPES[type];
  if (!cfg) return;
  var g = new THREE.Group();
  // Toprak yaması
  var soil = new THREE.Mesh(new THREE.CircleGeometry(.7, 12),
    new THREE.MeshStandardMaterial({color:0x3d1f00, roughness:1}));
  soil.rotation.x = -Math.PI/2; soil.position.y = .005; g.add(soil);
  // Sap
  var stem = new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.4+stage*.2,6),
    new THREE.MeshStandardMaterial({color:0x2d7a20, roughness:.9}));
  stem.position.y = .2+stage*.1; g.add(stem);
  // Yaprak
  if (stage > 0) {
    var lMat = new THREE.MeshStandardMaterial({color:0x1a8c30, side:THREE.DoubleSide, roughness:.8});
    var lSh = new THREE.Shape(); lSh.moveTo(0,0); lSh.quadraticCurveTo(.2,.1,0,.4); lSh.quadraticCurveTo(-.05,.2,0,0);
    var lGeo = new THREE.ShapeGeometry(lSh, 6);
    var lf = new THREE.Mesh(lGeo, lMat); lf.position.set(.05,.3,0); lf.rotation.set(.1,.2,.5); g.add(lf);
  }
  // Meyve (stage 2)
  if (stage === 2) {
    var fruitGeo, fruitY=.55, fruitScale=null;
    if(type==='cucumber'){fruitGeo=new THREE.CylinderGeometry(.07,.06,.3,8);fruitY=.7;}
    else if(type==='pepper'){fruitGeo=new THREE.SphereGeometry(.1,10,8);fruitY=.62;fruitScale=[.75,1.35,.75];}
    else if(type==='carrot'){fruitGeo=new THREE.ConeGeometry(.07,.34,8);fruitY=.3;}
    else fruitGeo=new THREE.SphereGeometry(.12,10,10);
    var fruit = new THREE.Mesh(fruitGeo,
      new THREE.MeshStandardMaterial({color:cfg.color, roughness:.5, emissive:cfg.color, emissiveIntensity:.1}));
    fruit.position.y = fruitY;
    if(fruitScale) fruit.scale.set(fruitScale[0],fruitScale[1],fruitScale[2]);
    g.add(fruit);
    // Parlayan halka (hasat hazır)
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.22,.02,6,20),
      new THREE.MeshStandardMaterial({color:0xffcc00, emissive:0xffaa00, emissiveIntensity:1.5}));
    ring.rotation.x = Math.PI/2; ring.position.y = .05; g.add(ring);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  var item = {group:g, type:type, stage:stage, growTimer:0, x:x, z:z, cfg:cfg};
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

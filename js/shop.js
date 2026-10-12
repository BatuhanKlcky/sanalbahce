// Magaza, nadir esyalar ve evcil hayvanlar.
// ── EVCİL HAYVAN ──────────────────────────────────────────────────────────
var pets = []; // {mesh, type, target, time, bobPhase}
var PET_TYPES = ['cat','dog'];

function mkCat(x, z) {
  var g = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({color:0xf5a050, roughness:.8});
  var wMat = new THREE.MeshStandardMaterial({color:0xffffff, roughness:.8});
  // Gövde
  var body = new THREE.Mesh(new THREE.SphereGeometry(.16,10,8), mat);
  body.scale.set(1,.75,1.3); body.position.y=.18; g.add(body);
  // Baş
  var head = new THREE.Mesh(new THREE.SphereGeometry(.12,10,8), mat);
  head.position.set(0,.35,.18); g.add(head);
  // Kulaklar
  [-.07,.07].forEach(function(ox){
    var ear = new THREE.Mesh(new THREE.ConeGeometry(.04,.08,4), mat);
    ear.position.set(ox,.48,.18); g.add(ear);
  });
  // Gözler
  var eMat = new THREE.MeshStandardMaterial({color:0x22aa44, emissive:0x004400, emissiveIntensity:.5});
  [-.04,.04].forEach(function(ox){
    var eye = new THREE.Mesh(new THREE.SphereGeometry(.02,6,6), eMat);
    eye.position.set(ox,.37,.29); g.add(eye);
  });
  // Kuyruk
  var tail = new THREE.Mesh(new THREE.CylinderGeometry(.015,.025,.28,6), mat);
  tail.position.set(0,.12,-.22); tail.rotation.x=-.8; g.add(tail);
  // Bacaklar
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(function(p){
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(.025,.02,.12,5), mat);
    leg.position.set(p[0]*.08,.06,p[1]*.1); g.add(leg);
  });
  g.position.set(x, 0, z);
  g.scale.setScalar(.9);
  scene.add(g);
  pets.push({mesh:g, type:'cat', target:null, time:Math.random()*100, bobPhase:Math.random()*Math.PI*2, tailAngle:0});
  showToast('🐱 Kedi bahçeye katıldı!');
  markDirty(); save(true);
}

function mkDog(x, z) {
  var g = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({color:0x8b5e3c, roughness:.85});
  var dMat = new THREE.MeshStandardMaterial({color:0x6b4020, roughness:.85});
  // Gövde
  var body = new THREE.Mesh(new THREE.SphereGeometry(.18,10,8), mat);
  body.scale.set(1,.7,1.5); body.position.y=.2; g.add(body);
  // Baş
  var head = new THREE.Mesh(new THREE.SphereGeometry(.14,10,8), mat);
  head.position.set(0,.38,.24); g.add(head);
  // Burun
  var snout = new THREE.Mesh(new THREE.SphereGeometry(.07,8,6), mat);
  snout.scale.set(1,.7,1.2); snout.position.set(0,.34,.36); g.add(snout);
  var nose = new THREE.Mesh(new THREE.SphereGeometry(.025,6,6), new THREE.MeshStandardMaterial({color:0x111111}));
  nose.position.set(0,.36,.43); g.add(nose);
  // Kulaklar (sarkık)
  [-.1,.1].forEach(function(ox){
    var ear = new THREE.Mesh(new THREE.SphereGeometry(.07,6,6), dMat);
    ear.scale.set(.5,1.2,.4); ear.position.set(ox,.46,.22); g.add(ear);
  });
  // Kuyruk
  var tail = new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.22,5), mat);
  tail.position.set(0,.28,-.28); tail.rotation.x=.6; g.add(tail);
  // Bacaklar
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(function(p){
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(.03,.025,.15,5), mat);
    leg.position.set(p[0]*.1,.07,p[1]*.12); g.add(leg);
  });
  g.position.set(x, 0, z);
  scene.add(g);
  pets.push({mesh:g, type:'dog', target:null, time:Math.random()*100, bobPhase:Math.random()*Math.PI*2, tailAngle:0});
  showToast('🐶 Köpek bahçeye katıldı!');
  markDirty(); save(true);
}

window.addPet = function(type) {
  if (pets.length >= 2) { showToast('En fazla 2 evcil hayvan! 🐾'); return; }
  var a = Math.random()*Math.PI*2, r = 5+Math.random()*6;
  if(type==='cat') mkCat(Math.cos(a)*r, Math.sin(a)*r);
  else mkDog(Math.cos(a)*r, Math.sin(a)*r);
};



// ── MAĞAZA SİSTEMİ ────────────────────────────────────────────────────────
var SHOP_ITEMS = {
  seeds: [
    {id:'rose',      emoji:'🌹', name:'Gül Tohumu',     desc:'Kırmızı zarif gül çiçeği',    price:30,  color:0xcc0022, type:'flower'},
    {id:'lotus',     emoji:'🪷', name:'Lotus Tohumu',   desc:'Nadir pembe lotus çiçeği',     price:50,  color:0xff69b4, type:'flower'},
    {id:'sunflower', emoji:'🌻', name:'Ayçiçeği',       desc:'Sarı dev ayçiçeği',            price:25,  color:0xffcc00, type:'flower'},
    {id:'tulip',     emoji:'🌷', name:'Lale Tohumu',    desc:'Klasik Türk lalesi',           price:35,  color:0xff3366, type:'flower'},
    {id:'bluebell',  emoji:'💙', name:'Çan Çiçeği',    desc:'Mavi sallanan çan çiçeği',     price:45,  color:0x4488ff, type:'flower'},
    {id:'cherry',    emoji:'🌸', name:'Kiraz Çiçeği',  desc:'Japon kiraz çiçeği',           price:60,  color:0xffb7c5, type:'flower'},
  ],
  items: [
    {id:'golden_pot',   emoji:'🏆', name:'Altın Saksı',   desc:'Özel altın renkli saksı',    price:80,  deco:'golden_pot'},
    {id:'crystal_pond', emoji:'💎', name:'Kristal Gölet', desc:'Parlayan mavi gölet',        price:120, deco:'crystal_pond'},
    {id:'magic_lamp',   emoji:'🔮', name:'Sihirli Fener', desc:'Mor ışık saçan fener',       price:100, deco:'magic_lamp'},
    {id:'rainbow_arch', emoji:'🌈', name:'Gökkuşağı Kemeri',desc:'Renkli taş kemer',        price:150, deco:'rainbow_arch'},
    {id:'fountain',     emoji:'⛲', name:'Çeşme',         desc:'Şırıl şırıl çeşme',          price:200, deco:'fountain'},
    {id:'treehouse',    emoji:'🏚️', name:'Ağaç Evi',     desc:'Mini ağaç üstü ev',           price:250, deco:'treehouse'},
  ],
  special: [
    {id:'angel_wing', emoji:'🪽', name:'Melek Kanadı', desc:'Beyaz altın kanat ve hale', price:3500, special:true},
    {id:'dragon_egg',  emoji:'🥚', name:'Ejder Yumurtası', desc:'Gizemli parlayan yumurta',  price:1000, special:true},
    {id:'moonflower',  emoji:'🌕', name:'Ay Çiçeği',      desc:'Sadece gece açan çiçek',     price:700, special:true},
    {id:'golden_tree', emoji:'🌳', name:'Altın Ağaç',     desc:'Yaprakları altın döken ağaç',price:550, special:true},
    {id:'firefly_jar', emoji:'🫙', name:'Ateşböceği Kavanozu',desc:'Geceleri ışıl ışıl',     price:480, special:true},
  ]
};

var purchasedItems = {};
var currentShopTab = 'seeds';
var selectedSeed = null;

function seedCount(id){
  var v = purchasedItems[id];
  return typeof v === 'number' && v > 0 ? v : 0;
}
function seedItem(id){
  var item = null;
  SHOP_ITEMS.seeds.forEach(function(s){ if(s.id===id) item=s; });
  return item;
}
function readySeedId(){
  if(selectedSeed && seedCount(selectedSeed)>0) return selectedSeed;
  var id = null;
  SHOP_ITEMS.seeds.forEach(function(s){ if(!id && seedCount(s.id)>0) id=s.id; });
  return id;
}
window.hasSeed = function(){ return !!readySeedId(); };
window.takeSeed = function(){
  var id = readySeedId();
  if(!id) return null;
  var left = seedCount(id) - 1;
  if(left > 0) purchasedItems[id] = left;
  else delete purchasedItems[id];
  selectedSeed = readySeedId();
  if(selectedSeed) purchasedItems.sel = selectedSeed;
  else delete purchasedItems.sel;
  saveShop();
  renderShop();
  return seedItem(id);
};
window.plantSeedAt = function(x, z){
  var seed = window.takeSeed();
  if(!seed){ showToast('Çantada tohum yok 🌱'); return false; }
  mkFlower(x, z, {c:seed.color, t:Math.floor(Math.random()*4), h:.15, b:0, w:1, isStunted:false});
  sndPlant(); chkTask('p', 20); stats.plant++; saveStats(); updStats(); save(true);
  showToast(seed.emoji+' ekildi');
  return true;
};
window.placeOwnedWing = function(){
  if(!purchasedItems._placeWing) return;
  delete purchasedItems._placeWing;
  saveShop();
  var has = false;
  decos.forEach(function(d){ if(d.type==='angel_wing') has=true; });
  if(!has) mkAngelWing(0, -4);
};

function loadShop(){
  try{ purchasedItems=JSON.parse(localStorage.getItem('gdn_shop')||'{}'); }catch(e){ purchasedItems={}; }
  if(!purchasedItems || typeof purchasedItems!=='object') purchasedItems={};
  SHOP_ITEMS.seeds.forEach(function(s){ if(purchasedItems[s.id]===true) delete purchasedItems[s.id]; });
  if(purchasedItems.anwwqgel_wing || purchasedItems.angel_wingwg || purchasedItems.angel_winggg){
    purchasedItems.angel_wing = true;
    purchasedItems._placeWing = true;
    delete purchasedItems.anwwqgel_wing;
    delete purchasedItems.angel_wingwg;
    delete purchasedItems.angel_winggg;
    saveShop();
  }
  selectedSeed = typeof purchasedItems.sel==='string' ? purchasedItems.sel : null;
  renderShop();
}
function saveShop(){
  localStorage.setItem('gdn_shop', JSON.stringify(purchasedItems));
}

window.shopTab = function(tab) {
  currentShopTab = tab;
  document.querySelectorAll('.shop-tab').forEach(function(el,i){
    el.classList.toggle('active', ['seeds','items','special'][i]===tab);
  });
  renderShop();
};

function renderShop() {
  var grid = document.getElementById('shopGrid');
  var coinBar = document.getElementById('coinBarAmt');
  if(coinBar) coinBar.textContent = stats.coin;
  if(!grid) return;
  
  var bag = document.getElementById('seedBagLine');
  if(bag){
    var parts = [];
    SHOP_ITEMS.seeds.forEach(function(s){ var n=seedCount(s.id); if(n>0) parts.push(s.emoji+' '+n); });
    bag.textContent = parts.length ? ('Çanta: '+parts.join(' · ')) : '';
  }
  var items = SHOP_ITEMS[currentShopTab] || [];
  
  grid.innerHTML = items.map(function(item) {
    var count = item.type==='flower' ? seedCount(item.id) : 0;
    var owned = item.type!=='flower' && !!purchasedItems[item.id];
    var canAfford = stats.coin >= item.price;
    var cls = 'shop-item' + (owned ? ' owned' : '') + (!canAfford && !owned ? ' cant-afford' : '');
    var badge = count ? '<div class="shop-owned-badge">x'+count+'</div>' : (owned ? '<div class="shop-owned-badge">Koy</div>' : '');
    return `<div class="${cls}" onclick="window.buyItem('${item.id}')">
        ${badge}
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
        ${owned ? '<div class="shop-price">Koy</div>' : '<div class="shop-price">💰 ' + item.price + '</div>'}
      </div>`;
  }).join('');
}

window.beginShopPlace = function(item){
  if(typeof flowerPlaceMode !== 'undefined') flowerPlaceMode = false;
  placementType = item.deco || item.id;
  placementMode = true;
  controls.enabled = false;
  var bar = document.getElementById('pBar');
  bar.classList.add('show');
  bar.querySelector('span').textContent = item.emoji+' nereye koyalım?';
  bar.querySelector('button').setAttribute('onclick', 'window.cancelPlace()');
  openP = null;
  document.getElementById('shopPanel').classList.remove('open');
  document.getElementById('btnShop').classList.remove('on');
  showToast(item.emoji+' yere dokun');
};

window.placeShopDeco = function(tp, x, z, ang){
  if(tp==='golden_pot') mkGoldenPot(x,z);
  else if(tp==='crystal_pond') mkCrystalPond(x,z);
  else if(tp==='magic_lamp') mkMagicLamp(x,z);
  else if(tp==='rainbow_arch') mkRainbowArch(x,z,ang);
  else if(tp==='fountain') mkFountain(x,z);
  else if(tp==='treehouse') mkTreehouse(x,z);
  else if(tp==='angel_wing') mkAngelWing(x,z);
  else if(tp==='dragon_egg'||tp==='moonflower'||tp==='golden_tree'||tp==='firefly_jar'){
    var item = null;
    SHOP_ITEMS.special.forEach(function(s){ if(s.id===tp) item=s; });
    if(!item) return false;
    placeSpecial(item, x, z);
  } else return false;
  return true;
};

window.buyItem = function(id) {
  var item = null;
  Object.values(SHOP_ITEMS).forEach(function(arr){ arr.forEach(function(i){ if(i.id===id) item=i; }); });
  if(!item) return;
  var seed = item.type==='flower';
  if(stats.coin < item.price && (seed || !purchasedItems[id])) { showToast('Yeterli coin yok! 💰'); return; }
  if(seed){
    stats.coin -= item.price;
    purchasedItems[id] = seedCount(id) + 1;
    selectedSeed = id;
    purchasedItems.sel = id;
    saveShop(); saveStats(); updStats(); renderShop();
    showToast(item.emoji+' çantada: '+purchasedItems[id]);
    tone(880,'sine',.1,.12); tone(1100,'sine',.15,.1,.12); tone(1320,'sine',.2,.1,.25);
    return;
  }
  if(!purchasedItems[id]){
    stats.coin -= item.price;
    purchasedItems[id] = true;
    saveShop(); saveStats(); updStats(); renderShop();
    tone(880,'sine',.1,.12); tone(1100,'sine',.15,.1,.12); tone(1320,'sine',.2,.1,.25);
  }
  window.beginShopPlace(item);
};

// ── ÖZEL MAĞAZA OBJELERİ ───────────────────────────────────────────────────
function mkGoldenPot(x,z){
  var g=new THREE.Group();
  var pM=new THREE.MeshStandardMaterial({color:0xd4a843,roughness:.3,metalness:.7,emissive:0x8b6000,emissiveIntensity:.3});
  var pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.32,12),pM);pot.position.y=.16;g.add(pot);
  var rim=new THREE.Mesh(new THREE.TorusGeometry(.23,.03,6,16),pM);rim.rotation.x=Math.PI/2;rim.position.y=.32;g.add(rim);
  var lt=new THREE.PointLight(0xffcc44,.8,2.5);lt.position.y=.5;g.add(lt);
  var fc=[0xff3366,0xff9900,0xcc44ff,0x00ddaa][Math.floor(Math.random()*4)];
  var fl=new THREE.Mesh(new THREE.SphereGeometry(.1,8,8),new THREE.MeshStandardMaterial({color:fc,emissive:fc,emissiveIntensity:.4}));
  fl.position.y=.55;g.add(fl);
  g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'golden_pot',light:lt});markDirty();
}

function mkCrystalPond(x,z){
  var g=new THREE.Group();
  var wM=new THREE.MeshStandardMaterial({color:0x44ddff,roughness:0,metalness:.3,transparent:true,opacity:.8,emissive:0x0044aa,emissiveIntensity:.4});
  var w=new THREE.Mesh(new THREE.CircleGeometry(2,32),wM);w.rotation.x=-Math.PI/2;w.position.y=.02;g.add(w);
  var lt=new THREE.PointLight(0x44aaff,.8,5);lt.position.y=.3;g.add(lt);
  // Kristal taşlar
  for(var i=0;i<12;i++){
    var a=(i/12)*Math.PI*2,r=1.9+(Math.random()-.5)*.2;
    var crystal=new THREE.Mesh(new THREE.ConeGeometry(.08,.25,5),new THREE.MeshStandardMaterial({color:0x88eeff,transparent:true,opacity:.8,emissive:0x004488,emissiveIntensity:.5}));
    crystal.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);crystal.rotation.y=Math.random()*Math.PI;g.add(crystal);
  }
  g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'crystal_pond',light:lt});markDirty();
}

function mkMagicLamp(x,z){
  var g=new THREE.Group();
  var pM=new THREE.MeshStandardMaterial({color:0x4a0060,roughness:.4,metalness:.4});
  var pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.8,8),pM);pole.position.y=.9;g.add(pole);
  var box=new THREE.Mesh(new THREE.BoxGeometry(.35,.4,.35),pM);box.position.y=1.9;g.add(box);
  var lt=new THREE.PointLight(0xaa44ff,2,5);lt.position.y=1.9;g.add(lt);
  var glass=new THREE.Mesh(new THREE.BoxGeometry(.28,.32,.28),new THREE.MeshStandardMaterial({color:0xcc88ff,emissive:0xaa44ff,emissiveIntensity:3,transparent:true,opacity:.7}));
  glass.position.y=1.9;g.add(glass);
  var rf=new THREE.Mesh(new THREE.ConeGeometry(.28,.2,4),pM);rf.position.y=2.2;g.add(rf);
  g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'magic_lamp',light:lt});markDirty();
}

function mkRainbowArch(x,z,angle){
  var g=new THREE.Group();
  var colors=[0xff0000,0xff8800,0xffff00,0x00cc00,0x0088ff,0x8800ff];
  colors.forEach(function(col,i){
    var r=.7+i*.12;
    var arc=new THREE.Mesh(new THREE.TorusGeometry(r,.04,6,32,Math.PI),
      new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.4,roughness:.5}));
    arc.rotation.z=Math.PI;arc.position.set(0,1.8,0);g.add(arc);
  });
  // Ayaklar
  var stM=new THREE.MeshStandardMaterial({color:0xc8a882,roughness:.8});
  var c1=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,1.8,8),stM);c1.position.set(-.7,.9,0);g.add(c1);
  var c2=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,1.8,8),stM);c2.position.set(.7,.9,0);g.add(c2);
  g.position.set(x,0,z);g.rotation.y=angle||0;scene.add(g);decos.push({group:g,type:'rainbow_arch'});markDirty();
}

function mkFountain(x,z){
  var g=new THREE.Group();
  var sM=new THREE.MeshStandardMaterial({color:0xd4c4a0,roughness:.8});
  // Havuz
  var base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,.25,16,1,true),sM);base.position.y=.12;g.add(base);
  var floor=new THREE.Mesh(new THREE.CircleGeometry(1.4,16),sM);floor.rotation.x=-Math.PI/2;floor.position.y=.01;g.add(floor);
  // Su
  var wM=new THREE.MeshStandardMaterial({color:0x44aadd,roughness:0,metalness:.2,transparent:true,opacity:.8});
  var water=new THREE.Mesh(new THREE.CircleGeometry(1.3,16),wM);water.rotation.x=-Math.PI/2;water.position.y=.2;g.add(water);
  // Orta sütun
  var col=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.6,8),sM);col.position.y=.55;g.add(col);
  // Üst kase
  var bowl=new THREE.Mesh(new THREE.CylinderGeometry(.5,.3,.15,12,1,true),sM);bowl.position.y=.9;g.add(bowl);
  // Su ışığı
  var lt=new THREE.PointLight(0x44aaff,.6,4);lt.position.y=.5;g.add(lt);
  g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'fountain',light:lt});markDirty();
}

function mkTreehouse(x,z){
  var g=new THREE.Group();
  // Ağaç
  var tr=new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,3,8),new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:.95}));
  tr.position.y=1.5;g.add(tr);
  // Yapraklar
  [[0,3.2,0,1.4],[0,3.9,0,1.1],[0,4.5,0,.8]].forEach(function(p,i){
    var l=new THREE.Mesh(new THREE.ConeGeometry(p[3],p[3]*1.3,8),new THREE.MeshStandardMaterial({color:[0x1a5c30,0x1e6e38,0x155228][i],roughness:.9}));
    l.position.set(p[0],p[1],p[2]);g.add(l);
  });
  // Ev platformu
  var plat=new THREE.Mesh(new THREE.BoxGeometry(1.4,.1,1.2),new THREE.MeshStandardMaterial({color:0x8b5e2a,roughness:.9}));
  plat.position.y=2.2;g.add(plat);
  // Ev
  var walls=new THREE.Mesh(new THREE.BoxGeometry(1.1,1,.9),new THREE.MeshStandardMaterial({color:0xf5e6d0,roughness:.85}));
  walls.position.y=2.8;g.add(walls);
  var roof=new THREE.Mesh(new THREE.ConeGeometry(.85,.6,4),new THREE.MeshStandardMaterial({color:0x8b2200,roughness:.8}));
  roof.rotation.y=Math.PI/4;roof.position.y=3.6;g.add(roof);
  var lt=new THREE.PointLight(0xffeeaa,.6,3);lt.position.y=2.8;g.add(lt);
  g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'treehouse',light:lt});markDirty();
}


function mkAngelWing(x, z) {
  var g = new THREE.Group();

  // ── MATERYAL ──────────────────────────────────────────────────────────────
  var baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: .3, metalness: .15,
    emissive: 0xffe8aa, emissiveIntensity: .25,
    side: THREE.DoubleSide, transparent: true, opacity: .96
  });
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a843, roughness: .2, metalness: .8,
    emissive: 0x8b6000, emissiveIntensity: .4
  });
  var glowMat = new THREE.MeshStandardMaterial({
    color: 0xfffaee, emissive: 0xffe8aa, emissiveIntensity: 1.8,
    transparent: true, opacity: .35, side: THREE.DoubleSide
  });

  // ── KANAT OLUŞTURUCU ──────────────────────────────────────────────────────
  function makeWing(side) {
    var wg = new THREE.Group();
    var s = side; // 1 = sağ, -1 = sol

    // Ana kanat gövdesi (büyük kavisli şekil)
    var wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(s*.3, .4, s*.8, .8, s*.6, 1.6);
    wingShape.bezierCurveTo(s*.5, 2.1, s*.2, 2.4, 0, 2.6);
    wingShape.bezierCurveTo(s*-.1, 2.2, s*-.05, 1.8, 0, 1.4);
    wingShape.bezierCurveTo(s*.1, 1.0, s*.05, .5, 0, 0);

    var wingGeo = new THREE.ShapeGeometry(wingShape, 24);
    var wingMesh = new THREE.Mesh(wingGeo, baseMat.clone());
    wingMesh.rotation.x = -.15;
    wg.add(wingMesh);

    // Glow layer (biraz büyük, arkada)
    var glowShape = new THREE.Shape();
    glowShape.moveTo(0, -.05);
    glowShape.bezierCurveTo(s*.35, .38, s*.88, .82, s*.65, 1.65);
    glowShape.bezierCurveTo(s*.55, 2.15, s*.22, 2.45, 0, 2.68);
    glowShape.bezierCurveTo(s*-.15, 2.25, s*-.08, 1.82, 0, 1.38);
    glowShape.bezierCurveTo(s*.12, .98, s*.06, .48, 0, -.05);
    var glowGeo = new THREE.ShapeGeometry(glowShape, 24);
    var glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.rotation.x = -.15;
    glowMesh.position.z = -.02;
    wg.add(glowMesh);

    // Tüy detayları — uzun ince şeritler
    var featherCount = 10;
    for (var i = 0; i < featherCount; i++) {
      var t = i / (featherCount - 1);
      var fy = t * 2.4;
      var fx = s * (.5 * Math.sin(t * Math.PI) + .05);
      var flen = .55 + .3 * Math.sin(t * Math.PI);
      var fwidth = .06 + .025 * Math.sin(t * Math.PI);

      var fShape = new THREE.Shape();
      fShape.moveTo(0, 0);
      fShape.bezierCurveTo(fwidth, flen*.3, fwidth*.8, flen*.7, 0, flen);
      fShape.bezierCurveTo(-fwidth*.8, flen*.7, -fwidth, flen*.3, 0, 0);
      var fGeo = new THREE.ShapeGeometry(fShape, 8);
      var fMat = baseMat.clone();
      fMat.emissiveIntensity = .15 + .2 * (1 - t);
      var fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(fx, fy, .01 + i*.002);
      fMesh.rotation.z = s * (.2 - t * .35);
      fMesh.rotation.x = -.1;
      wg.add(fMesh);
    }

    // Alt tüyler (kısa, aşağıda)
    for (var j = 0; j < 6; j++) {
      var jt = j / 5;
      var jShape = new THREE.Shape();
      jShape.moveTo(0,0);
      jShape.bezierCurveTo(.04,.12,.03,.28,0,.35);
      jShape.bezierCurveTo(-.03,.28,-.04,.12,0,0);
      var jGeo = new THREE.ShapeGeometry(jShape, 6);
      var jMesh = new THREE.Mesh(jGeo, baseMat.clone());
      jMesh.position.set(s*(jt*.4+.02), jt*.5-.05, .015);
      jMesh.rotation.z = s * (-.3 + jt*.5);
      wg.add(jMesh);
    }

    return wg;
  }

  // Sağ kanat
  var rightWing = makeWing(1);
  rightWing.position.set(.12, .15, 0);
  g.add(rightWing);

  // Sol kanat (aynalı)
  var leftWing = makeWing(-1);
  leftWing.position.set(-.12, .15, 0);
  leftWing.rotation.y = Math.PI;
  leftWing.position.z = .04;
  g.add(leftWing);

  // ── ALTIN SÜSLER ──────────────────────────────────────────────────────────
  // Ortadaki altın taban
  var baseGeo = new THREE.CylinderGeometry(.18, .24, .12, 12);
  var baseMesh = new THREE.Mesh(baseGeo, goldMat);
  baseMesh.position.y = .06;
  g.add(baseMesh);

  // Altın çerçeve - kanat birleşim noktası
  var centerGeo = new THREE.TorusGeometry(.1, .025, 8, 16);
  var center = new THREE.Mesh(centerGeo, goldMat);
  center.rotation.x = Math.PI/2;
  center.position.y = .22;
  g.add(center);

  // Altın yıldız süsleri
  function mkStar(px, py, pz, size) {
    var sg = new THREE.Group();
    for (var k = 0; k < 6; k++) {
      var a = (k/6)*Math.PI*2;
      var bar = new THREE.Mesh(
        new THREE.CylinderGeometry(size*.06, size*.06, size, 4),
        goldMat
      );
      bar.rotation.z = a;
      sg.add(bar);
    }
    var core = new THREE.Mesh(new THREE.SphereGeometry(size*.2, 6, 6), goldMat);
    sg.add(core);
    sg.position.set(px, py, pz);
    return sg;
  }
  g.add(mkStar(0, 2.5, .02, .18));   // tepe yıldız
  g.add(mkStar(.5, 1.8, .02, .1));   // sağ küçük
  g.add(mkStar(-.5, 1.8, .02, .1));  // sol küçük

  // ── IŞIKLAR ───────────────────────────────────────────────────────────────
  // Ana yumuşak beyaz ışık
  var lt = new THREE.PointLight(0xfff8e1, 1.4, 4.5);
  lt.position.set(0, 1.2, .3);
  g.add(lt);

  // Altın parıltı
  var lt2 = new THREE.PointLight(0xffcc44, .6, 2);
  lt2.position.set(0, 2.4, .1);
  g.add(lt2);

  // ── HALO (IŞIK HALKASI) ───────────────────────────────────────────────────
  var haloGeo = new THREE.TorusGeometry(.32, .018, 8, 32);
  var haloMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 2.5,
    transparent: true, opacity: .85, metalness: .6
  });
  var halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI/2 - .3;
  halo.position.set(0, 2.85, -.08);
  g.add(halo);

  g.position.set(x, 0, z);
  scene.add(g);
  decos.push({group: g, type: 'angel_wing', light: lt, light2: lt2, halo: halo});
  markDirty();
}

function placeSpecial(item, x, z){
  var g=new THREE.Group();
  if(item.id==='dragon_egg'){
    var egg=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),new THREE.MeshStandardMaterial({color:0x440088,roughness:.3,metalness:.4,emissive:0x220044,emissiveIntensity:.5}));
    egg.scale.y=1.3;egg.position.y=.3;g.add(egg);
    var lt=new THREE.PointLight(0x8844ff,.8,3);lt.position.y=.5;g.add(lt);
    decos.push({group:g,type:'dragon_egg',light:lt});
  } else if(item.id==='moonflower'){
    var stem2=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.6,6),new THREE.MeshStandardMaterial({color:0x334455}));
    stem2.position.y=.3;g.add(stem2);
    var fl=new THREE.Mesh(new THREE.SphereGeometry(.15,10,10),new THREE.MeshStandardMaterial({color:0xddeeff,emissive:0x8899cc,emissiveIntensity:1.5,transparent:true,opacity:.9}));
    fl.position.y=.7;g.add(fl);
    var lt2=new THREE.PointLight(0xaabbff,.6,3);lt2.position.y=.8;g.add(lt2);
    decos.push({group:g,type:'moonflower',light:lt2});
  } else if(item.id==='golden_tree'){
    var gtr=new THREE.Mesh(new THREE.CylinderGeometry(.15,.22,2,8),new THREE.MeshStandardMaterial({color:0x8b5e1e,roughness:.9}));
    gtr.position.y=1;g.add(gtr);
    [[0,2.4,0,1.2],[0,3.0,0,.9],[0,3.5,0,.65]].forEach(function(p){
      var l=new THREE.Mesh(new THREE.ConeGeometry(p[3],p[3]*1.4,8),new THREE.MeshStandardMaterial({color:0xd4a843,roughness:.4,metalness:.3,emissive:0x8b6000,emissiveIntensity:.3}));
      l.position.set(p[0],p[1],p[2]);g.add(l);
    });
    var lt3=new THREE.PointLight(0xffcc44,.5,4);lt3.position.y=2;g.add(lt3);
    decos.push({group:g,type:'golden_tree',light:lt3});
  } else if(item.id==='firefly_jar'){
    var jar=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.3,10),new THREE.MeshStandardMaterial({color:0x88aacc,transparent:true,opacity:.5,roughness:.1}));
    jar.position.y=.15;g.add(jar);
    var lt4=new THREE.PointLight(0x88ff44,1.2,3);lt4.position.y=.3;g.add(lt4);
    var glow=new THREE.Mesh(new THREE.SphereGeometry(.08,8,8),new THREE.MeshStandardMaterial({color:0x88ff44,emissive:0x44ff00,emissiveIntensity:2}));
    glow.position.y=.18;g.add(glow);
    decos.push({group:g,type:'firefly_jar',light:lt4});
  }
  g.position.set(x,0,z);scene.add(g);markDirty();
}



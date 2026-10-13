// Cicekler, kelebekler ve zararli bocekler.
// ── RAYCASTER (bad bug tap) ──────────────────────────────────────────────────
var ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
window.addEventListener('pointerdown',function(e){
  if(e.target.closest('.ui-container')||e.target.closest('.spanel')||e.target.closest('#sidebar')||placementMode)return;
  mouse.x=(e.clientX/innerWidth)*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;
  ray.setFromCamera(mouse,camera);
  var hits=ray.intersectObjects(badM);if(!hits.length)return;
  var id=hits[0].object.userData.id;
  var idx=badBugs.findIndex(function(b){return b.id===id;});
  if(idx>-1){var bg=badBugs[idx];bg.group.traverse(function(c){if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});scene.remove(bg.group);badBugs.splice(idx,1);}
  var mi=badM.findIndex(function(m){return m.userData.id===id;});if(mi>-1)badM.splice(mi,1);
  document.getElementById('bdC').innerText=badBugs.length;sndKill();showToast('Zararlı uzaklaştırıldı!');markDirty();save(true);
});

// ── BAD BUG ──────────────────────────────────────────────────────────────────
function mkBadBug(ti){var g=new THREE.Group(),bG=new THREE.SphereGeometry(.15,10,8);bG.scale(1,.55,1.3);var body=new THREE.Mesh(bG,new THREE.MeshStandardMaterial({color:0x8b0000,roughness:.5,metalness:.1}));g.add(body);var sM=new THREE.MeshStandardMaterial({color:0xff2200,roughness:.4});[-.05,.07].forEach(function(z){var s=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),sM);s.position.set(0,.09,z);s.scale.set(1,.3,.7);g.add(s);});var lM=new THREE.MeshStandardMaterial({color:0x3a0000,roughness:.8});for(var i=0;i<3;i++){[-1,1].forEach(function(sd){var l=new THREE.Mesh(new THREE.CylinderGeometry(.012,.008,.22,4),lM);l.position.set(sd*.14,-.04,(i-1)*.1);l.rotation.z=sd*(Math.PI/2.5+(i-1)*.2);l.rotation.x=.3;g.add(l);});}var hd=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshStandardMaterial({color:0x8b0000}));hd.scale.set(.8,.7,1);hd.position.set(0,0,.17);g.add(hd);var hb=new THREE.Mesh(new THREE.SphereGeometry(.9,6,6),new THREE.MeshBasicMaterial({visible:false}));hb.userData.id=badID;g.add(hb);g.position.set((Math.random()-.5)*22,6+Math.random()*4,(Math.random()-.5)*22);scene.add(g);badBugs.push({id:badID,group:g,ti:ti,lp:Math.random()*Math.PI*2});badM.push(hb);badID++;document.getElementById('bdC').innerText=badBugs.length;markDirty();}

// ── FLOWER ───────────────────────────────────────────────────────────────────
var FLOWER_KINDS={
  rose:{shape:0,color:0xcc0022},
  sunflower:{shape:2,color:0xffcc00},
  tulip:{shape:'tulip',color:0xff3366},
  lotus:{shape:'lotus',color:0xff69b4},
  bluebell:{shape:'bell',color:0x4488ff},
  cherry:{shape:'cherry',color:0xffb7c5}
};
function flowerLook(st){
  var kind=st&&st.k, spec=kind&&FLOWER_KINDS[kind];
  var cols=[0xff3366,0x1a8cff,0xff9900,0xcc44ff,0x00ddaa,0xff6644];
  if(spec) return {c:spec.color, t:spec.shape, k:kind};
  return {c:st&&st.c?st.c:cols[Math.floor(Math.random()*cols.length)], t:st&&st.t!==undefined?st.t:Math.floor(Math.random()*4), k:''};
}
function petalMat(col){return new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:.55});}
function petalGeo(w,h){var sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(w,h*.2,w*.65,h*.72,0,h);sh.bezierCurveTo(-w*.65,h*.72,-w,h*.2,0,0);return new THREE.ShapeGeometry(sh,8);}
function headTulip(col){var g=new THREE.Group(),geo=petalGeo(.14,.52);for(var i=0;i<6;i++){var p=new THREE.Mesh(geo,petalMat(col));p.rotation.y=(i/6)*Math.PI*2;p.rotation.x=.42;p.position.y=.02;g.add(p);}var c=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),new THREE.MeshStandardMaterial({color:0xffee66,roughness:.8}));c.position.y=.16;g.add(c);return g;}
function headLotus(col){var g=new THREE.Group();[8,10].forEach(function(n,ring){var geo=petalGeo(ring?0.16:0.11,.46-ring*.08);for(var i=0;i<n;i++){var p=new THREE.Mesh(geo,petalMat(col));p.rotation.order='YXZ';p.rotation.y=(i/n)*Math.PI*2+(ring*.2);p.rotation.x=1.05+ring*.35;p.position.y=.02;g.add(p);}});var c=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),new THREE.MeshStandardMaterial({color:0xffe08a,roughness:.7}));c.scale.y=.35;c.position.y=.06;g.add(c);return g;}
function headBell(col){var g=new THREE.Group(),mat=petalMat(col);for(var i=0;i<4;i++){var a=(i/4)*Math.PI*2;var bell=new THREE.Mesh(new THREE.ConeGeometry(.08,.22,8),mat);bell.position.set(Math.cos(a)*.1,-.04,Math.sin(a)*.1);g.add(bell);}return g;}
function headCherry(col){var g=new THREE.Group(),geo=new THREE.CircleGeometry(.11,8);for(var i=0;i<5;i++){var a=(i/5)*Math.PI*2;var p=new THREE.Mesh(geo,petalMat(col));p.position.set(Math.cos(a)*.09,.03,Math.sin(a)*.09);p.lookAt(0,.2,0);g.add(p);}var c=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),new THREE.MeshStandardMaterial({color:0xffee77,roughness:.8}));c.position.y=.05;g.add(c);return g;}
function bldHead(tp,col){
if(tp==='tulip')return headTulip(col);
if(tp==='lotus')return headLotus(col);
if(tp==='bell')return headBell(col);
if(tp==='cherry')return headCherry(col);
var g=new THREE.Group(),pM=new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:.55});
if(tp===0){var cg=new THREE.SphereGeometry(.14,10,10);cg.scale(1,.5,1);var c=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xffcc44,roughness:1,emissive:0x442200,emissiveIntensity:.4}));c.position.y=.05;g.add(c);[{n:5,r:.14,t:.55,s:.55,y:.02},{n:7,r:.22,t:.9,s:.8,y:-.02},{n:7,r:.3,t:1.15,s:1,y:-.05}].forEach(function(l){var sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.08,.05,.12,.18,.10,.32);sh.bezierCurveTo(.07,.44,0,.50,0,.50);sh.bezierCurveTo(-.07,.50,-.12,.44,-.10,.32);sh.bezierCurveTo(-.12,.18,-.08,.05,0,0);var geo=new THREE.ShapeGeometry(sh,10);for(var i=0;i<l.n;i++){var m=pM.clone();m.color=new THREE.Color(col);var p=new THREE.Mesh(geo,m);p.scale.setScalar(l.s);p.rotation.y=(i/l.n)*Math.PI*2;p.rotation.x=l.t;p.position.set(Math.sin(p.rotation.y)*l.r,l.y,Math.cos(p.rotation.y)*l.r);g.add(p);}});
}else if(tp===1){var c2=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),new THREE.MeshStandardMaterial({color:0xffee88,roughness:1}));c2.position.y=.08;g.add(c2);var sh2=new THREE.Shape();sh2.moveTo(0,0);sh2.bezierCurveTo(.13,.05,.18,.25,.14,.55);sh2.bezierCurveTo(.10,.80,0,.88,0,.88);sh2.bezierCurveTo(-.10,.88,-.18,.80,-.14,.55);sh2.bezierCurveTo(-.18,.25,-.13,.05,0,0);var geo2=new THREE.ShapeGeometry(sh2,12);for(var i=0;i<6;i++){var m=pM.clone();m.color=new THREE.Color(col);var p=new THREE.Mesh(geo2,m);p.rotation.y=(i/6)*Math.PI*2;p.rotation.x=Math.PI/3.2;p.position.y=.02;g.add(p);}
}else if(tp===2){var disk=new THREE.Mesh(new THREE.CircleGeometry(.2,24),new THREE.MeshStandardMaterial({color:0xd35400,roughness:.85,emissive:0x5a2400,emissiveIntensity:.25,side:THREE.DoubleSide}));disk.rotation.x=-Math.PI/2;disk.position.y=.05;g.add(disk);for(var i=0;i<16;i++){var a=Math.random()*Math.PI*2,r=Math.random()*.15;var bmp=new THREE.Mesh(new THREE.SphereGeometry(.022,5,5),new THREE.MeshStandardMaterial({color:0xf0a020,roughness:1}));bmp.position.set(Math.cos(a)*r,.075,Math.sin(a)*r);g.add(bmp);}var sh3=new THREE.Shape();sh3.moveTo(0,0);sh3.quadraticCurveTo(.16,.12,.1,.46);sh3.quadraticCurveTo(0,.56,-.1,.46);sh3.quadraticCurveTo(-.16,.12,0,0);var geo3=new THREE.ShapeGeometry(sh3,8);for(var i=0;i<16;i++){var m=pM.clone();m.color=new THREE.Color(col);var p=new THREE.Mesh(geo3,m);p.rotation.order='YXZ';p.rotation.y=(i/16)*Math.PI*2;p.rotation.x=1.25;p.position.y=.02;g.add(p);}
}else{var cg3=new THREE.SphereGeometry(.10,8,8);cg3.scale(1,.4,.8);var c3=new THREE.Mesh(cg3,new THREE.MeshStandardMaterial({color:0xffee00,roughness:.8,emissive:0x443300,emissiveIntensity:.3}));c3.position.y=.03;g.add(c3);var sh4=new THREE.Shape();sh4.moveTo(0,0);sh4.bezierCurveTo(.15,.02,.22,.25,.18,.55);sh4.bezierCurveTo(.13,.80,0,.85,0,.85);sh4.bezierCurveTo(-.13,.85,-.22,.80,-.18,.55);sh4.bezierCurveTo(-.22,.25,-.15,.02,0,0);var geo4=new THREE.ShapeGeometry(sh4,12);[0,Math.PI*2/3,Math.PI*4/3].forEach(function(a){var m=pM.clone();m.color=new THREE.Color(col);var p=new THREE.Mesh(geo4,m);p.rotation.y=a;p.rotation.x=Math.PI/2.2;g.add(p);});}
return g;}

function mkFlower(x,z,st){var group=new THREE.Group();var look=flowerLook(st);var col=look.c;var tp=look.t;var gp=new THREE.Mesh(new THREE.CircleGeometry(.9,20),new THREE.MeshStandardMaterial({color:0x0f2e1a,transparent:true,opacity:.5}));gp.rotation.x=-Math.PI/2;gp.position.y=.01;group.add(gp);var cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.04,.3,.02),new THREE.Vector3(.02,.7,-.01),new THREE.Vector3(0,1,0)]);var stem=new THREE.Mesh(new THREE.TubeGeometry(cv,8,.035,5,false),new THREE.MeshStandardMaterial({color:0x1e5e38,roughness:.9}));group.add(stem);var lsh=new THREE.Shape();lsh.moveTo(0,0);lsh.quadraticCurveTo(.18,.12,0,.42);lsh.quadraticCurveTo(-.05,.22,0,0);var lG=new THREE.ShapeGeometry(lsh,8);var lM=new THREE.MeshStandardMaterial({color:0x1a5c30,side:THREE.DoubleSide,roughness:.8});var l1=new THREE.Mesh(lG,lM);l1.position.set(.05,.38,.01);l1.rotation.set(.1,.2,.7);group.add(l1);var l2=new THREE.Mesh(lG.clone(),lM);l2.position.set(-.05,.62,-.01);l2.rotation.set(-.1,-.3,-.65);group.add(l2);var hg=bldHead(tp,col);hg.position.y=1.0;hg.scale.setScalar(.1);group.add(hg);group.position.set(x,0,z);group.rotation.y=Math.random()*Math.PI*2;scene.add(group);hg.userData.shape=tp;flowers.push({mesh:group,head:hg,grass:gp,h:st?st.h:.15,b:st?st.b:0,w:st?st.w:1.0,c:col,t:tp,k:look.k,isStunted:st?(st.isStunted||false):false});document.getElementById('fC').innerText=flowers.length;markDirty();}

// ── BUTTERFLY ────────────────────────────────────────────────────────────────
window.addBug=function(){var bg=new THREE.Group(),bM=new THREE.MeshStandardMaterial({color:0x222222,roughness:.6});var body=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.18,8),bM);body.rotation.x=Math.PI/2;bg.add(body);[-.03,.03].forEach(function(ox){var a=new THREE.Mesh(new THREE.CylinderGeometry(.005,.003,.12,4),bM);a.position.set(ox,.06,.09);a.rotation.x=-.3;bg.add(a);});var wc=[0x00ffcc,0xff66aa,0xffaa00,0x88aaff][Math.floor(Math.random()*4)];var wM=new THREE.MeshStandardMaterial({color:wc,transparent:true,opacity:.72,side:THREE.DoubleSide,roughness:.3,metalness:.2,emissive:new THREE.Color(wc),emissiveIntensity:.25});var uS=new THREE.Shape();uS.moveTo(0,0);uS.bezierCurveTo(.02,.12,.18,.18,.22,.10);uS.bezierCurveTo(.28,0,.20,-.12,.05,-.10);uS.bezierCurveTo(.02,-.08,0,-.04,0,0);var uG=new THREE.ShapeGeometry(uS,12);var lS=new THREE.Shape();lS.moveTo(0,0);lS.bezierCurveTo(.02,-.04,.16,-.14,.18,-.08);lS.bezierCurveTo(.20,-.02,.14,.04,.04,.02);lS.lineTo(0,0);var lG=new THREE.ShapeGeometry(lS,8);var wR1=new THREE.Mesh(uG,wM),wL1=new THREE.Mesh(uG,wM.clone()),wR2=new THREE.Mesh(lG,wM.clone()),wL2=new THREE.Mesh(lG,wM.clone());wR1.position.set(.02,0,0);wL1.position.set(-.02,0,0);wL1.rotation.y=Math.PI;wR2.position.set(.02,0,-.04);wR2.rotation.z=.1;wL2.position.set(-.02,0,-.04);wL2.rotation.y=Math.PI;wL2.rotation.z=-.1;bg.add(wR1,wL1,wR2,wL2);bg.position.set((Math.random()-.5)*20,2+Math.random()*2,(Math.random()-.5)*20);scene.add(bg);bugs.push({mesh:bg,wR1:wR1,wL1:wL1,wR2:wR2,wL2:wL2,target:null,time:Math.random()*100,speed:.008+Math.random()*.015});document.getElementById('bC').innerText=bugs.length;sndBug();chkTask('b',15);if(!isLoading){markDirty();save(true);}};

// ── ACTIONS ──────────────────────────────────────────────────────────────────
function soak(f,add){f.w=Math.min(1.5,f.w+(add||0));if(f.w>=.25)f.isStunted=false;}
window.waterAll=function(){if(!flowers.length){showToast('Sulayacak bitki yok 🌱');return;}var n=flowers.length,was=tasks.w.done;flowers.forEach(function(f){soak(f,.8);});sndWater();chkTask('w',30,n);stats.water++;saveStats();updStats();markDirty();save(true);if(!tasks.w.done||was)showToast('💧 Tüm bitkiler sulandı!');};
window.soakPlant=soak;
// Su .35 üstündeyken büyür, .25 altına inince solar. Hız saniye cinsinden (60 karelik eski dilim değil).
window.advancePlants=function(seconds){
  seconds=Number(seconds)||0;
  if(seconds<=0||!flowers.length) return 0;
  if(seconds>86400) seconds=86400;
  var live=seconds<5, crossed=0;
  for(var fi=0;fi<flowers.length;fi++){
    var f=flowers[fi], bugs=0, bi;
    for(bi=0;bi<badBugs.length;bi++) if(badBugs[bi].ti===fi) bugs++;
    var rate=DRY+bugs*BDRAIN, growFor=0, ph=f.h;
    if(!f.isStunted&&f.w>.35&&f.h<1.3&&curWeather!=='snow'){
      growFor=rate>0?Math.min(seconds,Math.max(0,(f.w-.35)/rate)):seconds;
      if(growFor>0) f.h=Math.min(1.3,f.h+GROW*growFor);
    }
    f.w=Math.max(0,f.w-rate*seconds);
    if(f.w<.25) f.isStunted=true;
    if(typeof growSteps==='undefined') continue;
    for(var si=0;si<growSteps.length;si++){
      if(ph<growSteps[si]&&f.h>=growSteps[si]){
        crossed++;
        if(si===3){stats.bloom++;saveStats();updStats();}
        if(live&&!isLoading){var tag=growNames[si];if(f.k&&typeof SHOP_ITEMS!=='undefined'){var seed=null;SHOP_ITEMS.seeds.forEach(function(s){if(s.id===f.k)seed=s;});if(seed)tag=seed.emoji+' '+tag;}showToast(tag+' oldu!');}
      }
    }
  }
  if(!live&&!isLoading&&crossed) showToast(crossed+' bitki büyüdü');
  return crossed;
};
var GARDEN_R=28, PLANT_GAP=1.5;
window.gardenBlocked=function(x,z){
  if(Math.sqrt(x*x+z*z)>GARDEN_R) return 'Çok uzak! 🚫';
  var i,p;
  for(i=0;i<flowers.length;i++){p=flowers[i].mesh.position;if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';}
  for(i=0;i<harvestItems.length;i++){p=harvestItems[i];if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';}
  for(i=0;i<decos.length;i++){if(decos[i].type!=='flower_wild')continue;p=decos[i].group.position;if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';}
  return '';
};
window.plant=function(){var a=Math.random()*Math.PI*2,r=Math.random()*13;mkFlower(Math.cos(a)*r,Math.sin(a)*r);sndPlant();chkTask('p',20);stats.plant++;saveStats();updStats();save(true);showToast('🌱 Yeni bitki ekildi!');};
window.killAllBadBugs=function(){var cnt=badBugs.length;if(cnt===0){showToast('🌿 Bahçe temiz!');return;}var was=tasks.k.done;for(var i=0;i<badBugs.length;i++){var bg=badBugs[i];bg.group.traverse(function(c){if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});scene.remove(bg.group);}badBugs.length=0;badM.length=0;document.getElementById('bdC').innerText=0;sndKill();chkTask('k',25);stats.kill+=cnt;saveStats();updStats();if(!tasks.k.done||was)showToast(cnt+' zararlı temizlendi! 🧹');markDirty();save(true);};
// ── ÇİÇEK YERLEŞTİRME MODU ───────────────────────────────────────────────────
var flowerPlaceMode = false;

window.startFlowerPlace = function() {
    if (deleteMode) { window.toggleDeleteMode(); return; }
    if (placementMode) { window.cancelPlace(); return; }
    if (!window.hasSeed()) { showToast('Çantada tohum yok 🌱'); return; }
    flowerPlaceMode = true;
    controls.enabled = false;
    document.getElementById('pBar').classList.add('show');
    document.getElementById('pBar').querySelector('span').textContent = '🌸 Çiçek ekmek için yere dokun';
    document.getElementById('pBar').querySelector('button').setAttribute('onclick', 'window.cancelFlowerPlace()');
    openP = null;
    showToast('🌸 Nereye ekmek istiyorsun?');
};

window.cancelFlowerPlace = function() {
    flowerPlaceMode = false;
    controls.enabled = true;
    document.getElementById('pBar').classList.remove('show');
    document.getElementById('pBar').querySelector('span').textContent = '👆 Sahneye dokun';
    document.getElementById('pBar').querySelector('button').setAttribute('onclick', 'window.cancelPlace()');
};

window.plant = function() {
  for(var i=0;i<8;i++){
    var a = Math.random() * Math.PI * 2, r = Math.random() * 13;
    var x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!window.gardenBlocked || !window.gardenBlocked(x,z)) { window.plantSeedAt(x, z); return; }
  }
  showToast('Boş yer yok 🌱');
};

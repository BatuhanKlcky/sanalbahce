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
function petalMat(col,glow){var m=new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:.5});if(glow){m.emissive=new THREE.Color(col);m.emissiveIntensity=glow;}return m;}
function tint(col, toward, amt){var c=new THREE.Color(col);c.lerp(new THREE.Color(toward), amt);return c;}
function petalGeo(w,h,curl){var sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(w,h*.15,w*(curl||.7),h*.62,0,h);sh.bezierCurveTo(-w*(curl||.7),h*.62,-w,h*.15,0,0);return new THREE.ShapeGeometry(sh,6);}
function ringPetals(g,geo,col,n,tilt,spin,order,glow){for(var i=0;i<n;i++){var p=new THREE.Mesh(geo,petalMat(col,glow));if(order)p.rotation.order=order;p.rotation.y=(i/n)*Math.PI*2+(spin||0);p.rotation.x=tilt;p.position.y=.02;g.add(p);}}
function headRose(col){var g=new THREE.Group();
  var bud=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),petalMat(tint(col,0x4a0010,.45)));bud.scale.set(1,.72,1);bud.position.y=.07;g.add(bud);
  [{n:5,r:.045,t:.42,s:.52,y:.08,light:.42,spin:.25},{n:7,r:.09,t:.78,s:.78,y:.03,light:.16,spin:.5},{n:8,r:.15,t:1.18,s:1.05,y:-.02,light:0,spin:.12}].forEach(function(l){
    var geo=petalGeo(.16*l.s,.34*l.s,.9);
    var pc=tint(col,0xffe4ea,l.light);
    for(var i=0;i<l.n;i++){var a=(i/l.n)*Math.PI*2+l.spin;var p=new THREE.Mesh(geo,petalMat(pc,.2));p.rotation.y=a;p.rotation.x=l.t;p.position.set(Math.sin(a)*l.r,l.y,Math.cos(a)*l.r);g.add(p);}
  });
  var sepal=petalGeo(.07,.16,.5),sm=new THREE.MeshStandardMaterial({color:0x1f6a32,side:THREE.DoubleSide,roughness:.8});
  for(var i=0;i<5;i++){var a=(i/5)*Math.PI*2;var s=new THREE.Mesh(sepal,sm);s.rotation.y=a;s.rotation.x=1.35;s.position.set(Math.sin(a)*.08,-.06,Math.cos(a)*.08);g.add(s);}
  return g;}
function headTulip(col){var g=new THREE.Group(),outer=petalGeo(.1,.58,.55),inner=petalGeo(.07,.5,.45);
  for(var i=0;i<3;i++){var p=new THREE.Mesh(outer,petalMat(tint(col,0xfff0f3,.12),.16));var a=(i/3)*Math.PI*2;p.rotation.y=a;p.rotation.x=.55;p.position.set(Math.sin(a)*.02,0,Math.cos(a)*.02);g.add(p);}
  for(var j=0;j<3;j++){var q=new THREE.Mesh(inner,petalMat(tint(col,0xfff7f8,.35),.12));var b=(j/3)*Math.PI*2+Math.PI/3;q.rotation.y=b;q.rotation.x=.3;q.position.y=.05;g.add(q);}
  return g;}
function headLotus(col){var g=new THREE.Group();
  [{n:8,w:.1,h:.34,tilt:.95,spin:0,shade:.1},{n:10,w:.16,h:.42,tilt:1.28,spin:.18,shade:0},{n:12,w:.14,h:.3,tilt:1.48,spin:.08,shade:-.15}].forEach(function(l){
    ringPetals(g,petalGeo(l.w,l.h,.8),l.shade>=0?tint(col,0xfff5fb,l.shade):tint(col,0x802050,-l.shade),l.n,l.tilt,l.spin,'YXZ',.14);
  });
  var c=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:0xf0c14a,roughness:.7}));c.scale.y=.28;c.position.y=.05;g.add(c);
  return g;}
function headBell(col){var g=new THREE.Group(),stem=new THREE.MeshStandardMaterial({color:0x2c6a38,roughness:.9}),mat=petalMat(col);
  for(var i=0;i<5;i++){var a=(i/5)*Math.PI*2;var spr=new THREE.Group();spr.rotation.y=a;spr.rotation.z=.55;spr.position.y=.02;g.add(spr);
    var st=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.16,4),stem);st.position.y=-.08;spr.add(st);
    var bell=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),mat);bell.scale.set(.85,1.15,.85);bell.position.y=-.18;spr.add(bell);
    var lip=new THREE.Mesh(new THREE.TorusGeometry(.04,.008,4,8),mat);lip.rotation.x=Math.PI/2;lip.position.y=-.22;spr.add(lip);
  }
  return g;}
function headCherry(col){var g=new THREE.Group(),geo=petalGeo(.1,.16,.9);
  ringPetals(g,geo,tint(col,0xffffff,.25),5,1.2,0,'YXZ',.16);
  var c=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),new THREE.MeshStandardMaterial({color:0xffe14a,roughness:.55}));c.position.y=.045;g.add(c);
  for(var i=0;i<6;i++){var a=(i/6)*Math.PI*2;var st=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.05,3),new THREE.MeshStandardMaterial({color:0xf2d24a,roughness:.6}));st.position.set(Math.cos(a)*.02,.06,Math.sin(a)*.02);g.add(st);}
  return g;}
function bldHead(tp,col){
if(tp==='tulip')return headTulip(col);
if(tp==='lotus')return headLotus(col);
if(tp==='bell')return headBell(col);
if(tp==='cherry')return headCherry(col);
if(tp===0)return headRose(col);
var g=new THREE.Group();
if(tp===1){ringPetals(g,petalGeo(.12,.4,.75),col,6,.85,0,'XYZ');var c2=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:0xffee88,roughness:.7}));c2.position.y=.08;g.add(c2);
}else if(tp===2){var disk=new THREE.Mesh(new THREE.CircleGeometry(.16,20),new THREE.MeshStandardMaterial({color:0x6b3410,roughness:.9,side:THREE.DoubleSide}));disk.rotation.x=-Math.PI/2;disk.position.y=.06;g.add(disk);
  var dome=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),new THREE.MeshStandardMaterial({color:0x8a4b12,roughness:.85}));dome.scale.y=.35;dome.position.y=.07;g.add(dome);
  for(var i=0;i<14;i++){var a=(i/14)*Math.PI*2,r=.05+.04*(i%2);var seed=new THREE.Mesh(new THREE.SphereGeometry(.018,4,4),new THREE.MeshStandardMaterial({color:i%2?0xc47820:0x5a2e0c,roughness:1}));seed.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);g.add(seed);}
  ringPetals(g,petalGeo(.18,.32,.95),tint(col,0xfff6c0,.2),14,1.15,.04,'YXZ',.28);
}else{ringPetals(g,petalGeo(.16,.42,.8),col,5,1.05,0,'XYZ');var c3=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:0xffd24a,roughness:.7}));c3.scale.y=.45;c3.position.y=.05;g.add(c3);}
return g;}

function mkFlower(x,z,st){var group=new THREE.Group();var look=flowerLook(st);var col=look.c;var tp=look.t;var gp=new THREE.Mesh(new THREE.CircleGeometry(.55,16),new THREE.MeshStandardMaterial({color:0x6a4428,roughness:1}));gp.rotation.x=-Math.PI/2;gp.position.y=.012;group.add(gp);var cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.03,.28,.015),new THREE.Vector3(.015,.66,-.008),new THREE.Vector3(0,1,0)]);var stem=new THREE.Mesh(new THREE.TubeGeometry(cv,10,.028,6,false),new THREE.MeshStandardMaterial({color:0x2f6a38,roughness:.92}));group.add(stem);var lsh=new THREE.Shape();lsh.moveTo(0,0);lsh.quadraticCurveTo(.2,.1,0,.46);lsh.quadraticCurveTo(-.06,.2,0,0);var lG=new THREE.ShapeGeometry(lsh,8);var lM=new THREE.MeshStandardMaterial({color:0x1f6b34,side:THREE.DoubleSide,roughness:.78});var l1=new THREE.Mesh(lG,lM);l1.position.set(.06,.36,.01);l1.rotation.set(.15,.25,.7);l1.userData.bz=l1.rotation.z;group.add(l1);var l2=new THREE.Mesh(lG.clone(),lM.clone());l2.position.set(-.05,.6,-.01);l2.rotation.set(-.12,-.35,-.62);l2.userData.bz=l2.rotation.z;group.add(l2);var hg=bldHead(tp,col);hg.position.y=1.0;hg.scale.setScalar(.1);group.add(hg);group.position.set(x,0,z);group.rotation.y=Math.random()*Math.PI*2;scene.add(group);hg.userData.shape=tp;flowers.push({mesh:group,head:hg,grass:gp,leaves:[l1,l2],h:st?st.h:.15,b:st?st.b:0,w:st?st.w:1.0,c:col,t:tp,k:look.k,isStunted:st?(st.isStunted||false):false});document.getElementById('fC').innerText=flowers.length;markDirty();}

// ── BUTTERFLY ────────────────────────────────────────────────────────────────
window.addBug=function(){var bg=new THREE.Group(),bM=new THREE.MeshStandardMaterial({color:0x2a241c,roughness:.7});var body=new THREE.Mesh(new THREE.CylinderGeometry(.02,.035,.2,8),bM);body.rotation.x=Math.PI/2;bg.add(body);[-.025,.025].forEach(function(ox){var a=new THREE.Mesh(new THREE.CylinderGeometry(.004,.002,.1,4),bM);a.position.set(ox,.05,.1);a.rotation.x=-.35;bg.add(a);});var wc=[0xe85d4c,0xf2c14e,0x5b8def,0xffffff][Math.floor(Math.random()*4)];var wM=new THREE.MeshStandardMaterial({color:wc,transparent:true,opacity:.88,side:THREE.DoubleSide,roughness:.45,metalness:0});var uS=new THREE.Shape();uS.moveTo(0,0);uS.bezierCurveTo(.02,.12,.18,.18,.22,.10);uS.bezierCurveTo(.28,0,.20,-.12,.05,-.10);uS.bezierCurveTo(.02,-.08,0,-.04,0,0);var uG=new THREE.ShapeGeometry(uS,12);var lS=new THREE.Shape();lS.moveTo(0,0);lS.bezierCurveTo(.02,-.04,.16,-.14,.18,-.08);lS.bezierCurveTo(.20,-.02,.14,.04,.04,.02);lS.lineTo(0,0);var lG=new THREE.ShapeGeometry(lS,8);var wR1=new THREE.Mesh(uG,wM),wL1=new THREE.Mesh(uG,wM.clone()),wR2=new THREE.Mesh(lG,wM.clone()),wL2=new THREE.Mesh(lG,wM.clone());wR1.position.set(.02,0,0);wL1.position.set(-.02,0,0);wL1.rotation.y=Math.PI;wR2.position.set(.02,0,-.04);wR2.rotation.z=.1;wL2.position.set(-.02,0,-.04);wL2.rotation.y=Math.PI;wL2.rotation.z=-.1;bg.add(wR1,wL1,wR2,wL2);bg.position.set((Math.random()-.5)*20,2+Math.random()*2,(Math.random()-.5)*20);scene.add(bg);bugs.push({mesh:bg,wR1:wR1,wL1:wL1,wR2:wR2,wL2:wL2,target:null,time:Math.random()*100,until:0,bob:0,flight:1.2+Math.random()*.7});document.getElementById('bC').innerText=bugs.length;sndBug();chkTask('b',15);if(!isLoading){markDirty();save(true);}};

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

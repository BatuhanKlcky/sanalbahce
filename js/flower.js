// Cicekler, kelebekler ve zararli bocekler.
// ── RAYCASTER (bad bug tap) ──────────────────────────────────────────────────
var ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
window.addEventListener('pointerdown',function(e){
  if(e.target.closest('.ui-container')||e.target.closest('.spanel')||e.target.closest('#sidebar')||e.target.closest('#biomeBar')||placementMode)return;
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
function ringPetals(g,geo,col,n,tilt,spin,order,glow){for(var i=0;i<n;i++){var p=new THREE.Mesh(geo,petalMat(col,glow));if(order)p.rotation.order=order;p.rotation.y=(i/n)*Math.PI*2+(spin||0);p.rotation.x=tilt;p.userData.px=tilt;p.userData.pi=i;p.position.y=.02;g.add(p);}}
function headRose(col){var g=new THREE.Group();
  var bud=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),petalMat(tint(col,0x4a0010,.45)));bud.scale.set(1,.72,1);bud.position.y=.07;g.add(bud);
  [{n:5,r:.045,t:.42,s:.52,y:.08,light:.42,spin:.25},{n:7,r:.09,t:.78,s:.78,y:.03,light:.16,spin:.5},{n:8,r:.15,t:1.18,s:1.05,y:-.02,light:0,spin:.12}].forEach(function(l){
    var geo=petalGeo(.16*l.s,.34*l.s,.9);
    var pc=tint(col,0xffe4ea,l.light);
    for(var i=0;i<l.n;i++){var a=(i/l.n)*Math.PI*2+l.spin;var p=new THREE.Mesh(geo,petalMat(pc,.2));p.rotation.y=a;p.rotation.x=l.t;p.userData.px=l.t;p.userData.pi=i;p.position.set(Math.sin(a)*l.r,l.y,Math.cos(a)*l.r);g.add(p);}
  });
  var sepal=petalGeo(.07,.16,.5),sm=new THREE.MeshStandardMaterial({color:0x1f6a32,side:THREE.DoubleSide,roughness:.8});
  for(var i=0;i<5;i++){var a=(i/5)*Math.PI*2;var s=new THREE.Mesh(sepal,sm);s.rotation.y=a;s.rotation.x=1.35;s.position.set(Math.sin(a)*.08,-.06,Math.cos(a)*.08);g.add(s);}
  return g;}
function headTulip(col){var g=new THREE.Group(),outer=petalGeo(.1,.58,.55),inner=petalGeo(.07,.5,.45);
  for(var i=0;i<3;i++){var p=new THREE.Mesh(outer,petalMat(tint(col,0xfff0f3,.12),.16));var a=(i/3)*Math.PI*2;p.rotation.y=a;p.rotation.x=.55;p.userData.px=.55;p.userData.pi=i;p.position.set(Math.sin(a)*.02,0,Math.cos(a)*.02);g.add(p);}
  for(var j=0;j<3;j++){var q=new THREE.Mesh(inner,petalMat(tint(col,0xfff7f8,.35),.12));var b=(j/3)*Math.PI*2+Math.PI/3;q.rotation.y=b;q.rotation.x=.3;q.userData.px=.3;q.userData.pi=j+3;q.position.y=.05;g.add(q);}
  return g;}
function headLotus(col){var g=new THREE.Group();
  [{n:8,w:.1,h:.34,tilt:.95,spin:0,shade:.1},{n:10,w:.16,h:.42,tilt:1.28,spin:.18,shade:0},{n:12,w:.14,h:.3,tilt:1.48,spin:.08,shade:-.15}].forEach(function(l){
    ringPetals(g,petalGeo(l.w,l.h,.8),l.shade>=0?tint(col,0xfff5fb,l.shade):tint(col,0x802050,-l.shade),l.n,l.tilt,l.spin,'YXZ',.14);
  });
  var c=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:0xf0c14a,roughness:.7}));c.scale.y=.28;c.position.y=.05;g.add(c);
  return g;}
function headBell(col){var g=new THREE.Group(),stem=new THREE.MeshStandardMaterial({color:0x2c6a38,roughness:.9}),mat=petalMat(col);
  for(var i=0;i<5;i++){var a=(i/5)*Math.PI*2;var spr=new THREE.Group();spr.rotation.y=a;spr.rotation.z=.55;spr.userData.bz=.55;spr.userData.pi=i;spr.position.y=.02;g.add(spr);
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

function mkFlower(x,z,st){var group=new THREE.Group();var look=flowerLook(st);var col=look.c;var tp=look.t;var gp=new THREE.Mesh(new THREE.CircleGeometry(.48,18),new THREE.MeshStandardMaterial({color:0x5a3a22,roughness:1}));gp.rotation.x=-Math.PI/2;gp.position.y=.03;group.add(gp);var cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.04,.3,.02),new THREE.Vector3(.02,.68,-.01),new THREE.Vector3(0,1.05,0)]);var stem=new THREE.Mesh(new THREE.TubeGeometry(cv,12,.024,7,false),new THREE.MeshStandardMaterial({color:0x2f7a3c,roughness:.9}));group.add(stem);var lsh=new THREE.Shape();lsh.moveTo(0,0);lsh.quadraticCurveTo(.22,.12,.02,.5);lsh.quadraticCurveTo(-.07,.22,0,0);var lG=new THREE.ShapeGeometry(lsh,10);var lM=new THREE.MeshStandardMaterial({color:0x1f6b34,side:THREE.DoubleSide,roughness:.76});var l1=new THREE.Mesh(lG,lM);l1.position.set(.07,.38,.01);l1.rotation.set(.15,.25,.7);l1.userData.bz=l1.rotation.z;group.add(l1);var l2=new THREE.Mesh(lG.clone(),lM.clone());l2.position.set(-.06,.62,-.01);l2.rotation.set(-.12,-.35,-.62);l2.userData.bz=l2.rotation.z;group.add(l2);var l3=new THREE.Mesh(lG.clone(),lM.clone());l3.scale.setScalar(.75);l3.position.set(.04,.78,.03);l3.rotation.set(.1,.5,.55);l3.userData.bz=l3.rotation.z;group.add(l3);var hg=bldHead(tp,col);hg.position.y=1.05;hg.scale.setScalar(.12);group.add(hg);group.position.set(x,0,z);group.rotation.y=Math.random()*Math.PI*2;scene.add(group);hg.userData.shape=tp;flowers.push({mesh:group,head:hg,grass:gp,leaves:[l1,l2,l3],h:st?st.h:.15,b:st?st.b:0,w:st?st.w:1.0,c:col,t:tp,k:look.k,isStunted:st?(st.isStunted||false):false});document.getElementById('fC').innerText=flowers.length;markDirty();}

// ── BUTTERFLY ────────────────────────────────────────────────────────────────
function wingTex(paint){
  var c=document.createElement('canvas'); c.width=c.height=256;
  var g=c.getContext('2d'); paint(g);
  var t=new THREE.CanvasTexture(c); t.needsUpdate=true;
  return t;
}
function wingMat(tex, glow){
  var m=new THREE.MeshStandardMaterial({map:tex, alphaTest:.4, side:THREE.DoubleSide, roughness:.55, metalness:0, color:0xffffff});
  if(glow){ m.emissive=new THREE.Color(glow); m.emissiveIntensity=.1; }
  m.userData.keep=true;
  return m;
}
function wingGeo(w, h, droop){
  var geo=new THREE.PlaneGeometry(w, h, 10, 8);
  var pos=geo.attributes.position, i;
  for(i=0;i<pos.count;i++){
    var x=pos.getX(i)+w*.5, y=pos.getY(i);
    var nx=x/w, ny=(y+h*.5)/h;
    pos.setZ(i, droop*nx*nx*(.45+.55*(1-ny)));
  }
  geo.computeVertexNormals();
  return geo;
}
function mountWing(geo, mat, side, z){
  var pivot=new THREE.Group();
  var m=new THREE.Mesh(geo, mat);
  m.position.set(side*geo.parameters.width*.5, 0, z);
  m.rotation.x=Math.PI/2;
  m.scale.x=side;
  pivot.add(m);
  return pivot;
}
function paintFore(g, fill, edge, vein){
  function path(){
    g.beginPath();
    g.moveTo(22,176);
    g.bezierCurveTo(70,36,150,14,232,58);
    g.bezierCurveTo(250,96,228,162,168,198);
    g.bezierCurveTo(108,226,36,206,18,180);
    g.closePath();
  }
  path(); g.fillStyle=fill; g.fill();
  g.save(); path(); g.clip();
  var grd=g.createRadialGradient(120,120,10,140,110,150);
  grd.addColorStop(0,'rgba(255,255,255,.28)'); grd.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grd; g.fillRect(0,0,256,256);
  g.strokeStyle=vein; g.lineWidth=2.5; g.lineCap='round';
  g.beginPath(); g.moveTo(28,170); g.quadraticCurveTo(110,70,220,62); g.stroke();
  g.beginPath(); g.moveTo(30,174); g.quadraticCurveTo(120,130,200,150); g.stroke();
  g.restore();
  path(); g.lineWidth=16; g.strokeStyle=edge; g.stroke();
}
function paintHind(g, fill, edge, vein){
  function path(){
    g.beginPath();
    g.moveTo(30,64);
    g.bezierCurveTo(80,22,170,18,214,72);
    g.bezierCurveTo(240,140,206,210,140,228);
    g.bezierCurveTo(64,240,18,176,24,100);
    g.closePath();
  }
  path(); g.fillStyle=fill; g.fill();
  g.save(); path(); g.clip();
  g.strokeStyle=vein; g.lineWidth=2.5; g.lineCap='round';
  g.beginPath(); g.moveTo(36,80); g.quadraticCurveTo(110,120,190,150); g.stroke();
  g.restore();
  path(); g.lineWidth=15; g.strokeStyle=edge; g.stroke();
}
function spots(g, pts, r, col){
  g.fillStyle=col;
  for(var i=0;i<pts.length;i++){ g.beginPath(); g.arc(pts[i][0], pts[i][1], r, 0, 7); g.fill(); }
}
function eyeSpot(g, x, y, r){
  g.beginPath(); g.arc(x,y,r,0,7); g.fillStyle='#1a120c'; g.fill();
  g.beginPath(); g.arc(x,y,r*.7,0,7); g.fillStyle='#f0c14e'; g.fill();
  g.beginPath(); g.arc(x,y,r*.46,0,7); g.fillStyle='#2f62d6'; g.fill();
  g.beginPath(); g.arc(x,y,r*.2,0,7); g.fillStyle='#140e0a'; g.fill();
  g.beginPath(); g.arc(x-r*.1,y-r*.1,r*.07,0,7); g.fillStyle='#fff'; g.fill();
}
function butterflyLib(){
  if(butterflyLib.cache) return butterflyLib.cache;
  var edge='#1c140e';
  var monarchF=wingTex(function(g){
    paintFore(g,'#f08a1c',edge,'#3a2414');
    spots(g,[[214,70],[232,98],[220,132],[186,164],[146,186]],6,'#fff4e4');
  });
  var monarchH=wingTex(function(g){
    paintHind(g,'#e97816',edge,'#3a2414');
    spots(g,[[150,150],[186,120],[120,180],[170,186]],7,'#fff4e4');
  });
  var swallowF=wingTex(function(g){
    paintFore(g,'#f2c534',edge,'#2a2410');
    g.strokeStyle='#1c140e'; g.lineWidth=11; g.lineCap='round';
    g.beginPath(); g.moveTo(70,70); g.quadraticCurveTo(130,90,200,70); g.stroke();
    g.beginPath(); g.moveTo(60,120); g.quadraticCurveTo(140,130,210,118); g.stroke();
  });
  var swallowH=wingTex(function(g){
    g.beginPath();
    g.moveTo(34,58);
    g.bezierCurveTo(90,20,180,24,220,78);
    g.bezierCurveTo(232,128,206,168,178,186);
    g.quadraticCurveTo(196,214,162,190);
    g.bezierCurveTo(96,206,24,164,28,96);
    g.closePath();
    g.fillStyle='#f0c030'; g.fill();
    g.lineWidth=13; g.strokeStyle=edge; g.stroke();
    g.beginPath(); g.arc(150,130,16,0,7); g.fillStyle='#2a6ad4'; g.fill();
    g.beginPath(); g.arc(178,156,8,0,7); g.fillStyle='#e25a2a'; g.fill();
  });
  var morphoF=wingTex(function(g){
    paintFore(g,'#1d4fd8',edge,'#102454');
    g.save();
    g.beginPath();
    g.moveTo(22,176); g.bezierCurveTo(70,36,150,14,232,58); g.bezierCurveTo(250,96,228,162,168,198); g.bezierCurveTo(108,226,36,206,18,180); g.closePath();
    g.clip();
    var grd=g.createLinearGradient(40,40,220,200);
    grd.addColorStop(0,'#7eb6ff'); grd.addColorStop(.45,'#2a62e8'); grd.addColorStop(1,'#1638a0');
    g.fillStyle=grd; g.fillRect(0,0,256,256);
    g.restore();
    g.lineWidth=16; g.strokeStyle='#141820';
    g.beginPath(); g.moveTo(22,176); g.bezierCurveTo(70,36,150,14,232,58); g.bezierCurveTo(250,96,228,162,168,198); g.bezierCurveTo(108,226,36,206,18,180); g.closePath(); g.stroke();
  });
  var morphoH=wingTex(function(g){
    paintHind(g,'#1a46c8','#141820','#102454');
    spots(g,[[120,150],[160,130],[190,160],[140,190]],5,'#d6e6ff');
  });
  var peacockF=wingTex(function(g){
    paintFore(g,'#e25a2c',edge,'#4a2418');
    g.fillStyle='#2a160e';
    g.beginPath(); g.moveTo(168,40); g.lineTo(236,62); g.lineTo(214,110); g.closePath(); g.fill();
    spots(g,[[188,78]],5,'#fff');
  });
  var peacockH=wingTex(function(g){
    paintHind(g,'#c4483a',edge,'#4a2418');
    eyeSpot(g,148,140,40);
  });
  var fore=wingGeo(.42,.32,.09), hind=wingGeo(.34,.3,.06), tail=wingGeo(.36,.4,.05);
  var bodyPts=[[.004,.16],[.024,.12],[.015,.085],[.036,.04],[.03,0],[.02,-.07],[.011,-.13],[.003,-.175]];
  var bodyGeo=new THREE.LatheGeometry(bodyPts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),16);
  bodyGeo.rotateX(Math.PI/2);
  var bodyMat=new THREE.MeshStandardMaterial({color:0x241810,roughness:.74});
  bodyMat.userData.keep=true;
  var eyeMat=new THREE.MeshStandardMaterial({color:0x140e0c,roughness:.4});
  eyeMat.userData.keep=true;
  var glint=new THREE.MeshBasicMaterial({color:0xffffff});
  glint.userData.keep=true;
  butterflyLib.cache={
    bodyGeo:bodyGeo, bodyMat:bodyMat, eyeMat:eyeMat, glint:glint,
    fore:fore, hind:hind, tail:tail,
    species:[
      {fore:wingMat(monarchF,0x6a3010), hind:wingMat(monarchH,0x6a3010), hindGeo:hind, hz:9.2, flight:1.12},
      {fore:wingMat(swallowF,0x6a5410), hind:wingMat(swallowH,0x6a5410), hindGeo:tail, hz:12, flight:1.42},
      {fore:wingMat(morphoF,0x16306a), hind:wingMat(morphoH,0x16306a), hindGeo:hind, hz:7.4, flight:1.02},
      {fore:wingMat(peacockF,0x6a2814), hind:wingMat(peacockH,0x6a2814), hindGeo:hind, hz:10, flight:1.22}
    ]
  };
  butterflyLib.cache.species[2].fore.emissiveIntensity=.18;
  butterflyLib.cache.species[2].hind.emissiveIntensity=.18;
  return butterflyLib.cache;
}
window.addBug=function(kind){
  var lib=butterflyLib();
  if(kind==null||kind<0||kind>=lib.species.length) kind=Math.floor(Math.random()*lib.species.length);
  var sp=lib.species[kind];
  var bg=new THREE.Group();
  var body=new THREE.Mesh(lib.bodyGeo, lib.bodyMat);
  bg.add(body);
  var ants=[];
  [-1,1].forEach(function(s){
    var eye=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6), lib.eyeMat);
    eye.position.set(s*.02,.012,.125);
    var gl=new THREE.Mesh(new THREE.SphereGeometry(.004,4,3), lib.glint);
    gl.position.set(s*.004,.004,.008);
    eye.add(gl);
    bg.add(eye);
    var curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(s*.028,.045,.025),
      new THREE.Vector3(s*.05,.078,.008)
    ]);
    var ant=new THREE.Group();
    ant.add(new THREE.Mesh(new THREE.TubeGeometry(curve,8,.006,4,false), lib.bodyMat));
    var tip=new THREE.Mesh(new THREE.SphereGeometry(.013,6,5), lib.bodyMat);
    tip.position.set(s*.05,.078,.008);
    ant.add(tip);
    ant.position.set(s*.012,.02,.13);
    bg.add(ant); ants.push(ant);
  });
  var hinge=new THREE.Group();
  hinge.position.set(0,.02,.03);
  bg.add(hinge);
  var wR1=mountWing(lib.fore, sp.fore, 1, .05);
  var wL1=mountWing(lib.fore, sp.fore, -1, .05);
  var wR2=mountWing(sp.hindGeo, sp.hind, 1, -.08);
  var wL2=mountWing(sp.hindGeo, sp.hind, -1, -.08);
  hinge.add(wR1,wL1,wR2,wL2);
  bg.scale.setScalar(1.5+Math.random()*.28);
  bg.position.set((Math.random()-.5)*16, 1.4+Math.random()*1.4, (Math.random()-.5)*16);
  scene.add(bg);
  bugs.push({mesh:bg, wR1:wR1, wL1:wL1, wR2:wR2, wL2:wL2, ants:ants, target:null, time:Math.random()*20, until:0, bob:0, flight:sp.flight, hz:sp.hz, kind:kind});
  document.getElementById('bC').innerText=bugs.length;
  sndBug(); chkTask('b',15);
  if(!isLoading){ markDirty(); save(true); }
};
window.removeBug=function(){
  if(!bugs.length){ showToast('Kelebek yok 🦋'); return; }
  var b=bugs.pop();
  if(b&&b.mesh){
    if(b.mesh.parent) b.mesh.parent.remove(b.mesh);
    else scene.remove(b.mesh);
  }
  var el=document.getElementById('bC');
  if(el) el.innerText=bugs.length;
  showToast('🦋 Kelebek azaldı ('+bugs.length+')');
  if(!isLoading){ markDirty(); save(true); }
};

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
var GARDEN_R=36, PLANT_GAP=1.5;
/** Active placeable disk: biome pad center+R in cozy multi-biome, else classic garden. */
window.placeZone=function(){
  if(typeof isCozy==='function'&&isCozy()&&typeof window.getActiveBiome==='function'){
    var b=window.getActiveBiome();
    if(b) return {cx:b.cx||0, cz:b.cz||0, r:Math.max(4,(b.R||15)-1.2)};
  }
  if(typeof isCozy==='function'&&isCozy()&&window._islandR)
    return {cx:0, cz:0, r:Math.max(4,window._islandR-1.2)};
  return {cx:0, cz:0, r:GARDEN_R};
};
window.tooFar=function(x,z){
  var zn=window.placeZone();
  return Math.hypot(x-zn.cx, z-zn.cz)>zn.r;
};
window.gardenBlocked=function(x,z){
  if(window.tooFar(x,z)) return 'Çok uzak! 🚫';
  var i,p;
  for(i=0;i<flowers.length;i++){p=flowers[i].mesh.position;if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';}
  for(i=0;i<harvestItems.length;i++){p=harvestItems[i];if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';}
  var cozyNow=typeof isCozy==='function'&&isCozy();
  for(i=0;i<decos.length;i++){
    if(decos[i].type!=='flower_wild')continue;
    var dw=decos[i].world;
    if(dw&&dw!=='both'&&((cozyNow&&dw!=='cozy')||(!cozyNow&&dw!=='classic'))) continue;
    p=decos[i].group.position;if(Math.hypot(p.x-x,p.z-z)<PLANT_GAP) return 'Burada bitki var 🌱';
  }
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

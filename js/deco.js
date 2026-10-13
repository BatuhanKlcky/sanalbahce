// Dekor, yerlestirme ve silme.
// ── DECO BUILDERS ────────────────────────────────────────────────────────────
function mkLantern(x,z){var g=new THREE.Group(),pM=new THREE.MeshStandardMaterial({color:0x4a3000,roughness:.8}),bM=new THREE.MeshStandardMaterial({color:0x2a1a00,roughness:.5,metalness:.3});var pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.8,8),pM);pole.position.y=.9;g.add(pole);var box=new THREE.Mesh(new THREE.BoxGeometry(.35,.4,.35),bM);box.position.y=1.9;g.add(box);var lt=new THREE.PointLight(0xffaa33,1.5,4);lt.position.y=1.9;g.add(lt);var gl=new THREE.Mesh(new THREE.BoxGeometry(.28,.32,.28),new THREE.MeshStandardMaterial({color:0xffcc44,emissive:0xffaa00,emissiveIntensity:2,transparent:true,opacity:.6}));gl.position.y=1.9;g.add(gl);var rf=new THREE.Mesh(new THREE.ConeGeometry(.28,.2,4),bM);rf.position.y=2.2;g.add(rf);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'lantern',light:lt});markDirty();}
function mkBench(x,z,a){var g=new THREE.Group(),wM=new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:.9}),mM=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.5,metalness:.6});var seat=new THREE.Mesh(new THREE.BoxGeometry(1.2,.08,.45),wM);seat.position.y=.45;g.add(seat);var bk=new THREE.Mesh(new THREE.BoxGeometry(1.2,.35,.06),wM);bk.position.set(0,.72,-.18);g.add(bk);[[-.5,-.2],[.5,-.2],[-.5,.2],[.5,.2]].forEach(function(p){var l=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.45,6),mM);l.position.set(p[0],.22,p[1]);g.add(l);});g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'bench'});markDirty();}
function mkStone(x,z){var g=new THREE.Group();var c=[0x5a5a5a,0x4a4a4a,0x6a6060][Math.floor(Math.random()*3)];var geo=new THREE.SphereGeometry(.3,8,6),w=.4+Math.random()*.5,h=.2+Math.random()*.3,d=.35+Math.random()*.4;geo.scale(w,h,d);var s=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:c,roughness:.95}));s.position.y=h*.25;s.rotation.y=Math.random()*Math.PI;g.add(s);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'stone'});markDirty();}
function mkMushroom(x,z){var g=new THREE.Group();var stem=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,.32,8),new THREE.MeshStandardMaterial({color:0xf3e6d4,roughness:1}));stem.position.y=.16;g.add(stem);var cap=new THREE.Mesh(new THREE.SphereGeometry(.24,12,8),new THREE.MeshStandardMaterial({color:0xc0392b,roughness:.75}));cap.scale.y=.55;cap.position.y=.38;g.add(cap);for(var i=0;i<6;i++){var a=(i/6)*Math.PI*2;var spot=new THREE.Mesh(new THREE.SphereGeometry(.035,5,4),new THREE.MeshStandardMaterial({color:0xfff6ea,roughness:.6}));spot.position.set(Math.cos(a)*.12,.46,Math.sin(a)*.12);spot.scale.y=.4;g.add(spot);}var gill=new THREE.Mesh(new THREE.CircleGeometry(.16,10),new THREE.MeshStandardMaterial({color:0xf6e2c4,roughness:.8,side:THREE.DoubleSide}));gill.rotation.x=Math.PI/2;gill.position.y=.3;g.add(gill);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'mushroom'});markDirty();}
function mkPot(x,z){var g=new THREE.Group(),pM=new THREE.MeshStandardMaterial({color:0xb85c38,roughness:.8});var pot=new THREE.Mesh(new THREE.CylinderGeometry(.2,.14,.3,12),pM);pot.position.y=.15;g.add(pot);var rim=new THREE.Mesh(new THREE.TorusGeometry(.21,.03,6,16),pM);rim.rotation.x=Math.PI/2;rim.position.y=.3;g.add(rim);var soil=new THREE.Mesh(new THREE.CircleGeometry(.18,12),new THREE.MeshStandardMaterial({color:0x2a1a0a,roughness:1}));soil.rotation.x=-Math.PI/2;soil.position.y=.29;g.add(soil);var stm=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.25,6),new THREE.MeshStandardMaterial({color:0x1e6040}));stm.position.y=.42;g.add(stm);var fc=[0xff3366,0xff9900,0xcc44ff,0x00ddaa][Math.floor(Math.random()*4)];var fl=new THREE.Mesh(new THREE.SphereGeometry(.08,8,8),new THREE.MeshStandardMaterial({color:fc,emissive:fc,emissiveIntensity:.3}));fl.position.y=.56;g.add(fl);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'pot'});markDirty();}
function mkFence(x,z,a){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x8b6914,roughness:.9});[-.35,0,.35].forEach(function(y){var b=new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,.06),m);b.position.set(0,.5+y,0);g.add(b);});for(var i=0;i<5;i++){var pl=new THREE.Mesh(new THREE.BoxGeometry(.1,.95,.06),m);pl.position.set(-.5+i*.25,.5,0);g.add(pl);}g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'fence'});markDirty();}
function mkTree(x,z){var g=new THREE.Group();var th=1.15+Math.random()*.45;var tr=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,th,7),new THREE.MeshStandardMaterial({color:0x6a4330,roughness:.95}));tr.position.y=th/2;g.add(tr);var greens=[0x2e7a3c,0x3c8f4a,0x246832,0x4e9a55];[[0,th+.05,0,.62],[.32,th-.05,.18,.4],[-.28,th,.12,.38],[.08,th+.32,-.16,.46],[-.12,th+.22,.22,.34]].forEach(function(p){var b=new THREE.Mesh(new THREE.SphereGeometry(p[3],8,6),new THREE.MeshStandardMaterial({color:greens[Math.floor(Math.random()*greens.length)],roughness:.92}));b.position.set(p[0],p[1],p[2]);g.add(b);});g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI*2;scene.add(g);decos.push({group:g,type:'tree'});markDirty();}
function mkBush(x,z){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x1a6b35,roughness:.9});[[0,0,0,.55],[.35,.1,.2,.4],[-.3,.05,-.2,.38],[.1,.15,.35,.35]].forEach(function(s){var b=new THREE.Mesh(new THREE.SphereGeometry(s[3],8,7),m.clone());b.position.set(s[0],s[1]+s[3]*.7,s[2]);g.add(b);});g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'bush'});markDirty();}
function mkPond(x,z){var g=new THREE.Group();var w=new THREE.Mesh(new THREE.CircleGeometry(1.8,24),window._waterMat);w.rotation.x=-Math.PI/2;w.position.y=.02;g.add(w);var sM=new THREE.MeshStandardMaterial({color:0x5a5a6a,roughness:.95});for(var i=0;i<14;i++){var a=(i/14)*Math.PI*2,r=1.75+(Math.random()-.5)*.3;var s=new THREE.Mesh(new THREE.SphereGeometry(.18+Math.random()*.12,6,5),sM);s.scale.y=.4;s.position.set(Math.cos(a)*r,.05,Math.sin(a)*r);g.add(s);}var lt=new THREE.PointLight(0x4488bb,.5,5);lt.position.y=.5;g.add(lt);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'pond',light:lt});markDirty();}
function mkWall(x,z,a){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x8b7355,roughness:.9}),dm=new THREE.MeshStandardMaterial({color:0x6b5535,roughness:1});var wl=new THREE.Mesh(new THREE.BoxGeometry(1.5,.9,.22),m);wl.position.y=.45;g.add(wl);for(var i=0;i<3;i++){var row=new THREE.Mesh(new THREE.BoxGeometry(1.52,.04,.24),dm);row.position.y=.18+i*.28;g.add(row);}g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'wall'});markDirty();}
function mkArch(x,z,a){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xc8a882,roughness:.8}),iM=new THREE.MeshStandardMaterial({color:0x2d7a20,roughness:1});var c1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,1.8,8),m);c1.position.set(-.7,.9,0);g.add(c1);var c2=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,1.8,8),m);c2.position.set(.7,.9,0);g.add(c2);var top=new THREE.Mesh(new THREE.TorusGeometry(.7,.12,8,16,Math.PI),m);top.rotation.z=Math.PI;top.position.set(0,1.8,0);g.add(top);for(var i=0;i<8;i++){var iv=new THREE.Mesh(new THREE.SphereGeometry(.12,5,5),iM);var ai=(i/8)*Math.PI;iv.position.set(Math.cos(ai+Math.PI)*.7,1.8+Math.sin(ai+Math.PI)*.7,.05);iv.scale.set(1.2,.8,.6);g.add(iv);}g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'arch'});markDirty();}
function mkPergola(x,z,a){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x8b6914,roughness:.85}),iM=new THREE.MeshStandardMaterial({color:0x1e6b28,roughness:1});[[-1,-.8],[1,-.8],[-1,.8],[1,.8]].forEach(function(p){var post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,2.2,8),m);post.position.set(p[0],1.1,p[1]);g.add(post);});[-.8,.8].forEach(function(z2){var beam=new THREE.Mesh(new THREE.BoxGeometry(2.4,.1,.1),m);beam.position.set(0,2.25,z2);g.add(beam);});for(var i=0;i<5;i++){var cr=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1.8),m);cr.position.set(-1+i*.5,2.3,0);g.add(cr);}for(var j=0;j<12;j++){var lf=new THREE.Mesh(new THREE.SphereGeometry(.14,5,5),iM);lf.position.set(-1+Math.random()*2,2.1+Math.random()*.3,-.8+Math.random()*1.6);lf.scale.set(1.5,.5,1.2);g.add(lf);}g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'pergola'});markDirty();}
function mkBridge(x,z,a){var g=new THREE.Group(),wM=new THREE.MeshStandardMaterial({color:0x8b5e2a,roughness:.9}),rM=new THREE.MeshStandardMaterial({color:0xc8a060,roughness:.8});for(var i=0;i<7;i++){var pl=new THREE.Mesh(new THREE.BoxGeometry(.12,.06,.9),wM);pl.position.set(-.72+i*.24,.15,0);g.add(pl);}[-.42,.42].forEach(function(z2){var rail=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8,6),rM);rail.rotation.z=Math.PI/2;rail.position.set(0,.5,z2);g.add(rail);[-.6,0,.6].forEach(function(px){var post=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.4,6),wM);post.position.set(px,.32,z2);g.add(post);});});g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'bridge'});markDirty();}
function mkWell(x,z){var g=new THREE.Group(),sM=new THREE.MeshStandardMaterial({color:0x8b7355,roughness:.95}),wM=new THREE.MeshStandardMaterial({color:0x6b4a1e,roughness:.9});var body=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.6,16,1,true),sM);body.position.y=.3;g.add(body);var ring=new THREE.Mesh(new THREE.TorusGeometry(.45,.06,8,16),sM);ring.rotation.x=Math.PI/2;ring.position.y=.62;g.add(ring);[[-.4,.4],[.4,.4],[-.4,-.4],[.4,-.4]].forEach(function(p){var post=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,6),wM);post.position.set(p[0],1.1,p[1]);g.add(post);});var rf=new THREE.Mesh(new THREE.ConeGeometry(.75,.5,4),wM);rf.position.y=1.65;g.add(rf);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'well'});markDirty();}
function mkTable(x,z,a){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x7a5230,roughness:.85});var top=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,.7),m);top.position.y=.72;g.add(top);[[-.45,-.28],[.45,-.28],[-.45,.28],[.45,.28]].forEach(function(p){var l=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.72,6),m);l.position.set(p[0],.36,p[1]);g.add(l);});g.position.set(x,0,z);g.rotation.y=a||0;scene.add(g);decos.push({group:g,type:'table'});markDirty();}
function mkWindmill(x,z){var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xd4b896,roughness:.8});var body=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,2.5,8),m);body.position.y=1.25;g.add(body);var bg2=new THREE.Group();var bM2=new THREE.MeshStandardMaterial({color:0xf5e8d0,roughness:.7,side:THREE.DoubleSide});for(var i=0;i<4;i++){var blade=new THREE.Mesh(new THREE.PlaneGeometry(.2,1.2),bM2);blade.position.set(0,.6,0);var wr=new THREE.Group();wr.rotation.z=(i/4)*Math.PI*2;wr.add(blade);bg2.add(wr);}bg2.position.set(.26,2.3,0);g.add(bg2);g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'windmill',blades:bg2});markDirty();}
function mkScarecrow(x,z){var g=new THREE.Group();var post=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,2,6),new THREE.MeshStandardMaterial({color:0x6b4a1e,roughness:1}));post.position.y=1;g.add(post);var arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.1,6),new THREE.MeshStandardMaterial({color:0x6b4a1e,roughness:1}));arm.rotation.z=Math.PI/2;arm.position.y=1.5;g.add(arm);var bdy=new THREE.Mesh(new THREE.BoxGeometry(.5,.6,.2),new THREE.MeshStandardMaterial({color:0x8b2200,roughness:.9}));bdy.position.y=1.3;g.add(bdy);var hd=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),new THREE.MeshStandardMaterial({color:0xf5e0a0,roughness:.8}));hd.position.y=1.85;g.add(hd);var brim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.04,12),new THREE.MeshStandardMaterial({color:0x2a1a00,roughness:.9}));brim.position.y=1.97;g.add(brim);var crown=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.3,12),new THREE.MeshStandardMaterial({color:0x2a1a00,roughness:.9}));crown.position.y=2.13;g.add(crown);g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI*2;scene.add(g);decos.push({group:g,type:'scarecrow'});markDirty();}
function mkWildFlower(x,z){var g=new THREE.Group();var cols=[0xffcc00,0xff8800,0xee44aa,0xaa44ff,0x44aaff];var cnt=3+Math.floor(Math.random()*3);var geo=petalGeo(.05,.09,.8);for(var i=0;i<cnt;i++){var ox=(Math.random()-.5)*.55,oz=(Math.random()-.5)*.55,hh=.28+Math.random()*.4;var stm=new THREE.Mesh(new THREE.CylinderGeometry(.008,.01,hh,4),new THREE.MeshStandardMaterial({color:0x2d6e30,roughness:.9}));stm.position.set(ox,hh/2,oz);g.add(stm);var fc=cols[Math.floor(Math.random()*cols.length)];var head=new THREE.Group();head.position.set(ox,hh,oz);for(var k=0;k<5;k++){var p=new THREE.Mesh(geo,petalMat(fc));p.rotation.order='YXZ';p.rotation.y=(k/5)*Math.PI*2;p.rotation.x=1.15;head.add(p);}var c=new THREE.Mesh(new THREE.SphereGeometry(.02,5,4),new THREE.MeshStandardMaterial({color:0xffe36a,roughness:.6}));c.position.y=.02;head.add(c);g.add(head);}g.position.set(x,0,z);scene.add(g);decos.push({group:g,type:'flower_wild'});markDirty();}


// ── EV MODELİ ────────────────────────────────────────────────────────────────
function mkHouse(x,z,angle){
  var g=new THREE.Group();
  // Temel
  var foundMat=new THREE.MeshStandardMaterial({color:0x8b7355,roughness:.9});
  var found=new THREE.Mesh(new THREE.BoxGeometry(3.2,.2,2.8),foundMat);
  found.position.y=.1; g.add(found);
  // Duvarlar
  var wallMat=new THREE.MeshStandardMaterial({color:0xf5e6d0,roughness:.85});
  var walls=new THREE.Mesh(new THREE.BoxGeometry(3.0,1.8,2.6),wallMat);
  walls.position.y=1.1; g.add(walls);
  // Çatı
  var roofMat=new THREE.MeshStandardMaterial({color:0x8b2200,roughness:.8});
  var roofShape=new THREE.Shape();
  roofShape.moveTo(-1.7,0); roofShape.lineTo(1.7,0);
  roofShape.lineTo(0,1.2); roofShape.lineTo(-1.7,0);
  var extSettings={depth:2.8,bevelEnabled:false};
  var roofGeo=new THREE.ExtrudeGeometry(roofShape,extSettings);
  var roof=new THREE.Mesh(roofGeo,roofMat);
  roof.position.set(0,2.0,-1.4); g.add(roof);
  // Kapı
  var doorMat=new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:.8});
  var door=new THREE.Mesh(new THREE.BoxGeometry(.55,.9,.05),doorMat);
  door.position.set(0,.65,1.31); g.add(door);
  // Kapı topu
  var knob=new THREE.Mesh(new THREE.SphereGeometry(.04,6,6),new THREE.MeshStandardMaterial({color:0xcc9900,roughness:.3,metalness:.6}));
  knob.position.set(.22,.65,1.34); g.add(knob);
  // Pencereler
  var winMat=new THREE.MeshStandardMaterial({color:0x88ccff,transparent:true,opacity:.7,roughness:.1,metalness:.1});
  var winFrameMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8});
  [[-1.0,1.1],[ 1.0,1.1]].forEach(function(p){
    var wFrame=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.06),winFrameMat);
    wFrame.position.set(p[0],p[1],1.31); g.add(wFrame);
    var wGlass=new THREE.Mesh(new THREE.BoxGeometry(.38,.38,.04),winMat);
    wGlass.position.set(p[0],p[1],1.33); g.add(wGlass);
    // Pencere çerçeve çizgileri
    var bar1=new THREE.Mesh(new THREE.BoxGeometry(.04,.42,.05),new THREE.MeshStandardMaterial({color:0xdddddd}));
    bar1.position.set(p[0],p[1],1.33); g.add(bar1);
    var bar2=new THREE.Mesh(new THREE.BoxGeometry(.42,.04,.05),new THREE.MeshStandardMaterial({color:0xdddddd}));
    bar2.position.set(p[0],p[1],1.33); g.add(bar2);
  });
  // Arka pencere
  var wBack=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.06),winFrameMat);
  wBack.position.set(0,1.1,-1.31); g.add(wBack);
  var wBackG=new THREE.Mesh(new THREE.BoxGeometry(.38,.38,.04),winMat);
  wBackG.position.set(0,1.1,-1.33); g.add(wBackG);
  // Baca
  var chimMat=new THREE.MeshStandardMaterial({color:0x664422,roughness:.9});
  var chim=new THREE.Mesh(new THREE.BoxGeometry(.28,.6,.28),chimMat);
  chim.position.set(.8,2.85,-.5); g.add(chim);
  var chimTop=new THREE.Mesh(new THREE.BoxGeometry(.36,.08,.36),chimMat);
  chimTop.position.set(.8,3.17,-.5); g.add(chimTop);
  // İç ışık (pencereden sızan)
  var lt=new THREE.PointLight(0xffeeaa,.8,3);
  lt.position.set(0,1.1,.8); g.add(lt);
  // Bahçe yolu (kapı önü)
  var pathMat=new THREE.MeshStandardMaterial({color:0xc8b89a,roughness:.95});
  for(var i=0;i<4;i++){
    var stone=new THREE.Mesh(new THREE.BoxGeometry(.35,.05,.3),pathMat);
    stone.position.set((Math.random()-.5)*.1,0,1.6+i*.38);
    stone.rotation.y=(Math.random()-.5)*.3;
    g.add(stone);
  }
  g.position.set(x,0,z);
  g.rotation.y=angle||0;
  scene.add(g);
  decos.push({group:g,type:'house',light:lt});
  markDirty();
}


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
        if (c.material && c.material !== window._waterMat) {
            if (Array.isArray(c.material)) c.material.forEach(function(m) { if(m!==window._waterMat) m.dispose(); });
            else c.material.dispose();
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
  if(Math.sqrt(pt.x*pt.x+pt.z*pt.z)>28){showToast('Çok uzak! 🚫');return;}
  var tp=placementType,ang=Math.random()*Math.PI*2;
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

// Oyun dongusu.
// ── ANIMATE ──────────────────────────────────────────────────────────────────
var _tc=new THREE.Color(),_cd=new THREE.Color(0x2a1a0a),_cg=new THREE.Color(0x0f2e1a),_cd2=new THREE.Color(0x0a0a0a),_tv=new THREE.Vector3();
var _fc=0,_lc='',_eClock=document.getElementById('clock'),_eHp=document.getElementById('hp');
var growNames=['🌱 Tohum','🌿 Fide','🌸 Filiz','🌺 Tam Çiçek'];
var growSteps=[.20,.45,.80,1.3];
var _perfMode = localStorage.getItem('gdn_perf') || (isMobile ? 'low' : 'high');
var _lastFrame=0, _targetFPS=(_perfMode==='low'?30:60), _fpsInterval=1000/_targetFPS;
var _lastSim=0, _bugAcc=0, _rainAcc=0;
var BUG_EVERY=5184/60, RAIN_EVERY=1800/60;
window.togglePerf = function(){
  _perfMode = _perfMode==='low' ? 'high' : 'low';
  localStorage.setItem('gdn_perf', _perfMode);
  _targetFPS = _perfMode==='low' ? 30 : 60;
  _fpsInterval = 1000/_targetFPS;
  document.getElementById('btnPerf').classList.toggle('on', _perfMode==='high');
  showToast(_perfMode==='low' ? '🔋 Pil Tasarrufu (30fps)' : '⚡ Yüksek Performans (60fps)');
};
function animate(){
  requestAnimationFrame(animate);
  // Uygulama arka plandaysa render etme
  if(document.visibilityState==='hidden') return;
  // FPS limiter - mobilde 30fps
  var _now=performance.now();
  if(_now-_lastFrame < _fpsInterval) return;
  _lastFrame=_now - ((_now-_lastFrame) % _fpsInterval);
  if(!_lastSim) _lastSim=_now;
  var dt=(_now-_lastSim)/1000;
  _lastSim=_now;
  if(!(dt>0)) dt=0;
  if(dt>86400) dt=86400;
  _fc++;
  var now=_now*.001;
  // Clock
  if(_fc%60===0){var t=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});if(t!==_lc){_eClock.innerText=t;_lc=t;}}
  // Day/night - sadece dakikada bir güncelle
  if(_fc%60===0){
    dayPhase=getRDP();
    updDN(dayPhase);
  }
  if(skyMat&&_fc%2===0)skyMat.uniforms.uTime.value=now;
  // Zararlı ve yağmur duvar saatiyle. Uzun arka plan boşluğunda sürü halinde doğmaz.
  if(dt>0){
    _bugAcc+=dt;
    if(_bugAcc>=BUG_EVERY&&flowers.length>0){
      _bugAcc-=BUG_EVERY;
      if(_bugAcc>BUG_EVERY) _bugAcc=BUG_EVERY;
      mkBadBug(Math.floor(Math.random()*flowers.length));
    }
    _rainAcc+=dt;
    if(_rainAcc>=RAIN_EVERY){
      _rainAcc-=RAIN_EVERY;
      if(_rainAcc>RAIN_EVERY) _rainAcc=RAIN_EVERY;
      if((dayPhase<.229||dayPhase>=.896)&&!isRaining&&Math.random()<.2){isRaining=true;initRain();rCvs.style.opacity='1';showToast('🌧️ Yağmur yağıyor!');flowers.forEach(function(f){soak(f,.3);});setTimeout(function(){isRaining=false;rCvs.style.opacity='0';},30000);}
    }
  }
  if(isRaining)drawRain();
  if(curWeather!=='clear')drawWx();
  // Bad bugs move
  for(var bi=0;bi<badBugs.length;bi++){var bg=badBugs[bi],pl=flowers[bg.ti];if(pl){_tv.set(pl.mesh.position.x,pl.h*.7+.15,pl.mesh.position.z);bg.group.position.lerp(_tv,.025);if(_fc%2===0){bg.lp+=.36;var ch=bg.group.children;for(var li=1;li<=6&&li<ch.length;li++)ch[li].rotation.x=.3+Math.sin(bg.lp+li)*.15;}}}
  if(dt>0) advancePlants(dt);
  // Flowers
  for(var fi=0;fi<flowers.length;fi++){var f=flowers[fi];
    if(f.w<.25){if(_fc%3===0){var ch2=f.head.children;for(var ci=0;ci<ch2.length;ci++){if(ch2[ci].material&&ch2[ci].material.color)ch2[ci].material.color.lerp(_cd,.015);}f.grass.material.color.lerp(_cd2,.015);}f.mesh.rotation.z=THREE.MathUtils.lerp(f.mesh.rotation.z,.65,.025);f.mesh.rotation.x=THREE.MathUtils.lerp(f.mesh.rotation.x,.25,.025);}
    else{if(_fc%3===0){_tc.set(f.c);var ch2=f.head.children;for(var ci=0;ci<ch2.length;ci++){var mat=ch2[ci].material;if(mat&&mat.color&&mat.emissiveIntensity===undefined)mat.color.lerp(_tc,.04);}f.grass.material.color.lerp(_cg,.04);}f.mesh.rotation.z=THREE.MathUtils.lerp(f.mesh.rotation.z,0,.04);f.mesh.rotation.x=THREE.MathUtils.lerp(f.mesh.rotation.x,0,.04);}
    if(f.h>.5)f.b=Math.min(1,f.b+.72*dt);f.head.scale.setScalar(f.b);
    var sw=Math.sin(now*.8+f.mesh.position.x)*.018,fsc=f.h*(.6+f.w*.4);f.mesh.scale.set(fsc,fsc,fsc);f.mesh.rotation.z+=(sw-f.mesh.rotation.z)*.05;
  }
  // Butterflies
  for(var bi2=0;bi2<bugs.length;bi2++){var bug=bugs[bi2];bug.time+=.15;if(_fc%2!==0)continue;var fl2=Math.sin(bug.time*5)*.95;bug.wR1.rotation.y=fl2;bug.wL1.rotation.y=-fl2;bug.wR2.rotation.y=fl2*.6;bug.wL2.rotation.y=-fl2*.6;if(!bug.target||bug.mesh.position.distanceTo(bug.target)<.4||Math.random()<.004){if(flowers.length>0&&Math.random()>.25){var rf=flowers[Math.floor(Math.random()*flowers.length)];bug.target=new THREE.Vector3(rf.mesh.position.x+(Math.random()-.5)*.5,rf.h*rf.mesh.scale.y+1,rf.mesh.position.z+(Math.random()-.5)*.5);}else{bug.target=new THREE.Vector3((Math.random()-.5)*22,1+Math.random()*4,(Math.random()-.5)*22);}}bug.mesh.position.lerp(bug.target,bug.speed);bug.mesh.position.y+=Math.sin(bug.time*1.5)*.015;bug.mesh.lookAt(bug.target);}
  // Decos
  decos.forEach(function(d){if(d.type==='windmill'&&d.blades)d.blades.rotation.z+=.01;
    if(d.type==='angel_wing'&&_fc%2===0){
      if(d.light) d.light.intensity=1.2+Math.sin(_fc*.15)*.3;
      if(d.light2) d.light2.intensity=.5+Math.sin(_fc*.22+1)*.2;
      if(d.halo) d.halo.rotation.z=_fc*.008;
    }
    if((d.type==='dragon_egg'||d.type==='moonflower'||d.type==='golden_tree'||d.type==='firefly_jar')&&d.light&&_fc%2===0){
      d.light.intensity=.6+Math.sin(_fc*.2+d.group.position.x*2)*.4;
    }
    if(d.type==='golden_pot'&&d.light&&_fc%3===0)d.light.intensity=.6+Math.sin(_fc*.25)*.3;
    if(d.type==='crystal_pond'&&d.light&&_fc%3===0)d.light.intensity=.6+Math.sin(_fc*.15)*.3;
    if(d.type==='magic_lamp'&&d.light&&_fc%2===0)d.light.intensity=1.5+Math.sin(_fc*.4)*.6;
    if(d.type==='fountain'&&d.light&&_fc%4===0)d.light.intensity=.5+Math.sin(_fc*.1)*.2;if(d.type==='lantern'&&d.light&&_fc%3===0)d.light.intensity=1.2+Math.sin(_fc*.3+d.group.position.x)*.4;if(d.type==='pond'&&d.light&&_fc%4===0)d.light.intensity=.4+Math.sin(now*.5)*.15;
    if(d.type==='house'&&d.light){var ph=getPN(dayPhase);d.light.intensity=ph==='GECE'||ph==='AKŞAM'?0.8+Math.sin(_fc*.08)*.1:0;}});
  if(dt>0) advanceHarvest(dt);

  // Evcil hayvan hareketi
  for(var pi=0;pi<pets.length;pi++){
    var pet=pets[pi]; pet.time+=.08;
    if(!pet.target||pet.mesh.position.distanceTo(pet.target)<.5||Math.random()<.003){
      if(flowers.length>0&&Math.random()>.3){
        var rf2=flowers[Math.floor(Math.random()*flowers.length)];
        pet.target=new THREE.Vector3(rf2.mesh.position.x+(Math.random()-.5)*1.5,.0,rf2.mesh.position.z+(Math.random()-.5)*1.5);
      } else {
        pet.target=new THREE.Vector3((Math.random()-.5)*16,.0,(Math.random()-.5)*16);
      }
    }
    var dir=pet.target.clone().sub(pet.mesh.position);
    if(dir.length()>.1){
      dir.normalize().multiplyScalar(.025);
      pet.mesh.position.add(dir);
      pet.mesh.lookAt(pet.target);
    }
    // Bob hareketi (kedi kuyruk, köpek sallanma)
    pet.mesh.position.y=Math.abs(Math.sin(pet.time*3))*.04;
    // Köpek kuyruk sallama
    if(pet.type==='dog'){
      var tailMesh=pet.mesh.children[4];
      if(tailMesh)tailMesh.rotation.z=Math.sin(pet.time*8)*.4;
    }
    // Kedi kuyruk
    if(pet.type==='cat'){
      var catTail=pet.mesh.children[4];
      if(catTail)catTail.rotation.z=Math.sin(pet.time*2)*.3;
    }
  }

  // Stats
  if(_fc%120===0){var tot=0;for(var fi2=0;fi2<flowers.length;fi2++)tot+=flowers[fi2].w;_eHp.innerText=Math.round(flowers.length?tot/flowers.length*100:0);}
  if(Date.now()-lastSave>SINT)save(false);
  if(_fc%3600===0){saveStats();checkNotifications();}
  controls.update();
  renderer.render(scene,camera);
}
window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);rCvs.width=wCvs.width=innerWidth;rCvs.height=wCvs.height=innerHeight;});
loadProg();loadStats();loadShop();load();placeOwnedWing();animate();

// Oyun dongusu.
// ── ANIMATE ──────────────────────────────────────────────────────────────────
var _tc=new THREE.Color(),_cd=new THREE.Color(0x2a1a0a),_soil=new THREE.Color(0x6b4f32),_cd2=new THREE.Color(0x2a2218),_tv=new THREE.Vector3(),_petDir=new THREE.Vector3();
var _fc=0,_lc='',_eClock=document.getElementById('clock'),_eHp=document.getElementById('hp');
var growNames=['🌱 Tohum','🌿 Fide','🌸 Filiz','🌺 Tam Çiçek'];
var growSteps=[.20,.45,.80,1.3];
var _perfMode = localStorage.getItem('gdn_perf') || (isMobile ? 'low' : 'high');
var _lastFrame=0, _targetFPS=(_perfMode==='low'?30:60), _fpsInterval=1000/_targetFPS;
var _lastSim=0, _bugAcc=0, _rainAcc=0;
var BUG_EVERY=5184/60, RAIN_EVERY=1800/60, PET_SPEED=1.5, PET_R=16;
function stepWeather(dt){
  if(!(dt>0)) return;
  _rainAcc+=dt;
  if(_rainAcc>=RAIN_EVERY){
    _rainAcc-=RAIN_EVERY;
    if(_rainAcc>RAIN_EVERY) _rainAcc=RAIN_EVERY;
    var night=dayPhase<.229||dayPhase>=.896;
    if(night&&curWeather==='clear'&&!isRaining&&Math.random()<.2) startRain();
  }
  if(isRaining){
    _rainLeft-=dt;
    if(_rainLeft<=0) stopRain();
    else drawRain(dt);
  }
  if(curWeather!=='clear') drawWx(dt);
}
function pickPetTarget(pet){
  if(flowers.length>0&&Math.random()>.3){
    var rf2=flowers[Math.floor(Math.random()*flowers.length)];
    pet.target=new THREE.Vector3(rf2.mesh.position.x+(Math.random()-.5)*1.5,0,rf2.mesh.position.z+(Math.random()-.5)*1.5);
  }else{
    var a=Math.random()*Math.PI*2, r=Math.random()*PET_R;
    pet.target=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);
  }
}
function stepPets(dt){
  if(!(dt>0)||!pets.length) return;
  for(var pi=0;pi<pets.length;pi++){
    var pet=pets[pi];
    pet.time+=dt;
    pet.wander=(pet.wander||0)+dt;
    var arrived=pet.target&&pet.mesh.position.distanceTo(pet.target)<.5;
    if(!pet.target||arrived||pet.wander>6){ pet.wander=0; pickPetTarget(pet); }
    _petDir.copy(pet.target).sub(pet.mesh.position); _petDir.y=0;
    var moving=false;
    if(_petDir.length()>.05){
      var step=Math.min(_petDir.length(), PET_SPEED*dt);
      moving=step>.004;
      _petDir.normalize().multiplyScalar(step);
      pet.mesh.position.add(_petDir);
      var rad=Math.hypot(pet.mesh.position.x, pet.mesh.position.z);
      if(rad>PET_R){ pet.mesh.position.x*=PET_R/rad; pet.mesh.position.z*=PET_R/rad; }
    }
    var gait=pet.time*(pet.type==='dog'?11:9);
    pet.mesh.position.y=moving?Math.abs(Math.sin(gait))*.03:Math.sin(pet.time*2)*.008;
    pet.mesh.lookAt(pet.target.x, pet.mesh.position.y, pet.target.z);
    if(pet.legs){
      for(var li=0;li<pet.legs.length;li++){
        var phase=(li===0||li===3)?0:Math.PI;
        pet.legs[li].rotation.x=Math.sin((moving?gait:pet.time*1.5)+phase)*(moving?.5:.06);
      }
    }
    if(pet.tail){
      if(pet.type==='dog'){pet.tail.rotation.x=moving?1.15:.95;pet.tail.rotation.z=Math.sin(pet.time*(moving?7:12))*(moving?.28:.5);}
      else{pet.tail.rotation.x=-1.2+Math.sin(pet.time*2)*.18;pet.tail.rotation.z=Math.sin(pet.time*(moving?5:3))*.45;}
    }
  }
}
window.stepPets=stepPets; window.stepWeather=stepWeather;
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
  if(window._waterMat)window._waterMat.uniforms.uTime.value=now;
  // Zararlı ve yağmur duvar saatiyle. Uzun arka plan boşluğunda sürü halinde doğmaz.
  if(dt>0){
    _bugAcc+=dt;
    if(_bugAcc>=BUG_EVERY&&flowers.length>0){
      _bugAcc-=BUG_EVERY;
      if(_bugAcc>BUG_EVERY) _bugAcc=BUG_EVERY;
      mkBadBug(Math.floor(Math.random()*flowers.length));
    }
    stepWeather(dt);
  }
  // Bad bugs move
  for(var bi=0;bi<badBugs.length;bi++){var bg=badBugs[bi],pl=flowers[bg.ti];if(pl){_tv.set(pl.mesh.position.x,pl.h*.7+.15,pl.mesh.position.z);bg.group.position.lerp(_tv,.025);if(_fc%2===0){bg.lp+=.36;var ch=bg.group.children;for(var li=1;li<=6&&li<ch.length;li++)ch[li].rotation.x=.3+Math.sin(bg.lp+li)*.15;}}}
  if(dt>0) advancePlants(dt);
  // Flowers
  for(var fi=0;fi<flowers.length;fi++){var f=flowers[fi];
    var wind=Math.sin(now*1.15+f.mesh.position.x*.65+f.mesh.position.z*.4);
    var gust=.65+.35*Math.sin(now*.33+f.mesh.position.z);
    if(f.w<.25){if(_fc%3===0){var ch2=f.head.children;for(var ci=0;ci<ch2.length;ci++){if(ch2[ci].material&&ch2[ci].material.color)ch2[ci].material.color.lerp(_cd,.015);}f.grass.material.color.lerp(_cd2,.015);}f.mesh.rotation.z=THREE.MathUtils.lerp(f.mesh.rotation.z,.55+wind*.04,.12);f.mesh.rotation.x=THREE.MathUtils.lerp(f.mesh.rotation.x,.22,.12);}
    else{if(_fc%3===0){_tc.set(f.c);var ch2=f.head.children;for(var ci=0;ci<ch2.length;ci++){var mat=ch2[ci].material;if(mat&&mat.color&&mat.emissiveIntensity===undefined)mat.color.lerp(_tc,.04);}f.grass.material.color.lerp(_soil,.04);}var amp=(.04+gust*.028)*(.55+Math.min(f.w,1.2)*.4);f.mesh.rotation.z=THREE.MathUtils.lerp(f.mesh.rotation.z,wind*amp,.08);f.mesh.rotation.x=THREE.MathUtils.lerp(f.mesh.rotation.x,Math.sin(now*.9+f.mesh.position.z)*amp*.35,.08);}
    if(f.leaves){for(var li2=0;li2<f.leaves.length;li2++){var lf=f.leaves[li2];lf.rotation.z=lf.userData.bz+wind*(.12+li2*.05);}}
    if(f.h>.5)f.b=Math.min(1,f.b+.72*dt);f.head.scale.setScalar(f.b);
    if(f.head)f.head.rotation.z=wind*(f.w<.25?.02:.07);
    var fsc=f.h*(.6+f.w*.4);f.mesh.scale.set(fsc,fsc,fsc);
  }
  // Butterflies
  for(var bi2=0;bi2<bugs.length;bi2++){var bug=bugs[bi2];bug.time+=dt;var flap=Math.sin(bug.time*18);bug.wR1.rotation.y=.7+flap*.42;bug.wL1.rotation.y=-(.7+flap*.42);bug.wR2.rotation.y=.15+flap*.28;bug.wL2.rotation.y=-(.15+flap*.28);if(!bug.target||bug.mesh.position.distanceTo(bug.target)<.7||bug.time>(bug.until||0)){bug.until=bug.time+2+Math.random()*3;if(flowers.length>0&&Math.random()>.25){var rf=flowers[Math.floor(Math.random()*flowers.length)];bug.target=new THREE.Vector3(rf.mesh.position.x+(Math.random()-.5)*.6,rf.h*rf.mesh.scale.y+.8+Math.random()*.6,rf.mesh.position.z+(Math.random()-.5)*.6);}else{bug.target=new THREE.Vector3((Math.random()-.5)*22,1.1+Math.random()*2.2,(Math.random()-.5)*22);}}if(bug.target){bug.mesh.position.y-=bug.bob||0;_tv.copy(bug.target).sub(bug.mesh.position);var dist=_tv.length();if(dist>.04){_tv.multiplyScalar(Math.min(1,(bug.flight||1.4)*dt/dist));bug.mesh.position.add(_tv);}bug.bob=Math.sin(bug.time*3.1)*.16;bug.mesh.position.y+=bug.bob;bug.mesh.lookAt(bug.target);bug.mesh.rotateZ(Math.sin(bug.time*2.4)*.28);}}
  // Decos
  decos.forEach(function(d){if(d.type==='tree'||d.type==='bush'||d.type==='flower_wild')d.group.rotation.z=Math.sin(now*.8+d.group.position.x)*.02;if(d.type==='windmill'&&d.blades)d.blades.rotation.z+=Math.min(dt,.05)*.9;
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
  for(var hi=0;hi<harvestItems.length;hi++){var hv=harvestItems[hi];if(hv.sway){hv.sway.rotation.z=Math.sin(now*1.35+hv.x)*.045;hv.sway.rotation.x=Math.sin(now*1.05+hv.z)*.03;}}

  stepPets(dt);

  // Stats
  if(_fc%120===0){var tot=0;for(var fi2=0;fi2<flowers.length;fi2++)tot+=flowers[fi2].w;_eHp.innerText=Math.round(flowers.length?tot/flowers.length*100:0);}
  if(Date.now()-lastSave>SINT)save(false);
  if(_fc%3600===0){saveStats();checkNotifications();}
  controls.update();
  renderer.render(scene,camera);
}
window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);rCvs.width=wCvs.width=innerWidth;rCvs.height=wCvs.height=innerHeight;});
loadProg();loadStats();loadShop();load();placeOwnedWing();animate();

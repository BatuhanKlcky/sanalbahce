// Oyun dongusu.
// ── ANIMATE ──────────────────────────────────────────────────────────────────
var _tc=new THREE.Color(),_cd=new THREE.Color(0x2a1a0a),_soil=new THREE.Color(0x6b4f32),_cd2=new THREE.Color(0x2a2218),_tv=new THREE.Vector3(),_petDir=new THREE.Vector3();
var _fc=0,_lc='',_eClock=document.getElementById('clock'),_eHp=document.getElementById('hp');
var growNames=['🌱 Tohum','🌿 Fide','🌸 Filiz','🌺 Tam Çiçek'];
var growSteps=[.20,.45,.80,1.3];
var _perfMode = localStorage.getItem('gdn_perf') || 'high';
var _lastFrame=0, _targetFPS=60, _fpsInterval=1000/60;
var _lastSim=0, _bugAcc=0, _rainAcc=0;
var BUG_EVERY=5184/60*2.2, RAIN_EVERY=1800/60, PET_SPEED=1.5, PET_R=12;
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
  var cx = 0, cz = 0;
  if(typeof window.getActiveBiome === 'function' && typeof isCozy === 'function' && isCozy()){
    var b = window.getActiveBiome();
    if(b){ cx = b.cx || 0; cz = b.cz || 0; }
  }
  if(!pet.target) pet.target = new THREE.Vector3();
  if(pet.homeX == null && pet.mesh){
    pet.homeX = pet.mesh.position.x;
    pet.homeZ = pet.mesh.position.z;
  }
  var isLivestock = pet.spec && (pet.spec.breed === 'cow' || pet.spec.breed === 'alpaca' || pet.spec.breed === 'sheep' || pet.spec.breed === 'chick' || pet.spec.breed === 'duck' || pet.spec.breed === 'horse');
  if(isLivestock && pet.homeX != null){
    var ang = Math.random() * Math.PI * 2, rad = 1.0 + Math.random() * 4.2;
    var tx = pet.homeX + Math.cos(ang) * rad;
    var tz = pet.homeZ + Math.sin(ang) * rad;
    if(Math.abs(tz - (-21.0)) < 3.2) tz = pet.homeZ; // Never wander into railroad tracks
    pet.target.set(tx, 0, tz);
    return;
  }
  if(flowers.length>0&&Math.random()>.3){
    var rf2=flowers[Math.floor(Math.random()*flowers.length)];
    var fx = rf2.mesh.position.x+(Math.random()-.5)*1.5;
    var fz = rf2.mesh.position.z+(Math.random()-.5)*1.5;
    if(Math.abs(fz - (-21.0)) < 3.2) fz = -17.5;
    pet.target.set(fx, 0, fz);
  }else{
    var a=Math.random()*Math.PI*2, r=Math.random()*Math.min(PET_R, 12);
    var ptx = cx + Math.cos(a)*r;
    var ptz = cz + Math.sin(a)*r;
    if(Math.abs(ptz - (-21.0)) < 3.2) ptz = -17.5;
    pet.target.set(ptx, 0, ptz);
  }
}
function stepPets(dt){
  if(!(dt>0)||!pets.length) return;
  for(var pi=0;pi<pets.length;pi++){
    var pet=pets[pi];
    if(!pet || !pet.mesh) continue;
    pet.time=(pet.time||0)+dt;

    // 1) İskelet animasyon mikserini güncelle (mesafe tabanlı ve dönüşümlü optimizasyon)
    if(pet.mixer){
      var distSq = pet.mesh.position.distanceToSquared(camera.position);
      if(distSq > 900){
        if((pi + _fc) % 3 === 0) pet.mixer.update(dt * 3);
      } else {
        if((pi + _fc) % 2 === 0) pet.mixer.update(dt * 2);
      }
    }

    // 1.5) Çiftlik Hayvanları Üretim Zamanlayıcısı (Süt 🥛, Yün 🧶, Yumurta 🥚)
    if(pet.prodItem){
      if(!pet.prodReady){
        pet.prodTimer = (pet.prodTimer != null ? pet.prodTimer : 45) - dt;
        if(pet.prodTimer <= 0){
          pet.prodTimer = 0;
          pet.prodReady = true;
          if(pet.prodBadge) pet.prodBadge.visible = true;
        }
      } else if(pet.prodBadge){
        pet.prodBadge.visible = true;
        var baseH = ((pet.spec && pet.spec.targetH) || 0.9) + 0.36;
        pet.prodBadge.position.y = baseH + Math.sin(pet.time * 3.4) * 0.08;
      }
    }

    // 2) Sevme / Besleme / Yetenek tepki animasyonu aktifse olduğu yerde gerçek klibi oynat
    if(pet._reactTimer && pet._reactTimer > 0){
      pet._reactTimer -= dt;
      pet.mesh.position.y = 0;
      if(pet._reactTimer <= 0){
        pet._reactTimer = 0;
        pet._reactClip = null;
        if(typeof window.playAnimalClip === 'function' && pet.spec){
          window.playAnimalClip(pet, pet.spec.idleClips || ['idle','Idle'], { fade: 0.25 });
        }
      }
      continue;
    }

    // 3) Doğal dinlenme (idle/sit/groom/sniff) ve gezinme (walk/trot) durum makinesi
    if(pet._restTimer && pet._restTimer > 0){
      pet._restTimer -= dt;
      pet.mesh.position.y = 0;
      pet._idleSwitchAcc = (pet._idleSwitchAcc || 0) + dt;
      if(pet._idleSwitchAcc > 3.6 && typeof window.playAnimalClip === 'function' && pet.spec){
        pet._idleSwitchAcc = 0;
        var idles = pet.spec.idleClips || ['idle'];
        var pickIdle = idles[Math.floor(Math.random() * idles.length)];
        window.playAnimalClip(pet, [pickIdle, 'idle', 'Idle'], { fade: 0.35 });
      }
      if(pet._restTimer <= 0){
        pet._restTimer = 0;
        pickPetTarget(pet);
      }
      continue;
    }

    pet.wander=(pet.wander||0)+dt;
    var arrived=pet.target&&pet.mesh.position.distanceTo(pet.target)<0.42;
    if(!pet.target||arrived||pet.wander>7.5){
      pet.wander=0;
      // Hedefe varınca 2.2 - 5.2 sn boyunca gerçek Idle / Sit / Groom / Sniff iskelet animasyonu oynat
      if(arrived && Math.random() < 0.72){
        pet._restTimer = 2.2 + Math.random() * 3.0;
        pet._idleSwitchAcc = 0;
        if(typeof window.playAnimalClip === 'function' && pet.spec){
          var idlePool = pet.spec.idleClips || ['idle'];
          var chosenIdle = idlePool[Math.floor(Math.random() * idlePool.length)];
          window.playAnimalClip(pet, [chosenIdle, 'idle', 'Idle'], { fade: 0.28 });
        }
        continue;
      }
      pickPetTarget(pet);
    }

    _petDir.copy(pet.target).sub(pet.mesh.position); _petDir.y=0;
    var dist = _petDir.length();
    var moving = false;
    var running = dist > 4.2 || !!pet._chasing;
    var moveSpd = PET_SPEED * (running ? 1.45 : 0.95);
    if(dist > 0.05){
      var step = Math.min(dist, moveSpd * dt);
      moving = step > 0.003;
      _petDir.normalize();
      // Yumuşak dönüş açısı (aniden dönmek yerine doğal yönelme)
      var targetYaw = Math.atan2(_petDir.x, _petDir.z);
      var diffYaw = targetYaw - pet.mesh.rotation.y;
      while(diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      while(diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      pet.mesh.rotation.y += diffYaw * Math.min(1, dt * 8.5);
      pet.mesh.position.x += _petDir.x * step;
      pet.mesh.position.z += _petDir.z * step;
      pet.mesh.position.y = 0;
    } else {
      pet._chasing = false;
    }

    // 4) Hareket durumuna göre gerçek .glb yürüme / koşma / durma klibine geçiş
    if(typeof window.playAnimalClip === 'function' && pet.spec){
      if(moving){
        var moveClip = running ? (pet.spec.runClip || 'trot') : (pet.spec.walkClip || 'walk');
        window.playAnimalClip(pet, [moveClip, 'walk', 'Walk', 'AnimalArmature|Walk'], {
          fade: 0.20,
          timeScale: running ? 1.15 : 1.0
        });
      } else {
        window.playAnimalClip(pet, [pet.spec.idleClips ? pet.spec.idleClips[0] : 'idle', 'idle', 'Idle'], {
          fade: 0.25,
          timeScale: 1.0
        });
      }
    }
  }
}
function stepBloom(f, now, wind){
  if(!f.head||f.w<.25) return;
  var tp=f.t, ph=now+f.mesh.position.x*.4, kids=f.head.children, i, p;
  if(tp===2){
    var sun=(typeof dayPhase==='number'?dayPhase:.5);
    f.head.rotation.y=Math.sin((sun-.5)*Math.PI)*.7;
  }
  for(i=0;i<kids.length;i++){
    p=kids[i];
    if(p.userData.bz!==undefined && p.isGroup){
      p.rotation.z=p.userData.bz+Math.sin(ph*2.1+(p.userData.pi||i))*(.16+Math.abs(wind)*.1);
      continue;
    }
    if(p.userData.px===undefined) continue;
    var n=p.userData.pi||i;
    if(tp===0) p.rotation.x=p.userData.px+Math.sin(ph*.85)*.045;
    else if(tp==='tulip') p.rotation.x=p.userData.px+(.5+.5*Math.sin(ph*.4))*(n<3?.14:.07);
    else if(tp==='lotus') p.rotation.x=p.userData.px+Math.sin(ph*1.35+n*.5)*.07;
    else if(tp==='cherry') p.rotation.x=p.userData.px+Math.sin(ph*3.1+n)*.12*Math.max(.35,Math.abs(wind));
    else if(tp===2) p.rotation.x=p.userData.px+Math.sin(ph*1.1+n)*.035;
    else p.rotation.x=p.userData.px+Math.sin(ph*1.5+n)*.06;
  }
}
function rustle(g, now, amp){
  var leaves=g.userData&&g.userData.leaves;
  if(leaves){
    for(var i=0;i<leaves.length;i++){
      var lf=leaves[i];
      lf.rotation.z=(lf.userData.rz||0)+Math.sin(now*1.7+lf.position.x*2+i)*amp*.12;
      lf.rotation.x=lf.userData.rx+Math.sin(now*1.25+i*.7)*amp*.05;
    }
  }
  var heads=g.userData&&g.userData.heads;
  if(heads){
    for(var h=0;h<heads.length;h++){
      heads[h].position.y=(heads[h].userData.by||heads[h].position.y)+Math.sin(now*1.6+h)*.03*amp;
      heads[h].rotation.z=Math.sin(now*1.3+h)*.08*amp;
    }
  }
}
function stepButterflies(dt){
  if(!bugs || !bugs.length) return;
  var cx = 0, cz = 0, maxR = 48;
  if(typeof window.getActiveBiome === 'function' && typeof isCozy === 'function' && isCozy()){
    var b = window.getActiveBiome();
    if(b){ cx = b.cx || 0; cz = b.cz || 0; maxR = Math.max(8, (b.R || 18) - 1.5); }
  } else if(typeof GARDEN_R !== 'undefined'){
    maxR = Math.min(60, GARDEN_R * 0.75);
  }

  for(var bi2=0;bi2<bugs.length;bi2++){
    var bug=bugs[bi2];
    if(!bug || !bug.mesh) continue;
    bug.time += dt;

    // 1) Hedef Seçimi (Bir merkezde takılı kalmayı önler, tüm haritaya yayılır)
    if(!bug.target || bug.mesh.position.distanceTo(bug.target) < 1.1 || bug.time > (bug.until || 0)){
      bug.until = bug.time + 3.5 + Math.random() * 5.0;
      if(!bug.target) bug.target = new THREE.Vector3();

      var pick = Math.random();
      if(pick < 0.25 && flowers.length > 0){
        // Çiçek ziyareti (%25 şans, geniş dağılım)
        var rf = flowers[Math.floor(Math.random() * flowers.length)];
        var fPos = rf.mesh.position;
        bug.target.set(
          fPos.x + (Math.random() - 0.5) * 2.2,
          Math.max(1.15, rf.h * rf.mesh.scale.y + 0.65 + Math.random() * 0.8),
          fPos.z + (Math.random() - 0.5) * 2.2
        );
      } else if(pick < 0.45 && typeof decos !== 'undefined' && decos && decos.length > 0){
        // Bahçe dekorları, çalılar, ağaçlar veya gölet etrafında süzülme
        var rd = decos[Math.floor(Math.random() * decos.length)];
        if(rd && rd.group && rd.group.visible !== false){
          var dp = rd.group.position;
          bug.target.set(
            dp.x + (Math.random() - 0.5) * 4.0,
            1.2 + Math.random() * 2.5,
            dp.z + (Math.random() - 0.5) * 4.0
          );
        } else {
          var a0 = Math.random() * Math.PI * 2;
          var r0 = 4 + Math.random() * (maxR - 5);
          bug.target.set(cx + Math.cos(a0) * r0, 1.2 + Math.random() * 2.8, cz + Math.sin(a0) * r0);
        }
      } else {
        // Dünyada tamamen serbest, geniş alanda rastgele uçuş
        var a = Math.random() * Math.PI * 2;
        var r = 3 + Math.random() * (maxR - 4);
        bug.target.set(
          cx + Math.cos(a) * r,
          1.15 + Math.random() * 3.0,
          cz + Math.sin(a) * r
        );
      }
    }

    // 2) Anti-Clustering (Yumuşak Ayrışma): Simetrik ve kare dağıtımlı optimizasyon
    if((bi2 + _fc) % 4 === 0){
      for(var bi3 = bi2 + 1; bi3 < bugs.length; bi3++){
        var other = bugs[bi3];
        if(!other || !other.mesh) continue;
        var sepX = bug.mesh.position.x - other.mesh.position.x;
        var sepZ = bug.mesh.position.z - other.mesh.position.z;
        var sepDistSq = sepX * sepX + sepZ * sepZ;
        if(sepDistSq > 0.0001 && sepDistSq < 4.84){ // 2.2 metre içinde birbirini nazikçe iter
          var sepDist = Math.sqrt(sepDistSq);
          var force = (2.2 - sepDist) * 0.72 * dt;
          var fx = (sepX / sepDist) * force;
          var fz = (sepZ / sepDist) * force;
          bug.mesh.position.x += fx;
          bug.mesh.position.z += fz;
          other.mesh.position.x -= fx;
          other.mesh.position.z -= fz;
        }
      }
    }

    bug.mesh.position.y -= bug.bob || 0;
    _tv.copy(bug.target).sub(bug.mesh.position);
    var dist = _tv.length();
    var hovering = dist < 1.35;
    var speed = hovering ? 0.72 : (bug.flight || 1.35);
    var hx = 0, hz = 1, distH = Math.hypot(_tv.x, _tv.z);
    if(distH > 0.08){ hx = _tv.x / distH; hz = _tv.z / distH; }
    if(dist > 0.04){
      _tv.multiplyScalar(Math.min(1, speed * dt / dist));
      bug.mesh.position.add(_tv);
    }
    var phase = bug.time * (hovering ? 2.3 : 1.15) + bi2 * 1.7;
    var drift = Math.sin(phase);
    var dAmp = hovering ? 0.32 : 0.12;
    var d = (drift - (bug._drift || 0)) * dAmp;
    bug._drift = drift;
    bug.mesh.position.x += -hz * d;
    bug.mesh.position.z += hx * d;
    var hzFlap = hovering ? (bug.hz || 10) * 0.62 : (bug.hz || 10);
    var s = Math.sin(bug.time * hzFlap);
    var s2 = Math.sin(bug.time * hzFlap - 0.5);
    var amp = hovering ? 0.34 : 0.86;
    var open = hovering ? 0.28 : 0.4;
    var lift = open + s * amp;
    var liftH = open * 0.75 + s2 * amp * 0.7;
    if(bug.wR1){ bug.wR1.rotation.z = lift; bug.wL1.rotation.z = -lift; }
    if(bug.wR2){ bug.wR2.rotation.z = liftH; bug.wL2.rotation.z = -liftH; }
    bug.bob = Math.sin(bug.time * hzFlap - 0.7) * (hovering ? 0.035 : 0.07) + Math.sin(bug.time * 1.7) * 0.035;
    bug.mesh.position.y += bug.bob;
    bug.mesh.lookAt(bug.target);
    bug.mesh.rotateZ(drift * (hovering ? 0.18 : 0.42));
    bug.mesh.rotateX(hovering ? -0.42 : (-0.2 - Math.max(0, s) * 0.22));
    if(bug.ants){
      bug.ants[0].rotation.x = Math.sin(bug.time * 2.6) * 0.18;
      bug.ants[1].rotation.x = Math.sin(bug.time * 2.6 + 0.5) * 0.18;
    }
  }
}
window.stepPets=stepPets; window.stepWeather=stepWeather; window.stepButterflies=stepButterflies;
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
  var _now = performance.now();
  if(!_lastSim) _lastSim = _now;
  var dt = Math.min(0.065, (_now - _lastSim) / 1000);
  _lastSim = _now;
  _lastFrame = _now;
  _fc++;
  window._fc = _fc;
  var now=_now*.001;
  // Clock
  if(_fc%60===0){var t=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});if(t!==_lc){_eClock.innerText=t;_lc=t;}}
  // Day/night - sadece dakikada bir güncelle
  if(_fc%60===0){
    dayPhase=getRDP();
    updDN(dayPhase);
    if(typeof window.applyCozyLights==='function') window.applyCozyLights();
  }
  if(skyMat&&_fc%2===0)skyMat.uniforms.uTime.value=now;
  if(window._waterMat)window._waterMat.uniforms.uTime.value=now;
  // Zararlı ve yağmur duvar saatiyle. Uzun arka plan boşluğunda sürü halinde doğmaz.
  if(dt>0){
    _bugAcc+=dt;
    if(_bugAcc>=BUG_EVERY&&flowers.length>0){
      _bugAcc-=BUG_EVERY;
      if(_bugAcc>BUG_EVERY) _bugAcc=BUG_EVERY;
      if(!(typeof isCozy==='function'&&isCozy())) mkBadBug(Math.floor(Math.random()*flowers.length));
    }
    stepWeather(dt);
  }
  // Bad bugs move
  for(var bi=0;bi<badBugs.length;bi++){var bg=badBugs[bi],pl=flowers[bg.ti];if(pl){_tv.set(pl.mesh.position.x,pl.h*.7+.15,pl.mesh.position.z);bg.group.position.lerp(_tv,.025);if(_fc%2===0){bg.lp+=.36;var ch=bg.group.children;for(var li=1;li<=6&&li<ch.length;li++)ch[li].rotation.x=.3+Math.sin(bg.lp+li)*.15;}}}
  if(dt>0) advancePlants(dt);
  // Flowers
  var flen = flowers.length;
  if(flen > 0){
    var baseNowWind = now * 1.15;
    var camX = camera.position.x, camZ = camera.position.z;
    for(var fi = 0; fi < flen; fi++){
      var f = flowers[fi];
      var fpos = f.mesh.position;
      var fx = fpos.x, fz = fpos.z;
      var fDistSq = (fx - camX) * (fx - camX) + (fz - camZ) * (fz - camZ);
      if(fDistSq > 2200) continue;
      var wind = Math.sin(baseNowWind + fx * 0.65 + fz * 0.4);
      var gust = 0.65 + 0.35 * Math.sin(now * 0.33 + fz);

      var isDry = f.w < 0.25;
      if(isDry){
        if(_fc % 6 === 0){
          var ch2 = f.head.children;
          for(var ci = 0; ci < ch2.length; ci++){
            if(ch2[ci].material && ch2[ci].material.color) ch2[ci].material.color.lerp(_cd, 0.04);
          }
          f.grass.material.color.lerp(_cd2, 0.04);
        }
        f.mesh.rotation.z = THREE.MathUtils.lerp(f.mesh.rotation.z, 0.55 + wind * 0.04, 0.12);
        f.mesh.rotation.x = THREE.MathUtils.lerp(f.mesh.rotation.x, 0.22, 0.12);
      } else {
        if(_fc % 6 === 0){
          _tc.set(f.c);
          var ch2 = f.head.children;
          for(var ci = 0; ci < ch2.length; ci++){
            var mat = ch2[ci].material;
            if(mat && mat.color && mat.emissiveIntensity === undefined) mat.color.lerp(_tc, 0.08);
          }
          f.grass.material.color.lerp(_soil, 0.08);
        }
        var amp = (0.04 + gust * 0.028) * (0.55 + Math.min(f.w, 1.2) * 0.4);
        f.mesh.rotation.z = THREE.MathUtils.lerp(f.mesh.rotation.z, wind * amp, 0.08);
        f.mesh.rotation.x = THREE.MathUtils.lerp(f.mesh.rotation.x, Math.sin(now * 0.9 + fz) * amp * 0.35, 0.08);
      }

      if(f.leaves){
        for(var li2 = 0; li2 < f.leaves.length; li2++){
          var lf = f.leaves[li2];
          lf.rotation.z = lf.userData.bz + wind * (0.12 + li2 * 0.05);
        }
      }
      if(f.h > 0.5) f.b = Math.min(1, f.b + 0.72 * dt);
      f.head.scale.setScalar(f.b);
      if(f.head) f.head.rotation.z = wind * (isDry ? 0.02 : 0.07);
      if((fi + _fc) % 2 === 0) stepBloom(f, now, wind);
      var fsc = f.h * (0.6 + f.w * 0.4);
      f.mesh.scale.set(fsc, fsc, fsc);
    }
  }
  // Butterflies
  if(dt>0) stepButterflies(dt);
  if(typeof window.stepCozyLife==='function'){
    try{ window.stepCozyLife(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepCozyLife', e); }
  }
  if(typeof window.stepFarmers==='function'){
    try{ window.stepFarmers(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepFarmers', e); }
  }
  if(typeof window.stepChickenCoop==='function'){
    try{ window.stepChickenCoop(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepChickenCoop', e); }
  }
  if(typeof window.stepVillageNPCs==='function'){
    try{ window.stepVillageNPCs(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepVillageNPCs', e); }
  }
  if(typeof window.stepBarn==='function'){
    try{ window.stepBarn(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepBarn', e); }
  }
  if(typeof window.stepVillageMarket==='function'){
    try{ window.stepVillageMarket(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepVillageMarket', e); }
  }
  if(typeof window.stepVisualFX==='function'){
    try{ window.stepVisualFX(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepVisualFX', e); }
  }
  if(typeof window.stepAQuality==='function'){
    try{ window.stepAQuality(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepAQuality', e); }
  }
  if(typeof window.stepTrainTrade==='function'){
    try{ window.stepTrainTrade(dt, now); }
    catch(e){ if(!_fc||_fc%300===1) console.warn('stepTrainTrade', e); }
  }
  // Decos — fast indexed loop, skip invisible, precalculate night mode once
  var dlen = decos.length;
  if(dlen > 0){
    var isNightTime = (dayPhase < 0.229 || dayPhase >= 0.896);
    var camX = camera.position.x, camZ = camera.position.z;
    for(var di = 0; di < dlen; di++){
      var d = decos[di];
      if(!d || !d.group || d.group.visible === false) continue;
      var dpos = d.group.position;
      var dx = dpos.x, dz = dpos.z;
      var distSq = (dx - camX) * (dx - camX) + (dz - camZ) * (dz - camZ);
      if(distSq > 2200) continue;

      if(d.type === 'tree' || d.type === 'bush'){
        if(d.group.userData.baseRotZ === undefined) d.group.userData.baseRotZ = d.group.rotation.z || 0;
        var amp = d.type === 'bush' ? 0.025 : 0.016;
        d.group.rotation.z = d.group.userData.baseRotZ + Math.sin(now * 1.35 + dx * 0.7 + dz * 0.5) * amp;
      }
      else if(d.type === 'pine' || d.type === 'birch' || d.type === 'willow' || d.type === 'apple_tree' || d.type === 'bamboo' || d.type === 'palm'){
        if(d.group.userData.baseRotZ === undefined) d.group.userData.baseRotZ = d.group.rotation.z || 0;
        var swayAmp = (d.type === 'bamboo' || d.type === 'willow') ? 0.045 : 0.022;
        d.group.rotation.z = d.group.userData.baseRotZ + Math.sin(now * 1.35 + dx * 0.7 + dz * 0.5) * swayAmp;
      }
      else if(d.type === 'plant' || d.type === 'pumpkin' || d.type === 'watermelon'){
        if(d.group.userData.baseRotZ === undefined) d.group.userData.baseRotZ = d.group.rotation.z || 0;
        d.group.rotation.z = d.group.userData.baseRotZ + Math.sin(now * 1.8 + dx) * 0.025;
      }
      else if(d.type === 'flower_wild'){
        d.group.rotation.z = Math.sin(now * 1.4 + dx) * 0.05;
      }
      else if(d.type === 'mushroom' && d.group.userData.caps){
        var caps = d.group.userData.caps;
        for(var ci = 0; ci < caps.length; ci++){
          caps[ci].position.y = caps[ci].userData.by + Math.sin(now * 1.6 + ci) * 0.02;
        }
      }
      if(d.group.userData.arm){
        d.group.userData.arm.rotation.z = Math.sin(now * 1.35 + dx) * 0.08;
      }
      if(d.flame){
        d.flame.scale.y = 0.92 + Math.sin(now * 7 + dx) * 0.08;
        if(d.light && _fc % 2 === 0) d.light.intensity = 1.15 + Math.sin(now * 6) * 0.25;
      }
      if(d.type === 'windmill' && d.blades){
        d.blades.rotation.z += Math.min(dt, 0.05) * 0.9;
      }
      if(d.type === 'angel_wing' && _fc % 3 === 0){
        if(d.light) d.light.intensity = 1.2 + Math.sin(_fc * 0.15) * 0.3;
        if(d.light2) d.light2.intensity = 0.5 + Math.sin(_fc * 0.22 + 1) * 0.2;
        if(d.halo) d.halo.rotation.z = _fc * 0.008;
      }
      if((d.type === 'dragon_egg' || d.type === 'moonflower' || d.type === 'golden_tree' || d.type === 'firefly_jar') && d.light && _fc % 3 === 0){
        d.light.intensity = 0.6 + Math.sin(_fc * 0.2 + dx * 2) * 0.4;
      }
      if(d.type === 'golden_pot' && d.light && _fc % 4 === 0) d.light.intensity = 0.6 + Math.sin(_fc * 0.25) * 0.3;
      if(d.type === 'crystal_pond' && d.light && _fc % 4 === 0) d.light.intensity = 0.6 + Math.sin(_fc * 0.15) * 0.3;
      if(d.type === 'magic_lamp' && d.light && _fc % 3 === 0) d.light.intensity = 1.5 + Math.sin(_fc * 0.4) * 0.6;
      if(d.type === 'fountain' && d.light && _fc % 4 === 0) d.light.intensity = 0.5 + Math.sin(_fc * 0.1) * 0.2;
      if(d.type === 'lantern' && d.light && _fc % 4 === 0){
        d.light.intensity = 4.2 + Math.sin(_fc * 0.3 + dx) * 0.75;
        if(d.group && d.group.userData && d.group.userData.fillLight){
          d.group.userData.fillLight.intensity = 1.95 + Math.sin(_fc * 0.22 + dz) * 0.4;
        }
      }
      if(d.type === 'pond' && d.light && _fc % 4 === 0){
        d.light.intensity = 0.4 + Math.sin(now * 0.5) * 0.15;
      }
      if(d.type === 'house' && d.light && _fc % 3 === 0){
        d.light.intensity = isNightTime ? (0.8 + Math.sin(_fc * 0.08) * 0.1) : 0;
      }
    }
  }

  // Skip rustling hidden classic dress while diorama is on
  if(window._dress && !(typeof isCozy === 'function' && isCozy())){
    if(!isMobile || _fc % 2 === 0){
      for(var si = 0; si < window._dress.length; si++) rustle(window._dress[si], now, 0.85);
    }
  }
  if(window._mills && !(typeof isCozy === 'function' && isCozy())){
    for(var mi = 0; mi < window._mills.length; mi++) window._mills[mi].rotation.z += Math.min(dt, 0.05) * 0.7;
  }
  if(window._blooms && !(typeof isCozy === 'function' && isCozy()) && _fc % 2 === 0){
    for(var bl = 0; bl < window._blooms.length; bl++){
      var bloom = window._blooms[bl];
      if(!bloom || !bloom.rotation || bloom.visible === false) continue;
      if(bloom.parent && bloom.parent.visible === false) continue;
      bloom.rotation.z = Math.sin(now * 1.25 + (bloom.userData.spin || 0)) * 0.1;
      bloom.rotation.x = Math.sin(now * 0.8 + (bloom.userData.spin || 0)) * 0.06;
    }
  }
  if(dt>0) advanceHarvest(dt);
  for(var hi=0;hi<harvestItems.length;hi++){
    if((hi + _fc) % 2 === 0){
      var hv=harvestItems[hi];if(hv.sway){var spd=hv.type==='strawberry'?2.5:hv.type==='carrot'?1.05:hv.type==='cucumber'?.85:hv.type==='pepper'?1.7:1.15;var amp=hv.type==='strawberry'?.07:hv.type==='carrot'?.045:hv.type==='cucumber'?.09:hv.type==='pepper'?.06:.035;hv.sway.rotation.z=Math.sin(now*spd+hv.x)*amp;hv.sway.rotation.x=Math.sin(now*spd*.8+hv.z)*amp*.65;if(hv.type==='cucumber')hv.sway.rotation.y=Math.sin(now*.6+hv.z)*.12;}
    }
  }

  stepPets(dt);

  // Stats
  if(_fc%120===0){var tot=0;for(var fi2=0;fi2<flowers.length;fi2++)tot+=flowers[fi2].w;_eHp.innerText=Math.round(flowers.length?tot/flowers.length*100:0);}
  if(Date.now()-lastSave>SINT)save(false);
  if(_fc%3600===0){saveStats();checkNotifications();}
  controls.update();
  if(renderer.shadowMap && renderer.shadowMap.enabled && (_fc % 30 === 0)){
    renderer.shadowMap.needsUpdate = true;
  }
  if(typeof window.renderWithFX==='function'&&window._fxBloom) window.renderWithFX();
  else renderer.render(scene,camera);
}
window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);rCvs.width=wCvs.width=innerWidth;rCvs.height=wCvs.height=innerHeight;});
function bootGame(){
  loadProg();loadStats();loadShop();load();placeOwnedWing();
  window._bootGameDone = true;
  if(typeof window.ensureCozyLife==='function'&&typeof isCozy==='function'&&isCozy()) window.ensureCozyLife();
  if(typeof window.bindFarmerHouseFromDecos==='function') window.bindFarmerHouseFromDecos();
  else if(typeof window.ensureFarmers==='function') window.ensureFarmers();

  // Bind Chicken Coops only if player placed them
  if(typeof window.bindCoopsFromDecos==='function') window.bindCoopsFromDecos();
  if(typeof window.bindBarnsFromDecos==='function') window.bindBarnsFromDecos();

  // Initialize Village NPCs (Balıkçı Reis at Pier & Aşçı Usta at Market)
  if(typeof window.initVillageNPCs === 'function') window.initVillageNPCs();

  // Initialize Village Market Square (far corner bazaar)
  if(typeof window.initVillageMarket === 'function') window.initVillageMarket();
}
animate();
if(typeof window.whenModelsReady==='function') window.whenModelsReady(bootGame);
else bootGame();

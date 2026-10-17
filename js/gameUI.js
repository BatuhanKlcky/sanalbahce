// gameUI.js - Sanal Bahçe A-Kalite Mobil Arayüz ve Etkileşim Sistemi
(function(){
  'use strict';

  // ── HAPTIC FEEDBACK (Titreşim) ───────────────────────────────────────────────
  window.triggerHaptic = function(type){
    if(typeof navigator==='undefined' || !navigator.vibrate) return;
    try {
      if(type==='light') navigator.vibrate(12);
      else if(type==='medium') navigator.vibrate(28);
      else if(type==='heavy') navigator.vibrate(45);
      else if(type==='success') navigator.vibrate([20, 40, 30]);
      else if(type==='harvest') navigator.vibrate([15, 30, 25, 40]);
      else if(type==='lvl') navigator.vibrate([30, 60, 40, 80]);
    } catch(e){}
  };

  // ── FLOATING OBJECT INSPECTOR (Akıllı Nesne Kartı) ───────────────────────────
  var inspectorEl = null;
  var currentInspected = null; // { type: 'flower'|'harvest'|'deco'|'pet', obj: any, pos: THREE.Vector3 }
  var _vProj = new THREE.Vector3();

  function createInspectorDOM(){
    if(inspectorEl) return inspectorEl;
    inspectorEl = document.createElement('div');
    inspectorEl.id = 'objInspector';
    inspectorEl.innerHTML = `
      <div class="oi-header">
        <span class="oi-icon" id="oiIcon">🌱</span>
        <div class="oi-text">
          <div class="oi-title" id="oiTitle">Bitki</div>
          <div class="oi-sub" id="oiSub">Büyüyor...</div>
        </div>
        <button type="button" class="oi-close" id="oiClose" aria-label="Kapat">✕</button>
      </div>
      <div class="oi-progress-wrap" id="oiProgressWrap" style="display:none">
        <div class="oi-progress-bar"><div class="oi-progress-fill" id="oiProgressFill"></div></div>
      </div>
      <div class="oi-actions" id="oiActions"></div>
    `;
    document.body.appendChild(inspectorEl);

    document.getElementById('oiClose').addEventListener('click', function(e){
      e.stopPropagation();
      closeInspector();
    });

    return inspectorEl;
  }

  function closeInspector(){
    if(!inspectorEl) return;
    inspectorEl.classList.remove('active');
    currentInspected = null;
    if(window._selRing) window._selRing.visible = false;
  }
  window.closeInspector = closeInspector;

  function updateInspectorPosition(){
    if(!currentInspected || !inspectorEl || !inspectorEl.classList.contains('active')) return;
    _vProj.copy(currentInspected.pos);
    _vProj.y += (currentInspected.heightOffset || 1.2);
    _vProj.project(camera);

    // Kamera arkasındaysa gizle
    if(_vProj.z > 1){
      inspectorEl.style.opacity = '0';
      return;
    }
    inspectorEl.style.opacity = '1';

    var sx = (_vProj.x * 0.5 + 0.5) * window.innerWidth;
    var sy = (-(_vProj.y * 0.5) + 0.5) * window.innerHeight;

    // Ekran taşmalarını önle
    var iw = inspectorEl.offsetWidth || 190;
    var ih = inspectorEl.offsetHeight || 90;
    var px = Math.max(12, Math.min(window.innerWidth - iw - 12, sx - iw / 2));
    var py = Math.max(70, Math.min(window.innerHeight - ih - 90, sy - ih - 16));

    inspectorEl.style.transform = `translate(${px}px, ${py}px)`;
  }

  function inspectObject(data){
    createInspectorDOM();
    currentInspected = data;

    var iconEl = document.getElementById('oiIcon');
    var titleEl = document.getElementById('oiTitle');
    var subEl = document.getElementById('oiSub');
    var actEl = document.getElementById('oiActions');
    var progWrap = document.getElementById('oiProgressWrap');
    var progFill = document.getElementById('oiProgressFill');

    iconEl.textContent = data.icon || '🌿';
    titleEl.textContent = data.title || 'Nesne';
    subEl.textContent = data.sub || '';
    actEl.innerHTML = '';

    if(data.progress != null){
      progWrap.style.display = 'block';
      progFill.style.width = Math.min(100, Math.max(0, data.progress)) + '%';
    } else {
      progWrap.style.display = 'none';
    }

    if(data.actions && data.actions.length){
      data.actions.forEach(function(act){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'oi-btn' + (act.primary ? ' oi-primary' : '') + (act.danger ? ' oi-danger' : '');
        btn.innerHTML = (act.icon ? `<span class="oi-btn-icon">${act.icon}</span> ` : '') + act.label;
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          window.triggerHaptic('light');
          if(act.onClick) act.onClick();
        });
        actEl.appendChild(btn);
      });
    }

    // Seçim halkasını konumlandır
    if(typeof window.ensureSelRing === 'function'){
      var ring = window.ensureSelRing();
      ring.visible = true;
      ring.position.set(data.pos.x, 0.04, data.pos.z);
      ring.scale.setScalar(data.ringScale || 1.1);
    }

    inspectorEl.classList.add('active');
    updateInspectorPosition();
    window.triggerHaptic('light');
  }

  // ── 3D DOKUNMA YAKALAYICI (Raycasting Inspector) ────────────────────────────
  var _ray = new THREE.Raycaster();
  var _m = new THREE.Vector2();

  window.addEventListener('pointerup', function(e){
    // UI veya modlar devredeyse inceleme yapma
    if(e.target.closest('#objInspector') || e.target.closest('.bottom-dock') ||
       e.target.closest('.ui-container') || e.target.closest('.spanel') || 
       e.target.closest('#sidebar') || e.target.closest('#topBar') ||
       e.target.closest('#moreDrawer') || e.target.closest('#biomeBar') ||
       e.target.closest('#editBar')) return;

    if(window.placementMode || window.flowerPlaceMode || window.deleteMode || window.editMode) return;

    // Sürükleme / döndürme hareketlerinde gereksiz tetiklemeyi önle
    if(window._lastPointerDownPos){
      var dist = Math.hypot(e.clientX - window._lastPointerDownPos.x, e.clientY - window._lastPointerDownPos.y);
      if(dist > 9) return;
    }

    _m.x = (e.clientX / window.innerWidth) * 2 - 1;
    _m.y = -(e.clientY / window.innerHeight) * 2 + 1;
    _ray.setFromCamera(_m, camera);

    // 1) Hasat Bitkileri Kontrolü
    if(typeof harvestItems !== 'undefined' && harvestItems.length){
      var hbs = [];
      harvestItems.forEach(function(it, idx){
        if(!it || !it.group) return;
        it.group.children.forEach(function(ch){
          ch.userData.hItemRef = it;
          ch.userData.hIdx = idx;
          hbs.push(ch);
        });
      });
      var hHits = _ray.intersectObjects(hbs, true);
      if(hHits.length > 0){
        var hObj = hHits[0].object;
        var itRef = hObj.userData.hItemRef;
        var itIdx = hObj.userData.hIdx;
        if(itRef && HARVEST_TYPES[itRef.type]){
          var cfg = HARVEST_TYPES[itRef.type];
          var stageName = itRef.stage >= 2 ? 'Hasat Hazır! 🎉' : (itRef.stage === 1 ? 'Büyüyor (2/3)' : 'Yeni Ekildi (1/3)');
          var prg = itRef.stage >= 2 ? 100 : Math.round(((itRef.growTimer || 0) / (cfg.growTime || 60)) * 50 + (itRef.stage * 50));
          var acts = [];
          if(itRef.stage >= 2){
            acts.push({
              label: `Hasat Et (+${cfg.coin}💰)`,
              icon: '🧺',
              primary: true,
              onClick: function(){
                harvestPlant(itIdx);
                window.triggerHaptic('harvest');
                closeInspector();
              }
            });
          } else {
            acts.push({
              label: 'Hızlı Sula',
              icon: '💧',
              onClick: function(){
                itRef.growTimer = (itRef.growTimer || 0) + 15;
                if(typeof sndWater==='function') sndWater();
                showToast('💧 Bitki sulandı, büyüme hızlandı!');
                closeInspector();
              }
            });
          }
          inspectObject({
            icon: cfg.emoji,
            title: cfg.emoji + ' ' + (itRef.type.toUpperCase()),
            sub: stageName,
            progress: prg,
            pos: itRef.group.position,
            heightOffset: 1.1,
            ringScale: 1.0,
            actions: acts
          });
          return;
        }
      }
    }

    // 1.5) Çiftçiler Kontrolü
    if(typeof farmers !== 'undefined' && farmers.length){
      var fMeshes = [];
      farmers.forEach(function(fm, idx){
        if(!fm || !fm.group) return;
        fm.group.traverse(function(ch){
          if(ch.isMesh){
            ch.userData.farmerRef = fm;
            ch.userData.farmerIdx = idx;
            fMeshes.push(ch);
          }
        });
      });
      var fHits = _ray.intersectObjects(fMeshes, true);
      if(fHits.length > 0){
        var fObj = fHits[0].object.userData.farmerRef;
        if(fObj){
          var fStateText = fObj.state === 'walk' ? 'Tarlada Yürüyor 🚶' : (fObj.state === 'work' ? 'Bitkilerle İlgileniyor 💧' : 'Dinleniyor 🌾');
          var jobCount = (fObj.slots ? fObj.slots.length : 0);
          inspectObject({
            icon: '🧑‍🌾',
            title: (fObj.kind === 'female' ? 'Çiftçi Elif' : 'Çiftçi Ahmet'),
            sub: fStateText + ' (' + jobCount + '/3 iş)',
            pos: fObj.group.position,
            heightOffset: 1.6,
            ringScale: 0.9,
            actions: [
              {
                label: 'El Salla',
                icon: '👋',
                primary: true,
                onClick: function(){
                  if(fObj.mixer && fObj.clips){
                    var waveClip = fObj.clips['Wave'] || fObj.clips['Punch'];
                    if(waveClip){
                      var act = fObj.mixer.clipAction(waveClip);
                      act.reset();
                      act.setLoop(THREE.LoopOnce, 1);
                      act.clampWhenFinished = true;
                      act.play();
                    }
                  }
                  if(typeof sndPet === 'function') sndPet();
                  showToast('🧑‍🌾 Çiftçi sana selam verdi!');
                  window.triggerHaptic('medium');
                  closeInspector();
                }
              }
            ]
          });
          return;
        }
      }
    }

    // 2) Çiçekler Kontrolü
    if(typeof flowers !== 'undefined' && flowers.length){
      var flMeshes = [];
      flowers.forEach(function(f, idx){
        if(!f || !f.mesh) return;
        f.mesh.traverse(function(ch){
          if(ch.isMesh){
            ch.userData.flRef = f;
            ch.userData.flIdx = idx;
            flMeshes.push(ch);
          }
        });
      });
      var fHits = _ray.intersectObjects(flMeshes, true);
      if(fHits.length > 0){
        var fl = fHits[0].object.userData.flRef;
        var flIndex = fHits[0].object.userData.flIdx;
        if(fl){
          var stText = growNames[Math.min(3, Math.floor(fl.h / 0.35))] || 'Çiçek';
          var nemP = Math.round((fl.w || 0) * 100);
          inspectObject({
            icon: '🌸',
            title: stText,
            sub: `💧 Nem: %${nemP}`,
            progress: nemP,
            pos: fl.mesh.position,
            heightOffset: 1.3,
            ringScale: 0.9,
            actions: [
              {
                label: 'Sula',
                icon: '💧',
                primary: true,
                onClick: function(){
                  if(typeof soak === 'function') soak(fl, 0.45);
                  if(typeof sndWater === 'function') sndWater();
                  window.triggerHaptic('medium');
                  showToast('🌸 Çiçek sulandı!');
                  closeInspector();
                }
              },
              {
                label: 'Sök',
                icon: '🗑️',
                danger: true,
                onClick: function(){
                  fl.mesh.traverse(function(c){
                    if(c.geometry) c.geometry.dispose();
                    if(c.material) c.material.dispose();
                  });
                  scene.remove(fl.mesh);
                  flowers.splice(flIndex, 1);
                  document.getElementById('fC').innerText = flowers.length;
                  save(true);
                  showToast('Çiçek söküldü.');
                  closeInspector();
                }
              }
            ]
          });
          return;
        }
      }
    }

    // 3) Dekor & Yapılar Kontrolü
    if(typeof decos !== 'undefined' && decos.length){
      var dMeshes = [];
      decos.forEach(function(d, idx){
        if(!d || !d.group || d.group.visible === false) return;
        d.group.traverse(function(ch){
          if(ch.isMesh){
            ch.userData.decoRef = d;
            ch.userData.decoIdx = idx;
            dMeshes.push(ch);
          }
        });
      });
      var dHits = _ray.intersectObjects(dMeshes, true);
      if(dHits.length > 0){
        var dObj = dHits[0].object.userData.decoRef;
        var dIndex = dHits[0].object.userData.decoIdx;
        if(dObj){
          var isHouse = dObj.type === 'farmer_house';
          var dName = isHouse ? ('ÇİFTÇİ EVİ (Lv.' + (dObj.level||1) + ')') : (dObj.type || 'Dekor').replace('_', ' ').toUpperCase();
          var subTitle = isHouse 
            ? 'Kapasite: ' + (dObj.level || 1) + ' Çiftçi (' + ((dObj.level || 1) * 3) + ' iş)'
            : 'Konum: ' + Math.round(dObj.group.position.x) + ', ' + Math.round(dObj.group.position.z);
          var decoActs = [];
          if(isHouse && (dObj.level || 1) < 2){
            decoActs.push({
              label: 'Yükselt (100💰)',
              icon: '⬆️',
              primary: true,
              onClick: function(){
                if(typeof window.upgradeFarmerHouse === 'function') window.upgradeFarmerHouse();
                closeInspector();
              }
            });
          }
          decoActs.push({
            label: 'Döndür',
            icon: '↺',
            onClick: function(){
              dObj.group.rotation.y += Math.PI / 4;
              markDirty(); save(true);
              window.triggerHaptic('light');
            }
          });
          decoActs.push({
            label: 'Taşı',
            icon: '📍',
            onClick: function(){
              selectedDeco = dObj;
              if(typeof window.armMoveSelected === 'function') window.armMoveSelected();
              closeInspector();
            }
          });
          decoActs.push({
            label: 'Kaldır',
            icon: '🗑️',
            danger: true,
            onClick: function(){
              dObj.group.traverse(function(c){
                if(c.geometry) c.geometry.dispose();
                if(c.material) c.material.dispose();
              });
              scene.remove(dObj.group);
              decos.splice(dIndex, 1);
              if(isHouse && typeof window.bindFarmerHouseFromDecos === 'function') window.bindFarmerHouseFromDecos();
              save(true);
              showToast('Obje kaldırıldı.');
              closeInspector();
            }
          });
          inspectObject({
            icon: isHouse ? '🏠' : '🏡',
            title: dName,
            sub: subTitle,
            pos: dObj.group.position,
            heightOffset: isHouse ? 2.2 : 1.5,
            ringScale: Math.max(1.0, (dObj.group.scale.x || 1) * 1.3),
            actions: decoActs
          });
          return;
        }
      }
    }

    // Boş araziye dokunulduğunda kartı kapat
    closeInspector();
  });

  window.addEventListener('pointerdown', function(e){
    window._lastPointerDownPos = { x: e.clientX, y: e.clientY };
  });

  // Her animasyon karesinde kartın ekran pozisyonunu güncelle
  function tickInspector(){
    updateInspectorPosition();
    requestAnimationFrame(tickInspector);
  }
  requestAnimationFrame(tickInspector);

  // ── MORE ACTIONS DRAWER (Gelişmiş İşlemler Çekmecesi) ───────────────────────
  window.closeMoreDrawer = function(){
    var drawer = document.getElementById('moreDrawer');
    if(drawer) drawer.classList.remove('open');
  };

  window.toggleMoreDrawer = function(){
    var drawer = document.getElementById('moreDrawer');
    if(!drawer) return;
    var willOpen = !drawer.classList.contains('open');
    if(willOpen){
      closeInspector();
      var panels = document.querySelectorAll('.spanel');
      panels.forEach(function(p){ p.classList.remove('open'); });
      if(typeof openP !== 'undefined') openP = null;
    }
    drawer.classList.toggle('open', willOpen);
    window.triggerHaptic('light');
  };

  // Sahneye dokunulduğunda açık olan #moreDrawer'ı kapat
  window.addEventListener('pointerdown', function(e){
    var drawer = document.getElementById('moreDrawer');
    if(drawer && drawer.classList.contains('open')){
      if(!e.target.closest('#moreDrawer') && !e.target.closest('#bottomDock')){
        drawer.classList.remove('open');
      }
    }
  });

  window.closeAllPanelsAndDrawers = function(){
    var drawer = document.getElementById('moreDrawer');
    if(drawer) drawer.classList.remove('open');
    closeInspector();
    var panels = document.querySelectorAll('.spanel');
    panels.forEach(function(p){ p.classList.remove('open'); });
    var barBtns = document.querySelectorAll('.dock-btn');
    barBtns.forEach(function(b){ if(b.id !== 'btnCozy') b.classList.remove('on'); });
    if(typeof openP !== 'undefined') openP = null;
  };

  // ── COIN & RESOURCE BOUNCE EFFECT ──────────────────────────────────────────
  var _lastCoins = null;
  function watchCoinChanges(){
    var cBadge = document.getElementById('coinBadge');
    if(!cBadge) return;
    var rawText = cBadge.textContent.replace(/[^0-9]/g, '');
    var currentCoins = parseInt(rawText, 10);
    if(_lastCoins !== null && currentCoins > _lastCoins){
      cBadge.classList.remove('bounce-up');
      void cBadge.offsetWidth; // reflow
      cBadge.classList.add('bounce-up');
      window.triggerHaptic('light');
    }
    _lastCoins = currentCoins;
  }
  setInterval(watchCoinChanges, 400);

  // ── MOBİL DOKUNMATİK KAMERA İYİLEŞTİRMELERİ ─────────────────────────────────
  // OrbitControls damping faktörünü ve zoom akıcılığını mobil için optimize et
  if(typeof controls !== 'undefined' && controls){
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = window.innerWidth < 768 ? 0.55 : 0.45;
    controls.zoomSpeed = 0.85;
    controls.panSpeed = 0.7;
    controls.minDistance = 5;
    controls.maxDistance = 65;
  }

})();

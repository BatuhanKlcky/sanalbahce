// Cozyrama-style: rahat mod, diorama kamera, sec-duzenle (don/olcek/tasi).
var cozyMode = localStorage.getItem('gdn_cozy') !== '0';
var editMode = false;
var selectedDeco = null;
var _selRing = null;
var _moveArmed = false;

function isCozy(){ return !!cozyMode; }
window.isCozy = isCozy;

function ensureSelRing(){
  if(_selRing) return _selRing;
  _selRing = new THREE.Mesh(
    new THREE.RingGeometry(.55, .72, 32),
    new THREE.MeshBasicMaterial({ color:0xffe29a, transparent:true, opacity:.85, side:THREE.DoubleSide, depthWrite:false })
  );
  _selRing.rotation.x = -Math.PI / 2;
  _selRing.visible = false;
  scene.add(_selRing);
  return _selRing;
}

function clearDecoSelection(){
  selectedDeco = null;
  _moveArmed = false;
  if(_selRing) _selRing.visible = false;
  var bar = document.getElementById('editBar');
  if(bar) bar.classList.remove('show');
}

function selectDeco(rec){
  selectedDeco = rec;
  var ring = ensureSelRing();
  ring.visible = true;
  ring.position.set(rec.group.position.x, .04, rec.group.position.z);
  var sc = rec.group.scale.x || 1;
  ring.scale.setScalar(Math.max(.8, sc * 1.15));
  var bar = document.getElementById('editBar');
  if(bar) bar.classList.add('show');
  showToast('Seçildi · döndür / büyüt / taşı');
}

function findDecoAt(clientX, clientY){
  plM.x = (clientX / innerWidth) * 2 - 1;
  plM.y = -(clientY / innerHeight) * 2 + 1;
  plRay.setFromCamera(plM, camera);
  var meshes = [];
  decos.forEach(function(d){
    d.group.traverse(function(ch){ if(ch.isMesh) meshes.push(ch); });
  });
  var hits = plRay.intersectObjects(meshes, true);
  if(!hits.length) return null;
  var hit = hits[0].object;
  for(var i = 0; i < decos.length; i++){
    var found = null;
    decos[i].group.traverse(function(ch){ if(ch === hit) found = decos[i]; });
    if(found) return found;
  }
  return null;
}

window.toggleCozy = function(){
  cozyMode = !cozyMode;
  localStorage.setItem('gdn_cozy', cozyMode ? '1' : '0');
  applyCozyMode(true);
  showToast(cozyMode ? '☁️ Rahat diorama modu' : '🎮 Klasik bahçe modu');
};

window.toggleEditMode = function(){
  if(placementMode) window.cancelPlace();
  if(deleteMode) window.toggleDeleteMode();
  if(flowerPlaceMode) window.cancelFlowerPlace();
  editMode = !editMode;
  var btn = document.getElementById('btnEdit');
  if(btn) btn.classList.toggle('on', editMode);
  controls.enabled = !editMode;
  if(!editMode) clearDecoSelection();
  else showToast('Düzenle: objeye dokun ✨');
};

window.rotateSelected = function(dir){
  if(!selectedDeco) return;
  selectedDeco.group.rotation.y += (dir || 1) * (Math.PI / 8);
  markDirty(); save(true);
};

window.scaleSelected = function(dir){
  if(!selectedDeco) return;
  var s = selectedDeco.group.scale.x || 1;
  s = Math.max(.45, Math.min(2.4, s + (dir || 1) * .12));
  selectedDeco.group.scale.setScalar(s);
  if(_selRing) _selRing.scale.setScalar(Math.max(.8, s * 1.15));
  markDirty(); save(true);
};

window.armMoveSelected = function(){
  if(!selectedDeco) return;
  _moveArmed = true;
  showToast('Yeni yere dokun 📍');
};

window.deselectDeco = function(){
  clearDecoSelection();
  if(editMode) showToast('Seçim kaldırıldı');
};

window.photoMode = function(){
  document.body.classList.add('photo-mode');
  showToast('📷 Foto modu · dokununca çık');
  var once = function(){
    document.body.classList.remove('photo-mode');
    document.removeEventListener('pointerup', once);
  };
  setTimeout(function(){ document.addEventListener('pointerup', once); }, 300);
};

function applyCozyCamera(){
  if(!controls || !camera) return;
  if(cozyMode){
    camera.fov = 48;
    camera.updateProjectionMatrix();
    camera.position.set(0, 16, 22);
    controls.target.set(0, .4, 0);
    controls.minDistance = 10;
    controls.maxDistance = 38;
    controls.minPolarAngle = .55;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.enablePan = false;
  } else {
    camera.fov = 60;
    camera.updateProjectionMatrix();
    camera.position.set(6, 14, 24);
    controls.target.set(0, 0, 0);
    controls.minDistance = 6;
    controls.maxDistance = 120;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2.12;
    controls.enablePan = true;
  }
  controls.update();
}

function applyCozyLights(){
  if(!window.mLight) return;
  var hemi = scene.children.filter(function(c){ return c.isHemisphereLight; })[0];
  var amb = scene.children.filter(function(c){ return c.isAmbientLight; })[0];
  if(cozyMode){
    if(amb){ amb.color.setHex(0xfff0e0); amb.intensity = .95; }
    if(hemi){ hemi.color.setHex(0xffe8d6); hemi.groundColor.setHex(0x6a8f52); hemi.intensity = .55; }
    mLight.color.setHex(0xffe2c4); mLight.intensity = 1.25;
    if(scene.fog){ scene.fog.color.setHex(0xd9c4b0); scene.fog.density = .0045; }
  } else {
    if(amb){ amb.color.setHex(0x1a2a4a); amb.intensity = .72; }
    if(hemi){ hemi.color.setHex(0xd7ecff); hemi.groundColor.setHex(0x3a5c2a); hemi.intensity = .28; }
  }
}

function applyCozyScenery(){
  if(window._dress) window._dress.forEach(function(o){ if(o) o.visible = !cozyMode; });
  if(window._dressStones) window._dressStones.forEach(function(o){ if(o) o.visible = !cozyMode; });
  if(window._dressSprigs) window._dressSprigs.forEach(function(o){ if(o) o.visible = !cozyMode; });
  if(window._millGroups) window._millGroups.forEach(function(o){ if(o) o.visible = !cozyMode; });
  // Prefer multi-biome archipelago; hide legacy single-island dress when biomes exist.
  var hasBiomes = !!(window._biomeRoot && window._biomes && window._biomes.length);
  if(window._cozyDress) window._cozyDress.forEach(function(o){ if(o) o.visible = !!cozyMode && !hasBiomes; });
  if(window._cozyHills) window._cozyHills.forEach(function(h){ h.visible = !cozyMode; });
  if(window._islandRoot) window._islandRoot.visible = !!cozyMode && !hasBiomes;
  if(window._flatGnd) window._flatGnd.visible = !cozyMode;
  if(typeof window.setBiomesVisible === 'function') window.setBiomesVisible(!!cozyMode);
}

function applyCozyHUD(){
  document.body.classList.toggle('cozy-mode', cozyMode);
  var btn = document.getElementById('btnCozy');
  if(btn) btn.classList.toggle('on', cozyMode);
}

function applyCozyMode(toastCam){
  applyCozyHUD();
  applyCozyLights();
  applyCozyScenery();
  applyCozyCamera();
  if(typeof DRY !== 'undefined'){
    window._dryClassic = window._dryClassic != null ? window._dryClassic : DRY;
    DRY = cozyMode ? 0 : window._dryClassic;
  }
  if(cozyMode && typeof window.ensureCozyLife === 'function') window.ensureCozyLife();
  // Island grass only on legacy pad; biomes have their own ground tint.
  if(cozyMode && !window._biomeRoot && typeof window.spawnIslandGrass === 'function') window.spawnIslandGrass();
  if(cozyMode && typeof window.focusBiome === 'function'){
    var bid = localStorage.getItem('gdn_biome') || 'meadow';
    window.focusBiome(bid, !!toastCam);
  } else if(toastCam && typeof window.resetCamera === 'function'){
    // camera already set in applyCozyCamera
  }
}

// Soft golden-hour freeze while cozy (still animates gently via uTime).
var _cozyPhase = 0.62; // warm afternoon
var _origGetRDP = null;
function wrapDayClock(){
  if(_origGetRDP) return;
  _origGetRDP = getRDP;
  getRDP = function(){
    if(cozyMode) return (window._biomePhase != null ? window._biomePhase : _cozyPhase);
    return _origGetRDP();
  };
}

window.addEventListener('pointerup', function(e){
  if(!editMode || deleteMode || placementMode || flowerPlaceMode) return;
  var uiHit = e.target.closest('.ui-container') || e.target.closest('.spanel') || e.target.closest('#sidebar') || e.target.closest('#pBar') || e.target.closest('#delBar') || e.target.closest('#editBar');
  if(uiHit) return;

  if(_moveArmed && selectedDeco){
    plM.x = (e.clientX / innerWidth) * 2 - 1;
    plM.y = -(e.clientY / innerHeight) * 2 + 1;
    plRay.setFromCamera(plM, camera);
    var hits = plRay.intersectObject(planeR);
    if(!hits.length) return;
    var pt = hits[0].point;
    var lim = cozyMode
      ? ((window.getActiveBiome && window.getActiveBiome()) ? window.getActiveBiome().R - 1.2 : 18)
      : GARDEN_R;
    if(Math.hypot(pt.x, pt.z) > lim){ showToast('Ada dışına çıkamaz 🚫'); return; }
    selectedDeco.group.position.x = pt.x;
    selectedDeco.group.position.z = pt.z;
    if(_selRing){ _selRing.position.x = pt.x; _selRing.position.z = pt.z; }
    _moveArmed = false;
    markDirty(); save(true);
    showToast('Taşındı ✨');
    return;
  }

  var rec = findDecoAt(e.clientX, e.clientY);
  if(rec) selectDeco(rec);
  else clearDecoSelection();
});

window.applyCozyMode = applyCozyMode;
window.applyCozyScenery = applyCozyScenery;

// Boot after scene + dressGarden exist
function bootCozy(){
  wrapDayClock();
  applyCozyMode(false);
  dayPhase = getRDP();
  updDN(dayPhase);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(bootCozy, 0); });
else setTimeout(bootCozy, 0);

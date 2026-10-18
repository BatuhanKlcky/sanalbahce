// Magaza, nadir esyalar ve evcil hayvanlar.
// ── EVCİL HAYVAN & 3D İSKELET ANİMASYONLU HAYVAN SİSTEMİ (.GLB + AnimationMixer) ──
var pets = []; // {mesh, type, breed, breedName, target, time, wander, mixer, clips, actions, currentAction, animName, _idleTimer, _reactTimer}
var PET_TYPES = ['cat','dog'];

var ANIMAL_SPECS = {
  // Evcil Kediler (37 gerçek iskelet animasyonu: idle, walk, trot, run, jump, sit_idle, groom, scratch_ear, stretch, loaf_idle, sleep_idle, knead, pounce, wiggle, head_tilt, tail_swish...)
  cat_toyger: { url: 'models/animals/Cat.glb?v=2',      targetH: 0.60, rotY: -Math.PI / 2, emoji: '🐱', label: 'Tekir Kedi',       idleClips: ['idle','sit_idle','groom','scratch_ear','loaf_idle','tail_swish','head_tilt','stretch'], walkClip: 'walk', runClip: 'trot', loveClip: 'knead',    feedClip: 'stretch' },
  cat_van:    { url: 'models/animals/Cat_Van.glb?v=2',  targetH: 0.60, rotY: -Math.PI / 2, emoji: '🐱', label: 'Van Kedisi',       idleClips: ['idle','sit_idle','groom','scratch_ear','loaf_idle','tail_swish','head_tilt','stretch'], walkClip: 'walk', runClip: 'trot', loveClip: 'wiggle',   feedClip: 'jump'    },
  cat_fold:   { url: 'models/animals/Cat_Fold.glb?v=2', targetH: 0.56, rotY: -Math.PI / 2, emoji: '🐱', label: 'Scottish Fold',    idleClips: ['idle','sit_idle','groom','scratch_ear','loaf_idle','tail_swish','head_tilt','stretch'], walkClip: 'walk', runClip: 'trot', loveClip: 'knead',    feedClip: 'wiggle'  },
  // Evcil Köpekler (65 gerçek iskelet animasyonu: idle, idle_happy, walk, trot, run, sit_idle, play_bow, excited_bounce, get_pet, eat, sniff, scratch_ear, head_tilt, shake_off, happy...)
  dog_golden: { url: 'models/animals/Dog.glb?v=2',       targetH: 0.76, rotY: -Math.PI / 2, emoji: '🐶', label: 'Golden Retriever', idleClips: ['idle','idle_happy','sit_idle','sniff','scratch_ear','head_tilt','yawn','shake_off'], walkClip: 'walk', runClip: 'trot', loveClip: 'get_pet',        feedClip: 'eat' },
  dog_shiba:  { url: 'models/animals/Dog_Shiba.glb?v=2', targetH: 0.68, rotY: -Math.PI / 2, emoji: '🐕', label: 'Shiba Inu',        idleClips: ['idle','idle_happy','sit_idle','sniff','scratch_ear','head_tilt','play_bow','happy'], walkClip: 'walk', runClip: 'trot', loveClip: 'excited_bounce', feedClip: 'eat' },
  dog_corgi:  { url: 'models/animals/Dog_Corgi.glb?v=2', targetH: 0.58, rotY: -Math.PI / 2, emoji: '🐕', label: 'Welsh Corgi',      idleClips: ['idle','idle_happy','sit_idle','sniff','scratch_ear','head_tilt','play_bow','happy'], walkClip: 'walk', runClip: 'trot', loveClip: 'play_bow',       feedClip: 'eat' },
  // Çiftlik, Orman ve Göl Hayvanları (Quaternius / PolyPizza / Gobkit İskelet Animasyonlu + Üretim)
  cow:        { url: 'models/animals/Cow.glb?v=2',    targetH: 1.32, rotY: 0, lift: true,  emoji: '🐮', label: 'Süt İneği',     prodItem: 'milk', prodEmoji: '🥛', prodName: 'Taze Süt',      prodVerb: 'Sütü Sağ',     prodTime: 38, idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_Headlow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_toIdle', feedClip: 'AnimalArmature|Eating' },
  horse:      { url: 'models/animals/Horse.glb?v=2',  targetH: 1.52, rotY: 0, lift: true,  emoji: '🐴', label: 'Doru At',       idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_Headlow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_toIdle', feedClip: 'AnimalArmature|Eating' },
  alpaca:     { url: 'models/animals/Alpaca.glb?v=2', targetH: 1.24, rotY: 0, lift: true,  emoji: '🦙', label: 'Alpaka',        prodItem: 'wool', prodEmoji: '🧶', prodName: 'Alpaka Yünü',   prodVerb: 'Yünü Kırk',    prodTime: 42, idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_Headlow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_toIdle', feedClip: 'AnimalArmature|Eating' },
  deer:       { url: 'models/animals/Deer.glb?v=2',   targetH: 1.35, rotY: 0, lift: true,  emoji: '🦌', label: 'Orman Geyiği',  idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_Headlow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_toIdle', feedClip: 'AnimalArmature|Eating' },
  fox:        { url: 'models/animals/Fox.glb?v=2',    targetH: 0.68, rotY: 0, lift: true,  emoji: '🦊', label: 'Kızıl Tilki',   idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_2_HeadLow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_ToIdle', feedClip: 'AnimalArmature|Eating' },
  chick:      { url: 'models/animals/Chick.glb?v=2',  targetH: 0.36, rotY: 0, lift: false, emoji: '🐥', label: 'Köy Civcivi',   prodItem: 'egg',  prodEmoji: '🥚', prodName: 'Köy Yumurtası', prodVerb: 'Yumurtayı Al', prodTime: 30, idleClips: ['Idle','Idle_Peck'], walkClip: 'Run', runClip: 'Run', loveClip: 'Idle_Peck', feedClip: 'Idle_Peck' },
  sheep:      { url: 'models/animals/Alpaca.glb?v=2', targetH: 1.15, rotY: 0, lift: true,  emoji: '🐑', label: 'Merinos Koyun',  prodItem: 'wool', prodEmoji: '🧶', prodName: 'Köy Yünü',      prodVerb: 'Yünü Kırk',    prodTime: 36, idleClips: ['AnimalArmature|Idle','AnimalArmature|Eating','AnimalArmature|Idle_2','AnimalArmature|Idle_Headlow'], walkClip: 'AnimalArmature|Walk', runClip: 'AnimalArmature|Gallop', loveClip: 'AnimalArmature|Jump_toIdle', feedClip: 'AnimalArmature|Eating' },
  duck:       { url: 'models/animals/Duck.glb?v=2',   targetH: 0.44, rotY: 0, lift: false, emoji: '🦆', label: 'Gölet Ördeği',  prodItem: 'egg',  prodEmoji: '🥚', prodName: 'Köy Yumurtası', prodVerb: 'Yumurtayı Al', prodTime: 34, idleClips: ['idle'], walkClip: 'walk', runClip: 'walk', loveClip: 'idle', feedClip: 'idle' }
};

var CAT_BREED_KEYS = ['cat_toyger', 'cat_van', 'cat_fold'];
var DOG_BREED_KEYS = ['dog_golden', 'dog_shiba', 'dog_corgi'];
var _catSpawnCount = 0;
var _dogSpawnCount = 0;
var _animalBufCache = {};   // key -> ArrayBuffer
var _animalWaitQueue = {};  // key -> [cb, ...]

function isValidAnimalGLB(buf){
  if(!buf || !(buf.byteLength > 2000)) return false;
  var u8 = new Uint8Array(buf, 0, 4);
  return u8[0] === 0x67 && u8[1] === 0x6C && u8[2] === 0x54 && u8[3] === 0x46;
}

function fetchAnimalArrayBuffer(url, cb){
  var cleanRel = String(url || '').replace(/\?.*$/, '');
  var candidates = [];
  if(typeof location === 'undefined' || (location.protocol !== 'file:' && String(location.hostname || '').indexOf('htmlpreview') < 0)){
    candidates.push(url);
    candidates.push(cleanRel + '?cb=' + Date.now());
  }
  candidates.push('https://raw.githubusercontent.com/BatuhanKlcky/sanalbahce/main/' + cleanRel);
  var idx = 0;
  function tryNext(lastErr){
    if(idx >= candidates.length){
      cb(lastErr || new Error('animal-glb-failed'), null);
      return;
    }
    var target = candidates[idx++];
    var isBurst = target.indexOf('?cb=') >= 0 || target.indexOf('raw.githubusercontent.com') >= 0;
    if(isBurst && typeof fetch === 'function'){
      fetch(target, { cache: 'reload', mode: 'cors' }).then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      }).then(function(buf){
        if(isValidAnimalGLB(buf)) cb(null, buf);
        else tryNext(new Error('invalid-glb'));
      }).catch(function(e){ tryNext(e); });
      return;
    }
    try {
      var req = new XMLHttpRequest();
      req.open('GET', target, true);
      req.responseType = 'arraybuffer';
      req.onload = function(){
        if(((req.status >= 200 && req.status < 300) || req.status === 0) && isValidAnimalGLB(req.response)){
          cb(null, req.response);
        } else {
          tryNext(new Error('HTTP ' + req.status));
        }
      };
      req.onerror = function(){ tryNext(new Error('xhr-error')); };
      req.send(null);
    } catch(e){
      tryNext(e);
    }
  }
  tryNext(null);
}

function getAnimalBuffer(specKey, cb){
  var spec = ANIMAL_SPECS[specKey];
  if(!spec){ cb(new Error('unknown-spec'), null); return; }
  if(_animalBufCache[specKey]){
    cb(null, _animalBufCache[specKey]);
    return;
  }
  if(_animalWaitQueue[specKey]){
    _animalWaitQueue[specKey].push(cb);
    return;
  }
  _animalWaitQueue[specKey] = [cb];
  fetchAnimalArrayBuffer(spec.url, function(err, buf){
    if(!err && buf) _animalBufCache[specKey] = buf;
    var q = _animalWaitQueue[specKey] || [];
    delete _animalWaitQueue[specKey];
    for(var i = 0; i < q.length; i++){
      try { q[i](err, buf); } catch(e){}
    }
  });
}

function prepareAnimalMaterials(root, spec){
  root.traverse(function(c){
    if(!c.isMesh) return;
    if(c.isSkinnedMesh){
      c.frustumCulled = false;
      c.matrixAutoUpdate = true;
    }
    if(c.geometry && c.geometry.attributes && c.geometry.attributes.color){
      c.geometry.deleteAttribute('color');
    }
    var mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach(function(m){
      if(!m) return;
      m.vertexColors = false;
      m.metalness = 0;
      if(m.map){
        if(m.color) m.color.setHex(0xffffff);
        m.roughness = 0.72;
        if(m.emissive){
          m.emissive.setHex(0x241a10);
          m.emissiveIntensity = 0.08;
        }
      } else if(spec && spec.lift && m.color){
        var nm = String(m.name || '');
        if(!/eye_black|eyes_black|^eyes$|^black$/i.test(nm)){
          var hsl = { h: 0, s: 0, l: 0 };
          m.color.getHSL(hsl);
          hsl.l = Math.min(0.76, hsl.l * 1.55 + 0.12);
          hsl.s = Math.min(0.85, hsl.s * 1.22 + 0.05);
          m.color.setHSL(hsl.h, hsl.s, hsl.l);
          if(m.emissive){
            m.emissive.copy(m.color);
            m.emissiveIntensity = 0.06;
          }
        }
        m.roughness = 0.80;
      }
      m.userData = m.userData || {};
      m.userData.keep = true;
      m.needsUpdate = true;
    });
  });
}

function findAnimalClip(rec, candidates){
  if(!rec || !rec.clips) return null;
  var list = Array.isArray(candidates) ? candidates : [candidates];
  var keys = Object.keys(rec.clips);
  for(var i = 0; i < list.length; i++){
    var want = list[i];
    if(!want) continue;
    if(rec.clips[want]) return rec.clips[want];
    var wantLow = want.toLowerCase();
    for(var k = 0; k < keys.length; k++){
      var ck = keys[k];
      var ckLow = ck.toLowerCase();
      if(ckLow === wantLow || ckLow.endsWith('|' + wantLow)) return rec.clips[ck];
    }
  }
  for(var j = 0; j < list.length; j++){
    var w2 = String(list[j] || '').toLowerCase();
    if(!w2) continue;
    for(var m = 0; m < keys.length; m++){
      if(keys[m].toLowerCase().indexOf(w2) >= 0) return rec.clips[keys[m]];
    }
  }
  return keys.length ? rec.clips[keys[0]] : null;
}

window.playAnimalClip = function(rec, candidates, opts){
  opts = opts || {};
  if(!rec || !rec.mixer || !rec.clips) return false;
  var clip = findAnimalClip(rec, candidates);
  if(!clip) return false;
  if(!rec.actions) rec.actions = {};
  var key = clip.name;
  if(!rec.actions[key]) rec.actions[key] = rec.mixer.clipAction(clip);
  var next = rec.actions[key];
  if(rec.currentAction === next && next.isRunning() && !opts.force){
    if(opts.timeScale != null) next.timeScale = opts.timeScale;
    return true;
  }
  next.reset();
  var once = opts.loop === false;
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
  next.clampWhenFinished = !!once;
  next.setEffectiveWeight(1);
  next.timeScale = opts.timeScale != null ? opts.timeScale : 1;
  var fade = opts.fade != null ? opts.fade : 0.22;
  if(rec.currentAction && rec.currentAction !== next){
    rec.currentAction.crossFadeTo(next, fade, false);
  } else {
    next.fadeIn(fade);
  }
  next.play();
  rec.currentAction = next;
  rec.animName = key;
  return true;
};

function mountAnimalIntoRecord(rec, specKey){
  var spec = ANIMAL_SPECS[specKey];
  if(!spec || !rec || !rec.mesh) return;
  getAnimalBuffer(specKey, function(err, buf){
    if(err || !buf || typeof THREE === 'undefined' || !THREE.GLTFLoader) return;
    try {
      var loader = new THREE.GLTFLoader();
      loader.parse(buf, '', function(gltf){
        if(!gltf || !gltf.scene || !rec.mesh) return;
        var root = gltf.scene;
        prepareAnimalMaterials(root, spec);

        var clipsMap = {};
        var anims = gltf.animations || [];
        for(var i = 0; i < anims.length; i++){
          clipsMap[anims[i].name] = anims[i];
        }
        var mixer = new THREE.AnimationMixer(root);
        rec.mixer = mixer;
        rec.clips = clipsMap;
        rec.actions = {};
        rec.spec = spec;

        // İlk Idle karesini uygula ki bounding-box gerçek duruşa göre hesaplansın
        window.playAnimalClip(rec, spec.idleClips || ['idle', 'Idle'], { fade: 0.01 });
        mixer.update(0.016);
        root.updateMatrixWorld(true);

        var box = new THREE.Box3().setFromObject(root);
        var h = Math.max(1e-4, box.max.y - box.min.y);
        var cx = (box.min.x + box.max.x) * 0.5;
        var cz = (box.min.z + box.max.z) * 0.5;
        if(isFinite(box.min.y)) root.position.y -= box.min.y;
        if(isFinite(cx)) root.position.x -= cx;
        if(isFinite(cz)) root.position.z -= cz;

        var pivot = new THREE.Group();
        pivot.rotation.y = spec.rotY || 0;
        pivot.scale.setScalar((spec.targetH || 0.65) / h);
        pivot.add(root);

        rec.mesh.add(pivot);
        rec.modelPivot = pivot;
        // Farklı hayvanların animasyon fazları senkron görünmesin
        mixer.update((Math.random() * 1.7) % 1.2);
      }, function(){});
    } catch(e){}
  });
}

function createShadowDisc(radius){
  var sh = new THREE.Mesh(
    new THREE.CircleGeometry(radius || 0.34, 14),
    new THREE.MeshBasicMaterial({ color: 0x1a2a14, transparent: true, opacity: 0.28, depthWrite: false })
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.02;
  sh.material.userData.keep = true;
  return sh;
}

function createProdBadgeSprite(emoji, heightY){
  var c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  var g = c.getContext('2d');
  g.fillStyle = 'rgba(20, 28, 22, 0.85)';
  g.strokeStyle = '#fbbf24';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(48, 48, 38, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.font = '44px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(emoji || '🥛', 48, 50);
  var tex = new THREE.CanvasTexture(c);
  var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  mat.userData.keep = true;
  var sp = new THREE.Sprite(mat);
  sp.scale.set(0.46, 0.46, 0.46);
  sp.position.set(0, (heightY || 0.9) + 0.38, 0);
  sp.visible = false;
  return sp;
}

function enforceMaxGardenAnimals(maxCount){
  var limit = maxCount || 10;
  while(pets.length >= limit){
    var old = pets.shift();
    if(old && old.mesh){
      if(old.mesh.parent) old.mesh.parent.remove(old.mesh);
      else scene.remove(old.mesh);
    }
  }
}

function spawnPetWithSpec(type, specKey, x, z, toastMsg){
  var spec = ANIMAL_SPECS[specKey] || ANIMAL_SPECS.cat_toyger;
  var hTarget = spec.targetH || 0.65;
  var g = new THREE.Group();
  g.name = 'pet_' + type + '_' + specKey;
  g.add(createShadowDisc(Math.max(0.28, hTarget * 0.34)));
  // SkinnedMesh üzerinde mobil/masaüstü tıklamayı %100 kolaylaştıran görünmez hit silindiri
  var hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  hitMat.userData.keep = true;
  var hitR = Math.max(0.38, hTarget * 0.42);
  var hitH = Math.max(0.68, hTarget * 1.05);
  var hitCyl = new THREE.Mesh(new THREE.CylinderGeometry(hitR, hitR, hitH, 8), hitMat);
  hitCyl.position.y = hitH * 0.5;
  g.add(hitCyl);

  var prodBadge = null;
  if(spec.prodItem){
    prodBadge = createProdBadgeSprite(spec.prodEmoji, hTarget);
    g.add(prodBadge);
  }

  g.position.set(x, 0, z);
  scene.add(g);

  var rec = {
    mesh: g,
    type: type,
    breed: specKey,
    breedName: spec.label,
    emoji: spec.emoji || (type === 'cat' ? '🐱' : '🐶'),
    target: null,
    time: Math.random() * 20,
    wander: 0,
    mixer: null,
    clips: null,
    actions: {},
    currentAction: null,
    animName: '',
    spec: spec,
    _idleTimer: 2.5 + Math.random() * 3.5,
    _reactTimer: 0,
    prodItem: spec.prodItem || null,
    prodTimer: spec.prodTime ? (spec.prodTime * (0.45 + Math.random() * 0.4)) : 0,
    prodReady: false,
    prodBadge: prodBadge
  };
  pets.push(rec);
  mountAnimalIntoRecord(rec, specKey);

  if(isLoading) return rec;
  showToast(toastMsg || ((spec.emoji || '🐾') + ' ' + spec.label + ' bahçeye katıldı!'));
  sndPet();
  markDirty(); save(true);
  return rec;
}

function mkCat(x, z, explicitBreed) {
  var specKey = (explicitBreed && ANIMAL_SPECS[explicitBreed]) ? explicitBreed : CAT_BREED_KEYS[_catSpawnCount % CAT_BREED_KEYS.length];
  _catSpawnCount++;
  var spec = ANIMAL_SPECS[specKey];
  return spawnPetWithSpec('cat', specKey, x, z, '🐱 ' + spec.label + ' bahçeye katıldı!');
}

function mkDog(x, z, explicitBreed) {
  var specKey = (explicitBreed && ANIMAL_SPECS[explicitBreed]) ? explicitBreed : DOG_BREED_KEYS[_dogSpawnCount % DOG_BREED_KEYS.length];
  _dogSpawnCount++;
  var spec = ANIMAL_SPECS[specKey];
  return spawnPetWithSpec('dog', specKey, x, z, '🐶 ' + spec.label + ' bahçeye katıldı!');
}

window.spawnFarmAnimalAt = function(specKey, x, z){
  if(!ANIMAL_SPECS[specKey]) specKey = 'cow';
  enforceMaxGardenAnimals(10);
  var spec = ANIMAL_SPECS[specKey];
  var baseType = /^cat_/.test(specKey) ? 'cat' : (/^dog_/.test(specKey) ? 'dog' : specKey);
  return spawnPetWithSpec(baseType, specKey, x, z, (spec.emoji || '🐾') + ' ' + spec.label + ' bahçeye yerleşti!');
};

window.restoreSavedPet = function(p){
  if(!p) return null;
  var x = p.x || 0, z = p.z || 0;
  if(p.breed && ANIMAL_SPECS[p.breed]){
    var bt = /^cat_/.test(p.breed) ? 'cat' : (/^dog_/.test(p.breed) ? 'dog' : p.breed);
    return spawnPetWithSpec(bt, p.breed, x, z);
  }
  if(p.type === 'cat') return mkCat(x, z);
  if(p.type === 'dog') return mkDog(x, z);
  if(p.type && ANIMAL_SPECS[p.type]) return spawnPetWithSpec(p.type, p.type, x, z);
  return mkCat(x, z);
};

// Cozy Biyomlar (Çiftlik, Orman, Göl, Köy) için gerçek iskelet animasyonlu hayvan üretici
window.spawnBiomeAnimal = function(specKey, parentGroup, x, z, rotY, scaleMult){
  var spec = ANIMAL_SPECS[specKey];
  if(!spec || !parentGroup) return null;
  var hTarget = spec.targetH || 0.65;
  var g = new THREE.Group();
  g.name = 'biomeAnimal_' + specKey;
  g.add(createShadowDisc(hTarget * 0.32));
  var hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  hitMat.userData.keep = true;
  var hitR = Math.max(0.38, hTarget * 0.42);
  var hitH = Math.max(0.68, hTarget * 1.05);
  var hitCyl = new THREE.Mesh(new THREE.CylinderGeometry(hitR, hitR, hitH, 8), hitMat);
  hitCyl.position.y = hitH * 0.5;
  g.add(hitCyl);
  g.position.set(x || 0, 0, z || 0);
  if(rotY != null) g.rotation.y = rotY;
  if(scaleMult != null && scaleMult !== 1) g.scale.setScalar(scaleMult);
  parentGroup.add(g);

  var rec = {
    mesh: g,
    type: specKey,
    breed: specKey,
    breedName: spec.label,
    emoji: spec.emoji || '🐾',
    isBiomeAnimal: true,
    homeX: x || 0,
    homeZ: z || 0,
    wanderR: specKey === 'chick' || specKey === 'duck' ? 1.8 : 2.6,
    speed: specKey === 'chick' || specKey === 'duck' ? 0.55 : 0.72,
    target: null,
    state: 'idle',
    stateTimer: 1.5 + Math.random() * 4.0,
    mixer: null,
    clips: null,
    actions: {},
    currentAction: null,
    animName: '',
    spec: spec
  };
  mountAnimalIntoRecord(rec, specKey);
  if(!window._biomeAnimals) window._biomeAnimals = [];
  window._biomeAnimals.push(rec);
  return rec;
};

// Sayfa açılır açılmaz kedi ve köpek .glb modellerini arka planda önbelleğe al
setTimeout(function(){
  ['cat_toyger', 'dog_golden', 'cat_van', 'dog_shiba'].forEach(function(k){
    getAnimalBuffer(k, function(){});
  });
}, 120);

window.addPet = function(type) {
  enforceMaxGardenAnimals(10);
  var cx = 0, cz = 0;
  if(typeof window.getActiveBiome === 'function' && typeof isCozy === 'function' && isCozy()){
    var b = window.getActiveBiome();
    if(b){ cx = b.cx || 0; cz = b.cz || 0; }
  }
  var a = Math.random()*Math.PI*2, r = 2.5 + Math.random()*4.5;
  if(type==='cat') mkCat(cx + Math.cos(a)*r, cz + Math.sin(a)*r);
  else if(type==='dog') mkDog(cx + Math.cos(a)*r, cz + Math.sin(a)*r);
  else window.spawnFarmAnimalAt(type, cx + Math.cos(a)*r, cz + Math.sin(a)*r);
};



var SHOP_ITEMS = {
  seeds: [
    {id:'wheat',     emoji:'🌾', name:'Buğday Tohumu',   desc:'Altın başaklı buğday. Tavuk ve ineklerin en sevdiği yem!', price:30, color:0xd4af37, type:'flower', deco:'wheat'},
    {id:'rose',      emoji:'🌹', name:'Gül Tohumu',      desc:'Kırmızı zarif gül çiçeği',    price:35,  color:0xcc0022, type:'flower'},
    {id:'lotus',     emoji:'🪷', name:'Lotus Tohumu',    desc:'Nadir pembe lotus çiçeği',     price:55,  color:0xff69b4, type:'flower'},
    {id:'sunflower', emoji:'🌻', name:'Ayçiçeği',        desc:'Sarı dev ayçiçeği',            price:30,  color:0xffcc00, type:'flower'},
    {id:'tulip',     emoji:'🌷', name:'Lale Tohumu',     desc:'Klasik Türk lalesi',           price:40,  color:0xff3366, type:'flower'},
    {id:'bluebell',  emoji:'💙', name:'Çan Çiçeği',     desc:'Mavi sallanan çan çiçeği',     price:50,  color:0x4488ff, type:'flower'},
    {id:'cherry',    emoji:'🌸', name:'Kiraz Çiçeği',   desc:'Japon kiraz çiçeği',           price:70,  color:0xffb7c5, type:'flower'},
  ],
  animals: [
    {id:'animal_cow',       emoji:'🐮', name:'Süt İneği',      desc:'Otlar ve 🥛 Taze Süt üretir (Ahırda Yaşar)', price:480, type:'animal', specKey:'cow'},
    {id:'animal_alpaca',    emoji:'🦙', name:'Alpaka',         desc:'Gezinir ve 🧶 Yumuşak Yün üretir',            price:520, type:'animal', specKey:'alpaca'},
    {id:'animal_sheep',     emoji:'🐑', name:'Merinos Koyun',  desc:'Otlar ve 🧶 Yumuşak Yün üretir',              price:390, type:'animal', specKey:'sheep'},
    {id:'animal_chick',     emoji:'🐥', name:'Köy Civcivi',    desc:'Yemlenir ve 🥚 Yumurta üretir',               price:180, type:'animal', specKey:'chick'},
    {id:'animal_duck',      emoji:'🦆', name:'Gölet Ördeği',   desc:'Badi badi yürür, 🥚 Yumurta verir',           price:240, type:'animal', specKey:'duck'},
    {id:'animal_horse',     emoji:'🐴', name:'Doru At',        desc:'Bahçede dörtnala koşan asil at',              price:880, type:'animal', specKey:'horse'},
    {id:'animal_deer',      emoji:'🦌', name:'Orman Geyiği',   desc:'Zarif boynuzlu uysal geyik',                  price:580, type:'animal', specKey:'deer'},
    {id:'animal_fox',       emoji:'🦊', name:'Kızıl Tilki',    desc:'Meraklı ve çevik dost tilki',                 price:450, type:'animal', specKey:'fox'},
    {id:'animal_cat_van',   emoji:'🐱', name:'Van Kedisi',     desc:'Hazine bulan 3D Van Kedisi',                  price:340, type:'animal', specKey:'cat_van'},
    {id:'animal_dog_shiba', emoji:'🐕', name:'Shiba Inu',      desc:'Zararlı avcısı sadık Shiba Inu',              price:380, type:'animal', specKey:'dog_shiba'},
  ],
  items: [
    {id:'village_house',    emoji:'🏡', name:'Köy Aile Evi',      desc:'Yeni ailenin köye taşınmasını sağlar. Pazar müşteri sayısı ve satışlar artar!', price:620, deco:'village_house'},
    {id:'chicken_coop',     emoji:'🐔', name:'Tavuk Kümesi & Çit',desc:'Geniş çitli ahşap kümes. Yumurta üretir!', price:550, deco:'chicken_coop'},
    {id:'barn_building',    emoji:'🛖', name:'Köy Ahırı & Ağıl',  desc:'İnek ve alpakalar için 4 hayvan kapasiteli ahır & mandıra!', price:880, deco:'stable'},
    {id:'wheat_field',      emoji:'🌾', name:'Buğday Tarlası Parseli', desc:'Geniş tarlada bol bol buğday ekimi!', price:220, deco:'wheat_field'},
    {id:'oven',             emoji:'🏠', name:'Köy Taş Fırını',    desc:'Sıcak pide & ekmek fırını',       price:420,  deco:'oven'},
    {id:'dairy_stand',      emoji:'🥛', name:'Ahşap Mandıra',     desc:'Süt güğümü ve yayık tezgahı',     price:460,  deco:'dairy_stand'},
    {id:'treehouse',        emoji:'🏚️', name:'Ağaç Evi',         desc:'Mini ağaç üstü ev',                price:750,  deco:'treehouse'},
    {id:'fountain',         emoji:'⛲', name:'Çeşme',             desc:'Şırıl şırıl çeşme',               price:480,  deco:'fountain'},
    {id:'golden_pot',       emoji:'🏆', name:'Altın Saksı',       desc:'Özel altın renkli saksı',         price:220,  deco:'golden_pot'},
    {id:'crystal_pond',     emoji:'💎', name:'Kristal Gölet',     desc:'Parlayan mavi gölet',             price:380,  deco:'crystal_pond'},
    {id:'magic_lamp',       emoji:'🔮', name:'Sihirli Fener',     desc:'Mor ışık saçan fener',            price:260,  deco:'magic_lamp'},
    {id:'rainbow_arch',     emoji:'🌈', name:'Gökkuşağı Kemeri',  desc:'Renkli taş kemer',                price:420,  deco:'rainbow_arch'},
    {id:'hay_stack',        emoji:'🌾', name:'Büyük Saman Yığını',desc:'Sarı kokulu saman balyaları',     price:140,  deco:'hay_stack'},
    {id:'chopping_block',   emoji:'🪵', name:'Odun Kırma Kütüğü', desc:'Kütük ve odun yığınları',        price:160,  deco:'chopping_block'},
    {id:'street_lantern',   emoji:'🏮', name:'Köy Sokak Feneri',  desc:'Paslı demir fener direği',        price:110,  deco:'street_lantern'},
    {id:'water_trough',     emoji:'⛲', name:'Taş Su Yalağı',     desc:'Hayvanlar için taze su teknesi',  price:210,  deco:'water_trough'},
    {id:'beehive',          emoji:'🍯', name:'Arı Kovanı',        desc:'Bal arıları ve çiçekli kovan',    price:560,  deco:'beehive'},
    {id:'wagon',            emoji:'🚜', name:'Ahşap Köy Arabası', desc:'Nostaljik tekerlekli araba',      price:360,  deco:'wagon'},
  ],
  special: [
    {id:'angel_wing', emoji:'🪽', name:'Melek Kanadı', desc:'Beyaz altın kanat ve hale', price:5000, special:true},
    {id:'dragon_egg',  emoji:'🥚', name:'Ejder Yumurtası', desc:'Gizemli parlayan yumurta',  price:1800, special:true},
    {id:'moonflower',  emoji:'🌕', name:'Ay Çiçeği',      desc:'Sadece gece açan çiçek',     price:1200, special:true},
    {id:'golden_tree', emoji:'🌳', name:'Altın Ağaç',     desc:'Yaprakları altın döken ağaç',price:950, special:true},
    {id:'firefly_jar', emoji:'🫙', name:'Ateşböceği Kavanozu',desc:'Geceleri ışıl ışıl',     price:750, special:true},
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
  var why = window.gardenBlocked ? window.gardenBlocked(x, z) : '';
  if(why){ showToast(why); return false; }
  var seed = window.takeSeed();
  if(!seed){ showToast('Çantada tohum yok 🌱'); return false; }
  mkFlower(x, z, {c:seed.color, k:seed.id, h:.15, b:0, w:1, isStunted:false});
  sndPlant(); var plantedDone=tasks.p.done; chkTask('p', 20); stats.plant++; saveStats(); updStats(); save(true);
  if(!tasks.p.done||plantedDone) showToast(seed.emoji+' ekildi');
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
  var tabOrder = ['seeds','animals','items','special'];
  document.querySelectorAll('.shop-tab').forEach(function(el,i){
    el.classList.toggle('active', tabOrder[i]===tab);
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
    bag.textContent = parts.length ? ('Çanta: '+parts.join(' · ')) : (currentShopTab==='animals' ? '🐾 Bahçeye koyduğun çiftlik hayvanları süt, yün ve yumurta üretir!' : '');
  }
  var items = SHOP_ITEMS[currentShopTab] || [];
  
  grid.innerHTML = items.map(function(item) {
    var isAnimal = item.type === 'animal';
    var count = item.type==='flower' ? seedCount(item.id) : 0;
    var owned = item.type!=='flower' && !isAnimal && !!purchasedItems[item.id];
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
  if(tp && tp.indexOf('animal_') === 0){
    var aItem = null;
    (SHOP_ITEMS.animals || []).forEach(function(a){ if(a.id === tp) aItem = a; });
    if(aItem && aItem.specKey){
      window.spawnFarmAnimalAt(aItem.specKey, x, z);
      return true;
    }
  }
  if(tp==='chicken_coop'){
    var coopMesh = (typeof window.createCoopMesh === 'function') ? window.createCoopMesh() : null;
    if(coopMesh){
      coopMesh.position.set(x, 0, z);
      coopMesh.rotation.y = ang || 0;
      scene.add(coopMesh);
      var coopRec = {
        type: 'chicken_coop',
        group: coopMesh,
        x: x,
        z: z,
        rot: ang || 0,
        world: (typeof isCozy==='function' && isCozy()) ? 'cozy' : 'normal'
      };
      decos.push(coopRec);
      if(typeof window.registerChickenCoop === 'function') window.registerChickenCoop(coopRec);
      if(typeof sndPlant === 'function') sndPlant();
      if(typeof showToast === 'function') showToast('🐔 Tavuk Kümesi kuruldu! Tavuklar yumurtlamaya başladı 🥚');
      if(typeof save === 'function') save(true);
      return true;
    }
  }
  else if(tp==='stable' || tp==='barn_building'){
    if(typeof mkPackProp === 'function'){
      mkPackProp('stable', x, z, ang || 0);
      if(typeof sndPlant === 'function') sndPlant();
      if(typeof showToast === 'function') showToast('🛖 Köy Ahırı kuruldu! Çiftlik hayvanları yerleşti 🐮🦙');
      if(typeof save === 'function') save(true);
      return true;
    }
  }
  else if(tp==='village_house' || tp==='house'){
    if(typeof window.mkVillageHouse === 'function') window.mkVillageHouse(x, z, ang || 0);
    else if(typeof mkHouse === 'function') mkHouse(x, z, ang || 0);
    if(typeof sndPlant === 'function') sndPlant();
    if(typeof save === 'function') save(true);
    return true;
  }
  else if(tp==='wheat_field'){
    if(typeof window.mkWheatField === 'function') window.mkWheatField(x, z);
    if(typeof sndPlant === 'function') sndPlant();
    if(typeof save === 'function') save(true);
    return true;
  }
  else if(tp==='golden_pot') mkGoldenPot(x,z);
  else if(tp==='crystal_pond') mkCrystalPond(x,z);
  else if(tp==='magic_lamp') mkMagicLamp(x,z);
  else if(tp==='rainbow_arch') mkRainbowArch(x,z,ang);
  else if(tp==='fountain') mkFountain(x,z);
  else if(tp==='treehouse') mkTreehouse(x,z);
  else if(tp==='angel_wing') mkAngelWing(x,z);
  else if(tp==='oven' && typeof window.mkOven==='function') window.mkOven(x,z,ang);
  else if(tp==='water_trough' && typeof window.mkWaterTrough==='function') window.mkWaterTrough(x,z,ang);
  else if(tp==='chopping_block' && typeof window.mkChoppingBlock==='function') window.mkChoppingBlock(x,z);
  else if(tp==='street_lantern' && typeof window.mkStreetLantern==='function') window.mkStreetLantern(x,z);
  else if(tp==='beehive' && typeof window.mkBeehive==='function') window.mkBeehive(x,z,ang);
  else if(typeof PACK_PROPS!=='undefined' && PACK_PROPS[tp] && typeof mkPackProp==='function') mkPackProp(tp,x,z,ang);
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
  var isAnimal = item.type==='animal';
  if(stats.coin < item.price && (seed || isAnimal || !purchasedItems[id])) { showToast('Yeterli coin yok! 💰'); return; }
  if(seed){
    stats.coin -= item.price;
    purchasedItems[id] = seedCount(id) + 1;
    selectedSeed = id;
    purchasedItems.sel = id;
    saveShop(); saveStats(); updStats(); renderShop();
    showToast(item.emoji+' çantada: '+purchasedItems[id]);
    sndCoin();
    return;
  }
  if(isAnimal){
    if(item.specKey === 'cow' || item.specKey === 'alpaca' || item.specKey === 'sheep'){
      var bList = (typeof window.barns !== 'undefined' && Array.isArray(window.barns)) ? window.barns : [];
      if(bList.length === 0){
        if(typeof showToast === 'function') showToast('🛖 Önce bir Köy Ahırı kurmalısın!');
        return;
      }
      var curLivestock = (typeof window.cows !== 'undefined') ? window.cows.length : 0;
      if(curLivestock >= bList.length * 4){
        if(typeof showToast === 'function') showToast('🛖 Tüm ahırların dolu! (Maksimum 4 hayvan/ahır). Yeni ahır kurmalısın.');
        return;
      }
    }
    stats.coin -= item.price;
    saveStats(); updStats(); renderShop();
    sndCoin();
    window.beginShopPlace(item);
    return;
  }
  if(!purchasedItems[id]){
    stats.coin -= item.price;
    purchasedItems[id] = true;
    saveShop(); saveStats(); updStats(); renderShop();
    sndCoin();
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
  var water=new THREE.Mesh(new THREE.CircleGeometry(1.3,16),window._waterMat);water.rotation.x=-Math.PI/2;water.position.y=.2;g.add(water);
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
  g.position.set(x,0,z);scene.add(g);
  var last=decos[decos.length-1];
  if(last){
    last.world=(typeof isCozy==='function'&&isCozy())?'cozy':'classic';
    last.group.visible=!(typeof isCozy==='function')|| (last.world==='cozy'?isCozy():!isCozy());
  }
  markDirty();
}



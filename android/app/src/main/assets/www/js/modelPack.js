// Real Kenney CC0 glTF models — replaces procedural spheres.
(function(){
  var BASE = 'models/';
  var templates = {};
  var ready = false;
  var waiting = [];
  var loader = null;

  var CATALOG = {
    // trees
    'tree_oak': 'nature/tree_oak.glb',
    'tree_detailed': 'nature/tree_detailed.glb',
    'tree_pine': 'nature/tree_pineTallA_detailed.glb',
    'tree_fat': 'nature/tree_fat.glb',
    'tree_oak_dark': 'nature/tree_oak_dark.glb',
    'tree_detailed_dark': 'nature/tree_detailed_dark.glb',
    'tree_forest': 'forest/tree.glb',
    'tree_forest_high': 'forest/tree-high.glb',
    // bushes / plants
    'bush': 'nature/plant_bushDetailed.glb',
    'bush_large': 'nature/plant_bushLarge.glb',
    'bush_small': 'nature/plant_bushSmall.glb',
    'plant': 'nature/plant_bush.glb',
    'hedge': 'town/hedge.glb',
    'hedge_large': 'town/hedge-large.glb',
    // rocks
    'rock_l': 'nature/rock_largeA.glb',
    'rock_l2': 'nature/rock_largeB.glb',
    'rock_s': 'nature/rock_smallA.glb',
    'rock_s2': 'nature/rock_smallB.glb',
    'stone_tall': 'nature/stone_tallA.glb',
    // mushrooms / flowers
    'shroom_red': 'nature/mushroom_redGroup.glb',
    'shroom_tan': 'nature/mushroom_tanGroup.glb',
    'flower_r': 'nature/flower_redA.glb',
    'flower_y': 'nature/flower_yellowA.glb',
    'flower_p': 'nature/flower_purpleA.glb',
    'flower_r2': 'nature/flower_redB.glb',
    'flower_y2': 'nature/flower_yellowB.glb',
    // fence / bridge / misc
    'fence': 'nature/fence_simple.glb',
    'fence_planks': 'nature/fence_planks.glb',
    'bridge': 'nature/bridge_wood.glb',
    'log': 'nature/log.glb',
    'campfire': 'nature/campfire_stones.glb',
    'tent': 'nature/tent_smallOpen.glb',
    'grass': 'nature/grass_large.glb',
    'path_stone': 'nature/path_stone.glb',
    // town
    'lantern': 'town/lantern.glb',
    'bench': 'town/stall-bench.glb',
    'fountain': 'town/fountain-round.glb',
    'wall_door': 'town/wall-wood-door.glb',
    'wall': 'town/wall-wood.glb',
    'wall_win': 'town/wall-wood-window-glass.glb',
    'roof': 'town/roof-high.glb',
    'chimney': 'town/chimney.glb',
    'fence_town': 'town/fence.glb'
  };

  function fixMats(root){
    root.traverse(function(c){
      if(!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      var out = mats.map(function(m){
        var nm = m.clone();
        nm.metalness = 0;
        nm.roughness = Math.min(0.92, Math.max(0.45, nm.roughness != null ? nm.roughness : 0.8));
        nm.side = THREE.FrontSide;
        nm.userData.keep = true;
        if(nm.emissive && nm.emissiveIntensity > 0.8) nm.emissiveIntensity = 0.35;
        return nm;
      });
      c.material = out.length === 1 ? out[0] : out;
      c.castShadow = false;
      c.receiveShadow = false;
    });
  }

  function groundAlign(obj){
    obj.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(obj);
    if(isFinite(box.min.y)) obj.position.y -= box.min.y;
  }

  function cloneKey(key, scale){
    var path = CATALOG[key];
    if(!path || !templates[path]) return null;
    var o = templates[path].clone(true);
    fixMats(o);
    if(scale != null) o.scale.setScalar(scale);
    groundAlign(o);
    return o;
  }

  function wrapAt(x, z, angle, obj){
    var g = new THREE.Group();
    if(obj) g.add(obj);
    g.position.set(x, 0, z);
    if(angle != null) g.rotation.y = angle;
    return g;
  }

  function pick(){
    var keys = arguments;
    for(var i=0;i<keys.length;i++){
      if(templates[CATALOG[keys[i]]]) return keys[i];
    }
    return null;
  }

  function whenReady(fn){
    if(ready) fn();
    else waiting.push(fn);
  }

  function installBuilders(){
    var _rnd = typeof gardenRand === 'function' ? gardenRand : function(){ return Math.random; };

    buildTree = function(x, z){
      var rnd = _rnd(x, z);
      var keys = ['tree_oak','tree_detailed','tree_pine','tree_fat','tree_oak_dark','tree_detailed_dark'];
      var key = keys[Math.floor(rnd()*keys.length)];
      var o = cloneKey(key, 1.85 + rnd()*0.45);
      if(!o) o = cloneKey('tree_forest_high', 1.4);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.1));
      return g;
    };

    buildBush = function(x, z){
      var rnd = _rnd(x+1, z+2);
      var key = pick('bush','bush_large','bush_small','plant','hedge') || 'bush';
      var o = cloneKey(key, 2.2 + rnd()*0.6);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      // sprinkle real flowers around bush
      for(var i=0;i<3;i++){
        var fk = ['flower_r','flower_y','flower_p','flower_r2','flower_y2'][Math.floor(rnd()*5)];
        var fl = cloneKey(fk, 1.6+rnd());
        if(fl){
          fl.position.set((rnd()-.5)*.7, 0, (rnd()-.5)*.7);
          groundAlign(fl);
          g.add(fl);
        }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(.7));
      return g;
    };

    buildStone = function(x, z){
      var rnd = _rnd(x+3, z+1);
      var key = pick('rock_l','rock_l2','rock_s','rock_s2','stone_tall') || 'rock_s';
      var o = cloneKey(key, 1.4 + rnd()*0.8);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.55));
      return g;
    };

    buildMushroom = function(x, z){
      var rnd = _rnd(x+4, z+4);
      var o = cloneKey(rnd()>.5 ? 'shroom_red' : 'shroom_tan', 2.4+rnd());
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.4));
      return g;
    };

    buildFence = function(x, z, a){
      var o = cloneKey('fence', 1.35) || cloneKey('fence_planks', 1.35) || cloneKey('fence_town', .9);
      var g = wrapAt(x, z, a||0, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.5));
      return g;
    };

    buildBench = function(x, z, a){
      var o = cloneKey('bench', 1.05);
      var g = wrapAt(x, z, a||0, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.7));
      return g;
    };

    buildLantern = function(x, z){
      var o = cloneKey('lantern', .85);
      var g = wrapAt(x, z, 0, o);
      var lt = new THREE.PointLight(0xffb060, 1.5, 6);
      lt.position.set(0, 1.6, 0);
      g.add(lt);
      // soft glow orb
      var glow = new THREE.Mesh(
        new THREE.SphereGeometry(.12, 12, 10),
        new THREE.MeshStandardMaterial({ color:0xffc878, emissive:0xff9944, emissiveIntensity:1.2, transparent:true, opacity:.55 })
      );
      glow.position.y = 1.55;
      glow.material.userData.keep = true;
      g.add(glow);
      g.userData.flame = glow;
      if(typeof sitShadow === 'function') g.add(sitShadow(.3));
      return { group:g, light:lt };
    };

    buildBridge = function(x, z, a){
      var o = cloneKey('bridge', 1.6);
      var g = wrapAt(x, z, a||0, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.1));
      return g;
    };

    buildPond = function(x, z){
      // Fountain model + shader water ring for life
      var g = new THREE.Group();
      var fountain = cloneKey('fountain', 1.35);
      if(fountain) g.add(fountain);
      var w = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), window._waterMat);
      w.rotation.x = -Math.PI/2;
      w.position.y = .06;
      g.add(w);
      for(var i=0;i<4;i++){
        var fl = cloneKey(['flower_r','flower_y','flower_p'][i%3], 1.8);
        if(fl){
          var ang = i/4*Math.PI*2;
          fl.position.set(Math.cos(ang)*1.5, 0, Math.sin(ang)*1.1);
          groundAlign(fl);
          g.add(fl);
        }
      }
      var lt = new THREE.PointLight(0x88e0d0, .55, 5);
      lt.position.set(0, .6, 0);
      g.add(lt);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.5));
      g.position.set(x, 0, z);
      return { group:g, light:lt };
    };

    buildWell = function(x, z){
      // Use fountain as decorative well stand-in + campfire stones rim
      var g = new THREE.Group();
      var f = cloneKey('fountain', 1.1);
      if(f) g.add(f);
      var rim = cloneKey('campfire', 2.2);
      if(rim){ rim.position.y = 0.01; g.add(rim); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.9));
      g.position.set(x, 0, z);
      return g;
    };

    buildWild = function(x, z){
      var g = new THREE.Group();
      var rnd = _rnd(x+5, z+3);
      g.userData.heads = [];
      for(var i=0;i<6;i++){
        var key = ['flower_r','flower_y','flower_p','flower_r2','flower_y2'][Math.floor(rnd()*5)];
        var fl = cloneKey(key, 1.8+rnd()*1.2);
        if(!fl) continue;
        fl.position.set((rnd()-.5)*.7, 0, (rnd()-.5)*.7);
        groundAlign(fl);
        g.add(fl);
        g.userData.heads.push(fl);
        fl.userData.by = fl.position.y;
      }
      var grass = cloneKey('grass', 1.5+rnd());
      if(grass){ groundAlign(grass); g.add(grass); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.45));
      g.position.set(x, 0, z);
      return g;
    };

    buildHouse = function(x, z, angle){
      var g = new THREE.Group();
      var s = 1.15;
      function addWall(key, px, pz, ry){
        var w = cloneKey(key, s);
        if(!w) return;
        w.position.set(px, 0, pz);
        w.rotation.y = ry||0;
        groundAlign(w);
        // walls are ~2 tall after align
        g.add(w);
      }
      // 2-unit modular footprint
      addWall('wall_door', 0, 1.0, 0);
      addWall('wall', 0, -1.0, Math.PI);
      addWall('wall_win', -1.0, 0, Math.PI/2);
      addWall('wall_win', 1.0, 0, -Math.PI/2);
      var roof = cloneKey('roof', s);
      if(roof){
        roof.position.set(0, 2.0*s, 0);
        g.add(roof);
      }
      var chim = cloneKey('chimney', s*0.7);
      if(chim){
        chim.position.set(0.55, 2.35*s, -0.35);
        g.add(chim);
      }
      // flower pots by door
      for(var i=0;i<2;i++){
        var fl = cloneKey(i? 'flower_y':'flower_r', 2.0);
        if(fl){
          fl.position.set(i?0.55:-0.55, 0, 1.35);
          groundAlign(fl);
          g.add(fl);
        }
      }
      var lt = new THREE.PointLight(0xffe0b0, 1.1, 5);
      lt.position.set(0, 1.4, 0.2);
      g.add(lt);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.9));
      g.position.set(x, 0, z);
      g.rotation.y = angle||0;
      return { group:g, light:lt };
    };

    buildArch = function(x, z, a){
      var g = new THREE.Group();
      var h1 = cloneKey('hedge_large', 1.1);
      var h2 = cloneKey('hedge_large', 1.1);
      if(h1){ h1.position.set(-0.9,0,0); groundAlign(h1); g.add(h1); }
      if(h2){ h2.position.set(0.9,0,0); groundAlign(h2); g.add(h2); }
      var gate = cloneKey('fence_town', 1.0);
      // use hedge-gate if available via catalog path manually
      var hg = templates['town/hedge-gate.glb'];
      if(hg){
        var o = hg.clone(true); fixMats(o); o.scale.setScalar(1.1); groundAlign(o); g.add(o);
      }
      for(var i=0;i<5;i++){
        var fl = cloneKey(['flower_r','flower_y','flower_p'][i%3], 2);
        if(fl){
          fl.position.set((i-2)*.35, 0, 0.35);
          groundAlign(fl); fl.position.y += 1.6;
          g.add(fl);
        }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.1));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };

    buildPergola = function(x, z, a){
      // Tent as cozy canopy structure + hedges
      var g = new THREE.Group();
      var tent = cloneKey('tent', 2.0);
      if(tent) g.add(tent);
      var h = cloneKey('hedge', 1.2);
      if(h){ h.position.set(0,0,-1.1); groundAlign(h); g.add(h); }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.3));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };

    buildScarecrow = function(x, z){
      // Log + flowers as friendly garden marker (until character pack)
      var g = new THREE.Group();
      var log = cloneKey('log', 2.2);
      if(log){ log.rotation.z = Math.PI/2; groundAlign(log); log.position.y += 0.7; g.add(log); }
      var plant = cloneKey('plant', 2.5);
      if(plant){ plant.position.y = 0.9; g.add(plant); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.4));
      g.position.set(x,0,z);
      return g;
    };

    buildWindmill = function(x, z){
      // Tall pine + tent platform as landmark until dedicated mill asset
      var g = new THREE.Group();
      var pine = cloneKey('tree_pine', 2.4);
      if(pine) g.add(pine);
      var base = cloneKey('tent', 1.2);
      if(base){ base.position.set(1.2,0,0); groundAlign(base); g.add(base); }
      var blades = new THREE.Group();
      blades.position.set(0, 2.8, 0);
      g.add(blades);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.0));
      g.position.set(x,0,z);
      return { group:g, blades:blades };
    };

    buildPot = function(x, z){
      var g = new THREE.Group();
      var fl = cloneKey(['flower_r','flower_y','flower_p'][Math.floor(Math.random()*3)], 2.4);
      if(fl) g.add(fl);
      var bush = cloneKey('bush_small', 1.2);
      if(bush){ bush.position.y = 0; g.add(bush); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.3));
      g.position.set(x,0,z);
      return g;
    };

    buildTable = function(x, z, a){
      var g = new THREE.Group();
      var b = cloneKey('bench', 1.0);
      if(b){ b.position.set(0,0,0.55); groundAlign(b); g.add(b); }
      var b2 = cloneKey('bench', 1.0);
      if(b2){ b2.position.set(0,0,-0.55); b2.rotation.y = Math.PI; groundAlign(b2); g.add(b2); }
      var log = cloneKey('log', 1.6);
      if(log){ log.position.y = 0.35; g.add(log); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.7));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };

    // Meadow uses real flowers
    if(typeof window.seedMeadowPatches === 'undefined'){
      // cozyLife may overwrite; patch spawn to use GLB wild clusters after ready
    }
  }

  function startLoad(){
    if(typeof THREE === 'undefined' || !THREE.GLTFLoader){
      console.warn('GLTFLoader missing — keeping procedural models');
      ready = true;
      waiting.splice(0).forEach(function(fn){ try{fn();}catch(e){} });
      return;
    }
    loader = new THREE.GLTFLoader();
    var paths = Object.keys(CATALOG).map(function(k){ return CATALOG[k]; });
    // unique
    paths = paths.filter(function(p,i){ return paths.indexOf(p)===i; });
    // also hedge-gate
    paths.push('town/hedge-gate.glb');
    var left = paths.length;
    var bar = document.getElementById('modelLoad');
    if(bar) bar.classList.add('show');
    paths.forEach(function(path){
      loader.load(BASE + path, function(gltf){
        templates[path] = gltf.scene;
        fixMats(gltf.scene);
        left--;
        if(bar) bar.querySelector('span').textContent = 'Modeller ' + Math.round((1-left/paths.length)*100) + '%';
        if(left<=0){
          ready = true;
          installBuilders();
          if(bar) bar.classList.remove('show');
          waiting.splice(0).forEach(function(fn){ try{fn();}catch(e){} });
          if(typeof showToast === 'function') showToast('✨ Gerçek 3D modeller hazır');
        }
      }, undefined, function(err){
        console.warn('Model load fail', path, err);
        left--;
        if(left<=0){
          ready = true;
          installBuilders();
          if(bar) bar.classList.remove('show');
          waiting.splice(0).forEach(function(fn){ try{fn();}catch(e){} });
        }
      });
    });
  }

  window.modelPackReady = function(){ return ready; };
  window.whenModelsReady = whenReady;

  // Start after THREE + GLTFLoader scripts
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(startLoad, 0); });
  else setTimeout(startLoad, 0);
})();

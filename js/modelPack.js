// Quaternius CC0 glTF models — cozy low-poly props (Nature + Medieval Village + Crops).
(function(){
  var BASE = 'models/';
  var templates = {};
  var ready = false;
  var waiting = [];
  var loader = null;
  var _tmpBox = null;
  var _tmpColor = null;

  var CATALOG = {
    // trees
    'tree_1': 'nature/CommonTree_1.glb',
    'tree_2': 'nature/CommonTree_2.glb',
    'tree_3': 'nature/CommonTree_3.glb',
    'tree_4': 'nature/CommonTree_4.glb',
    'tree_5': 'nature/CommonTree_5.glb',
    'pine_1': 'nature/PineTree_1.glb',
    'pine_2': 'nature/PineTree_2.glb',
    'pine_3': 'nature/PineTree_3.glb',
    'pine_4': 'nature/PineTree_4.glb',
    'pine_5': 'nature/PineTree_5.glb',
    'birch_1': 'nature/BirchTree_1.glb',
    'birch_2': 'nature/BirchTree_2.glb',
    'birch_3': 'nature/BirchTree_3.glb',
    'willow_1': 'nature/Willow_1.glb',
    'willow_2': 'nature/Willow_2.glb',
    'dead_tree': 'nature/CommonTree_Dead_1.glb',
    // bushes / plants
    'bush_1': 'nature/Bush_1.glb',
    'bush_2': 'nature/Bush_2.glb',
    'bush_berry_1': 'nature/BushBerries_1.glb',
    'bush_berry_2': 'nature/BushBerries_2.glb',
    'plant_1': 'nature/Plant_1.glb',
    'plant_2': 'nature/Plant_2.glb',
    'plant_3': 'nature/Plant_3.glb',
    'plant_4': 'nature/Plant_4.glb',
    'plant_5': 'nature/Plant_5.glb',
    // rocks / logs
    'rock_1': 'nature/Rock_1.glb',
    'rock_2': 'nature/Rock_2.glb',
    'rock_3': 'nature/Rock_3.glb',
    'rock_4': 'nature/Rock_4.glb',
    'rock_5': 'nature/Rock_5.glb',
    'rock_m1': 'nature/Rock_Moss_1.glb',
    'rock_m2': 'nature/Rock_Moss_2.glb',
    'rock_m3': 'nature/Rock_Moss_3.glb',
    'rock_m4': 'nature/Rock_Moss_4.glb',
    'log': 'nature/WoodLog.glb',
    'log_moss': 'nature/WoodLog_Moss.glb',
    'stump': 'nature/TreeStump_Moss.glb',
    'stump_plain': 'nature/TreeStump.glb',
    // meadow
    // flowers / flower_* intentionally omitted — procedural flowerArt is used instead
    'grass': 'nature/Grass.glb',
    'grass_2': 'nature/Grass_2.glb',
    'grass_s': 'nature/Grass_Short.glb',
    'lilypad': 'nature/Lilypad.glb',
    'wheat': 'nature/Wheat.glb',
    'corn': 'nature/Corn_1.glb',
    // crops pack accents
    'shroom_1': 'crops/Mushroom_1.glb',
    'shroom_2': 'crops/Mushroom_2.glb',
    'shroom_3': 'crops/Mushroom_3.glb',
    'shroom_4': 'crops/Mushroom_4.glb',
    'pumpkin': 'crops/Pumpkin_4.glb',
    'carrot': 'crops/Carrot_4.glb',
    'tomato': 'crops/Tomato_4.glb',
    'lettuce': 'crops/Lettuce_4.glb',
    'berry_bush': 'crops/BushBerries_4.glb',
    'bamboo': 'crops/Bamboo_4.glb',
    'palm': 'crops/PalmTree_4.glb',
    'cactus': 'crops/Cactus_4.glb',
    'watermelon': 'crops/Watermelon_4.glb',
    'apple_tree': 'crops/Apple_4.glb',
    // village
    'house_1': 'village/House_1.glb',
    'house_2': 'village/House_2.glb',
    'house_3': 'village/House_3.glb',
    'house_4': 'village/House_4.glb',
    'inn': 'village/Inn.glb',
    'well': 'village/Well.glb',
    'mill': 'village/Mill.glb',
    'gazebo': 'village/Gazebo.glb',
    'bench_1': 'village/Bench_1.glb',
    'bench_2': 'village/Bench_2.glb',
    'fence': 'village/Fence.glb',
    'bonfire': 'village/Bonfire_Lit.glb',
    'barrel': 'village/Barrel.glb',
    'crate': 'village/Crate.glb',
    'hay': 'village/Hay.glb',
    'path': 'village/Path_Straight.glb',
    'path_sq': 'village/Path_Square.glb',
    'stand': 'village/MarketStand_1.glb',
    'stand_2': 'village/MarketStand_2.glb',
    'cart': 'village/Cart.glb',
    'stable': 'village/Stable.glb',
    'bag': 'village/Bag.glb',
    'bags': 'village/Bags.glb',
    'cauldron': 'village/Cauldron.glb',
    'package_1': 'village/Package_1.glb',
    'package_2': 'village/Package_2.glb',
    'stairs': 'village/Stairs.glb',
    'blacksmith': 'village/Blacksmith.glb',
    'bell': 'village/Bell.glb',
    'sawmill': 'village/Sawmill.glb',
    // characters (farmers / workers)
    'farmer': 'characters/Farmer.glb',
    'worker': 'characters/Worker.glb',
    'shovel': 'characters/Shovel.glb'
  };

  function box3(){
    if(!_tmpBox) _tmpBox = new THREE.Box3();
    return _tmpBox;
  }

  function cozyTint(color){
    if(!_tmpColor) _tmpColor = new THREE.Color();
    _tmpColor.copy(color);
    var hsl = { h:0, s:0, l:0 };
    _tmpColor.getHSL(hsl);
    // Quaternius ships dark PBR — lift a bit, keep saturated cozy greens/woods
    hsl.l = Math.min(0.62, hsl.l * 1.55 + 0.08);
    hsl.s = Math.min(0.78, hsl.s * 1.35 + 0.1);
    _tmpColor.setHSL(hsl.h, hsl.s, hsl.l);
    color.copy(_tmpColor);
  }

  function fixMats(root){
    root.traverse(function(c){
      if(!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      var out = mats.map(function(m){
        var nm = m.clone();
        if(nm.color) cozyTint(nm.color);
        if(nm.map){
          nm.map.encoding = THREE.sRGBEncoding != null ? THREE.sRGBEncoding : nm.map.encoding;
          nm.map.needsUpdate = true;
        }
        nm.metalness = 0;
        nm.roughness = Math.min(0.95, Math.max(0.55, nm.roughness != null ? nm.roughness * 0.9 + 0.08 : 0.82));
        nm.side = THREE.FrontSide;
        nm.flatShading = false;
        nm.userData.keep = true;
        // Soft leaf glow so canopies read from afar (keep subtle — avoid milky wash)
        var n = (nm.name || '').toLowerCase();
        if(/green|leaf|grass|plant|moss/.test(n) && nm.emissive){
          nm.emissive.copy(nm.color).multiplyScalar(0.1);
          nm.emissiveIntensity = 0.12;
        }
        if(/flower|mushroom|berry|hay|wheat|corn/.test(n) && nm.emissive){
          nm.emissive.copy(nm.color).multiplyScalar(0.16);
          nm.emissiveIntensity = 0.18;
        }
        return nm;
      });
      c.material = out.length === 1 ? out[0] : out;
      // Shadows only on chunkier meshes — every flower casting = diorama hitch.
      var cast = !!(renderer && renderer.shadowMap && renderer.shadowMap.enabled);
      if(cast && c.geometry){
        if(!c.geometry.boundingSphere) c.geometry.computeBoundingSphere();
        var r = c.geometry.boundingSphere ? c.geometry.boundingSphere.radius : 1;
        var n2 = ((out[0] && out[0].name) || '').toLowerCase();
        if(r < 0.35 || /flower|grass|mushroom|leaf|wheat|corn|berry/.test(n2)) cast = false;
      }
      c.castShadow = cast;
      c.receiveShadow = !!(renderer && renderer.shadowMap && renderer.shadowMap.enabled);
      c.frustumCulled = true;
    });
  }

  function groundAlign(obj){
    obj.updateMatrixWorld(true);
    var box = box3().setFromObject(obj);
    if(isFinite(box.min.y)) obj.position.y -= box.min.y;
  }

  function fitHeight(obj, targetH){
    if(!obj || !targetH) return obj;
    obj.updateMatrixWorld(true);
    var box = box3().setFromObject(obj);
    var h = box.max.y - box.min.y;
    if(h > 1e-4) obj.scale.multiplyScalar(targetH / h);
    groundAlign(obj);
    return obj;
  }

  function cloneSkinned(source){
    // Minimal SkeletonUtils.clone — keeps Quaternius character skins bound after clone().
    var sourceLookup = {};
    var cloneLookup = {};
    var clone = source.clone(true);
    function parallelTraverse(a, b, cb){
      cb(a, b);
      for(var i=0;i<a.children.length;i++) parallelTraverse(a.children[i], b.children[i], cb);
    }
    parallelTraverse(source, clone, function(s, c){
      sourceLookup[s.uuid] = s;
      cloneLookup[s.uuid] = c;
    });
    clone.traverse(function(node){
      if(!node.isSkinnedMesh) return;
      var src = sourceLookup[node.uuid] || null;
      // uuid of clone node differs — find by matching through lookup values
      var matched = null;
      for(var id in cloneLookup){
        if(cloneLookup[id] === node){ matched = sourceLookup[id]; break; }
      }
      src = matched;
      if(!src || !src.skeleton) return;
      var srcBones = src.skeleton.bones;
      var bones = [];
      for(var i=0;i<srcBones.length;i++){
        var mapped = cloneLookup[srcBones[i].uuid];
        bones.push(mapped || srcBones[i]);
      }
      node.bind(new THREE.Skeleton(bones, src.skeleton.boneInverses), src.bindMatrix);
    });
    return clone;
  }

  function cloneKey(key, height){
    var path = CATALOG[key];
    if(!path || !templates[path]) return null;
    var tmpl = templates[path];
    var skinned = false;
    tmpl.traverse(function(c){ if(c.isSkinnedMesh) skinned = true; });
    var o = skinned ? cloneSkinned(tmpl) : tmpl.clone(true);
    // Re-share materials with the prepared template (clone() duplicates mats).
    var srcMeshes = [];
    tmpl.traverse(function(c){ if(c.isMesh) srcMeshes.push(c); });
    var mi = 0;
    o.traverse(function(c){
      if(!c.isMesh) return;
      var src = srcMeshes[mi++];
      if(src){
        c.material = src.material;
        c.castShadow = src.castShadow;
        c.receiveShadow = src.receiveShadow;
      }
      c.frustumCulled = true;
      // Characters need live matrices; static props freeze after place.
      if(!skinned){
        c.matrixAutoUpdate = false;
        c.updateMatrix();
      }
    });
    o.matrixAutoUpdate = true; // groups still place/rotate at spawn
    if(height != null) fitHeight(o, height);
    else groundAlign(o);
    if(!skinned){
      o.traverse(function(c){
        if(c.isMesh){ c.updateMatrix(); c.matrixAutoUpdate = false; }
      });
    }
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
      var keys = ['tree_1','tree_2','tree_3','tree_4','tree_5','pine_1','pine_2','pine_4','pine_5','birch_1','birch_2','willow_1'];
      var key = keys[Math.floor(rnd()*keys.length)];
      var h = 2.6 + rnd()*1.1;
      if(key.indexOf('pine')===0) h = 3.1 + rnd()*1.2;
      if(key.indexOf('willow')===0) h = 2.8 + rnd()*0.9;
      var o = cloneKey(key, h);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      // grass skirt so trunks sit in the meadow
      var grass = cloneKey(rnd()>.5 ? 'grass' : 'grass_2', 0.35 + rnd()*0.25);
      if(grass){ grass.position.set((rnd()-.5)*.4, 0, (rnd()-.5)*.4); groundAlign(grass); g.add(grass); }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.25));
      return g;
    };

    buildBush = function(x, z){
      var rnd = _rnd(x+1, z+2);
      var key = pick('bush_berry_1','bush_berry_2','bush_1','bush_2','berry_bush','plant_1','plant_2') || 'bush_1';
      var o = cloneKey(key, 0.85 + rnd()*0.55);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      for(var i=0;i<3;i++){
        if(typeof window.mkPerfectBloom === 'function'){
          var kinds = (window._flowerArt && window._flowerArt.kinds) || ['daisy','rose','tulip','cherry'];
          var cols = (window._flowerArt && window._flowerArt.cols) || [0xff5a9a,0xffd056,0xffffff];
          var fl = window.mkPerfectBloom(kinds[Math.floor(rnd()*kinds.length)], cols[Math.floor(rnd()*cols.length)], 0.7+rnd()*0.35);
          fl.position.set((rnd()-.5)*.75, 0, (rnd()-.5)*.75);
          g.add(fl);
        } else {
          var fk = ['flower_1','flower_2','flower_3','flower_4'][Math.floor(rnd()*4)];
          var fl2 = cloneKey(fk, 0.35+rnd()*0.25);
          if(fl2){
            fl2.position.set((rnd()-.5)*.75, 0, (rnd()-.5)*.75);
            groundAlign(fl2);
            g.add(fl2);
          }
        }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(.75));
      return g;
    };

    buildStone = function(x, z){
      var rnd = _rnd(x+3, z+1);
      var key = pick('rock_m1','rock_m2','rock_m3','rock_m4','rock_1','rock_2','rock_3','rock_4','rock_5') || 'rock_1';
      var o = cloneKey(key, 0.45 + rnd()*0.55);
      var g = wrapAt(x, z, rnd()*Math.PI*2, o);
      if(rnd() > .55){
        var moss = cloneKey('plant_3', 0.35+rnd()*0.2);
        if(moss){ moss.position.set((rnd()-.5)*.25, 0, (rnd()-.5)*.25); groundAlign(moss); g.add(moss); }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(.55));
      return g;
    };

    buildMushroom = function(x, z){
      var rnd = _rnd(x+4, z+4);
      var g = new THREE.Group();
      var n = 2 + Math.floor(rnd()*3);
      for(var i=0;i<n;i++){
        var key = ['shroom_1','shroom_2','shroom_3','shroom_4'][Math.floor(rnd()*4)];
        var o = cloneKey(key, 0.28 + rnd()*0.35);
        if(!o) continue;
        o.position.set((rnd()-.5)*.45, 0, (rnd()-.5)*.45);
        groundAlign(o);
        g.add(o);
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(.4));
      g.position.set(x, 0, z);
      return g;
    };

    buildFence = function(x, z, a){
      var o = cloneKey('fence', 1.05);
      var g = wrapAt(x, z, a||0, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.5));
      return g;
    };

    buildBench = function(x, z, a){
      var o = cloneKey(pick('bench_1','bench_2') || 'bench_1', 0.72);
      var g = wrapAt(x, z, a||0, o);
      if(typeof sitShadow === 'function') g.add(sitShadow(.65));
      return g;
    };

    buildLantern = function(x, z){
      // Classic garden lamp-post — reads clearly as a fener (not a barrel).
      var g = new THREE.Group();
      function mat(hex, rough, metal, emissive, eInt){
        var o = { color:hex, roughness:rough==null?0.7:rough, metalness:metal||0 };
        if(emissive!=null){ o.emissive = emissive; o.emissiveIntensity = eInt==null?0.4:eInt; }
        var m = new THREE.MeshStandardMaterial(o);
        m.userData.keep = true;
        return m;
      }
      var iron = mat(0x2a2430, 0.45, 0.55);
      var ironDark = mat(0x1a1520, 0.55, 0.4);
      var brass = mat(0xb8893a, 0.35, 0.65, 0x6a4010, 0.15);
      var stone = mat(0x8a8074, 0.95, 0);

      // Pedestal
      var plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.14, 10), stone);
      plinth.position.y = 0.07;
      g.add(plinth);
      var plinth2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 10), stone);
      plinth2.position.y = 0.18;
      g.add(plinth2);

      // Pole
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.55, 10), iron);
      pole.position.y = 1.0;
      g.add(pole);
      var collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 16), brass);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 1.55;
      g.add(collar);
      var collar2 = collar.clone();
      collar2.position.y = 0.42;
      g.add(collar2);

      // Lamp head cage (square lantern body)
      var headY = 1.95;
      var cageW = 0.38, cageH = 0.42;
      var frame = ironDark;
      // Bottom / top plates
      var floor = new THREE.Mesh(new THREE.BoxGeometry(cageW + 0.06, 0.05, cageW + 0.06), brass);
      floor.position.y = headY - cageH * 0.5;
      g.add(floor);
      var ceiling = new THREE.Mesh(new THREE.BoxGeometry(cageW + 0.04, 0.045, cageW + 0.04), brass);
      ceiling.position.y = headY + cageH * 0.5;
      g.add(ceiling);
      // Corner posts
      var hw = cageW * 0.5;
      [[-hw,-hw],[hw,-hw],[-hw,hw],[hw,hw]].forEach(function(p){
        var bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, cageH + 0.04, 0.04), frame);
        bar.position.set(p[0], headY, p[1]);
        g.add(bar);
      });
      // Cross braces mid
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
        var rail = new THREE.Mesh(new THREE.BoxGeometry(d[0] ? 0.03 : cageW - 0.02, 0.03, d[1] ? 0.03 : cageW - 0.02), frame);
        rail.position.set(d[0] * hw, headY, d[1] * hw);
        g.add(rail);
      });

      // Glass panes (4 sides) — warm emissive
      var glassMat = new THREE.MeshStandardMaterial({
        color: 0xfff0c8,
        emissive: 0xffb050,
        emissiveIntensity: 2.8,
        transparent: true,
        opacity: 0.92,
        roughness: 0.14,
        metalness: 0.05,
        side: THREE.DoubleSide
      });
      glassMat.userData.keep = true;
      var paneGeo = new THREE.PlaneGeometry(cageW - 0.08, cageH - 0.08);
      [[0, hw],[0, -hw],[hw, 0],[-hw, 0]].forEach(function(p, i){
        var pane = new THREE.Mesh(paneGeo, glassMat);
        pane.position.set(p[0], headY, p[1]);
        if(i < 2) pane.rotation.y = 0;
        else pane.rotation.y = Math.PI / 2;
        g.add(pane);
      });

      // Inner flame bulb
      var flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 10),
        mat(0xfff6d0, 0.25, 0, 0xffaa44, 3.6)
      );
      flame.scale.set(0.85, 1.2, 0.85);
      flame.position.y = headY;
      g.add(flame);
      g.userData.flame = flame;

      // Pagoda / pyramid roof
      var roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.22, 4), iron);
      roof.position.y = headY + cageH * 0.5 + 0.14;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      var finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), brass);
      finial.position.y = headY + cageH * 0.5 + 0.28;
      g.add(finial);
      var spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), brass);
      spike.position.y = headY + cageH * 0.5 + 0.36;
      g.add(spike);

      // Arm brace under head
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), iron);
      arm.position.y = headY - cageH * 0.5 - 0.06;
      g.add(arm);

      var lt = new THREE.PointLight(0xffd090, 4.6, 18);
      lt.position.set(0, headY, 0);
      g.add(lt);
      // Extra warm fill so the lawn around the pole lights up
      var fill = new THREE.PointLight(0xffb060, 2.15, 14);
      fill.position.set(0, 0.9, 0);
      g.add(fill);
      g.userData.fillLight = fill;

      // Soft halo
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd090, transparent: true, opacity: 0.34, depthWrite: false })
      );
      halo.position.y = headY;
      halo.material.userData.keep = true;
      g.add(halo);

      if(typeof sitShadow === 'function') g.add(sitShadow(0.4));
      g.position.set(x, 0, z);
      return { group: g, light: lt };
    };

    buildBridge = function(x, z, a){
      // Path planks + logs as a garden footbridge
      var g = new THREE.Group();
      var path = cloneKey('path', 0.35);
      if(path){ path.scale.x *= 1.6; path.scale.z *= 0.55; groundAlign(path); g.add(path); }
      var log = cloneKey('log_moss', 0.45);
      if(log){ log.position.set(0, 0.08, 0.55); groundAlign(log); g.add(log); }
      var log2 = cloneKey('log', 0.45);
      if(log2){ log2.position.set(0, 0.08, -0.55); groundAlign(log2); g.add(log2); }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.1));
      g.position.set(x, 0, z); g.rotation.y = a||0;
      return g;
    };

    buildPond = function(x, z){
      var g = new THREE.Group();
      var w = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), window._waterMat);
      w.rotation.x = -Math.PI/2;
      w.position.y = .04;
      g.add(w);
      // soft stone rim
      for(var i=0;i<7;i++){
        var rk = cloneKey(['rock_1','rock_2','rock_m1','rock_m2'][i%4], 0.28+((i*17)%10)*.02);
        if(!rk) continue;
        var ang = i/7*Math.PI*2;
        rk.position.set(Math.cos(ang)*1.55, 0, Math.sin(ang)*1.2);
        groundAlign(rk);
        g.add(rk);
      }
      for(var j=0;j<4;j++){
        var pad = cloneKey('lilypad', 0.35+j*.05);
        if(pad){
          pad.position.set(Math.cos(j*1.7)*.7, .05, Math.sin(j*1.7)*.55);
          g.add(pad);
        }
        if(typeof window.mkPerfectBloom === 'function'){
          var fl = window.mkPerfectBloom(['lotus','daisy','cherry'][j%3], [0xff69b4,0xffffff,0xffb7c5][j%3], 0.85);
          fl.position.set(Math.cos(j)*1.75, 0, Math.sin(j)*1.35);
          g.add(fl);
        } else {
          var fl2 = cloneKey(['flower_1','flower_2','flower_3'][j%3], 0.4);
          if(fl2){
            fl2.position.set(Math.cos(j)*1.75, 0, Math.sin(j)*1.35);
            groundAlign(fl2); g.add(fl2);
          }
        }
      }
      var lt = new THREE.PointLight(0x88e0d0, .6, 5.5);
      lt.position.set(0, .55, 0);
      g.add(lt);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.6));
      g.position.set(x, 0, z);
      return { group:g, light:lt };
    };

    buildWell = function(x, z){
      var g = new THREE.Group();
      var well = cloneKey('well', 1.9);
      if(well) g.add(well);
      if(typeof window.mkPerfectBloom === 'function'){
        var fl = window.mkPerfectBloom('daisy', 0xffd056, 0.9);
        fl.position.set(0.7,0,0.55); g.add(fl);
      } else {
        var fl2 = cloneKey('flower_2', 0.45);
        if(fl2){ fl2.position.set(0.7,0,0.55); groundAlign(fl2); g.add(fl2); }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.0));
      g.position.set(x, 0, z);
      return g;
    };

    buildWild = function(x, z){
      // Polished procedural blooms — Quaternius crop flowers read as toys up close.
      if(typeof window.buildPerfectWild === 'function'){
        return window.buildPerfectWild(x, z);
      }
      var g = new THREE.Group();
      var rnd = _rnd(x+5, z+3);
      g.userData.heads = [];
      var cluster = cloneKey('flowers', 0.55+rnd()*0.35);
      if(cluster){ groundAlign(cluster); g.add(cluster); g.userData.heads.push(cluster); }
      for(var i=0;i<4;i++){
        var key = ['flower_1','flower_2','flower_3','flower_4','wheat','plant_4'][Math.floor(rnd()*6)];
        var fl = cloneKey(key, 0.4+rnd()*0.35);
        if(!fl) continue;
        fl.position.set((rnd()-.5)*.85, 0, (rnd()-.5)*.85);
        groundAlign(fl);
        g.add(fl);
        g.userData.heads.push(fl);
        fl.userData.by = fl.position.y;
      }
      var grass = cloneKey(rnd()>.5?'grass_2':'grass_s', 0.4+rnd()*0.25);
      if(grass){ groundAlign(grass); g.add(grass); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.5));
      g.position.set(x, 0, z);
      return g;
    };

    buildHouse = function(x, z, angle){
      var rnd = _rnd(x+11, z+7);
      var key = ['house_1','house_2','house_3','house_4','inn'][Math.floor(rnd()*5)];
      var g = new THREE.Group();
      var house = cloneKey(key, 3.4 + rnd()*0.5);
      if(house) g.add(house);
      for(var i=0;i<3;i++){
        if(typeof window.mkPerfectBloom === 'function'){
          var fl = window.mkPerfectBloom(['rose','tulip','daisy'][i%3], [0xff3366,0xff69b4,0xffd056][i%3], 0.85+i*.08);
          fl.position.set((i-1)*0.7, 0, 1.55);
          g.add(fl);
        } else {
          var fl2 = cloneKey(['flower_1','flower_3','bush_1'][i%3], 0.45+i*.08);
          if(fl2){
            fl2.position.set((i-1)*0.7, 0, 1.55);
            groundAlign(fl2); g.add(fl2);
          }
        }
      }
      var crate = cloneKey('crate', 0.45);
      if(crate){ crate.position.set(1.1,0,1.1); groundAlign(crate); g.add(crate); }
      var lt = new THREE.PointLight(0xffe0b0, 1.15, 6);
      lt.position.set(0, 1.6, 0.4);
      g.add(lt);
      if(typeof sitShadow === 'function') g.add(sitShadow(2.2));
      g.position.set(x, 0, z);
      g.rotation.y = angle||0;
      return { group:g, light:lt };
    };

    buildArch = function(x, z, a){
      var g = new THREE.Group();
      var h1 = cloneKey('bush_1', 1.35);
      var h2 = cloneKey('bush_2', 1.35);
      if(h1){ h1.position.set(-1.05,0,0); groundAlign(h1); g.add(h1); }
      if(h2){ h2.position.set(1.05,0,0); groundAlign(h2); g.add(h2); }
      var fence = cloneKey('fence', 0.95);
      if(fence){ fence.position.set(0,0,0.15); groundAlign(fence); g.add(fence); }
      for(var i=0;i<5;i++){
        if(typeof window.mkPerfectBloom === 'function'){
          var fl = window.mkPerfectBloom(['cherry','daisy','rose','tulip','peony'][i%5], [0xffb7c5,0xffffff,0xcc0022,0xff3366,0xff69b4][i%5], 0.8);
          fl.position.set((i-2)*.38, 0, 0.45);
          g.add(fl);
        } else {
          var fl2 = cloneKey(['flower_1','flower_2','flower_3','flower_4'][i%4], 0.42);
          if(fl2){
            fl2.position.set((i-2)*.38, 0, 0.45);
            groundAlign(fl2); g.add(fl2);
          }
        }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.2));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };

    buildPergola = function(x, z, a){
      var g = new THREE.Group();
      var gazebo = cloneKey('gazebo', 2.8);
      if(gazebo) g.add(gazebo);
      var bench = cloneKey('bench_1', 0.7);
      if(bench){ bench.position.set(0,0,0.2); groundAlign(bench); g.add(bench); }
      var vine = cloneKey('plant_1', 0.9);
      if(vine){ vine.position.set(0.9,0,0.6); groundAlign(vine); g.add(vine); }
      if(typeof sitShadow === 'function') g.add(sitShadow(1.5));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };

    buildScarecrow = function(x, z){
      var g = new THREE.Group();
      var hay = cloneKey('hay', 0.85);
      if(hay) g.add(hay);
      var barrel = cloneKey('barrel', 0.7);
      if(barrel){ barrel.position.set(0,0.55,0); groundAlign(barrel); barrel.position.y += 0.35; g.add(barrel); }
      var plant = cloneKey('wheat', 0.9);
      if(plant){ plant.position.set(0.15,0.9,0); g.add(plant); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.55));
      g.position.set(x,0,z);
      return g;
    };

    buildWindmill = function(x, z){
      var g = new THREE.Group();
      var mill = cloneKey('mill', 4.6);
      if(mill) g.add(mill);
      var blades = new THREE.Group();
      blades.position.set(0, 2.6, 0);
      g.add(blades);
      if(typeof sitShadow === 'function') g.add(sitShadow(1.4));
      g.position.set(x,0,z);
      return { group:g, blades:blades };
    };

    buildPot = function(x, z){
      var g = new THREE.Group();
      var pot = cloneKey(pick('barrel','crate') || 'barrel', 0.42);
      if(pot) g.add(pot);
      if(typeof window.mkPerfectBloom === 'function'){
        var fl = window.mkPerfectBloom(['rose','tulip','daisy','cherry'][Math.floor(Math.random()*4)], [0xcc0022,0xff3366,0xffd056,0xffb7c5][Math.floor(Math.random()*4)], 0.95);
        fl.position.y = 0.28; g.add(fl);
      } else {
        var fl2 = cloneKey(['flower_1','flower_2','flower_3','flower_4','lettuce','tomato'][Math.floor(Math.random()*6)], 0.55);
        if(fl2){ fl2.position.y = 0.35; g.add(fl2); }
      }
      if(typeof sitShadow === 'function') g.add(sitShadow(.3));
      g.position.set(x,0,z);
      return g;
    };

    buildTable = function(x, z, a){
      var g = new THREE.Group();
      var stand = cloneKey('stand', 1.35);
      if(stand) g.add(stand);
      else {
        var b = cloneKey('bench_1', 0.7);
        if(b){ b.position.set(0,0,0.5); groundAlign(b); g.add(b); }
        var b2 = cloneKey('bench_2', 0.7);
        if(b2){ b2.position.set(0,0,-0.5); b2.rotation.y = Math.PI; groundAlign(b2); g.add(b2); }
      }
      var pumpkin = cloneKey('pumpkin', 0.35);
      if(pumpkin){ pumpkin.position.set(0.35,0.55,0); g.add(pumpkin); }
      if(typeof sitShadow === 'function') g.add(sitShadow(.85));
      g.position.set(x,0,z); g.rotation.y = a||0;
      return g;
    };
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
    paths = paths.filter(function(p,i){ return paths.indexOf(p)===i; });
    // Skip crop/nature flower GLBs if any leftover keys still point at them.
    paths = paths.filter(function(p){
      return !/\/Flower[_s]|\bFlowers\.glb$/i.test(p);
    });
    var left = paths.length;
    var failed = [];
    var bar = document.getElementById('modelLoad');
    if(bar) bar.classList.add('show');
    function finishPack(){
      ready = true;
      installBuilders();
      // Defer heavy clone/Box3 work so the first frames stay responsive.
      setTimeout(function(){
        if(typeof window.redressGardenModels === 'function'){
          try{ window.redressGardenModels(); }catch(e){ console.warn('redress', e); }
        }
        if(typeof window.reseedMeadowPatches === 'function'){
          try{ window.reseedMeadowPatches(); }catch(e){}
        }
        if(typeof window.ensureFarmers === 'function'){
          try{ window.ensureFarmers(); }catch(e){ console.warn('farmers', e); }
        }
      }, 0);
      if(bar) bar.classList.remove('show');
      waiting.splice(0).forEach(function(fn){ try{fn();}catch(e){} });
      if(typeof showToast === 'function') showToast('🌿 Bahçe modelleri hazır');
    }
    function loadOne(path, isRetry){
      var url = BASE + path + (isRetry ? ('?v=4&r=' + Date.now()) : '?v=4');
      loader.load(url, function(gltf){
        templates[path] = gltf.scene;
        fixMats(gltf.scene);
        left--;
        if(bar) bar.querySelector('span').textContent = 'Modeller ' + Math.round((1-left/paths.length)*100) + '%';
        if(left<=0) finishPack();
      }, undefined, function(err){
        console.warn('Model load fail', path, err);
        if(!isRetry){
          // One delayed retry — Android WebView / flaky asset reads.
          setTimeout(function(){ loadOne(path, true); }, 400);
          return;
        }
        failed.push(path);
        left--;
        if(left<=0) finishPack();
      });
    }
    paths.forEach(function(path){ loadOne(path, false); });
  }

  window.modelPackReady = function(){ return ready; };
  window.whenModelsReady = whenReady;
  window.spawnModel = function(key, height){ return cloneKey(key, height); };
  window.hasModel = function(key){
    var path = CATALOG[key];
    return !!(path && templates[path]);
  };
  window.hasPackPropModel = function(type){
    var def = typeof PACK_PROPS !== 'undefined' ? PACK_PROPS[type] : null;
    if(!def || !def.keys) return false;
    for(var i=0;i<def.keys.length;i++){
      if(window.hasModel(def.keys[i])) return true;
    }
    return false;
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(startLoad, 0); });
  else setTimeout(startLoad, 0);
})();

// Premium procedural lawn: albedo + normal + roughness for modern ground look.
(function(){
  function hash2(ix, iy){
    var v = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  function vnoise(x, y, period){
    var x0 = Math.floor(x) % period; if(x0 < 0) x0 += period;
    var y0 = Math.floor(y) % period; if(y0 < 0) y0 += period;
    var fx = x - Math.floor(x), fy = y - Math.floor(y);
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    var a = hash2(x0, y0), b = hash2(x1, y0), c = hash2(x0, y1), d = hash2(x1, y1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, oct, period){
    var a = 0, amp = 0.5, f = 1, tot = 0;
    for(var i = 0; i < oct; i++){
      a += vnoise(x * f, y * f, Math.max(2, Math.floor(period * f))) * amp;
      tot += amp; amp *= 0.5; f *= 2;
    }
    return a / tot;
  }

  function buildMaps(opts){
    opts = opts || {};
    var size = opts.size || (isMobile ? 512 : 768);
    var tint = opts.tint != null ? opts.tint : 0x6db85a;
    var tc = new THREE.Color(tint);
    var warm = opts.warm != null ? opts.warm : 0xb8a050;
    var cool = opts.cool != null ? opts.cool : 0x3a8a62;
    var dirt = opts.dirt != null ? opts.dirt : 0x8a6a40;
    var wc = new THREE.Color(warm), cc = new THREE.Color(cool), dc = new THREE.Color(dirt);

    var alb = document.createElement('canvas'); alb.width = alb.height = size;
    var nrm = document.createElement('canvas'); nrm.width = nrm.height = size;
    var rgh = document.createElement('canvas'); rgh.width = rgh.height = size;
    var ag = alb.getContext('2d'), ng = nrm.getContext('2d'), rg = rgh.getContext('2d');
    var aImg = ag.createImageData(size, size);
    var nImg = ng.createImageData(size, size);
    var rImg = rg.createImageData(size, size);
    var ad = aImg.data, nd = nImg.data, rd = rImg.data;
    var height = new Float32Array(size * size);

    for(var y = 0; y < size; y++){
      for(var x = 0; x < size; x++){
        var u = x / size, v = y / size;
        var macro = fbm(u * 3.2, v * 3.2, 4, 8);
        var mid = fbm(u * 11, v * 11, 3, 16);
        var fine = fbm(u * 42, v * 42, 2, 32);
        var blade = vnoise(u * 90 + mid * 2, v * 14, 64);
        var h = macro * 0.45 + mid * 0.35 + fine * 0.2 + blade * 0.08;
        height[y * size + x] = h;

        // Macro biome mix: cool shadow grass / warm sun patches / thin dirt scars
        var coolW = Math.max(0, 1 - Math.abs(macro - 0.35) * 2.4);
        var warmW = Math.max(0, (macro - 0.55) * 2.2);
        var dirtW = Math.max(0, (fine < 0.22 ? (0.22 - fine) * 3.5 : 0) * (mid < 0.4 ? 1 : 0.35));
        var col = tc.clone();
        col.lerp(cc, coolW * 0.35);
        col.lerp(wc, warmW * 0.28);
        col.lerp(dc, Math.min(0.55, dirtW));

        // Fiber streaks — darker between blades
        var fiber = 0.88 + blade * 0.22 + fine * 0.08;
        // Speckle clover / highlight tips
        var speck = hash2(x * 3, y * 7);
        if(speck > 0.985){ col.lerp(new THREE.Color(0xc8ff90), 0.55); fiber += 0.08; }
        else if(speck < 0.012){ col.lerp(dc, 0.4); fiber -= 0.06; }

        var i = (y * size + x) * 4;
        ad[i] = Math.min(255, Math.max(0, col.r * 255 * fiber));
        ad[i + 1] = Math.min(255, Math.max(0, col.g * 255 * fiber));
        ad[i + 2] = Math.min(255, Math.max(0, col.b * 255 * fiber));
        ad[i + 3] = 255;

        var rough = 0.72 + mid * 0.18 - blade * 0.08 + dirtW * 0.12;
        var rv = Math.min(255, Math.max(0, rough * 255));
        rd[i] = rv; rd[i + 1] = rv; rd[i + 2] = rv; rd[i + 3] = 255;
      }
    }

    // Normals from height field (seamless wrap)
    var strength = opts.normalStrength != null ? opts.normalStrength : 2.4;
    for(var y2 = 0; y2 < size; y2++){
      for(var x2 = 0; x2 < size; x2++){
        var xl = height[y2 * size + ((x2 - 1 + size) % size)];
        var xr = height[y2 * size + ((x2 + 1) % size)];
        var yu = height[((y2 - 1 + size) % size) * size + x2];
        var yd = height[((y2 + 1) % size) * size + x2];
        var dx = (xr - xl) * strength;
        var dy = (yd - yu) * strength;
        // tangent-space normal
        var nx = -dx, ny = -dy, nz = 1;
        var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;
        var j = (y2 * size + x2) * 4;
        nd[j] = (nx * 0.5 + 0.5) * 255;
        nd[j + 1] = (ny * 0.5 + 0.5) * 255;
        nd[j + 2] = (nz * 0.5 + 0.5) * 255;
        nd[j + 3] = 255;
      }
    }

    // Optional drawn blade strokes for crisp close-up read
    ag.putImageData(aImg, 0, 0);
    ag.globalCompositeOperation = 'multiply';
    for(var k = 0; k < (isMobile ? 420 : 900); k++){
      var bx = Math.random() * size, by = Math.random() * size;
      var len2 = 3 + Math.random() * 7;
      var ang = -0.35 + Math.random() * 0.7;
      ag.strokeStyle = 'rgba(20,50,18,' + (0.025 + Math.random() * 0.04) + ')';
      ag.lineWidth = 0.6 + Math.random() * 0.7;
      ag.beginPath();
      ag.moveTo(bx, by);
      ag.lineTo(bx + Math.sin(ang) * len2, by - Math.cos(ang) * len2);
      ag.stroke();
    }
    ag.globalCompositeOperation = 'source-over';
    // Soft light flecks
    for(var k2 = 0; k2 < (isMobile ? 120 : 260); k2++){
      ag.fillStyle = 'rgba(220,255,160,' + (0.04 + Math.random() * 0.08) + ')';
      ag.beginPath();
      ag.ellipse(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 0.6 + Math.random(), Math.random() * 3, 0, 6.28);
      ag.fill();
    }

    ng.putImageData(nImg, 0, 0);
    rg.putImageData(rImg, 0, 0);

    function toTex(canvas, isColor){
      var t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if(isColor && THREE.sRGBEncoding != null) t.encoding = THREE.sRGBEncoding;
      t.needsUpdate = true;
      return t;
    }
    return {
      map: toTex(alb, true),
      normalMap: toTex(nrm, false),
      roughnessMap: toTex(rgh, false)
    };
  }

  var _cache = {};
  function mapsFor(key, opts){
    if(_cache[key]) return _cache[key];
    _cache[key] = buildMaps(opts);
    return _cache[key];
  }

  window.createLawnMaterial = function(opts){
    opts = opts || {};
    var key = (opts.key || 'default') + ':' + (opts.tint || 0) + ':' + (opts.size || 0);
    var maps = mapsFor(key, opts);
    var repeat = opts.repeat != null ? opts.repeat : 12;
    var mat = new THREE.MeshStandardMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      color: opts.color != null ? opts.color : 0xffffff,
      roughness: opts.roughness != null ? opts.roughness : 0.92,
      metalness: 0,
      normalScale: new THREE.Vector2(
        opts.normalScale != null ? opts.normalScale : 0.85,
        opts.normalScale != null ? opts.normalScale : 0.85
      )
    });
    if(mat.map){ mat.map.repeat.set(repeat, repeat); }
    if(mat.normalMap){ mat.normalMap.repeat.set(repeat, repeat); }
    if(mat.roughnessMap){ mat.roughnessMap.repeat.set(repeat, repeat); }
    mat.userData.keep = true;
    mat.userData.lawn = true;
    return mat;
  };

  // Soft dome / micro-relief for circular biome pads
  window.sculptGroundCircle = function(mesh, radius, amp){
    if(!mesh || !mesh.geometry) return;
    amp = amp == null ? 0.35 : amp;
    var pos = mesh.geometry.attributes.position;
    for(var i = 0; i < pos.count; i++){
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      // CircleGeometry lies in XY before rotation; after rot.x=-PI/2, Y becomes height.
      // Before rotation we bump Z (will become Y after rot).
      var r = Math.sqrt(x * x + y * y) / (radius || 1);
      var fall = Math.max(0, 1 - r * r);
      var n = fbm((x / radius) * 2.2 + 3, (y / radius) * 2.2 + 1, 3, 8);
      pos.setZ(i, z + fall * amp * (0.55 + n * 0.9));
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  };

  window.createSoilMaterial = function(opts){
    opts = opts || {};
    var mat = window.createLawnMaterial({
      key: opts.key || 'soil',
      tint: opts.tint != null ? opts.tint : 0x6a4a2e,
      warm: 0xa07840,
      cool: 0x4a3424,
      dirt: 0x3a2818,
      repeat: opts.repeat != null ? opts.repeat : 3.5,
      normalScale: 1.2,
      size: isMobile ? 384 : 512
    });
    mat.roughness = 0.98;
    return mat;
  };

  window.groundArtReady = true;
})();

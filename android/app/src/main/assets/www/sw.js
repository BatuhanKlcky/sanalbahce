var CACHE = 'sanalbahce-shell-18';
var LOCAL = [
  './',
  './index.html',
  './gizlilik.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './js/scene.js',
  './js/save.js',
  './js/harvest.js',
  './js/shop.js',
  './js/flower.js',
  './js/flowerArt.js',
  './js/deco.js',
  './js/loop.js'
];
var CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://unpkg.com/@supabase/supabase-js@2.42.5/dist/umd/supabase.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(LOCAL).then(function(){
        return Promise.all(CDN.map(function(url){
          return fetch(url).then(function(res){
            if(res && res.ok) return cache.put(url, res);
          }).catch(function(){});
        }));
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){
        if(key !== CACHE) return caches.delete(key);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(event.request).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});

// Kayit: ziyaret logu, XP, istatistik, bildirim, localStorage anahtarlari.
// ── SUPABASE ─────────────────────────────────────────────────────────────────
var sbC=null;try{sbC=supabase.createClient('https://lvoeziofefbczugymzft.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2V6aW9mZWZiY3p1Z3ltemZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODY1MjcsImV4cCI6MjA2MTE2MjUyN30.u9HyvUCxkchSmtwDzwAm2iy6yQiA7rScCQjKXCpq7XI');}catch(e){}
var _ip='unknown',_ls=false,_vs=Date.now();
fetch('https://api.ipify.org?format=json').then(function(r){return r.json();}).then(function(d){_ip=d.ip;}).catch(function(){});
setTimeout(function(){if(sbC)sbC.from('visitor_logs').insert([{page_url:location.href,ip_address:_ip,user_agent:navigator.userAgent,screen_resolution:screen.width+'x'+screen.height,time_spent:0}]).then(function(){}).catch(function(){});},2000);
function _sl(){if(_ls||!sbC)return;_ls=true;sbC.from('visitor_logs').insert([{page_url:location.href,ip_address:_ip,user_agent:navigator.userAgent,screen_resolution:screen.width+'x'+screen.height,time_spent:Math.floor((Date.now()-_vs)/1000)}]).then(function(){}).catch(function(){});}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')_sl();});
window.addEventListener('pagehide',_sl);

// ── XP / TASKS ───────────────────────────────────────────────────────────────
var XPL=[0,100,250,450,700,1000,1400,1900,2500,3200,4000];
var tasks={w:{done:false,n:0,need:5},p:{done:false,n:0,need:3},k:{done:false,n:0,need:1},b:{done:false,n:0,need:2}};
var _taskLabels={w:'bitki sula',p:'yeni bitki ek',k:'Zararlıları temizle',b:'dost böcek ekle'};
var _taskFull={w:'5 bitki sula',p:'3 yeni bitki ek',k:'Zararlıları temizle',b:'2 dost böcek ekle'};
var xp=0,level=1;
function addXP(a){xp+=a;var mx=XPL[Math.min(level,10)];while(level<10&&xp>=mx){xp-=mx;level++;mx=XPL[Math.min(level,10)];sndLvl();showToast('🎉 Seviye '+level+'!');}updXP();saveProg();}
function updXP(){var mx=XPL[Math.min(level,10)];document.getElementById('lvN').textContent=level;document.getElementById('xpC').textContent=Math.floor(xp);document.getElementById('xpM').textContent=mx;document.getElementById('xpFill').style.width=Math.min(100,xp/mx*100)+'%';document.getElementById('lvBadge').textContent='⭐ Lv.'+level;}
function chkTask(k,r){if(!tasks[k]||tasks[k].done)return;tasks[k].n++;var lb=document.getElementById('lb-'+k);if(lb)lb.textContent=tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k];if(tasks[k].n>=tasks[k].need){tasks[k].done=true;var ck=document.getElementById('ck-'+k);if(ck){ck.classList.add('done');ck.textContent='✓';}if(lb)lb.classList.add('done');sndTask();addXP(r);showToast('✅ Görev! +'+r+' XP');}saveTasks();}
function rstTasks(){var td=new Date().toDateString();if(localStorage.getItem('gdn_td')!==td){['w','p','k','b'].forEach(function(k){tasks[k].done=false;tasks[k].n=0;});localStorage.setItem('gdn_td',td);saveTasks();updTUI();}}
function updTUI(){['w','p','k','b'].forEach(function(k){var ck=document.getElementById('ck-'+k),lb=document.getElementById('lb-'+k);if(tasks[k].done){if(ck){ck.classList.add('done');ck.textContent='✓';}if(lb){lb.classList.add('done');lb.textContent=tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k];}}else{if(ck){ck.classList.remove('done');ck.textContent='';}if(lb){lb.classList.remove('done');lb.textContent=tasks[k].n>0?(tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k]):_taskFull[k];}}});}
function saveProg(){localStorage.setItem('gdn_xp',JSON.stringify({xp:xp,level:level}));}
function saveTasks(){var snap={};['w','p','k','b'].forEach(function(k){snap[k]={done:!!tasks[k].done,n:tasks[k].n||0};});localStorage.setItem('gdn_tasks',JSON.stringify({date:new Date().toDateString(),tasks:snap}));}
function loadTasks(){try{var d=JSON.parse(localStorage.getItem('gdn_tasks')||'null');if(d&&d.date===new Date().toDateString()&&d.tasks){['w','p','k','b'].forEach(function(k){if(!d.tasks[k])return;tasks[k].done=!!d.tasks[k].done;tasks[k].n=d.tasks[k].n||0;});}}catch(e){}updTUI();}


// ── İSTATİSTİKLER ─────────────────────────────────────────────────────────
var stats = {water:0, plant:0, kill:0, bloom:0, time:0, streak:0, lastDay:'',
             tom:0, str:0, cuc:0, coin:0};
var _sessionStart = Date.now();
var _timeBase = 0;
var _progressReady = false;

function loadStats(){
  try{var d=JSON.parse(localStorage.getItem('gdn_stats')||'null');if(d)stats=Object.assign(stats,d);}catch(e){}
  _timeBase = stats.time||0;
  // Streak hesapla
  var today=new Date().toDateString();
  if(stats.lastDay===''){stats.lastDay=today;stats.streak=1;}
  else{
    var last=new Date(stats.lastDay),now2=new Date(today);
    var diff=Math.round((now2-last)/(1000*60*60*24));
    if(diff===1){stats.streak++;stats.lastDay=today;}
    else if(diff>1){stats.streak=1;stats.lastDay=today;}
  }
  saveStats();updStats();
  _progressReady = true;
}
function saveStats(){
  stats.time=_timeBase+Math.floor((Date.now()-_sessionStart)/60000);
  localStorage.setItem('gdn_stats',JSON.stringify(stats));
}
function flushProgress(){if(!_progressReady)return;saveStats();saveProg();saveTasks();}
function updStats(){
  var e=function(id){return document.getElementById(id);};
  if(e('st-water'))e('st-water').textContent=stats.water;
  if(e('st-plant'))e('st-plant').textContent=stats.plant;
  if(e('st-kill'))e('st-kill').textContent=stats.kill;
  if(e('st-bloom'))e('st-bloom').textContent=stats.bloom;
  if(e('st-time'))e('st-time').textContent=(stats.time||0)+' dk';
  if(e('st-streak'))e('st-streak').textContent=stats.streak+' gün 🔥';
  if(e('st-tom'))e('st-tom').textContent=stats.tom;
  if(e('st-str'))e('st-str').textContent=stats.str;
  if(e('st-cuc'))e('st-cuc').textContent=stats.cuc;
  if(e('st-coin'))e('st-coin').textContent=stats.coin;
  var cb=document.getElementById('coinBadge');
  if(cb)cb.textContent='💰 '+stats.coin;
}
function addCoin(n){stats.coin+=n;updStats();saveStats();showToast('+'+n+' 💰 coin!');}
// ── BİLDİRİM SİSTEMİ ─────────────────────────────────────────────────────
var notifPermission = false;

function requestNotifPermission(){
  if(!('Notification' in window)) return;
  Notification.requestPermission().then(function(p){
    notifPermission = p === 'granted';
    if(notifPermission) showToast('🔔 Bildirimler açık!');
  });
}

function sendNotif(title, body, icon){
  if(!notifPermission || document.visibilityState === 'visible') return;
  try {
    new Notification(title, {
      body: body,
      icon: icon || '🌿',
      badge: '🌱',
      tag: 'sanalbahce',
      renotify: true
    });
  } catch(e) {}
}

// Bildirim zamanlayıcıları
var _lastNotifCheck = Date.now();
var _notifCooldowns = {};

function checkNotifications(){
  var now = Date.now();
  if(now - _lastNotifCheck < 60000) return; // Her dakika kontrol
  _lastNotifCheck = now;

  // 1. Sulama zamanı - nem %30 altına düştüyse
  if(flowers.length > 0 && !_notifCooldowns.water){
    var tot=0; flowers.forEach(function(f){tot+=f.w;});
    var avg = tot/flowers.length;
    if(avg < 0.3){
      sendNotif('💧 Sulama Zamanı!', flowers.length+' çiçeğin susadı, hemen sula!', '💧');
      _notifCooldowns.water = true;
      setTimeout(function(){ _notifCooldowns.water = false; }, 3600000); // 1 saat cooldown
    }
  } else if(flowers.length > 0){
    var tot2=0; flowers.forEach(function(f){tot2+=f.w;});
    if(tot2/flowers.length >= 0.3) _notifCooldowns.water = false;
  }

  // 2. Hasat hazır
  var readyHarvest = harvestItems.filter(function(h){ return h.stage >= 2; });
  if(readyHarvest.length > 0 && !_notifCooldowns.harvest){
    sendNotif('🍅 Hasat Zamanı!', readyHarvest.length+' ürün hasat için bekliyor!', '🌾');
    _notifCooldowns.harvest = true;
    setTimeout(function(){ _notifCooldowns.harvest = false; }, 1800000); // 30 dk
  }

  // 3. Zararlı böcek varsa
  if(badBugs.length >= 3 && !_notifCooldowns.bugs){
    sendNotif('🐛 Zararlı Uyarısı!', badBugs.length+' zararlı böcek çiçeklerini mahvediyor!', '🐛');
    _notifCooldowns.bugs = true;
    setTimeout(function(){ _notifCooldowns.bugs = false; }, 1800000);
  }

  // 4. Günlük görev hatırlatıcı - görevler tamamlanmamışsa akşam 20:00
  var hour = new Date().getHours();
  if(hour >= 20 && !_notifCooldowns.daily){
    var doneTasks = Object.values(tasks).filter(function(t){ return t.done; }).length;
    if(doneTasks < 4){
      sendNotif('📋 Günlük Görevler', 'Bugün '+(4-doneTasks)+' görevin hâlâ tamamlanmadı!', '⭐');
      _notifCooldowns.daily = true;
      setTimeout(function(){ _notifCooldowns.daily = false; }, 86400000); // 24 saat
    }
  }
}

// Bildirim izni iste - ilk kullanımda
document.addEventListener('click', function(){
  if(!notifPermission) requestNotifPermission();
}, {once: true});



// ── WİDGET & PAYLAŞIM SİSTEMİ ────────────────────────────────────────────
// Widget için bahçe verilerini özel bir key'e yaz (native widget okur)
function updateWidgetData(){
  var tot=0; flowers.forEach(function(f){tot+=f.w;});
  var avgWater = flowers.length ? Math.round(tot/flowers.length*100) : 0;
  var readyHarvest = harvestItems.filter(function(h){return h.stage>=2;}).length;
  var widgetData = {
    flowers: flowers.length,
    water: avgWater,
    bugs: badBugs.length,
    harvest: readyHarvest,
    level: level,
    coin: stats.coin,
    streak: stats.streak,
    lastUpdate: Date.now()
  };
  localStorage.setItem('gdn_widget', JSON.stringify(widgetData));
}

// Widget verisi her 5 dakikada güncelle
setInterval(updateWidgetData, 300000);

// ── BAHÇE PAYLAŞIM ────────────────────────────────────────────────────────
window.shareBahce = function(){
  var tot=0; flowers.forEach(function(f){tot+=f.w;});
  var avgW = flowers.length ? Math.round(tot/flowers.length*100) : 0;
  var text = '🌿 Sanal Bahçem\n'
    + '🌸 '+flowers.length+' çiçek | 💧 %'+avgW+' nem\n'
    + '⭐ Seviye '+level+' | 💰 '+stats.coin+' coin\n'
    + '🔥 '+stats.streak+' günlük streak\n'
    + 'Sanal Bahçe uygulamasında!';
  if(navigator.share){
    navigator.share({title:'Sanal Bahçem', text:text}).catch(function(){});
  } else {
    navigator.clipboard && navigator.clipboard.writeText(text).then(function(){
      showToast('📋 Kopyalandı!');
    });
  }
};


function loadProg(){
  // XP migration
  var oldXPKeys=['garden_xp','gdn_xp_v1'];
  oldXPKeys.forEach(function(k){
    if(!localStorage.getItem('gdn_xp')&&localStorage.getItem(k)){
      localStorage.setItem('gdn_xp', localStorage.getItem(k));
    }
  });
  try{var d=JSON.parse(localStorage.getItem('gdn_xp')||'null');if(d){xp=d.xp||0;level=d.level||1;}}catch(e){}updXP();rstTasks();loadTasks();}
// ── GAME CONSTANTS ───────────────────────────────────────────────────────────
var SAVE_KEY='gdn_save',DRY=.00001389,GROW=.000012,BDRAIN=.00018,SINT=15000;
var flowers=[],bugs=[],badBugs=[],badM=[],decos=[];
var badID=0,lastSave=0,isDirty=false,isLoading=false;
function markDirty(){isDirty=true;}
function save(force){var now=Date.now();if(!force&&(now-lastSave)<SINT&&!isDirty)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({lastUpdate:now,
      plants:flowers.map(function(f){return{x:f.mesh.position.x,z:f.mesh.position.z,h:f.h,b:f.b,w:f.w,c:f.c,t:f.t,isStunted:f.isStunted};}),
      badBugs:badBugs.map(function(b){return{ti:b.ti};}),
      bugCount:bugs.length,
      decos:decos.map(function(d){return{type:d.type,x:d.group.position.x,z:d.group.position.z,ry:d.group.rotation.y};}),
      weather:curWeather,
      harvest:harvestItems.map(function(h){return{type:h.type,stage:h.stage,x:h.x,z:h.z,growTimer:h.growTimer||0};}),
      petCount:pets.map(function(p){return{type:p.type,x:p.mesh.position.x,z:p.mesh.position.z};})
    }));lastSave=now;isDirty=false;showSave();updateWidgetData();}catch(e){}}
window.addEventListener('pagehide',function(){flushProgress();save(true);},{capture:true});
window.addEventListener('beforeunload',function(){flushProgress();save(true);});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'){flushProgress();save(true);}});
// ── LOAD ─────────────────────────────────────────────────────────────────────
function load(){
  // Eski versiyonlardan migration - hiçbir şey kaybolmasın
  var oldKeys=['gdn_v14','gdn_v13','gdn_v12','gdn_organic_v12','garden_organic_v12'];
  oldKeys.forEach(function(k){
    if(!localStorage.getItem(SAVE_KEY)&&localStorage.getItem(k)){
      localStorage.setItem(SAVE_KEY, localStorage.getItem(k));
      localStorage.removeItem(k);
      console.log('Migrated from', k);
    }
  });
  var raw=localStorage.getItem(SAVE_KEY);if(!raw)return;var data;try{data=JSON.parse(raw);}catch(e){localStorage.removeItem(SAVE_KEY);return;}isLoading=true;var elapsed=Math.max(0,(Date.now()-data.lastUpdate)/1000);var sB=data.badBugs||[];var offSp=Math.floor(elapsed*.000001);for(var i=0;i<offSp;i++){if(data.plants.length>0)sB.push({ti:Math.floor(Math.random()*data.plants.length)});}data.plants.forEach(function(p,idx){var bH=sB.filter(function(b){return b.ti===idx;});var drain=bH.length*elapsed*BDRAIN;var nW=Math.max(0,p.w-elapsed*DRY-drain);var nH=p.h;var stunted=p.isStunted||nW<.25;if(!stunted&&p.w>.35)nH=Math.min(1.3,p.h+elapsed*GROW);mkFlower(p.x,p.z,Object.assign({},p,{w:nW,h:nH,isStunted:stunted}));});sB.forEach(function(b){if(b.ti<flowers.length)mkBadBug(b.ti);});var bc=data.bugCount||0;for(var i=0;i<bc;i++)window.addBug();// Restore decos
    var savedDecos=data.decos||[];
    savedDecos.forEach(function(d){
      var x=d.x,z=d.z,a=d.ry||0;
      if(d.type==='lantern')mkLantern(x,z);
      else if(d.type==='bench')mkBench(x,z,a);
      else if(d.type==='stone')mkStone(x,z);
      else if(d.type==='mushroom')mkMushroom(x,z);
      else if(d.type==='pot')mkPot(x,z);
      else if(d.type==='fence')mkFence(x,z,a);
      else if(d.type==='tree')mkTree(x,z);
      else if(d.type==='bush')mkBush(x,z);
      else if(d.type==='pond')mkPond(x,z);
      else if(d.type==='wall')mkWall(x,z,a);
      else if(d.type==='arch')mkArch(x,z,a);
      else if(d.type==='pergola')mkPergola(x,z,a);
      else if(d.type==='bridge')mkBridge(x,z,a);
      else if(d.type==='well')mkWell(x,z);
      else if(d.type==='table')mkTable(x,z,a);
      else if(d.type==='windmill')mkWindmill(x,z);
      else if(d.type==='scarecrow')mkScarecrow(x,z);
      else if(d.type==='flower_wild')mkWildFlower(x,z);
      else if(d.type==='house')mkHouse(x,z,a);
      else if(d.type==='golden_pot')mkGoldenPot(x,z);
      else if(d.type==='crystal_pond')mkCrystalPond(x,z);
      else if(d.type==='magic_lamp')mkMagicLamp(x,z);
      else if(d.type==='rainbow_arch')mkRainbowArch(x,z,a);
      else if(d.type==='fountain')mkFountain(x,z);
      else if(d.type==='treehouse')mkTreehouse(x,z);
      else if(d.type==='angel_wing')mkAngelWing(x,z);
      else if(d.type==='dragon_egg'||d.type==='moonflower'||d.type==='golden_tree'||d.type==='firefly_jar'){
        // Special items - find original item and re-place
        var sItem=null;
        Object.values(SHOP_ITEMS.special).forEach(function(i){if(i.id===d.type)sItem=i;});
        if(!sItem)Object.values(SHOP_ITEMS).forEach(function(arr){arr.forEach(function(i){if(i.id===d.type)sItem=i;});});
        if(sItem)placeSpecial(sItem,x,z);
      }
    });
    // Restore weather
    if(data.weather&&data.weather!=='clear')window.setWeather(data.weather);
    // Re-render shop with current coins
    renderShop();
    // Restore harvest plants
    var sH=data.harvest||[];
    sH.forEach(function(h){
      mkHarvestPlant(h.x,h.z,h.type,h.stage||0);
      if(harvestItems.length>0) harvestItems[harvestItems.length-1].growTimer=h.growTimer||0;
    });
    if(elapsed>0) advanceHarvest(elapsed);
    // Restore pets
    var sP=data.petCount||[];
    sP.forEach(function(p){if(p.type==='cat')mkCat(p.x,p.z);else mkDog(p.x,p.z);});
    isLoading=false;lastSave=Date.now();}

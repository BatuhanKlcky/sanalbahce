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
var TASK_COIN={w:15,p:20,k:15,b:10};
function addXP(a){
  a=Math.max(0, Number(a)||0);
  var purse=0;
  xp+=a;
  while(level<10){
    var mx=XPL[level];
    if(!(mx>0)||xp<mx) break;
    xp-=mx;
    level++;
    purse+=level*25;
    sndLvl();
  }
  if(purse){ stats.coin+=purse; updStats(); saveStats(); }
  updXP();
  saveProg();
  return purse;
}
function updXP(){
  var maxed=level>=10;
  var mx=maxed?0:XPL[level];
  document.getElementById('lvN').textContent=level;
  document.getElementById('xpC').textContent=maxed?'Maks':Math.floor(xp);
  document.getElementById('xpM').textContent=maxed?'—':mx;
  document.getElementById('xpFill').style.width=(maxed?100:Math.min(100,mx?xp/mx*100:0))+'%';
  document.getElementById('lvBadge').textContent='⭐ Lv.'+level;
  paintAccount();
}
function chkTask(k,r,count){
  if(!tasks[k]||tasks[k].done) return;
  var step=Math.max(1, Math.round(Number(count))||1);
  tasks[k].n=Math.min(tasks[k].need, tasks[k].n+step);
  var lb=document.getElementById('lb-'+k);
  if(lb) lb.textContent=tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k];
  if(tasks[k].n>=tasks[k].need){
    tasks[k].done=true;
    var ck=document.getElementById('ck-'+k);
    if(ck){ ck.classList.add('done'); ck.textContent='✓'; }
    if(lb) lb.classList.add('done');
    sndTask();
    var coins=TASK_COIN[k]||0;
    var before=level;
    var bonus=addXP(r)||0;
    if(coins) addCoin(coins, true);
    if(level>before) showToast('🎉 Seviye '+level+'! +'+(coins+bonus)+' 💰');
    else showToast('✅ Görev! +'+r+' XP +'+coins+' 💰');
  }
  saveTasks();
}
function rstTasks(){var td=new Date().toDateString();if(localStorage.getItem('gdn_td')!==td){['w','p','k','b'].forEach(function(k){tasks[k].done=false;tasks[k].n=0;});localStorage.setItem('gdn_td',td);saveTasks();updTUI();}}
function updTUI(){['w','p','k','b'].forEach(function(k){var ck=document.getElementById('ck-'+k),lb=document.getElementById('lb-'+k);if(tasks[k].done){if(ck){ck.classList.add('done');ck.textContent='✓';}if(lb){lb.classList.add('done');lb.textContent=tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k];}}else{if(ck){ck.classList.remove('done');ck.textContent='';}if(lb){lb.classList.remove('done');lb.textContent=tasks[k].n>0?(tasks[k].n+'/'+tasks[k].need+' '+_taskLabels[k]):_taskFull[k];}}});}
function saveProg(){localStorage.setItem('gdn_xp',JSON.stringify({xp:xp,level:level}));}
function saveTasks(){var snap={};['w','p','k','b'].forEach(function(k){snap[k]={done:!!tasks[k].done,n:tasks[k].n||0};});localStorage.setItem('gdn_tasks',JSON.stringify({date:new Date().toDateString(),tasks:snap}));}
function loadTasks(){try{var d=JSON.parse(localStorage.getItem('gdn_tasks')||'null');if(d&&d.date===new Date().toDateString()&&d.tasks){['w','p','k','b'].forEach(function(k){if(!d.tasks[k])return;tasks[k].done=!!d.tasks[k].done;tasks[k].n=d.tasks[k].n||0;});}}catch(e){}updTUI();}


// ── İSTATİSTİKLER ─────────────────────────────────────────────────────────
var stats = {water:0, plant:0, kill:0, bloom:0, time:0, streak:0, lastDay:'',
             tom:0, str:0, cuc:0, pep:0, car:0, coin:0};
var _sessionStart = Date.now();
var _timeBase = 0;
var _progressReady = false;

function loadStats(){
  var raw=localStorage.getItem('gdn_stats');
  try{var d=JSON.parse(raw||'null');if(d)stats=Object.assign(stats,d);}catch(e){}
  if(!raw) stats.coin=100;
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
  takeScoreHash();
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
  if(e('st-pep'))e('st-pep').textContent=stats.pep||0;
  if(e('st-car'))e('st-car').textContent=stats.car||0;
  if(e('st-coin'))e('st-coin').textContent=stats.coin;
  var cb=document.getElementById('coinBadge');
  if(cb)cb.textContent='💰 '+stats.coin;
  paintAccount();
}
function addCoin(n, quiet){
  n=Math.round(Number(n))||0;
  if(n<=0) return 0;
  stats.coin+=n;
  updStats();
  saveStats();
  if(!quiet) showToast('+'+n+' 💰 coin!');
  return n;
}
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
    name: accountName(),
    score: gardenScore(),
    lastUpdate: Date.now()
  };
  localStorage.setItem('gdn_widget', JSON.stringify(widgetData));
}

// Widget verisi her 5 dakikada güncelle
setInterval(updateWidgetData, 300000);

// ── HESAP / SKOR ──────────────────────────────────────────────────────────
// Skor bu cihazda durur. Başka cihaz, kopyalanan bağlantıdaki kartla aynı
// seviye, coin ve seriyi açar. Bahçe düzeni kartta yoktur.
var ACCT_KEY='gdn_account';
function accountName(){
  try{var d=JSON.parse(localStorage.getItem(ACCT_KEY)||'null');if(d&&d.name)return d.name;}catch(e){}
  return '';
}
function gardenScore(){
  return (level|0)*1000+(stats.streak|0)*25+(Math.round(stats.coin)||0);
}
function nameOk(name){
  if(name.length<2||name.length>16) return false;
  if(/[\n\r|]/.test(name)) return false;
  return /[0-9A-Za-zÀ-ÿĞğİıÖöŞşÜüÇç]/.test(name);
}
function b64utf(s){
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64utf(s){
  s=String(s).replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4) s+='=';
  return decodeURIComponent(escape(atob(s)));
}
function scoreSig(s){
  var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function makeScoreCard(){
  var payload=['1',accountName(),level|0,Math.floor(xp),Math.round(stats.coin)||0,stats.streak|0,stats.lastDay||''].join('|');
  return 'SB1.'+b64utf(payload)+'.'+scoreSig(payload);
}
function extractCard(raw){
  var s=String(raw||'').trim();
  var hash=s.match(/[#&?]skor=(SB1\.[A-Za-z0-9_-]+\.[a-z0-9]+)/);
  if(hash) return hash[1];
  var direct=s.replace(/\s+/g,'').match(/SB1\.[A-Za-z0-9_-]+\.[a-z0-9]+/);
  return direct?direct[0]:'';
}
function whole(n){return typeof n==='number'&&isFinite(n)&&Math.floor(n)===n;}
function applyScoreCard(raw){
  var card=extractCard(raw);
  var m=card.match(/^SB1\.([A-Za-z0-9_-]+)\.([a-z0-9]+)$/);
  if(!m) return null;
  var payload;
  try{payload=unb64utf(m[1]);}catch(e){return null;}
  if(scoreSig(payload)!==m[2]) return null;
  var p=payload.split('|');
  if(p.length!==7||p[0]!=='1') return null;
  var name=p[1].trim().replace(/\s+/g,' ');
  if(!nameOk(name)) return null;
  var lv=Number(p[2]),px=Number(p[3]),coin=Number(p[4]),streak=Number(p[5]);
  if(!whole(lv)||lv<1||lv>10) return null;
  if(!whole(px)||px<0||px>1000000) return null;
  if(lv<10&&px>=XPL[lv]) return null;
  if(!whole(coin)||coin<0||coin>9999999) return null;
  if(!whole(streak)||streak<0||streak>9999) return null;
  var day=p[6];
  var parsed=Date.parse(day);
  if(!day||day.length>40||isNaN(parsed)) return null;
  if(parsed>Date.now()+36*3600*1000) return null;
  return {name:name,level:lv,xp:px,coin:coin,streak:streak,lastDay:day};
}
function commitScore(got){
  level=got.level;
  xp=got.xp;
  stats.coin=got.coin;
  stats.streak=got.streak;
  stats.lastDay=got.lastDay;
  localStorage.setItem(ACCT_KEY,JSON.stringify({name:got.name}));
  var nameEl=document.getElementById('acctName');
  if(nameEl) nameEl.value=got.name;
  saveProg();
  saveStats();
  updXP();
  updStats();
}
function paintAccount(){
  var name=accountName();
  var who=document.getElementById('acctWho');
  if(who) who.textContent=name||'İsim yok';
  var sc=String(gardenScore());
  var box=document.getElementById('acctScore');
  if(box) box.textContent=sc;
  var st=document.getElementById('st-score');
  if(st) st.textContent=sc;
  var card=document.getElementById('acctCard');
  if(card&&document.activeElement!==card) card.value=name?makeScoreCard():'';
}
function takeScoreHash(){
  if((location.hash||'').indexOf('skor=')<0) return;
  var got=applyScoreCard(location.hash);
  if(history.replaceState) history.replaceState(null,'',location.pathname+location.search);
  if(got){commitScore(got);showToast(got.name+' skorun açıldı');}
  else showToast('Kart okunamadı');
}
window.addEventListener('hashchange', takeScoreHash);
window.saveAccount=function(){
  var el=document.getElementById('acctName');
  var name=((el&&el.value)||'').trim().replace(/\s+/g,' ');
  if(!nameOk(name)){showToast('İsim 2-16 karakter olsun');return;}
  localStorage.setItem(ACCT_KEY,JSON.stringify({name:name}));
  if(el) el.value=name;
  paintAccount();
  showToast('Hesap kaydedildi');
};
window.copyScore=function(){
  if(!accountName()){showToast('Önce bir isim kaydet');return;}
  var link=makeScoreCard();
  try{var u=new URL(location.href);u.hash='skor='+makeScoreCard();link=u.toString();}catch(e){}
  var box=document.getElementById('acctPaste');
  var done=function(){showToast('Bağlantı kopyalandı');};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(link).then(done).catch(function(){
      if(box){box.value=link;box.focus();box.select();}
      showToast('Bağlantıyı kendin kopyala');
    });
  } else {
    if(box){box.value=link;box.focus();box.select();}
    showToast('Bağlantıyı kendin kopyala');
  }
};
window.openScore=function(){
  var el=document.getElementById('acctPaste');
  var got=applyScoreCard(el&&el.value);
  if(!got){showToast('Kart okunamadı');return;}
  commitScore(got);
  if(el) el.value='';
  showToast('Skor açıldı');
};
window.gardenScore=gardenScore;

window.shareBahce = function(){
  var tot=0; flowers.forEach(function(f){tot+=f.w;});
  var avgW = flowers.length ? Math.round(tot/flowers.length*100) : 0;
  var who=accountName();
  var text = '🌿 '+(who?who+' bahçesi':'Sanal Bahçem')+'\n'
    + '🌸 '+flowers.length+' çiçek | 💧 %'+avgW+' nem\n'
    + '⭐ Seviye '+level+' | 🏆 Skor '+gardenScore()+'\n'
    + '💰 '+stats.coin+' coin | 🔥 '+stats.streak+' gün\n'
    + 'Sanal Bahçe uygulamasında!';
  function fallbackCopy(){
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Bahçe özeti kopyalandı!');
    } catch(e) {
      showToast('📤 ' + text.split('\n')[0] + ' | Skor: ' + gardenScore());
    }
  }
  if(navigator.share){
    navigator.share({title:'Sanal Bahçem', text:text}).then(function(){
      showToast('📤 Paylaşıldı!');
    }).catch(function(err){
      if(err && err.name !== 'AbortError') fallbackCopy();
    });
  } else if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      showToast('📋 Bahçe özeti kopyalandı!');
    }).catch(fallbackCopy);
  } else {
    fallbackCopy();
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
      plants:flowers.map(function(f){return{x:f.mesh.position.x,z:f.mesh.position.z,h:f.h,b:f.b,w:f.w,c:f.c,t:f.t,k:f.k||'',isStunted:f.isStunted};}),
      badBugs:badBugs.map(function(b){return{ti:b.ti};}),
      bugCount:bugs.length,
      decos:decos.map(function(d){
        var o={type:d.type,x:d.group.position.x,z:d.group.position.z,ry:d.group.rotation.y,sc:d.group.scale.x||1,world:d.world||'both'};
        if(d.type==='farmer_house') o.level=d.level||1;
        return o;
      }),
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
  var raw=localStorage.getItem(SAVE_KEY);if(!raw)return;var data;try{data=JSON.parse(raw);}catch(e){localStorage.removeItem(SAVE_KEY);return;}isLoading=true;var elapsed=Math.max(0,(Date.now()-data.lastUpdate)/1000);var sB=data.badBugs||[];(data.plants||[]).forEach(function(p){mkFlower(p.x,p.z,p);});if(!(typeof isCozy==='function'&&isCozy())){sB.forEach(function(b){if(b.ti<flowers.length)mkBadBug(b.ti);});}if(elapsed>0)advancePlants(elapsed);if(!(typeof isCozy==='function'&&isCozy())&&typeof BUG_EVERY!=='undefined'&&elapsed>=BUG_EVERY&&flowers.length)mkBadBug(Math.floor(Math.random()*flowers.length));var bc=data.bugCount||0;for(var i=0;i<bc;i++)window.addBug();// Restore decos
    var savedDecos=data.decos||[];
    if(!localStorage.getItem('gdn_rm_autohouse_v1')){
      savedDecos=savedDecos.filter(function(d){
        return !(d && d.type==='farmer_house' && Math.abs((d.x||0)-(-4.8))<0.15 && Math.abs((d.z||0)-(-5.2))<0.15);
      });
      localStorage.setItem('gdn_rm_autohouse_v1','1');
    }
    function _applyXform(d){
      var last=decos[decos.length-1];if(!last)return;
      if(d.ry!=null)last.group.rotation.y=d.ry;
      if(d.sc&&d.sc!==1)last.group.scale.setScalar(d.sc);
      // Restore mode ownership (diorama vs classic).
      // Untagged + far from classic garden → likely a diorama/biome placement (pre-fix saves).
      if(d.world) last.world = d.world;
      else if(Math.hypot(d.x||0, d.z||0) > 18) last.world = 'cozy';
      else last.world = 'both';
    }
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
      else if(d.type==='farmer_house' && typeof window.mkFarmerHouse==='function'){
        window.mkFarmerHouse(x, z, d.level||1);
        var fh=decos[decos.length-1];
        if(fh && d.world) fh.world=d.world;
      }
      else if(typeof PACK_PROPS!=='undefined' && PACK_PROPS[d.type] && typeof mkPackProp==='function'){
        if(!mkPackProp(d.type, x, z, a)) return;
      }
      else if(d.type==='golden_pot')mkGoldenPot(x,z);
      else if(d.type==='crystal_pond')mkCrystalPond(x,z);
      else if(d.type==='magic_lamp')mkMagicLamp(x,z);
      else if(d.type==='rainbow_arch')mkRainbowArch(x,z,a);
      else if(d.type==='fountain')mkFountain(x,z);
      else if(d.type==='treehouse')mkTreehouse(x,z);
      else if(d.type==='angel_wing'||d.type==='angel_winggg')mkAngelWing(x,z);
      else if(d.type==='dragon_egg'||d.type==='moonflower'||d.type==='golden_tree'||d.type==='firefly_jar'){
        // Special items - find original item and re-place
        var sItem=null;
        Object.values(SHOP_ITEMS.special).forEach(function(i){if(i.id===d.type)sItem=i;});
        if(!sItem)Object.values(SHOP_ITEMS).forEach(function(arr){arr.forEach(function(i){if(i.id===d.type)sItem=i;});});
        if(sItem)placeSpecial(sItem,x,z);
      }
      _applyXform(d);
    });
    if(typeof window.syncDecoWorldVisibility==='function') window.syncDecoWorldVisibility();
    if(typeof window.bindFarmerHouseFromDecos==='function') window.bindFarmerHouseFromDecos();
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
    isLoading=false;
    if(elapsed >= 90 && typeof window.showWelcomeSummary === 'function'){
      setTimeout(function(){ window.showWelcomeSummary(elapsed); }, 800);
    }
    save(true);
}

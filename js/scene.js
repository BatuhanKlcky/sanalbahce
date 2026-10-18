// Sahne: yardimcilar, ses, hava, gece/gunduz, kamera ve Three.js dunyasi.
// ── HELPERS ──────────────────────────────────────────────────────────────────
function showToast(m){var e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show');},1800);}
function showSave(){var e=document.getElementById('saveInd');e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show');},1800);}

// ── AUDIO ────────────────────────────────────────────────────────────────────
var _ac=null,_master=null,_sndN=0,_amb=null,_muted=localStorage.getItem('gdn_mute')==='1';
function canHear(){if(_muted)return false;if(document.visibilityState==='hidden')return false;if(typeof isLoading!=='undefined'&&isLoading)return false;return true;}
function ac(){if(!_ac){_ac=new(window.AudioContext||window.webkitAudioContext)();_master=_ac.createGain();_master.gain.value=_muted?0:1;_master.connect(_ac.destination);}if(!_muted&&_ac.state==='suspended')_ac.resume();return _ac;}

// Warm natural mallet / kalimba tone synthesizer (fundamental sine + gentle overtone + fast exponential decay)
function mallet(freq, dur, vol, delay, type){
  if(!canHear()) return;
  try{
    var c=ac(), t=c.currentTime+(delay||0);
    var o1=c.createOscillator(), o2=c.createOscillator();
    var g=c.createGain(), f=c.createBiquadFilter();

    o1.type=type||'sine';
    o1.frequency.setValueAtTime(freq, t);
    // 2nd harmonic for wooden warmth
    o2.type='sine';
    o2.frequency.setValueAtTime(freq*2.01, t);

    f.type='lowpass';
    f.frequency.setValueAtTime(freq*3.5, t);

    var v = vol||0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur||0.25));

    o1.connect(f); o2.connect(f);
    f.connect(g); g.connect(_master);

    o1.start(t); o2.start(t);
    o1.stop(t + (dur||0.25) + 0.05);
    o2.stop(t + (dur||0.25) + 0.05);
    _sndN++;
  }catch(e){}
}
function tone(f,t,d,v,dl){ mallet(f, d, v, dl, t); }

function sndWater(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('light');
  if(!canHear())return;
  try{
    var c=ac(),b=c.createBuffer(1,c.sampleRate*.35,c.sampleRate),da=b.getChannelData(0);
    for(var i=0;i<da.length;i++)da[i]=(Math.random()*2-1)*.2;
    var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    f.type='bandpass';f.frequency.setValueAtTime(600, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(1200, c.currentTime+.3);
    g.gain.setValueAtTime(.25,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.35);
    s.buffer=b;s.connect(f);f.connect(g);g.connect(_master);
    s.start();s.stop(c.currentTime+.35);_sndN++;
  }catch(e){}
  mallet(420,'sine',.22,.08,.04);
  mallet(580,'sine',.16,.06,.12);
}
function sndPlant(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('medium');
  // Gentle wooden kalimba ascending triad (C5 - E5 - G5)
  mallet(523, .22, .12, 0);
  mallet(659, .24, .10, .08);
  mallet(784, .32, .11, .16);
}
function sndBug(){
  if(!canHear())return;
  mallet(880,'triangle',.08,.06);
  mallet(1174,'triangle',.08,.06,.07);
}
function sndKill(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('heavy');
  mallet(261,'triangle',.14,.12);
  mallet(196,'sine',.18,.10,.09);
}
function sndLvl(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('success');
  // Major 7th celebratory arpeggio (C5 - E5 - G5 - B5 - C6)
  [523, 659, 784, 987, 1046].forEach(function(f,i){
    mallet(f, .45, .14, i * .11);
  });
}
function sndTask(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('success');
  mallet(659, .18, .11, 0);
  mallet(880, .22, .10, .09);
  mallet(1174, .35, .12, .18);
}
function sndBird(){
  [[1046,0],[1318,.11],[1174,.22],[1567,.34],[1318,.46]].forEach(function(n){
    mallet(n[0],.08,.03,n[1],'sine');
  });
}
function sndCoin(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('light');
  // Crispy bright pickup tone
  mallet(987, .12, .11, 0);
  mallet(1318, .22, .10, .09);
}
function sndPet(){
  if(typeof window.triggerHaptic==='function') window.triggerHaptic('light');
  mallet(587, .14, .08, 0);
  mallet(740, .20, .07, .09);
}
function sndRain(){
  mallet(659, .22, .04, 0);
  mallet(784, .25, .03, .12);
  mallet(880, .30, .03, .22);
}
function daytime(){return !(dayPhase<.229||dayPhase>=.896);}
function ambTick(){
  if(!canHear()||!daytime())return;
  // Pentatonic warm wind chime tones (C D E G A)
  var ns=[523, 587, 659, 784, 880, 1046];
  if(Math.random()<.35){
    mallet(ns[Math.floor(Math.random()*ns.length)], .65, .025+Math.random()*.025);
  }
  if(Math.random()<.07) sndBird();
}
function startAmb(){if(_amb)return;_amb=setInterval(ambTick,2800);}
function paintSound(){var b=document.getElementById('btnSnd');if(!b)return;b.textContent=_muted?'🔇':'🔊';b.classList.toggle('on',!_muted);}
function unlockAudio(){if(_muted)return;ac();startAmb();}
window.toggleSound=function(){_muted=!_muted;localStorage.setItem('gdn_mute',_muted?'1':'0');if(_master)_master.gain.value=_muted?0:1;paintSound();if(!_muted){ac();startAmb();}showToast(_muted?'Ses kapalı 🔇':'Ses açık 🔊');};
document.addEventListener('pointerdown',unlockAudio);
document.addEventListener('touchstart',unlockAudio);
if('caches' in window){caches.keys().then(function(ks){ks.forEach(function(k){if(k!=='sanalbahce-shell-26')caches.delete(k);});}).catch(function(){});}
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){try{r.update();}catch(e){}}).catch(function(){});});}
paintSound();
window.ambTick=ambTick;

// ── WEATHER FX ───────────────────────────────────────────────────────────────
var rCvs=document.getElementById('rainCvs'),rCtx=rCvs.getContext('2d');
var wCvs=document.getElementById('wxCvs'),wCtx=wCvs.getContext('2d');
rCvs.width=wCvs.width=innerWidth;rCvs.height=wCvs.height=innerHeight;
var rDrops=[],wxParts=[],isRaining=false,curWeather='clear';
var RAIN_DUR=30,_rainLeft=0;
function initRain(){rDrops=[];var rainCount=isMobile?60:120;for(var i=0;i<rainCount;i++)rDrops.push({x:Math.random()*rCvs.width,y:Math.random()*rCvs.height,l:10+Math.random()*20,s:(8+Math.random()*10)*60,o:.2+Math.random()*.5});}
function drawRain(dt){var step=Math.min(Math.max(dt||0,0),.05);rCtx.clearRect(0,0,rCvs.width,rCvs.height);rDrops.forEach(function(d){rCtx.beginPath();rCtx.moveTo(d.x,d.y);rCtx.lineTo(d.x-2,d.y+d.l);rCtx.strokeStyle='rgba(180,220,255,'+d.o+')';rCtx.lineWidth=1;rCtx.stroke();d.y+=d.s*step;if(d.y>rCvs.height){d.y=-d.l;d.x=Math.random()*rCvs.width;}});}
function initWx(tp){wxParts=[];var n=tp==='snow'?(isMobile?80:150):(isMobile?40:80);for(var i=0;i<n;i++)wxParts.push({x:Math.random()*wCvs.width,y:Math.random()*wCvs.height,sz:tp==='snow'?2+Math.random()*4:8+Math.random()*12,sp:(tp==='snow'?1+Math.random()*2:2+Math.random()*3)*60,dr:(Math.random()-.5)*48,rot:Math.random()*Math.PI*2,rs:(Math.random()-.5)*3,o:.4+Math.random()*.6,col:tp==='snow'?'#fff':['#e8732a','#d4522a','#c8a020','#8b4513'][Math.floor(Math.random()*4)]});}
function drawWx(dt){var step=Math.min(Math.max(dt||0,0),.05);wCtx.clearRect(0,0,wCvs.width,wCvs.height);wxParts.forEach(function(p){wCtx.save();wCtx.globalAlpha=p.o;if(curWeather==='snow'){wCtx.fillStyle=p.col;wCtx.beginPath();wCtx.arc(p.x,p.y,p.sz,0,Math.PI*2);wCtx.fill();}else{wCtx.translate(p.x,p.y);wCtx.rotate(p.rot);wCtx.fillStyle=p.col;wCtx.beginPath();wCtx.ellipse(0,0,p.sz,p.sz*.5,0,0,Math.PI*2);wCtx.fill();}wCtx.restore();p.y+=p.sp*step;p.x+=p.dr*step+Math.sin(p.y*.02)*30*step;p.rot+=p.rs*step;if(p.y>wCvs.height+20){p.y=-20;p.x=Math.random()*wCvs.width;}});}
function startRain(){if(isRaining)return;isRaining=true;_rainLeft=RAIN_DUR;initRain();rCvs.style.opacity='1';if(typeof flowers!=='undefined')flowers.forEach(function(f){soak(f,.3);});if(!isLoading){showToast('🌧️ Yağmur yağıyor!');sndRain();}}
function stopRain(){if(!isRaining&&!rDrops.length)return;isRaining=false;_rainLeft=0;rDrops=[];rCtx.clearRect(0,0,rCvs.width,rCvs.height);rCvs.style.opacity='0';}
window.setWeather=function(tp){curWeather=tp;if(tp==='clear'){wCvs.style.opacity='0';wxParts=[];wCtx.clearRect(0,0,wCvs.width,wCvs.height);if(!isLoading){showToast('☀️ Hava açıldı!');tone(720,'sine',.16,.05);}}else{initWx(tp);wCvs.style.opacity='1';if(!isLoading){showToast(tp==='snow'?'❄️ Kar yağıyor, bitkiler üşüdü':'🍂 Yapraklar dökülüyor...');tone(tp==='snow'?392:520,'triangle',.2,.05);}}markDirty();};
window.startRain=startRain;window.stopRain=stopRain;

// ── DAY/NIGHT ────────────────────────────────────────────────────────────────
var dayPhase=0,lastPN='';
function getRDP(){var n=new Date();return(n.getHours()*3600+n.getMinutes()*60+n.getSeconds())/86400;}
function getPN(p){if(p<.229||p>=.896)return'GECE';if(p<.292)return'ŞAFAK';if(p<.833)return'GÜNDÜZ';return'AKŞAM';}
function updDN(p){
  var ph=getPN(p);
  document.getElementById('dayLabel').textContent=ph;
  var r=0,g=0,b=0,a=0;
  if(p<.229||p>=.896){b=20;a=.72;}
  else if(p<.292){var t=(p-.229)/.063;r=Math.round(80*(1-t));g=Math.round(20*(1-t));b=10;a=.55*(1-t);}
  else if(p<.833){a=0;}
  else{var t2=(p-.833)/.063;r=Math.round(60*t2);g=Math.round(10*t2);b=5;a=.45*t2;}
  document.getElementById('dayOverlay').style.background='rgba('+r+','+g+','+b+','+a+')';
  var nb;
  if(p<.229||p>=.896)nb=1;
  else if(p<.292)nb=1-(p-.229)/.063;
  else if(p<.833)nb=0;
  else nb=(p-.833)/.063;
  nb=Math.max(0,Math.min(1,nb));
  if(window.skyMat)skyMat.uniforms.uNight.value=nb;
  if(window._sMat)window._sMat.uniforms.uNight.value=nb;
  if(window._sun){window._sun.visible=nb<.5;if(window._sHalo)window._sHalo.visible=nb<.5;}
  if(window.mLight){if(ph==='GÜNDÜZ'){mLight.color.setHex(0xfff5e0);mLight.intensity=1.6;}else if(ph==='ŞAFAK'){mLight.color.setHex(0xffaa66);mLight.intensity=.8;}else if(ph==='AKŞAM'){mLight.color.setHex(0xff6633);mLight.intensity=.6;}else{mLight.color.setHex(0xaabfff);mLight.intensity=.5;}
    var ang=(p-.5)*Math.PI,sx=Math.sin(ang)*34,sy=Math.cos(ang)*26+14;
    mLight.position.set(sx,sy,12);
    if(window._sun){window._sun.position.set(sx*3,Math.max(sy*2.4,28),24);if(window._sHalo)window._sHalo.position.copy(window._sun.position);}
  }
  if(scene&&scene.fog){if(ph==='GÜNDÜZ'){scene.fog.color.setHex(0xb9d7ef);scene.fog.density=.006;}else if(ph==='ŞAFAK'){scene.fog.color.setHex(0xc48862);scene.fog.density=.008;}else if(ph==='AKŞAM'){scene.fog.color.setHex(0x8a4030);scene.fog.density=.008;}else{scene.fog.color.setHex(0x070b16);scene.fog.density=.012;}}
  if(ph!==lastPN){var icons={GÜNDÜZ:'☀️',ŞAFAK:'🌅',AKŞAM:'🌇',GECE:'🌙'};document.getElementById('wIcon').textContent=icons[ph]||'☀️';if(ph==='ŞAFAK')showToast('🌅 Şafak söküyor...');else if(ph==='AKŞAM')showToast('🌇 Akşam oluyor...');else if(ph==='GECE')showToast('🌙 İyi geceler!');else if(ph==='GÜNDÜZ')showToast('☀️ Günaydın!');lastPN=ph;}
}
// ── PANEL TOGGLE ─────────────────────────────────────────────────────────────
var openP=null;
window.togglePanel=function(nm){
  if(placementMode){window.cancelPlace();return;}
  if(typeof window.closeInspector==='function') window.closeInspector();
  var moreD=document.getElementById('moreDrawer');if(moreD)moreD.classList.remove('open');
  var ps={deco:'decoPanel',task:'taskPanel',stats:'statsPanel',shop:'shopPanel',codex:'codexModal',market:'marketPanel'};
  var bs={deco:'btnDeco',task:'btnTask',stats:'btnStats',shop:'btnShop',codex:'btnCodex',market:'btnMarket'};
  if(openP===nm){
    var pe=document.getElementById(ps[nm]);if(pe)pe.classList.remove('open');
    var be=document.getElementById(bs[nm]);if(be)be.classList.remove('on');
    openP=null;
  }else{
    Object.keys(ps).forEach(function(k){
      var pe=document.getElementById(ps[k]);if(pe)pe.classList.remove('open');
      var be=document.getElementById(bs[k]);if(be)be.classList.remove('on');
    });
    if(nm==='market' && typeof window.renderMarketPanel==='function') window.renderMarketPanel();
    var npe=document.getElementById(ps[nm]);if(npe)npe.classList.add('open');
    var nbe=document.getElementById(bs[nm]);if(nbe)nbe.classList.add('on');
    openP=nm;
  }
};
// ── ORBIT CONTROLS ───────────────────────────────────────────────────────────
(function(){THREE.OrbitControls=function(obj,dom){this.object=obj;this.domElement=dom;this.enabled=true;this.target=new THREE.Vector3();this.enableDamping=true;this.dampingFactor=.04;this.enableZoom=true;this.zoomSpeed=.6;this.enableRotate=true;this.rotateSpeed=.45;this.enablePan=true;this.panSpeed=.6;this.minDistance=6;this.maxDistance=120;this.minPolarAngle=0;this.maxPolarAngle=Math.PI/2.12;var sc=this,ST={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TR:3,TDP:5},st=ST.NONE,EPS=1e-6,sph=new THREE.Spherical(),sphD=new THREE.Spherical(),scale=1,panOff=new THREE.Vector3(),zC=false,rS=new THREE.Vector2(),rE=new THREE.Vector2(),rD=new THREE.Vector2(),pS=new THREE.Vector2(),pE=new THREE.Vector2(),pD=new THREE.Vector2(),dS=new THREE.Vector2(),dE=new THREE.Vector2(),dDe=new THREE.Vector2();function gZS(){return Math.pow(.95,sc.zoomSpeed);}function rL(a){sphD.theta-=a;}function rU(a){sphD.phi-=a;}var pLV=new THREE.Vector3();function pL(d,m){pLV.setFromMatrixColumn(m,0);pLV.multiplyScalar(-d);panOff.add(pLV);}var pUV=new THREE.Vector3();function pU(d,m){pUV.setFromMatrixColumn(m,1);pUV.multiplyScalar(d);panOff.add(pUV);}var pV=new THREE.Vector3();function pan(dx,dy){if(sc.object.isPerspectiveCamera){var p=sc.object.position;pV.copy(p).sub(sc.target);var tD=pV.length()*Math.tan((sc.object.fov/2)*Math.PI/180);pL(2*dx*tD/sc.domElement.clientHeight,sc.object.matrix);pU(2*dy*tD/sc.domElement.clientHeight,sc.object.matrix);}}function dI(s){scale/=s;}function dO(s){scale*=s;}this.update=function(){var off=new THREE.Vector3(),q=new THREE.Quaternion().setFromUnitVectors(obj.up,new THREE.Vector3(0,1,0)),qi=q.clone().invert(),lP=new THREE.Vector3(),lQ=new THREE.Quaternion();return function(){var pos=sc.object.position;off.copy(pos).sub(sc.target);off.applyQuaternion(q);sph.setFromVector3(off);sph.theta+=sphD.theta;sph.phi+=sphD.phi;sph.phi=Math.max(sc.minPolarAngle,Math.min(sc.maxPolarAngle,sph.phi));sph.makeSafe();sph.radius*=scale;sph.radius=Math.max(sc.minDistance,Math.min(sc.maxDistance,sph.radius));sc.target.add(panOff);off.setFromSpherical(sph);off.applyQuaternion(qi);pos.copy(sc.target).add(off);sc.object.lookAt(sc.target);if(sc.enableDamping){sphD.theta*=(1-sc.dampingFactor);sphD.phi*=(1-sc.dampingFactor);panOff.multiplyScalar(1-sc.dampingFactor);}else{sphD.set(0,0,0);panOff.set(0,0,0);}scale=1;if(zC||lP.distanceToSquared(sc.object.position)>EPS||8*(1-lQ.dot(sc.object.quaternion))>EPS){lP.copy(sc.object.position);lQ.copy(sc.object.quaternion);zC=false;return true;}return false;};}();function mD(e){if(!sc.enabled)return;if(e.button===0){st=ST.ROTATE;rS.set(e.clientX,e.clientY);}else if(e.button===2){st=ST.PAN;pS.set(e.clientX,e.clientY);}document.addEventListener('mousemove',mM);document.addEventListener('mouseup',mU);}function mM(e){if(!sc.enabled)return;if(st===ST.ROTATE){rE.set(e.clientX,e.clientY);rD.subVectors(rE,rS).multiplyScalar(sc.rotateSpeed);rL(2*Math.PI*rD.x/sc.domElement.clientHeight);rU(2*Math.PI*rD.y/sc.domElement.clientHeight);rS.copy(rE);sc.update();}else if(st===ST.PAN){pE.set(e.clientX,e.clientY);pD.subVectors(pE,pS).multiplyScalar(sc.panSpeed);pan(pD.x,pD.y);pS.copy(pE);sc.update();}}function mU(){document.removeEventListener('mousemove',mM);document.removeEventListener('mouseup',mU);st=ST.NONE;}function wh(e){if(!sc.enabled)return;e.deltaY<0?dO(gZS()):dI(gZS());sc.update();e.preventDefault();}function tS(e){if(e.touches.length===1){st=ST.TR;rS.set(e.touches[0].clientX,e.touches[0].clientY);}else if(e.touches.length===2){st=ST.TDP;var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;dS.set(0,Math.sqrt(dx*dx+dy*dy));}}function tM(e){e.preventDefault();if(st===ST.TR&&e.touches.length===1){rE.set(e.touches[0].clientX,e.touches[0].clientY);rD.subVectors(rE,rS).multiplyScalar(sc.rotateSpeed);rL(2*Math.PI*rD.x/sc.domElement.clientHeight);rU(2*Math.PI*rD.y/sc.domElement.clientHeight);rS.copy(rE);sc.update();}else if(st===ST.TDP&&e.touches.length===2){var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;dE.set(0,Math.sqrt(dx*dx+dy*dy));dDe.set(0,Math.pow(dE.y/dS.y,sc.zoomSpeed));dI(dDe.y);dS.copy(dE);sc.update();}}function tE(){st=ST.NONE;}function cM(e){if(!sc.enabled)return;e.preventDefault();}dom.addEventListener('contextmenu',cM,false);dom.addEventListener('mousedown',mD,false);dom.addEventListener('wheel',wh,{passive:false});dom.addEventListener('touchstart',tS,{passive:false});dom.addEventListener('touchend',tE,false);dom.addEventListener('touchmove',tM,{passive:false});this.update();};})();

// ── SCENE ────────────────────────────────────────────────────────────────────
var scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xd9c4b0, 0.0045);
var camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,5000);
camera.position.set(0,16,22);
var isMobile=/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||('ontouchstart' in window && window.innerWidth<1024)||(window.innerWidth<768);
var renderer=new THREE.WebGLRenderer({antialias:!isMobile,powerPreference:"high-performance",precision:isMobile?"mediump":"highp"});
renderer.setSize(innerWidth,innerHeight);
var maxPR=isMobile?1.25:1.5;
if(localStorage.getItem('gdn_perf')==='low') maxPR=1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,maxPR));
renderer.shadowMap.enabled=!isMobile;
if(renderer.shadowMap.enabled&&THREE.PCFShadowMap!=null){
  renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
}
document.body.appendChild(renderer.domElement);
var controls=new THREE.OrbitControls(camera,renderer.domElement);
window.resetCamera=function(){if(placementMode){window.cancelPlace();return;}if(typeof window.applyCozyMode==='function'&&typeof isCozy==='function'&&isCozy()){camera.position.set(0,16,22);controls.target.set(0,.4,0);}else{camera.position.set(6,14,24);controls.target.set(0,0,0);}controls.update();showToast('Kamera sıfırlandı');};

// Sky
var skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uTime:{value:0},uNight:{value:1}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:['varying vec3 vP;uniform float uTime,uNight;','float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}','float n2(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),u.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),u.x),u.y);}','void main(){vec3 d=normalize(vP);float up=clamp(d.y,0.,1.),hz=1.-up;','vec3 nc=mix(mix(vec3(.01,.02,.08),vec3(.04,.06,.18),smoothstep(0.,.5,up)),vec3(.10,.04,.22),pow(hz,3.));','vec3 dc=mix(vec3(.4,.65,1.),vec3(.75,.88,1.),up);','vec3 col=mix(dc,nc,uNight);','vec2 uv=vec2(atan(d.z,d.x)/6.28,d.y)*3.;','float nb=n2(uv*2.5+uTime*.008)*n2(uv*5.-uTime*.005);','nb=smoothstep(.25,.6,nb)*up*.55*uNight;','col+=mix(vec3(.15,.03,.35),vec3(.02,.10,.40),n2(uv*1.5))*nb;','float cl=n2(uv*2.2+vec2(uTime*.02,0.));','float cl2=n2(uv*4.6-vec2(uTime*.01,uTime*.015));','cl=smoothstep(.4,.72,cl*.55+cl2*.45);','cl*=mix(.8,1.,clamp(up*3.,0.,1.))*(1.-uNight);','col=mix(col,vec3(.96,.98,1.),cl*.92);','gl_FragColor=vec4(col,1.);}'].join('\n')});
skyMat.fog=false;scene.add(new THREE.Mesh(new THREE.SphereGeometry(800,32,20),skyMat));
// Stars
(function(){var cnt=1200,pos=new Float32Array(cnt*3),sz=new Float32Array(cnt),br=new Float32Array(cnt);for(var i=0;i<cnt;i++){var th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()),r=380;pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.abs(Math.cos(ph))+5;pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);sz[i]=.5+Math.random()*2.5;br[i]=Math.random();}var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aSize',new THREE.BufferAttribute(sz,1));geo.setAttribute('aBright',new THREE.BufferAttribute(br,1));window._sMat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uPR:{value:Math.min(devicePixelRatio,2)},uNight:{value:1}},vertexShader:'attribute float aSize,aBright;varying float vB;uniform float uTime,uPR,uNight;void main(){vB=aBright*uNight;vec4 mv=modelViewMatrix*vec4(position,1.);float tw=.7+.3*sin(uTime*2.+aBright*31.4);gl_PointSize=aSize*uPR*tw*(300./-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying float vB;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=smoothstep(1.,0.,d)*(.5+.5*vB);gl_FragColor=vec4(mix(vec3(.7,.8,1.),vec3(1.,.95,.85),vB),a);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});window._sMat.fog=false;scene.add(new THREE.Points(geo,window._sMat));})();
// Moon/Sun
(function(){var moon=new THREE.Mesh(new THREE.SphereGeometry(8,24,24),new THREE.MeshStandardMaterial({color:0xdde8ff,roughness:.95,emissive:0x8899cc,emissiveIntensity:.25}));moon.position.set(120,80,140);scene.add(moon);var mh=new THREE.Mesh(new THREE.SphereGeometry(14,16,16),new THREE.MeshBasicMaterial({color:0x6677bb,transparent:true,opacity:.06,side:THREE.BackSide}));mh.position.copy(moon.position);scene.add(mh);window._sun=new THREE.Mesh(new THREE.SphereGeometry(6,16,16),new THREE.MeshBasicMaterial({color:0xffee88}));window._sun.position.set(100,90,-80);scene.add(window._sun);window._sHalo=new THREE.Mesh(new THREE.SphereGeometry(10,16,16),new THREE.MeshBasicMaterial({color:0xffcc44,transparent:true,opacity:.08,side:THREE.BackSide}));window._sHalo.position.copy(window._sun.position);scene.add(window._sHalo);})();
// Lights
scene.add(new THREE.AmbientLight(0xfff0e0,.95));
scene.add(new THREE.HemisphereLight(0xffe8d6,0x6a8f52,.55));
window.mLight=new THREE.DirectionalLight(0xffe2c4,1.35);mLight.position.set(12,28,14);
mLight.castShadow=!isMobile;
if(mLight.castShadow){
  // 1024 is enough for the island; 1536 was hitching diorama on mid GPUs.
  mLight.shadow.mapSize.width=1024;
  mLight.shadow.mapSize.height=1024;
  mLight.shadow.camera.near=2; mLight.shadow.camera.far=55;
  mLight.shadow.camera.left=-22; mLight.shadow.camera.right=22;
  mLight.shadow.camera.top=22; mLight.shadow.camera.bottom=-22;
  mLight.shadow.bias=-0.00025; mLight.shadow.normalBias=0.035;
  mLight.shadow.radius=2;
}
scene.add(mLight);
var fL=new THREE.DirectionalLight(0xffc8a8,.35);fL.position.set(-15,8,-12);scene.add(fL);
var gL=new THREE.PointLight(0xfff2cc,.45,36);gL.position.set(0,3,0);scene.add(gL);
// Premium lawn (albedo + normal + roughness). Fallback if groundArt missing.
var _lawnMat = typeof window.createLawnMaterial==='function'
  ? window.createLawnMaterial({ key:'classic', tint:0x5fad52, repeat:9, normalScale:0.7 })
  : new THREE.MeshStandardMaterial({ color:0x5a9a48, roughness:0.95 });
window._grassMap = _lawnMat.map || null;
var gnd=new THREE.Mesh(new THREE.PlaneGeometry(220,220, isMobile?1:1), _lawnMat);
gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=!isMobile;scene.add(gnd);
window._flatGnd=gnd;
// Cozyrama-style floating island (shown in cozy mode)
(function(){
  var root=new THREE.Group();
  var R=20;
  var grassMat = typeof window.createLawnMaterial==='function'
    ? window.createLawnMaterial({ key:'island', tint:0x8fd96a, color:0xf2ffe8, repeat:4.5, normalScale:0.8 })
    : new THREE.MeshStandardMaterial({ color:0xb8e878, roughness:0.92 });
  var top=new THREE.Mesh(new THREE.CircleGeometry(R, isMobile?48:84), grassMat);
  top.rotation.x=-Math.PI/2;top.position.y=.03;top.receiveShadow=!isMobile;
  if(typeof window.sculptGroundCircle==='function'){
    // sculpt before rotation uses geometry XY; CircleGeometry is XY plane
    top.rotation.x=0;
    window.sculptGroundCircle(top, R, 0.42);
    top.rotation.x=-Math.PI/2;
  }
  root.add(top);
  // Soft dirt cliff bands
  var rim=new THREE.Mesh(new THREE.CylinderGeometry(R+.2,R+1.05,2.6,56,1,true),new THREE.MeshStandardMaterial({color:0xc4895a,roughness:.9,metalness:0,side:THREE.DoubleSide}));
  rim.position.y=-1.25;root.add(rim);
  var mid=new THREE.Mesh(new THREE.CylinderGeometry(R+.15,R*.85,1.4,48),new THREE.MeshStandardMaterial({color:0xa86f45,roughness:.95}));
  mid.position.y=-2.3;root.add(mid);
  var cork=new THREE.Mesh(new THREE.CylinderGeometry(R*.82,R*.45,1.5,40),new THREE.MeshStandardMaterial({color:0x7a4a2e,roughness:1}));
  cork.position.y=-3.4;root.add(cork);
  var moss=new THREE.Mesh(new THREE.TorusGeometry(R-.08,.22,10,72),new THREE.MeshStandardMaterial({color:0x6ecf7a,roughness:.88}));
  moss.rotation.x=Math.PI/2;moss.position.y=.04;root.add(moss);
  // Rim flowers / pebbles for diorama charm
  for(var i=0;i<28;i++){
    var a=(i/28)*Math.PI*2, rr=R-0.55-(i%3)*.15;
    var bloom=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),new THREE.MeshStandardMaterial({color:[0xff8ab8,0xffd56a,0xb79bff,0xffffff][i%4],roughness:.55,emissive:[0xff8ab8,0xffd56a,0xb79bff,0xffffff][i%4],emissiveIntensity:.18}));
    bloom.scale.set(1,.45,1);
    bloom.position.set(Math.cos(a)*rr,.12,Math.sin(a)*rr);
    root.add(bloom);
    if(i%2===0){
      var tuft=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshStandardMaterial({color:0x7ed96a,roughness:.9}));
      tuft.scale.set(1,.55,1);
      tuft.position.set(Math.cos(a+0.08)*(rr-.35),.08,Math.sin(a+0.08)*(rr-.35));
      root.add(tuft);
    }
  }
  // Soft under-glow so island floats
  var glow=new THREE.PointLight(0xffd2a0,.55,40);
  glow.position.set(0,-1.5,0);root.add(glow);
  root.visible=false;scene.add(root);window._islandRoot=root;window._islandR=R;
})();
window.surf=(function(){
  function tex(w,h,draw){
    var c=document.createElement('canvas');c.width=w;c.height=h;
    draw(c.getContext('2d'),w,h);
    var t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=4;
    return t;
  }
  function mat(o){var m=new THREE.MeshStandardMaterial(o);m.userData.keep=true;return m;}
  function nse(x,y){var v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
  var bark=tex(64,128,function(g,w,h){
    g.fillStyle='#5c3a28';g.fillRect(0,0,w,h);
    for(var x=0;x<w;x++)for(var y=0;y<h;y++){
      var k=nse(x*2,Math.floor(y/4));
      if(k>.62){g.fillStyle='rgba(32,16,8,'+(0.25+k*.4)+')';g.fillRect(x,y,1,k>.88?5:2);}
      else if(k<.12){g.fillStyle='rgba(150,110,70,.28)';g.fillRect(x,y,1,1);}
    }
  });
  var wood=tex(128,64,function(g,w,h){
    g.fillStyle='#7a5230';g.fillRect(0,0,w,h);
    for(var y=0;y<h;y+=16){g.fillStyle=y%32?'#6b4524':'#8a5e34';g.fillRect(0,y,w,15);g.fillStyle='rgba(40,20,8,.35)';g.fillRect(0,y+14,w,2);}
    for(var i=0;i<40;i++){g.strokeStyle='rgba(90,50,20,.25)';g.beginPath();g.moveTo(0,i*1.6);g.lineTo(w,i*1.6+(i%5));g.stroke();}
  });
  var stone=tex(128,128,function(g,w,h){
    g.fillStyle='#6a6560';g.fillRect(0,0,w,h);
    for(var i=0;i<90;i++){
      var x=nse(i,3)*w,y=nse(i,9)*h,r=6+nse(i,5)*16;
      g.fillStyle=nse(i,1)>.5?'rgba(40,38,36,.45)':'rgba(180,176,168,.28)';
      g.beginPath();g.ellipse(x,y,r,r*(.6+nse(i,2)*.5),nse(i,4)*3,0,6.28);g.fill();
    }
  });
  var stucco=tex(128,128,function(g,w,h){
    g.fillStyle='#e7d7c2';g.fillRect(0,0,w,h);
    for(var i=0;i<700;i++){
      var x=nse(i,2)*w,y=nse(i,8)*h;
      g.fillStyle=nse(i,4)>.5?'rgba(120,90,60,.18)':'rgba(255,250,240,.2)';
      g.fillRect(x,y,2,2);
    }
  });
  var tile=tex(128,128,function(g,w,h){
    g.fillStyle='#7a2e22';g.fillRect(0,0,w,h);
    for(var row=0;row<6;row++){
      var y=row*22,off=row%2?16:0;
      for(var col=-1;col<5;col++){
        var x=col*32+off;
        g.fillStyle=row%2?'#9a4030':'#8a3428';
        g.beginPath();g.ellipse(x+16,y+12,15,10,0,Math.PI,0);g.fill();
        g.strokeStyle='rgba(40,12,8,.55)';g.lineWidth=2;g.stroke();
      }
    }
  });
  var cloth=tex(64,128,function(g,w,h){
    g.fillStyle='#d7c4a4';g.fillRect(0,0,w,h);
    for(var y=0;y<h;y+=4){g.fillStyle='rgba(90,60,30,.12)';g.fillRect(0,y,w,1);}
    g.strokeStyle='rgba(90,55,30,.35)';g.lineWidth=2;
    g.strokeRect(3,3,w-6,h-6);
  });
  var cap=tex(128,64,function(g,w,h){
    g.fillStyle='#c0392b';g.fillRect(0,0,w,h);
    for(var i=0;i<8;i++){
      g.fillStyle='#fff6ea';
      g.beginPath();g.ellipse(12+(i*29)%110,10+(i*17)%40,7+i%3,5,i,0,6.28);g.fill();
    }
  });
  var leaf=tex(256,256,function(g,w,h){
    g.clearRect(0,0,w,h);
    function one(x,y,rot,sc,col){
      g.save();g.translate(x,y);g.rotate(rot);g.scale(sc,sc);
      g.fillStyle=col;g.beginPath();
      g.moveTo(0,-22);g.bezierCurveTo(16,-6,14,12,0,26);g.bezierCurveTo(-14,12,-16,-6,0,-22);g.fill();
      g.strokeStyle='rgba(12,40,16,.55)';g.lineWidth=1.2;g.beginPath();g.moveTo(0,-16);g.lineTo(0,20);g.stroke();
      g.restore();
    }
    var cols=['#3c9a48','#4eae58','#2f8a3c','#62c06a','#348f44'];
    for(var i=0;i<18;i++){
      var a=i/18*Math.PI*2,rad=28+(i%4)*22;
      one(128+Math.cos(a)*rad,128+Math.sin(a)*rad,a+(i%2)*.4,.85+(i%3)*.2,cols[i%cols.length]);
    }
    one(128,128,.3,1.35,'#226832');
  });
  function fur(base){
    return tex(64,64,function(g,w,h){
      g.fillStyle=base;g.fillRect(0,0,w,h);
      for(var i=0;i<180;i++){
        g.fillStyle=nse(i,6)>.5?'rgba(255,255,255,.13)':'rgba(40,20,10,.16)';
        g.beginPath();g.ellipse(nse(i,1)*w,nse(i,2)*h,2+nse(i,3)*3,1.5,nse(i,4),0,6.28);g.fill();
      }
    });
  }
  return {
    bark:mat({map:bark,roughness:.96,color:0xffffff}),
    wood:mat({map:wood,roughness:.9,color:0xffffff}),
    woodDark:mat({map:wood,roughness:.9,color:0x8a6848}),
    stone:mat({map:stone,roughness:.97,color:0xffffff}),
    stucco:mat({map:stucco,roughness:.92,color:0xffffff}),
    tile:mat({map:tile,roughness:.84,color:0xffffff}),
    cloth:mat({map:cloth,roughness:.8,color:0xffffff,side:THREE.DoubleSide}),
    cap:mat({map:cap,roughness:.7,color:0xffffff}),
    stem:mat({color:0xf3e6d0,roughness:1}),
    leaf:mat({map:leaf,alphaTest:.15,side:THREE.DoubleSide,roughness:.82,color:0xffffff}),
    leafDark:mat({map:leaf,alphaTest:.15,side:THREE.DoubleSide,roughness:.86,color:0xc5d7be}),
    furOrange:mat({map:fur('#f0b070'),roughness:.82,color:0xffffff}),
    furBrown:mat({map:fur('#a56b42'),roughness:.86,color:0xffffff}),
    furDark:mat({map:fur('#6e4328'),roughness:.86,color:0xffffff}),
    furWhite:mat({map:fur('#fff4ea'),roughness:.78,color:0xffffff})
  };
})();
window._waterMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:['varying vec2 vUv;uniform float uTime;','float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}','float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}','void main(){','vec2 uv=vUv;','float w1=n(uv*6.+vec2(uTime*.35,0.));','float w2=n(uv*11.-vec2(0.,uTime*.28));','float rip=smoothstep(.35,.7,w1*.55+w2*.45);','vec2 q=uv-.5;float edge=smoothstep(.52,.12,length(q));','vec3 deep=vec3(.04,.32,.42);vec3 mid=vec3(.18,.62,.68);vec3 lit=vec3(.72,.95,.96);','vec3 col=mix(deep,mid,rip);col=mix(col,lit,pow(rip,2.)*.55);','float spark=smoothstep(.82,.98,n(uv*30.+uTime))*edge;','col+=vec3(1.,.98,.9)*spark*.55;','gl_FragColor=vec4(col, .58+.28*edge);','}'].join('\n')});
// Outer ring
// outer ring removed - clean flat grass
// Border stones
// border removed - clean grass

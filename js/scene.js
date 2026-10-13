// Sahne: yardimcilar, ses, hava, gece/gunduz, kamera ve Three.js dunyasi.
// ── HELPERS ──────────────────────────────────────────────────────────────────
function showToast(m){var e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show');},1800);}
function showSave(){var e=document.getElementById('saveInd');e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show');},1800);}

// ── AUDIO ────────────────────────────────────────────────────────────────────
var _ac=null,_master=null,_sndN=0,_amb=null,_muted=localStorage.getItem('gdn_mute')==='1';
function canHear(){if(_muted)return false;if(document.visibilityState==='hidden')return false;if(typeof isLoading!=='undefined'&&isLoading)return false;return true;}
function ac(){if(!_ac){_ac=new(window.AudioContext||window.webkitAudioContext)();_master=_ac.createGain();_master.gain.value=_muted?0:1;_master.connect(_ac.destination);}if(!_muted&&_ac.state==='suspended')_ac.resume();return _ac;}
function tone(f,t,d,v,dl){if(!canHear())return;try{var c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(_master);o.type=t||'sine';o.frequency.setValueAtTime(f,c.currentTime+(dl||0));g.gain.setValueAtTime(v||.1,c.currentTime+(dl||0));g.gain.exponentialRampToValueAtTime(.001,c.currentTime+(dl||0)+d);o.start(c.currentTime+(dl||0));o.stop(c.currentTime+(dl||0)+d);_sndN++;}catch(e){}}
function sndWater(){if(!canHear())return;try{var c=ac(),b=c.createBuffer(1,c.sampleRate*.4,c.sampleRate),da=b.getChannelData(0);for(var i=0;i<da.length;i++)da[i]=(Math.random()*2-1)*.25;var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.value=700;g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.4);s.buffer=b;s.connect(f);f.connect(g);g.connect(_master);s.start();s.stop(c.currentTime+.4);_sndN++;}catch(e){}tone(520,'sine',.25,.07,.05);tone(680,'sine',.18,.05,.12);}
function sndPlant(){tone(440,'sine',.12,.09);tone(554,'sine',.12,.07,.13);tone(659,'sine',.2,.09,.25);}
function sndBug(){tone(880,'sine',.07,.06);tone(1100,'sine',.07,.06,.1);tone(880,'sine',.07,.06,.2);}
function sndKill(){tone(220,'sawtooth',.13,.12);tone(160,'sawtooth',.16,.09,.13);}
function sndLvl(){[523,659,784,1047].forEach(function(f,i){tone(f,'sine',.26,.12,i*.12);});}
function sndTask(){tone(784,'sine',.1,.09);tone(1047,'sine',.16,.09,.14);}
function sndBird(){[[880,0],[1100,.13],[880,.26],[1320,.4],[1100,.53]].forEach(function(n){tone(n[0],'sine',.09,.03,n[1]);});}
function sndCoin(){tone(880,'sine',.1,.1);tone(1100,'sine',.15,.08,.12);tone(1320,'sine',.2,.08,.25);}
function sndPet(){tone(520,'sine',.1,.07);tone(640,'sine',.14,.06,.1);}
function sndRain(){tone(740,'sine',.2,.04);tone(880,'sine',.25,.03,.12);tone(660,'sine',.3,.03,.22);}
function daytime(){return !(dayPhase<.229||dayPhase>=.896);}
function ambTick(){if(!canHear()||!daytime())return;var ns=[330,392,440,494,523,587,659];if(Math.random()<.3)tone(ns[Math.floor(Math.random()*ns.length)],'sine',.55,.022+Math.random()*.025);if(Math.random()<.06)sndBird();}
function startAmb(){if(_amb)return;_amb=setInterval(ambTick,2800);}
function paintSound(){var b=document.getElementById('btnSnd');if(!b)return;b.textContent=_muted?'🔇':'🔊';b.classList.toggle('on',!_muted);}
function unlockAudio(){if(_muted)return;ac();startAmb();}
window.toggleSound=function(){_muted=!_muted;localStorage.setItem('gdn_mute',_muted?'1':'0');if(_master)_master.gain.value=_muted?0:1;paintSound();if(!_muted){ac();startAmb();}showToast(_muted?'Ses kapalı 🔇':'Ses açık 🔊');};
document.addEventListener('pointerdown',unlockAudio);
document.addEventListener('touchstart',unlockAudio);
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
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
  if(window.mLight){if(ph==='GÜNDÜZ'){mLight.color.setHex(0xfff5e0);mLight.intensity=1.6;}else if(ph==='ŞAFAK'){mLight.color.setHex(0xffaa66);mLight.intensity=.8;}else if(ph==='AKŞAM'){mLight.color.setHex(0xff6633);mLight.intensity=.6;}else{mLight.color.setHex(0xaabfff);mLight.intensity=.5;}}
  if(ph!==lastPN){var icons={GÜNDÜZ:'☀️',ŞAFAK:'🌅',AKŞAM:'🌇',GECE:'🌙'};document.getElementById('wIcon').textContent=icons[ph]||'☀️';if(ph==='ŞAFAK')showToast('🌅 Şafak söküyor...');else if(ph==='AKŞAM')showToast('🌇 Akşam oluyor...');else if(ph==='GECE')showToast('🌙 İyi geceler!');else if(ph==='GÜNDÜZ')showToast('☀️ Günaydın!');lastPN=ph;}
}
// ── PANEL TOGGLE ─────────────────────────────────────────────────────────────
var openP=null;
window.togglePanel=function(nm){if(placementMode){window.cancelPlace();return;}var ps={deco:'decoPanel',task:'taskPanel',stats:'statsPanel',shop:'shopPanel'},bs={deco:'btnDeco',task:'btnTask',stats:'btnStats',shop:'btnShop'};if(openP===nm){document.getElementById(ps[nm]).classList.remove('open');document.getElementById(bs[nm]).classList.remove('on');openP=null;}else{Object.keys(ps).forEach(function(k){document.getElementById(ps[k]).classList.remove('open');document.getElementById(bs[k]).classList.remove('on');});document.getElementById(ps[nm]).classList.add('open');document.getElementById(bs[nm]).classList.add('on');openP=nm;}};

// ── ORBIT CONTROLS ───────────────────────────────────────────────────────────
(function(){THREE.OrbitControls=function(obj,dom){this.object=obj;this.domElement=dom;this.enabled=true;this.target=new THREE.Vector3();this.enableDamping=true;this.dampingFactor=.04;this.enableZoom=true;this.zoomSpeed=.6;this.enableRotate=true;this.rotateSpeed=.45;this.enablePan=true;this.panSpeed=.6;this.minDistance=6;this.maxDistance=120;this.minPolarAngle=0;this.maxPolarAngle=Math.PI/2.12;var sc=this,ST={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TR:3,TDP:5},st=ST.NONE,EPS=1e-6,sph=new THREE.Spherical(),sphD=new THREE.Spherical(),scale=1,panOff=new THREE.Vector3(),zC=false,rS=new THREE.Vector2(),rE=new THREE.Vector2(),rD=new THREE.Vector2(),pS=new THREE.Vector2(),pE=new THREE.Vector2(),pD=new THREE.Vector2(),dS=new THREE.Vector2(),dE=new THREE.Vector2(),dDe=new THREE.Vector2();function gZS(){return Math.pow(.95,sc.zoomSpeed);}function rL(a){sphD.theta-=a;}function rU(a){sphD.phi-=a;}var pLV=new THREE.Vector3();function pL(d,m){pLV.setFromMatrixColumn(m,0);pLV.multiplyScalar(-d);panOff.add(pLV);}var pUV=new THREE.Vector3();function pU(d,m){pUV.setFromMatrixColumn(m,1);pUV.multiplyScalar(d);panOff.add(pUV);}var pV=new THREE.Vector3();function pan(dx,dy){if(sc.object.isPerspectiveCamera){var p=sc.object.position;pV.copy(p).sub(sc.target);var tD=pV.length()*Math.tan((sc.object.fov/2)*Math.PI/180);pL(2*dx*tD/sc.domElement.clientHeight,sc.object.matrix);pU(2*dy*tD/sc.domElement.clientHeight,sc.object.matrix);}}function dI(s){scale/=s;}function dO(s){scale*=s;}this.update=function(){var off=new THREE.Vector3(),q=new THREE.Quaternion().setFromUnitVectors(obj.up,new THREE.Vector3(0,1,0)),qi=q.clone().invert(),lP=new THREE.Vector3(),lQ=new THREE.Quaternion();return function(){var pos=sc.object.position;off.copy(pos).sub(sc.target);off.applyQuaternion(q);sph.setFromVector3(off);sph.theta+=sphD.theta;sph.phi+=sphD.phi;sph.phi=Math.max(sc.minPolarAngle,Math.min(sc.maxPolarAngle,sph.phi));sph.makeSafe();sph.radius*=scale;sph.radius=Math.max(sc.minDistance,Math.min(sc.maxDistance,sph.radius));sc.target.add(panOff);off.setFromSpherical(sph);off.applyQuaternion(qi);pos.copy(sc.target).add(off);sc.object.lookAt(sc.target);if(sc.enableDamping){sphD.theta*=(1-sc.dampingFactor);sphD.phi*=(1-sc.dampingFactor);panOff.multiplyScalar(1-sc.dampingFactor);}else{sphD.set(0,0,0);panOff.set(0,0,0);}scale=1;if(zC||lP.distanceToSquared(sc.object.position)>EPS||8*(1-lQ.dot(sc.object.quaternion))>EPS){lP.copy(sc.object.position);lQ.copy(sc.object.quaternion);zC=false;return true;}return false;};}();function mD(e){if(!sc.enabled)return;if(e.button===0){st=ST.ROTATE;rS.set(e.clientX,e.clientY);}else if(e.button===2){st=ST.PAN;pS.set(e.clientX,e.clientY);}document.addEventListener('mousemove',mM);document.addEventListener('mouseup',mU);}function mM(e){if(!sc.enabled)return;if(st===ST.ROTATE){rE.set(e.clientX,e.clientY);rD.subVectors(rE,rS).multiplyScalar(sc.rotateSpeed);rL(2*Math.PI*rD.x/sc.domElement.clientHeight);rU(2*Math.PI*rD.y/sc.domElement.clientHeight);rS.copy(rE);sc.update();}else if(st===ST.PAN){pE.set(e.clientX,e.clientY);pD.subVectors(pE,pS).multiplyScalar(sc.panSpeed);pan(pD.x,pD.y);pS.copy(pE);sc.update();}}function mU(){document.removeEventListener('mousemove',mM);document.removeEventListener('mouseup',mU);st=ST.NONE;}function wh(e){if(!sc.enabled)return;e.deltaY<0?dO(gZS()):dI(gZS());sc.update();e.preventDefault();}function tS(e){if(e.touches.length===1){st=ST.TR;rS.set(e.touches[0].clientX,e.touches[0].clientY);}else if(e.touches.length===2){st=ST.TDP;var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;dS.set(0,Math.sqrt(dx*dx+dy*dy));}}function tM(e){e.preventDefault();if(st===ST.TR&&e.touches.length===1){rE.set(e.touches[0].clientX,e.touches[0].clientY);rD.subVectors(rE,rS).multiplyScalar(sc.rotateSpeed);rL(2*Math.PI*rD.x/sc.domElement.clientHeight);rU(2*Math.PI*rD.y/sc.domElement.clientHeight);rS.copy(rE);sc.update();}else if(st===ST.TDP&&e.touches.length===2){var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;dE.set(0,Math.sqrt(dx*dx+dy*dy));dDe.set(0,Math.pow(dE.y/dS.y,sc.zoomSpeed));dI(dDe.y);dS.copy(dE);sc.update();}}function tE(){st=ST.NONE;}function cM(e){if(!sc.enabled)return;e.preventDefault();}dom.addEventListener('contextmenu',cM,false);dom.addEventListener('mousedown',mD,false);dom.addEventListener('wheel',wh,{passive:false});dom.addEventListener('touchstart',tS,{passive:false});dom.addEventListener('touchend',tE,false);dom.addEventListener('touchmove',tM,{passive:false});this.update();};})();

// ── SCENE ────────────────────────────────────────────────────────────────────
var scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0a1520, 0.005);
var camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,5000);
camera.position.set(22,16,22);
var isMobile=window.innerWidth<768;var renderer=new THREE.WebGLRenderer({antialias:!isMobile,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
renderer.shadowMap.enabled=false;
document.body.appendChild(renderer.domElement);
var controls=new THREE.OrbitControls(camera,renderer.domElement);
window.resetCamera=function(){if(placementMode){window.cancelPlace();return;}camera.position.set(22,16,22);controls.target.set(0,0,0);controls.update();showToast('Kamera sıfırlandı');};

// Sky
var skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uTime:{value:0},uNight:{value:1}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:['varying vec3 vP;uniform float uTime,uNight;','float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}','float n2(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),u.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),u.x),u.y);}','void main(){vec3 d=normalize(vP);float up=clamp(d.y,0.,1.),hz=1.-up;','vec3 nc=mix(mix(vec3(.01,.02,.08),vec3(.04,.06,.18),smoothstep(0.,.5,up)),vec3(.10,.04,.22),pow(hz,3.));','vec3 dc=mix(vec3(.4,.65,1.),vec3(.75,.88,1.),up);','vec3 col=mix(dc,nc,uNight);','vec2 uv=vec2(atan(d.z,d.x)/6.28,d.y)*3.;','float nb=n2(uv*2.5+uTime*.008)*n2(uv*5.-uTime*.005);','nb=smoothstep(.25,.6,nb)*up*.55*uNight;','col+=mix(vec3(.15,.03,.35),vec3(.02,.10,.40),n2(uv*1.5))*nb;','gl_FragColor=vec4(col,1.);}'].join('\n')});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(800,32,20),skyMat));
// Stars
(function(){var cnt=1200,pos=new Float32Array(cnt*3),sz=new Float32Array(cnt),br=new Float32Array(cnt);for(var i=0;i<cnt;i++){var th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()),r=380;pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.abs(Math.cos(ph))+5;pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);sz[i]=.5+Math.random()*2.5;br[i]=Math.random();}var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aSize',new THREE.BufferAttribute(sz,1));geo.setAttribute('aBright',new THREE.BufferAttribute(br,1));window._sMat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uPR:{value:Math.min(devicePixelRatio,2)},uNight:{value:1}},vertexShader:'attribute float aSize,aBright;varying float vB;uniform float uTime,uPR,uNight;void main(){vB=aBright*uNight;vec4 mv=modelViewMatrix*vec4(position,1.);float tw=.7+.3*sin(uTime*2.+aBright*31.4);gl_PointSize=aSize*uPR*tw*(300./-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying float vB;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=smoothstep(1.,0.,d)*(.5+.5*vB);gl_FragColor=vec4(mix(vec3(.7,.8,1.),vec3(1.,.95,.85),vB),a);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});scene.add(new THREE.Points(geo,window._sMat));})();
// Moon/Sun
(function(){var moon=new THREE.Mesh(new THREE.SphereGeometry(8,24,24),new THREE.MeshStandardMaterial({color:0xdde8ff,roughness:.95,emissive:0x8899cc,emissiveIntensity:.25}));moon.position.set(120,80,140);scene.add(moon);var mh=new THREE.Mesh(new THREE.SphereGeometry(14,16,16),new THREE.MeshBasicMaterial({color:0x6677bb,transparent:true,opacity:.06,side:THREE.BackSide}));mh.position.copy(moon.position);scene.add(mh);window._sun=new THREE.Mesh(new THREE.SphereGeometry(6,16,16),new THREE.MeshBasicMaterial({color:0xffee88}));window._sun.position.set(100,90,-80);scene.add(window._sun);window._sHalo=new THREE.Mesh(new THREE.SphereGeometry(10,16,16),new THREE.MeshBasicMaterial({color:0xffcc44,transparent:true,opacity:.08,side:THREE.BackSide}));window._sHalo.position.copy(window._sun.position);scene.add(window._sHalo);})();
// Lights
scene.add(new THREE.AmbientLight(0x1a2a4a,1.0));
window.mLight=new THREE.DirectionalLight(0xaabfff,.9);mLight.position.set(12,28,14);mLight.castShadow=false;mLight.shadow.mapSize.width=1024;mLight.shadow.mapSize.height=1024;scene.add(mLight);
var fL=new THREE.DirectionalLight(0x220a44,.4);fL.position.set(-15,8,-12);scene.add(fL);
var gL=new THREE.PointLight(0x002211,.6,30);gL.position.set(0,2,0);scene.add(gL);
// Ground
var gndM=new THREE.ShaderMaterial({uniforms:{},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:['varying vec2 vUv;','float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}','float n2(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),u.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),u.x),u.y);}','float fbm(vec2 p){return n2(p)*.5+n2(p*2.1)*.25+n2(p*4.3)*.15+n2(p*8.7)*.1;}','void main(){vec2 fuv=vUv*14.;float n=fbm(fuv);float dist=length(vUv-.5)*2.;float pz=smoothstep(.75,.55,dist);vec3 col=mix(vec3(.10,.07,.04),vec3(.05,.09,.04),n);col=mix(col,vec3(.08,.10,.05),pz*.6);col=mix(col,vec3(.05,.02,.04),smoothstep(.40,.50,dist));gl_FragColor=vec4(col,1.);}'].join('\n'),side:THREE.FrontSide});
// Big flat green ground
var gnd=new THREE.Mesh(new THREE.CircleGeometry(120,48),new THREE.MeshStandardMaterial({color:0x2a4a1a,roughness:.95}));
gnd.rotation.x=-Math.PI/2;scene.add(gnd);
// Inner garden area slightly different color
var innerGnd=new THREE.Mesh(new THREE.CircleGeometry(14,32),gndM);
innerGnd.rotation.x=-Math.PI/2;innerGnd.position.y=.001;scene.add(innerGnd);
// Outer ring
// outer ring removed - clean flat grass
// Border stones
// border removed - clean grass

// appUpdate.js - Otomatik Güncelleme Kontrolcüsü ve Bilgilendirme Modalı
// Oyuna girerken arka planda yeni sürümü denetler; güncelleme varsa kullanıcıyı uyarır.
(function(){
  'use strict';

  var CURRENT_VERSION = '2.2.0';
  var CURRENT_BUILD = 16;
  var UPDATE_ENDPOINT = 'https://raw.githubusercontent.com/BatuhanKlcky/sanalbahce/main/version.json';

  window.CURRENT_APP_VERSION = CURRENT_VERSION;
  window.CURRENT_APP_BUILD = CURRENT_BUILD;

  function parseSemver(v){
    var cleaned = String(v || '').replace(/[^0-9.]/g, '');
    var parts = cleaned.split('.').map(function(n){ return parseInt(n, 10) || 0; });
    while(parts.length < 3) parts.push(0);
    return parts;
  }

  function isNewerVersion(remoteVer, remoteBuild, curVer, curBuild){
    if(remoteBuild != null && curBuild != null && Number(remoteBuild) > Number(curBuild)){
      return true;
    }
    var r = parseSemver(remoteVer);
    var c = parseSemver(curVer);
    for(var i = 0; i < 3; i++){
      if(r[i] > c[i]) return true;
      if(r[i] < c[i]) return false;
    }
    return false;
  }

  function showUpdateModal(info){
    var existing = document.getElementById('appUpdateModal');
    if(existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'appUpdateModal';
    overlay.className = 'aum-overlay';

    var notesHtml = '';
    if(info && info.notes && Array.isArray(info.notes)){
      notesHtml = '<ul class="aum-notes">' + info.notes.map(function(n){
        return '<li><span class="aum-bullet">✦</span> <span>' + n + '</span></li>';
      }).join('') + '</ul>';
    }

    var targetUrl = (info && (info.apkUrl || info.downloadUrl || info.updateUrl)) ||
      'https://github.com/BatuhanKlcky/sanalbahce/releases/latest';

    overlay.innerHTML = `
      <div class="aum-card" role="dialog" aria-modal="true">
        <div class="aum-glow"></div>
        <div class="aum-header">
          <div class="aum-icon-wrap">
            <span class="aum-rocket">🚀</span>
          </div>
          <div class="aum-title-wrap">
            <div class="aum-badge">YENİ GÜNCELLEME MEVCUT</div>
            <h2 class="aum-title">Sanal Bahçe v${info.version || 'Yeni'}</h2>
          </div>
        </div>

        <div class="aum-body">
          <div class="aum-ver-row">
            <span class="aum-ver-chip current">Mevcut: v${CURRENT_VERSION}</span>
            <span class="aum-arrow">➔</span>
            <span class="aum-ver-chip next">Yeni: v${info.version || 'Son Sürüm'}</span>
          </div>

          <div class="aum-desc">
            ${info.title ? '<div class="aum-release-title">' + info.title + '</div>' : ''}
            <div class="aum-notes-title">✨ Neler Yeni?</div>
            ${notesHtml}
          </div>
        </div>

        <div class="aum-actions">
          <button type="button" class="aum-btn primary" id="aumUpdateBtn">
            <span>🚀 Hemen Güncelle</span>
          </button>
          <button type="button" class="aum-btn secondary" id="aumLaterBtn">
            <span>Daha Sonra</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fade-in animation
    requestAnimationFrame(function(){
      overlay.classList.add('visible');
    });

    var updateBtn = overlay.querySelector('#aumUpdateBtn');
    var laterBtn = overlay.querySelector('#aumLaterBtn');

    if(updateBtn){
      updateBtn.addEventListener('click', function(e){
        e.preventDefault();
        try {
          if(window.triggerHaptic) window.triggerHaptic('success');
        } catch(err){}
        window.open(targetUrl, '_blank');
        overlay.classList.remove('visible');
        setTimeout(function(){ overlay.remove(); }, 250);
      });
    }

    if(laterBtn){
      laterBtn.addEventListener('click', function(e){
        e.preventDefault();
        try {
          if(window.triggerHaptic) window.triggerHaptic('light');
        } catch(err){}
        try {
          sessionStorage.setItem('dismissed_update_' + info.version, '1');
        } catch(err){}
        overlay.classList.remove('visible');
        setTimeout(function(){ overlay.remove(); }, 250);
      });
    }
  }

  function fetchVersionJson(cb){
    var candidates = [
      UPDATE_ENDPOINT + '?cb=' + Date.now(),
      './version.json?cb=' + Date.now()
    ];
    var idx = 0;
    function tryNext(){
      if(idx >= candidates.length){
        cb(new Error('Update check failed'), null);
        return;
      }
      var url = candidates[idx++];
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 5000;
      xhr.onload = function(){
        if(xhr.status >= 200 && xhr.status < 300){
          try {
            var data = JSON.parse(xhr.responseText);
            cb(null, data);
          } catch(e){
            tryNext();
          }
        } else {
          tryNext();
        }
      };
      xhr.onerror = function(){ tryNext(); };
      xhr.ontimeout = function(){ tryNext(); };
      try {
        xhr.send(null);
      } catch(e){
        tryNext();
      }
    }
    tryNext();
  }

  window.checkAppUpdate = function(opts){
    opts = opts || {};
    var isSilent = opts.silent !== false;

    fetchVersionJson(function(err, data){
      if(err || !data){
        if(!isSilent && typeof showToast === 'function'){
          showToast('⚠️ Güncelleme sunucusuna bağlanılamadı.');
        }
        return;
      }

      var remoteVer = data.version || '0.0.0';
      var remoteBuild = data.versionCode || 0;

      if(isNewerVersion(remoteVer, remoteBuild, CURRENT_VERSION, CURRENT_BUILD)){
        // If dismissed in this session and silent mode, don't nag repeatedly
        try {
          if(isSilent && sessionStorage.getItem('dismissed_update_' + remoteVer) === '1'){
            return;
          }
        } catch(e){}

        showUpdateModal(data);
      } else {
        if(!isSilent && typeof showToast === 'function'){
          showToast('✅ Sanal Bahçe en güncel sürümde! (v' + CURRENT_VERSION + ')');
        }
      }
    });
  };

  // Inject CSS Styles for Modal
  function injectStyles(){
    if(document.getElementById('appUpdateStyles')) return;
    var style = document.createElement('style');
    style.id = 'appUpdateStyles';
    style.textContent = `
      .aum-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(7, 12, 10, 0.78);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 16px;
      }
      .aum-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }
      .aum-card {
        position: relative;
        width: 100%;
        max-width: 400px;
        background: linear-gradient(145deg, rgba(22, 32, 26, 0.96), rgba(14, 20, 16, 0.98));
        border: 1px solid rgba(74, 222, 128, 0.28);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65), 0 0 32px rgba(34, 197, 94, 0.15);
        border-radius: 26px;
        padding: 22px;
        color: #f1f5f9;
        overflow: hidden;
        transform: scale(0.92) translateY(12px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .aum-overlay.visible .aum-card {
        transform: scale(1) translateY(0);
      }
      .aum-glow {
        position: absolute;
        top: -40px;
        right: -40px;
        width: 130px;
        height: 130px;
        background: radial-gradient(circle, rgba(74, 222, 128, 0.35) 0%, rgba(74, 222, 128, 0) 70%);
        pointer-events: none;
      }
      .aum-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 16px;
      }
      .aum-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.12));
        border: 1px solid rgba(74, 222, 128, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
        flex-shrink: 0;
      }
      .aum-title-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .aum-badge {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #4ade80;
      }
      .aum-title {
        margin: 0;
        font-size: 19px;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1.2;
      }
      .aum-ver-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        background: rgba(0, 0, 0, 0.3);
        padding: 6px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .aum-ver-chip {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 8px;
      }
      .aum-ver-chip.current {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
      }
      .aum-ver-chip.next {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.35);
      }
      .aum-arrow {
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
      }
      .aum-desc {
        background: rgba(15, 23, 20, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 12px 14px;
        margin-bottom: 20px;
        max-height: 170px;
        overflow-y: auto;
      }
      .aum-release-title {
        font-size: 13px;
        font-weight: 700;
        color: #facc15;
        margin-bottom: 8px;
      }
      .aum-notes-title {
        font-size: 11px;
        font-weight: 700;
        color: #cbd5e1;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .aum-notes {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .aum-notes li {
        font-size: 12px;
        color: #e2e8f0;
        line-height: 1.4;
        display: flex;
        align-items: flex-start;
        gap: 6px;
      }
      .aum-bullet {
        color: #38bdf8;
        font-size: 10px;
        line-height: 1.5;
        flex-shrink: 0;
      }
      .aum-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .aum-btn {
        width: 100%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.02em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: transform 0.16s ease, filter 0.16s ease;
        border: none;
        -webkit-tap-highlight-color: transparent;
      }
      .aum-btn:active {
        transform: scale(0.97);
      }
      .aum-btn.primary {
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: #ffffff;
        box-shadow: 0 4px 18px rgba(34, 197, 94, 0.35);
        border: 1px solid rgba(134, 239, 172, 0.4);
      }
      .aum-btn.secondary {
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-check on entry after game scene loads
  function startAutoCheck(){
    injectStyles();
    // Delay 3 seconds so game assets & intro sequence finish smoothly
    setTimeout(function(){
      window.checkAppUpdate({ silent: true });
    }, 3200);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startAutoCheck);
  } else {
    startAutoCheck();
  }
})();

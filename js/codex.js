// Sanal Bahçe - Bitki ve Bahçe Keşif Rehberi (Herbarium / Garden Codex)
(function(){
  var CODEX_DATA = [
    // Çiçekler
    { id:'rose', cat:'flower', name:'Gül (Rose)', emoji:'🌹', rarity:'Yaygın', desc:'Zarif kokulu, kat kat kadife taç yapraklı klasik bahçe çiçeği.', tip:'Sabah güneşi ve düzenli sulama ile hızla filizlenir.' },
    { id:'tulip', cat:'flower', name:'Lale (Tulip)', emoji:'🌷', rarity:'Yaygın', desc:'Kadeh formunda pürüzsüz yapraklı, baharın habercisi soğanlı bitki.', tip:'Hafif nemli toprakta canlı renklerini korur.' },
    { id:'lotus', cat:'flower', name:'Lotus (Nilüfer)', emoji:'🪷', rarity:'Nadir', desc:'Durgun suların üzerinde saf ve dingin açan kutsal su çiçeği.', tip:'Bol su ve berrak havayı çok sever.' },
    { id:'daisy', cat:'flower', name:'Papatya (Daisy)', emoji:'🌼', rarity:'Yaygın', desc:'Sarı göbekli, neşeli beyaz taç yapraklarıyla bahçeye canlılık katar.', tip:'Dost böceklerin ve arıların en sevdiği çiçek.' },
    { id:'sunflower', cat:'flower', name:'Ayçiçeği (Sunflower)', emoji:'🌻', rarity:'Nadir', desc:'Gün boyu yüzünü güneşe dönen devasa ve neşeli çiçek.', tip:'Güneşli saatlerde hızlı boy atar.' },
    { id:'peony', cat:'flower', name:'Şakayık (Peony)', emoji:'🌸', rarity:'Efsanevi', desc:'Bolluk ve zarafetin simgesi, ipeksi tombul çiçek başı.', tip:'Tam çiçek evresinde bahçe skoruna yüksek katkı sağlar.' },

    // Hasat Ürünleri
    { id:'tomato', cat:'crop', name:'Salkım Domates', emoji:'🍅', rarity:'Yaygın', desc:'Sulu ve kırmızı lezzetli organik domates.', tip:'90 saniyede hasada hazır hale gelir, 15 coin kazandırır.' },
    { id:'strawberry', cat:'crop', name:'Yaban Çileği', emoji:'🍓', rarity:'Yaygın', desc:'Tatlı, minik ve hoş kokulu meyveler.', tip:'60 saniyede en hızlı büyüyen meyvedir, 10 coin kazandırır.' },
    { id:'cucumber', cat:'crop', name:'Çıtır Salatalık', emoji:'🥒', rarity:'Nadir', desc:'Kütür kütür, serinletici taze salatalık.', tip:'120 saniyede olgunlaşır, 20 coin kazandırır.' },
    { id:'pepper', cat:'crop', name:'Köy Biberi', emoji:'🌶️', rarity:'Yaygın', desc:'Güneşte kızaran lezzetli biber.', tip:'75 saniyede toplanabilir, 18 coin kazandırır.' },
    { id:'carrot', cat:'crop', name:'Tatlı Havuç', emoji:'🥕', rarity:'Yaygın', desc:'Toprağın derinliklerinde olgunlaşan vitamin deposu.', tip:'80 saniyede olgunlaşır, 12 coin kazandırır.' },

    // Efsanevi Yapılar & Canlılar
    { id:'farmer', cat:'special', name:'Çiftçi Ekibi', emoji:'🧑‍🌾', rarity:'Efsanevi', desc:'Bahçende dolaşan, bitkileri sulayan ve ürünleri toplayan sevimli çiftçiler.', tip:'Çiftçi evini yükselterek daha fazla işçiyi göreve çağırabilirsin.' },
    { id:'dragon_egg', cat:'special', name:'Ejderha Yumurtası', emoji:'🥚', rarity:'Efsanevi', desc:'Geceleri mistik bir parıltı yayan kadim emanet.', tip:'Mağazanın Özel sekmesinden edinilebilir.' },
    { id:'moonflower', cat:'special', name:'Ay Çiçeği', emoji:'🌙', rarity:'Efsanevi', desc:'Sadece geceleri ay ışığında parıldayan gizemli bitki.', tip:'Karanlık çöktüğünde etrafına yumuşak mavi ışık saçar.' },
    { id:'golden_tree', cat:'special', name:'Altın Ağaç', emoji:'🌳', rarity:'Efsanevi', desc:'Yaprakları saf altından dökülmüş bereket ağacı.', tip:'Bahçenin prestij ve puanını katlar.' }
  ];

  // UI modalını oluştur
  function injectCodexModal(){
    if(document.getElementById('codexModal')) return;

    var modal = document.createElement('div');
    modal.id = 'codexModal';
    modal.className = 'spanel';
    modal.innerHTML = [
      '<div class="spanel-handle"></div>',
      '<div class="spanel-head">',
      '  <h2>📖 Bahçe Keşif Rehberi</h2>',
      '  <button class="spanel-close" onclick="window.togglePanel(\'codex\');window.triggerHaptic(\'light\')">×</button>',
      '</div>',
      '<div class="codex-tabs" style="display:flex;gap:8px;margin-bottom:12px;">',
      '  <button class="tab-btn on" onclick="window.filterCodex(\'all\', this)">Tümü</button>',
      '  <button class="tab-btn" onclick="window.filterCodex(\'flower\', this)">🌸 Çiçekler</button>',
      '  <button class="tab-btn" onclick="window.filterCodex(\'crop\', this)">🥕 Hasat</button>',
      '  <button class="tab-btn" onclick="window.filterCodex(\'special\', this)">✨ Özel</button>',
      '</div>',
      '<div id="codexList" class="codex-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;max-height:60vh;overflow-y:auto;padding-right:4px;">',
      '</div>'
    ].join('\n');

    document.body.appendChild(modal);

    // CSS ekle
    var st = document.createElement('style');
    st.textContent = [
      '.codex-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; transition: transform .18s ease, background .18s; }',
      '.codex-card:active { transform: scale(0.96); background: rgba(255,255,255,0.12); }',
      '.codex-icon { font-size: 32px; margin-bottom: 6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); }',
      '.codex-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }',
      '.codex-rarity { font-size: 10px; padding: 2px 7px; border-radius: 8px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }',
      '.rarity-Yaygın { background: rgba(90, 160, 90, 0.25); color: #8ef59b; border: 1px solid rgba(90, 160, 90, 0.4); }',
      '.rarity-Nadir { background: rgba(70, 130, 240, 0.25); color: #8ecdff; border: 1px solid rgba(70, 130, 240, 0.4); }',
      '.rarity-Efsanevi { background: rgba(220, 160, 40, 0.25); color: #ffd666; border: 1px solid rgba(220, 160, 40, 0.4); }',
      '.codex-desc { font-size: 11px; color: #d0c8b8; line-height: 1.35; margin-bottom: 6px; }',
      '.codex-tip { font-size: 10px; color: #a4dd92; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 4px 6px; width: 100%; box-sizing: border-box; }'
    ].join('\n');
    document.head.appendChild(st);
  }

  window.renderCodex = function(filterCategory){
    var list = document.getElementById('codexList');
    if(!list) return;
    list.innerHTML = '';

    CODEX_DATA.forEach(function(item){
      if(filterCategory && filterCategory !== 'all' && item.cat !== filterCategory) return;
      var card = document.createElement('div');
      card.className = 'codex-card';
      card.innerHTML = [
        '<div class="codex-icon">' + item.emoji + '</div>',
        '<div class="codex-title">' + item.name + '</div>',
        '<div class="codex-rarity rarity-' + item.rarity + '">' + item.rarity + '</div>',
        '<div class="codex-desc">' + item.desc + '</div>',
        '<div class="codex-tip">💡 ' + item.tip + '</div>'
      ].join('');
      card.onclick = function(){
        if(typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        if(typeof showToast === 'function') showToast(item.name + ': ' + item.tip);
      };
      list.appendChild(card);
    });
  };

  window.filterCodex = function(cat, btn){
    if(typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
    var tabs = document.querySelectorAll('.codex-tabs .tab-btn');
    tabs.forEach(function(t){ t.classList.remove('on'); });
    if(btn) btn.classList.add('on');
    window.renderCodex(cat);
  };

  // Hoşgeldin Özeti Modal (Offline Welcome Summary)
  function showWelcomeSummary(elapsedSec){
    if(elapsedSec < 90) return; // En az 1.5 dakika geçmişse göster
    var minutes = Math.floor(elapsedSec / 60);
    var hours = (minutes / 60).toFixed(1);
    var timeStr = minutes >= 60 ? hours + ' saat' : minutes + ' dakika';

    var readyCount = 0;
    if(typeof harvestItems !== 'undefined') readyCount = harvestItems.filter(function(h){ return h.stage >= 2; }).length;
    var flowerCount = (typeof flowers !== 'undefined') ? flowers.length : 0;

    var overlay = document.createElement('div');
    overlay.id = 'welcomeModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(12,16,10,0.72);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .25s ease;';

    var card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,rgba(40,46,32,0.95),rgba(20,24,18,0.98));border:1px solid rgba(255,255,255,0.18);border-radius:24px;padding:24px;max-width:340px;width:100%;color:#fff;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,0.5);';

    card.innerHTML = [
      '<div style="font-size:42px;margin-bottom:8px;">🏡🌾</div>',
      '<h2 style="font-size:18px;margin:0 0 6px 0;font-weight:700;color:#f0f8ea;">Tekrar Hoş Geldin!</h2>',
      '<p style="font-size:12px;color:#cbd9bf;margin:0 0 16px 0;line-height:1.4;">Sen yokken bahçende zaman akmaya devam etti (' + timeStr + ' geçti).</p>',
      '<div style="background:rgba(255,255,255,0.06);border-radius:14px;padding:12px;margin-bottom:18px;text-align:left;font-size:13px;line-height:1.7;">',
      '  <div>🌱 <b>' + flowerCount + '</b> bitki büyümeye devam etti</div>',
      '  <div>🧺 <b>' + readyCount + '</b> ürün hasada hazır duruma geldi</div>',
      '  <div>🧑‍🌾 Çiftçilerin bahçeni düzenli tuttu</div>',
      '</div>',
      '<button id="btnWelcomeCollect" style="width:100%;background:linear-gradient(135deg,#78b84e,#4e9428);color:#fff;border:none;border-radius:14px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 16px rgba(78,148,40,0.35);">Bahçeye Devam Et ✨</button>'
    ].join('\n');

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('btnWelcomeCollect').onclick = function(){
      if(typeof window.triggerHaptic === 'function') window.triggerHaptic('medium');
      if(typeof sndLvl === 'function') sndLvl();
      overlay.style.animation = 'fadeOut .2s ease forwards';
      setTimeout(function(){ overlay.remove(); }, 200);
    };
  }
  window.showWelcomeSummary = showWelcomeSummary;

  // DOMContentLoaded / Script Load
  setTimeout(function(){
    injectCodexModal();
    window.renderCodex('all');
  }, 150);

})();

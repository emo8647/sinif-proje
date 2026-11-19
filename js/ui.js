/* Nexus · arayüz çekirdeği: tema, ses, toast, katmanlar */
(function (N) {
  var ui = N.ui = {};
  var $ = N.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = N.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function setVH(){ document.documentElement.style.setProperty('--vh', (window.innerHeight*0.01)+'px'); }
  setVH(); window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', function(){ setTimeout(setVH, 240); });

  /* ── tema ── */
  ui.applyTheme = function () {
    var t = N.DB.settings.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    N.DB.settings.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    var mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', t === 'light' ? '#fafafa' : '#000000');
  };
  ui.toggleTheme = function () {
    N.DB.settings.theme = N.DB.settings.theme === 'light' ? 'dark' : 'light';
    N.save(); ui.applyTheme(); ui.beep('ok'); ui.haptic(6);
    ui.toast(N.DB.settings.theme === 'light' ? 'Aydınlık mod' : 'Karanlık mod', 'info');
  };

  /* ── ses ── */
  var AC = null;
  function ctx(){ if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } }
    if(AC && AC.state==='suspended') AC.resume(); return AC; }
  ui.beep = function (kind) {
    if (!N.DB || !N.DB.settings.sound) return;
    var c = ctx(); if (!c) return;
    var M = { like:[680,1020,.09,'sine',.05], post:[440,900,.16,'triangle',.055], tick:[920,920,.03,'sine',.024],
      open:[540,720,.07,'sine',.03], del:[320,150,.14,'sawtooth',.038], ok:[740,1100,.11,'sine',.045],
      err:[260,180,.18,'square',.035] }[kind] || [620,620,.05,'sine',.026];
    var t=c.currentTime, g=c.createGain(), o=c.createOscillator();
    o.type=M[3]; o.frequency.setValueAtTime(M[0],t);
    o.frequency.exponentialRampToValueAtTime(Math.max(60,M[1]), t+M[2]);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(M[4], t+.012);
    g.gain.exponentialRampToValueAtTime(.0001, t+M[2]);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+M[2]+.02);
  };
  ui.haptic = function(ms){ if(navigator.vibrate && N.DB.settings.sound){ try{ navigator.vibrate(ms||8); }catch(e){} } };
  ui.paintSound = function () {
    var b = $('#soundBtn'); if (!b) return;
    b.innerHTML = N.ico(N.DB.settings.sound ? 'vol' : 'volX');
    b.classList.toggle('act', N.DB.settings.sound);
    b.title = N.DB.settings.sound ? 'Ses açık — kapat' : 'Ses kapalı — aç';
    b.setAttribute('aria-pressed', String(N.DB.settings.sound));
  };
  ui.toggleSound = function () {
    N.DB.settings.sound = !N.DB.settings.sound; N.save(); ui.paintSound();
    $$('video').forEach(function(v){ v.muted = !N.DB.settings.sound; });
    $$('[data-act="reelMute"]').forEach(function(b){ b.innerHTML = N.ico(N.DB.settings.sound?'vol':'volX'); });
    if (N.DB.settings.sound) ui.beep('ok');
    ui.toast(N.DB.settings.sound ? 'Ses açık' : 'Ses kapalı', 'info');
  };
  window.addEventListener('pointerdown', function once(){ ctx(); window.removeEventListener('pointerdown', once); }, { once:true });

  /* ── toast ── */
  ui.toast = function (msg, kind, action) {
    var box = $('#toasts'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || 'ok');
    var i = { ok:'check', info:'sparkle', warn:'warn', err:'x' }[kind || 'ok'];
    el.innerHTML = '<span class="ti">' + N.ico(i) + '</span><span>' + N.esc(msg) + '</span>';
    function kill(){ if(!el.parentNode) return; el.classList.add('out'); setTimeout(function(){ el.remove(); }, 280); }
    if (action) {
      var b = document.createElement('button'); b.className = 'ta'; b.textContent = action.label;
      b.onclick = function(){ action.fn(); kill(); }; el.appendChild(b);
    }
    box.appendChild(el);
    var tm = setTimeout(kill, action ? 6000 : 2800);
    el.addEventListener('click', function(e){ if(e.target.classList.contains('ta')) return; clearTimeout(tm); kill(); });
    while (box.children.length > 3) box.firstChild.remove();
  };

  /* ── katmanlar ── */
  ui.lock = function(on){ document.body.style.overflow = on ? 'hidden' : ''; };
  ui.closeAll = function (silent) {
    $$('.panel,.sheet').forEach(function(e){ e.classList.remove('on'); });
    $('#lightbox').classList.remove('on');
    var em = $('#emojiPop'); if (em) em.classList.remove('on');
    if (!silent) { $('#scrim').classList.remove('on'); ui.lock(false); }
    if (N.reels && N.reels.onClose) N.reels.onClose();
  };
  ui.panel = function (sel) {
    ui.closeAll(true); $(sel).classList.add('on'); $('#scrim').classList.add('on'); ui.lock(true); ui.beep('open');
  };
  ui.sheet = function (title, html, footHTML) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    var f = $('#sheetFoot');
    if (footHTML) { f.innerHTML = footHTML; f.hidden = false; } else { f.innerHTML = ''; f.hidden = true; }
    ui.closeAll(true); $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); ui.lock(true); ui.beep('open');
  };
  ui.lightbox = function (src) { $('#lbImg').src = src; $('#lightbox').classList.add('on'); ui.lock(true); };

  /* ── yardımcılar ── */
  ui.rich = function (t) {
    return N.esc(t)
      .replace(/(^|\s)#([\wğüşıöçĞÜŞİÖÇ]+)/g, '$1<a class="tag" href="#/explore" data-act="tag" data-tag="$2">#$2</a>')
      .replace(/(^|\s)@([\w]+)/g, '$1<a href="#/profile/$2" data-act="handle" data-h="$2">@$2</a>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  };
  ui.sparks = function () {
    var s = '';
    for (var i = 0; i < 6; i++) { var a = i*60*Math.PI/180;
      s += '<i style="--dx:' + Math.round(Math.cos(a)*18) + 'px;--dy:' + Math.round(Math.sin(a)*18) + 'px"></i>'; }
    return s;
  };
  ui.empty = function (icon, title, sub, btn) {
    return '<div class="empty"><div class="ei">' + N.ico(icon) + '</div><h3>' + N.esc(title) + '</h3><p>' + N.esc(sub) + '</p>' + (btn || '') + '</div>';
  };
  ui.vf = function (u) { return u && u.verified ? '<span class="vf">' + N.ico('verified') + '</span>' : ''; };
  ui.copy = function (text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ ui.toast(msg||'Kopyalandı','ok'); },
        function(){ ui.fallbackCopy(text, msg); });
    } else ui.fallbackCopy(text, msg);
  };
  ui.fallbackCopy = function (text, msg) {
    var ta = document.createElement('textarea'); ta.value = text;
    ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ui.toast(msg||'Kopyalandı','ok'); } catch(e){ ui.toast('Kopyalanamadı','err'); }
    ta.remove();
  };
  ui.confirm = function (title, text, okLabel, onOk, danger) {
    ui.sheet(title,
      '<p style="font-size:14px;line-height:1.65;color:var(--text2);margin:4px 0 18px">' + N.esc(text) + '</p>' +
      '<div style="display:flex;gap:9px"><button class="btn ' + (danger?'dgr':'pri') + '" id="cfOk" style="flex:1">' + N.esc(okLabel) + '</button>' +
      '<button class="btn" data-close style="flex:1">Vazgeç</button></div>');
    $('#cfOk').onclick = function(){ ui.closeAll(); onOk(); };
  };
  ui.readImage = function (file, max, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var sc = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement('canvas');
        c.width = Math.round(im.width*sc); c.height = Math.round(im.height*sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', .8));
      };
      im.onerror = function(){ ui.toast('Görsel okunamadı','err'); };
      im.src = fr.result;
    };
    fr.onerror = function(){ ui.toast('Dosya okunamadı','err'); };
    fr.readAsDataURL(file);
  };
  ui.paintClock = function () {
    var d = new Date(), e = $('#iosTime');
    if (e) e.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
  };
})(window.NX);

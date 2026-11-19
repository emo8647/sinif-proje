/* Nexus · reels: Instagram resmî embed + kameradan çekim */
(function (N) {
  var R = N.reels = {}, ui = N.ui, $ = N.$, $$ = N.$$;
  var io = null, stream = null, rec = null, chunks = [], recTimer = null, recStart = 0, blobUrl = null, facing = 'user';

  R.parse = function (url) {
    var m = String(url).match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/i);
    return m ? m[1] : null;
  };

  /* ── görünüm ── */
  R.view = function () {
    var list = N.DB.posts.filter(function(p){ return p.reel; });
    if (!list.length) {
      return '<div class="reels-empty">' + ui.empty('reels', 'Henüz reels yok',
        'Ortadaki + butonundan kamerayla reels çek ya da bir Instagram reels bağlantısı yapıştır.',
        '<button class="btn ig" data-act="openCam">' + N.ico('plus') + 'Reels oluştur</button>') + '</div>';
    }
    var me = N.me();
    return '<div class="reels-shell"><div class="reels-track" id="reelsTrack">' + list.map(function (p, i) {
      var u = N.user(p.authorId), r = p.reel, ig = r.kind === 'embed';
      var liked = p.likes.indexOf(me.id) >= 0, saved = p.saves.indexOf(me.id) >= 0, fol = me.following.indexOf(u.id) >= 0;
      return '<section class="reel' + (i?' paused':'') + '" data-reel="' + p.id + '">' +
        '<div class="reel-media">' +
          (ig ? '<div class="ig-frame"><iframe src="' + r.src + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" title="Instagram reels" data-igf="' + p.id + '"></iframe>' +
                '<div class="ig-load" data-igl="' + p.id + '"><div><div class="spin" style="margin:0 auto 14px;border-top-color:#fff"></div><p>Instagram gönderisi yükleniyor…</p></div></div>' +
                '<div class="ig-fail" data-igx="' + p.id + '"><div><h4>Embed açılamadı</h4><p>Instagram bu gönderiyi gömülmesi için izin vermiyor olabilir ya da bağlantı özel.</p>' +
                '<a class="btn ig" href="' + r.ig + '" target="_blank" rel="noopener">' + N.ico('ext') + 'Instagram’da aç</a></div></div></div>'
              : '<video src="' + r.src + '" loop playsinline preload="metadata" muted data-rv="' + p.id + '"></video>') +
        '</div>' +
        '<div class="reel-shade"></div><div class="reel-play">' + N.ico('play') + '</div>' +
        '<div class="reel-top"><h2>Reels</h2><div class="rt">' +
          '<button class="rbtn" data-act="reelMute" aria-label="Ses">' + N.ico(N.DB.settings.sound?'vol':'volX') + '</button>' +
          '<button class="rbtn" data-act="openCam" aria-label="Reels ekle">' + N.ico('plus') + '</button></div></div>' +
        (ig ? '<span class="ig-badge">' + N.ico('ext') + 'Instagram embed</span>' : '') +
        '<div class="reel-body"><div class="reel-u"><img class="av a32" src="' + N.avatarOf(u) + '" alt="" data-act="go" data-to="#/profile/' + u.handle + '" style="cursor:pointer">' +
          '<b data-act="go" data-to="#/profile/' + u.handle + '" style="cursor:pointer">' + N.esc(u.handle) + '</b>' + ui.vf(u) +
          (u.id !== me.id ? '<button class="fb' + (fol?' on':'') + '" data-act="follow" data-u="' + u.id + '">' + (fol?'Takiptesin':'Takip et') + '</button>' : '') + '</div>' +
          '<div class="reel-cap" data-act="capToggle">' + ui.rich(p.text) + '</div>' +
          '<div class="reel-aud">' + N.ico('music') + '<span class="marq"><span>' + N.esc(r.audio) + ' &nbsp;·&nbsp; ' + N.esc(r.audio) + ' &nbsp;·&nbsp; </span></span></div></div>' +
        '<div class="reel-side">' +
          '<button class="rs like' + (liked?' on':'') + '" data-act="like" data-p="' + p.id + '">' + N.ico(liked?'heartF':'heart') + '<span class="rn">' + N.nf(p.likes.length) + '</span></button>' +
          '<button class="rs" data-act="comments" data-p="' + p.id + '">' + N.ico('comment') + '<span>' + N.nf(p.comments.length) + '</span></button>' +
          '<button class="rs" data-act="repost" data-p="' + p.id + '">' + N.ico('repost') + '<span>' + N.nf(p.reposts.length) + '</span></button>' +
          '<button class="rs' + (saved?' on':'') + '" data-act="save" data-p="' + p.id + '">' + N.ico(saved?'bookmarkF':'bookmark') + '<span>Kaydet</span></button>' +
          '<button class="rs" data-act="share" data-p="' + p.id + '">' + N.ico('send') + '<span>Paylaş</span></button>' +
          (p.authorId === me.id || me.role === 'admin' ? '<button class="rs" data-act="delPost" data-p="' + p.id + '">' + N.ico('trash') + '<span>Sil</span></button>' : '') +
          '<span class="disc"><img src="' + N.avatarOf(u) + '" alt=""></span>' +
        '</div>' +
        (ig ? '' : '<div class="reel-prog"><input type="range" min="0" max="100" value="0" data-scrub="' + p.id + '" aria-label="İlerleme"></div>') +
        (i === 0 ? '<div class="reel-hint">' + N.ico('up') + 'Kaydır</div>' : '') +
      '</section>';
    }).join('') + '</div></div>';
  };

  R.init = function () {
    var track = $('#reelsTrack'); if (!track) return;
    R.stop();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var s = e.target, v = s.querySelector('video');
        if (e.intersectionRatio > .6) {
          s.classList.remove('paused');
          if (v) { v.muted = !N.DB.settings.sound; var pr = v.play(); if (pr && pr.catch) pr.catch(function(){ s.classList.add('paused'); }); }
        } else { s.classList.add('paused'); if (v) { try { v.pause(); } catch(x){} } }
      });
    }, { root: track, threshold: [0, .6, 1] });

    $$('.reel', track).forEach(function (s) {
      io.observe(s);
      var pid = s.dataset.reel, v = s.querySelector('video'), sc = s.querySelector('[data-scrub]');
      if (v) {
        v.addEventListener('timeupdate', function(){ if (sc && v.duration) sc.value = String(v.currentTime / v.duration * 100); });
        v.addEventListener('error', function(){ s.classList.add('paused'); ui.toast('Video yüklenemedi','warn'); });
        v.addEventListener('click', function(){ R.toggle(s); });
      }
      if (sc) sc.addEventListener('input', function(){ if (v && v.duration) v.currentTime = v.duration * (+sc.value/100); });
      var f = s.querySelector('[data-igf]');
      if (f) {
        var l = s.querySelector('[data-igl]'), x = s.querySelector('[data-igx]');
        var to = setTimeout(function(){ if (l && !l.classList.contains('hide')) { l.classList.add('hide'); x.classList.add('on'); } }, 7000);
        f.addEventListener('load', function(){ clearTimeout(to); if (l) l.classList.add('hide'); });
        f.addEventListener('error', function(){ clearTimeout(to); if (l) l.classList.add('hide'); if (x) x.classList.add('on'); });
      }
      var last = 0;
      s.addEventListener('click', function (e) {
        if (e.target.closest('button,input,a,.reel-body,.reel-side,iframe')) return;
        var now = Date.now();
        if (now - last < 330) { N.feed.like(pid, true); R.burst(s); }
        last = now;
      });
    });
    var first = track.querySelector('.reel video');
    if (first) { first.muted = !N.DB.settings.sound; var p = first.play(); if (p && p.catch) p.catch(function(){}); }
  };
  R.burst = function (s) {
    var b = s.querySelector('.burst');
    if (!b) { b = document.createElement('div'); b.className = 'burst'; b.innerHTML = N.ico('heartF'); s.appendChild(b); }
    b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
    ui.beep('like'); ui.haptic(12);
  };
  R.toggle = function (s) {
    var v = s.querySelector('video'); if (!v) return;
    if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function(){}); s.classList.remove('paused'); }
    else { v.pause(); s.classList.add('paused'); }
    ui.beep('tick');
  };
  R.stop = function () {
    if (io) { io.disconnect(); io = null; }
    $$('video[data-rv]').forEach(function(v){ try { v.pause(); } catch(e){} });
  };
  R.onClose = function () { R.stopCam(); };

  /* ── oluşturma ── */
  R.open = function () {
    $('#camBody').innerHTML =
      '<div class="cam-tabs"><button class="cam-tab on" data-act="camTab" data-t="cam">' + N.ico('camera') + 'Kamera</button>' +
      '<button class="cam-tab" data-act="camTab" data-t="ig">' + N.ico('ext') + 'Instagram’dan</button></div>' +
      '<div id="camPane">' + R.camPane() + '</div><div id="igPane" hidden>' + R.igPane() + '</div>';
    ui.closeAll(true); $('#camSheet').classList.add('on'); $('#scrim').classList.add('on'); ui.lock(true); ui.beep('open');
    R.bindCam();
  };
  R.camPane = function () {
    return '<div class="cam-stage" id="camStage">' +
        '<div class="cam-ph" id="camPh"><div>' + N.ico('camera') + '<h4>Kameranı aç</h4>' +
        '<p>Reels çekmek için kamera ve mikrofon izni gerekiyor. Görüntü yalnızca bu cihazda işlenir, hiçbir yere yüklenmez.</p>' +
        '<button class="btn ig" data-act="camStart">' + N.ico('video') + 'Kamerayı başlat</button></div></div>' +
        '<video id="camVideo" playsinline muted hidden></video>' +
        '<span class="cam-rec" id="camRec"><i></i>KAYIT</span><span class="cam-timer" id="camTimer" hidden>0:00</span>' +
      '</div>' +
      '<div class="cam-ctrl">' +
        '<button class="cam-side" data-act="camFlip" id="camFlip" disabled aria-label="Kamera değiştir">' + N.ico('flip') + '</button>' +
        '<button class="cam-shoot" id="camShoot" data-act="camShoot" disabled aria-label="Kaydet"><i></i></button>' +
        '<button class="cam-side" data-act="camStop" id="camStopB" disabled aria-label="Kamerayı kapat">' + N.ico('x') + '</button>' +
      '</div><p class="cam-hint" id="camHint">Kırmızı düğmeye bas, kayıt başlasın. En fazla 60 saniye.</p>';
  };
  R.igPane = function () {
    return '<div class="ig-form"><div class="ig-note">' + N.ico('shield') +
      '<div>Instagram’ın <b>resmî embed</b> adresi kullanılır (<code>/reel/KOD/embed/</code>). Videoyu kazımak veya indirmek Instagram kurallarına aykırıdır ve tarayıcı zaten engeller. Gönderi gizliyse embed açılmaz.</div></div>' +
      '<label class="lbl">Reels bağlantısı</label><input class="inp" id="igUrl" placeholder="https://www.instagram.com/reel/…">' +
      '<div id="igPrev" class="ig-preview"></div>' +
      '<label class="lbl" style="margin-top:14px">Açıklama</label><textarea class="inp" id="igCap" maxlength="280" placeholder="Bu reels hakkında bir şey yaz… #reels"></textarea>' +
      '<div style="display:flex;gap:9px;margin-top:16px"><button class="btn ig" data-act="igAdd" style="flex:1">' + N.ico('plus') + 'Reels olarak ekle</button>' +
      '<button class="btn" data-act="igPreview">' + N.ico('eye') + 'Önizle</button></div></div>';
  };
  R.tab = function (t) {
    $$('.cam-tab').forEach(function(b){ b.classList.toggle('on', b.dataset.t === t); });
    $('#camPane').hidden = t !== 'cam'; $('#igPane').hidden = t !== 'ig';
    if (t !== 'cam') R.stopCam();
    ui.beep('tick');
  };
  R.bindCam = function () {
    var u = $('#igUrl');
    if (u) u.addEventListener('keydown', function(e){ if(e.key==='Enter') R.preview(); });
  };
  R.preview = function () {
    var code = R.parse($('#igUrl').value.trim());
    if (!code) return ui.toast('Geçerli bir Instagram reels bağlantısı gir', 'err');
    var box = $('#igPrev');
    box.innerHTML = '<iframe src="https://www.instagram.com/reel/' + code + '/embed/" allow="autoplay; encrypted-media" title="Önizleme"></iframe>';
    box.classList.add('on'); ui.beep('tick');
  };
  R.addIG = function () {
    var code = R.parse($('#igUrl').value.trim());
    if (!code) return ui.toast('Geçerli bir Instagram reels bağlantısı gir', 'err');
    var cap = $('#igCap').value.trim() || 'Instagram reels #reels';
    R.publish({ kind:'embed', src:'https://www.instagram.com/reel/' + code + '/embed/captioned/',
      ig:'https://www.instagram.com/reel/' + code + '/', audio:'Instagram · orijinal ses' }, cap, code);
  };
  R.publish = function (reel, cap, seed) {
    var me = N.me();
    var p = { id:N.uid(), authorId:me.id, text:cap, media:[], reel:reel, createdAt:Date.now(),
      likes:[], saves:[], reposts:[], comments:[] };
    N.DB.posts.unshift(p); N.save();
    R.stopCam(); ui.closeAll(); ui.beep('post'); ui.haptic(14);
    N.app.nav('#/reels');
    ui.toast('Reels eklendi', 'ok');
  };

  /* ── kamera ── */
  R.startCam = function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return R.camFail('Bu tarayıcı kamera erişimini desteklemiyor. Instagram bağlantısı sekmesinden reels ekleyebilirsin.');
    }
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:facing, width:{ideal:720}, height:{ideal:1280} }, audio:true })
      .then(function (s) {
        stream = s;
        var v = $('#camVideo'); if (!v) { R.stopCam(); return; }
        v.srcObject = s; v.hidden = false; v.classList.toggle('rear', facing === 'environment');
        var pr = v.play(); if (pr && pr.catch) pr.catch(function(){});
        $('#camPh').hidden = true;
        $('#camShoot').disabled = false; $('#camFlip').disabled = false; $('#camStopB').disabled = false;
        $('#camHint').textContent = 'Kırmızı düğmeye bas, kayıt başlasın. En fazla 60 saniye.';
        ui.beep('ok'); ui.toast('Kamera açık', 'ok');
      })
      .catch(function (e) {
        var m = e && e.name === 'NotAllowedError'
          ? 'Kamera izni verilmedi. Tarayıcı adres çubuğundaki kamera simgesinden izin verip tekrar dene.'
          : e && e.name === 'NotFoundError' ? 'Kamera bulunamadı.'
          : 'Kamera açılamadı (' + (e && e.name ? e.name : 'bilinmeyen') + ').';
        R.camFail(m + ' Instagram bağlantısı sekmesinden de reels ekleyebilirsin.');
      });
  };
  R.camFail = function (msg) {
    var ph = $('#camPh'); if (!ph) return;
    ph.hidden = false;
    ph.innerHTML = '<div>' + N.ico('eyeOff') + '<h4>Kamera kullanılamıyor</h4><p>' + N.esc(msg) + '</p>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn ig" data-act="camStart">' + N.ico('refresh') + 'Tekrar dene</button>' +
      '<button class="btn" data-act="camTab" data-t="ig">' + N.ico('ext') + 'Bağlantıdan ekle</button></div></div>';
    ui.beep('err');
  };
  R.flip = function () {
    facing = facing === 'user' ? 'environment' : 'user';
    R.stopCam(true); R.startCam();
  };
  R.shoot = function () {
    if (!stream) return;
    if (rec && rec.state === 'recording') { R.stopRec(); return; }
    if (!window.MediaRecorder) return ui.toast('Bu tarayıcı video kaydını desteklemiyor', 'err');
    var mime = '';
    ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].some(function (m) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) { mime = m; return true; } return false;
    });
    try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
    catch (e) { return ui.toast('Kayıt başlatılamadı', 'err'); }
    chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = R.finishRec;
    rec.start(200);
    recStart = Date.now();
    $('#camShoot').classList.add('rec'); $('#camRec').classList.add('on'); $('#camTimer').hidden = false;
    $('#camFlip').disabled = true;
    $('#camHint').textContent = 'Kayıt sürüyor — durdurmak için tekrar bas.';
    ui.beep('tick'); ui.haptic(14);
    clearInterval(recTimer);
    recTimer = setInterval(function () {
      var s = Math.floor((Date.now() - recStart) / 1000);
      var t = $('#camTimer'); if (t) t.textContent = Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
      if (s >= 60) R.stopRec();
    }, 250);
  };
  R.stopRec = function () { if (rec && rec.state === 'recording') { try { rec.stop(); } catch(e){} } clearInterval(recTimer); };
  R.finishRec = function () {
    clearInterval(recTimer);
    $('#camShoot').classList.remove('rec'); $('#camRec').classList.remove('on'); $('#camTimer').hidden = true;
    var blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type : 'video/webm' });
    chunks = [];
    if (!blob.size) return ui.toast('Kayıt boş çıktı', 'warn');
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(blob);
    var v = $('#camVideo'), st = $('#camStage');
    if (!v) return;
    if (stream) { stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    v.srcObject = null; v.src = blobUrl; v.muted = false; v.loop = true; v.controls = false;
    v.classList.remove('rear'); st.classList.add('playback');
    var p = v.play(); if (p && p.catch) p.catch(function(){});
    var secs = Math.max(1, Math.round((Date.now() - recStart) / 1000));
    $('#camShoot').disabled = true; $('#camFlip').disabled = true;
    $('#camHint').innerHTML = '';
    var ctrl = document.querySelector('.cam-ctrl');
    ctrl.innerHTML = '<button class="btn" data-act="camRetake">' + N.ico('refresh') + 'Yeniden çek</button>' +
      '<button class="btn ig" data-act="camPublish" style="flex:1;max-width:220px">' + N.ico('send') + 'Reels olarak paylaş</button>';
    R._pending = { blobUrl: blobUrl, secs: secs };
    ui.beep('ok'); ui.toast('Kayıt hazır · ' + secs + ' sn', 'ok');
  };
  R.retake = function () {
    R._pending = null;
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    $('#camPane').innerHTML = R.camPane();
    $('#camStage').classList.remove('playback');
    R.startCam();
  };
  R.publishLocal = function () {
    if (!R._pending) return;
    ui.sheet('Reels açıklaması',
      '<textarea class="inp" id="rlCap" maxlength="280" placeholder="Bu reels hakkında bir şey yaz… #reels" style="min-height:90px"></textarea>' +
      '<p style="font-size:12px;color:var(--text3);line-height:1.6;margin:12px 0 16px">Video bu tarayıcıda tutulur. Sayfayı yenilediğinde yerel video kaybolur; kalıcı olması için sunucu gerekir.</p>' +
      '<button class="btn ig blk" data-act="camPublishGo">' + N.ico('send') + 'Paylaş</button>');
  };
  R.publishLocalGo = function () {
    if (!R._pending) return;
    var cap = ($('#rlCap') && $('#rlCap').value.trim()) || 'Yeni reels #reels';
    var url = R._pending.blobUrl; R._pending = null; blobUrl = null;
    R.publish({ kind:'local', src:url, audio:'Orijinal ses · ' + N.me().handle }, cap, 'local');
  };
  R.stopCam = function (keepUI) {
    clearInterval(recTimer); recTimer = null;
    if (rec && rec.state === 'recording') { try { rec.stop(); } catch(e){} }
    rec = null; chunks = [];
    if (stream) { stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    if (!keepUI) {
      R._pending = null;
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    }
  };
})(window.NX);

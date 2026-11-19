/* Nexus · ana akış, gönderi kartları, carousel, yorumlar, keşfet */
(function (N) {
  var F = N.feed = {}, ui = N.ui, $ = N.$, $$ = N.$$;
  F.draft = { text:'', media:[], quote:null };

  /* ── gönderi kartı ── */
  function carousel(p, ctx) {
    if (!p.media || !p.media.length) return '';
    var id = 'c-' + p.id + '-' + ctx, n = p.media.length;
    return '<div class="carousel" data-car="' + p.id + '">' +
      '<div class="ctrack" id="' + id + '" data-track="' + p.id + '">' +
        p.media.map(function (m, i) { return '<div class="cslide">' + N.imgTag(m.src, m.seed, '', p.text.slice(0,40) + ' ' + (i+1)) + '</div>'; }).join('') +
      '</div>' +
      (n > 1 ?
        '<button class="cnav p" data-act="cnav" data-t="' + id + '" data-d="-1" aria-label="Önceki">' + N.ico('left') + '</button>' +
        '<button class="cnav n" data-act="cnav" data-t="' + id + '" data-d="1" aria-label="Sonraki">' + N.ico('right') + '</button>' +
        '<span class="ccount" data-count="' + id + '">1/' + n + '</span>' +
        '<div class="cdots" data-dots="' + id + '">' + p.media.map(function(_,i){ return '<i class="'+(i?'':'on')+'"></i>'; }).join('') + '</div>' : '') +
      '<div class="burst" data-burst="' + p.id + '">' + N.ico('heartF') + '</div></div>';
  }

  F.card = function (p, ctx) {
    var u = N.user(p.authorId), me = N.me();
    if (!u || !me) return '';
    ctx = ctx || 'f';
    var liked = p.likes.indexOf(me.id) >= 0, saved = p.saves.indexOf(me.id) >= 0, rp = p.reposts.indexOf(me.id) >= 0;
    var q = p.quote ? N.post(p.quote) : null, qu = q ? N.user(q.authorId) : null;
    var last = p.comments.slice(-2);
    return '<article class="post" data-post="' + p.id + '">' +
      (rp ? '<div class="rp-tag">' + N.ico('repost') + 'Sen yeniden paylaştın</div>' : '') +
      '<div class="post-h">' +
        '<span class="ring' + (p.media && p.media.length ? '' : ' off') + '" data-act="go" data-to="#/profile/' + u.handle + '" style="cursor:pointer"><img class="av a32" src="' + N.avatarOf(u) + '" alt=""></span>' +
        '<div class="ph-id"><b data-act="go" data-to="#/profile/' + u.handle + '" style="cursor:pointer">' + N.esc(u.handle) + '</b>' + ui.vf(u) +
          (u.role === 'admin' ? '<span class="badge admin">YÖNETİCİ</span>' : '') +
          '<span class="dot">·</span><time title="' + N.fullDate(p.createdAt) + '">' + N.ago(p.createdAt) + '</time>' +
          (p.edited ? '<span class="dot">·</span><time>düzenlendi</time>' : '') + '</div>' +
        '<button class="ph-more" data-act="postMenu" data-p="' + p.id + '" aria-label="Seçenekler">' + N.ico('more') + '</button>' +
      '</div>' +
      (p.text ? '<div class="post-t">' + ui.rich(p.text) + '</div>' : '') +
      (q && qu ? '<div class="quote-box" data-act="detail" data-p="' + q.id + '" style="cursor:pointer"><div class="qh"><img class="av a24" src="' + N.avatarOf(qu) + '" alt="">' + N.esc(qu.handle) + ui.vf(qu) + '</div><div class="qt">' + N.esc(q.text.slice(0,180)) + (q.text.length>180?'…':'') + '</div></div>' : '') +
      carousel(p, ctx) +
      '<div class="post-a">' +
        '<button class="pa like' + (liked?' on':'') + '" data-act="like" data-p="' + p.id + '" aria-label="Beğen">' + N.ico(liked?'heartF':'heart') + '<span class="sp">' + ui.sparks() + '</span></button>' +
        '<button class="pa" data-act="comments" data-p="' + p.id + '" aria-label="Yorum">' + N.ico('comment') + '</button>' +
        '<button class="pa rp' + (rp?' on':'') + '" data-act="repost" data-p="' + p.id + '" aria-label="Yeniden paylaş">' + N.ico('repost') + '</button>' +
        '<button class="pa" data-act="share" data-p="' + p.id + '" aria-label="Paylaş">' + N.ico('send') + '</button>' +
        '<button class="pa sv' + (saved?' on':'') + '" data-act="save" data-p="' + p.id + '" aria-label="Kaydet">' + N.ico(saved?'bookmarkF':'bookmark') + '</button>' +
      '</div>' +
      '<div class="post-likes" data-likes="' + p.id + '">' + N.nf(p.likes.length) + ' beğeni</div>' +
      (p.comments.length > 2 ? '<div class="post-cmts" data-act="comments" data-p="' + p.id + '">' + p.comments.length + ' yorumun tümünü gör</div>' : '') +
      last.map(function (c) { var cu = N.user(c.authorId); if(!cu) return '';
        return '<div class="post-cmt"><b>' + N.esc(cu.handle) + '</b><span>' + ui.rich(c.text) + '</span></div>'; }).join('') +
      '<div class="post-time">' + N.fullDate(p.createdAt) + (p.reposts.length ? ' · ' + p.reposts.length + ' yeniden paylaşım' : '') + '</div>' +
      '<div class="inline-cmt"><input placeholder="Yorum ekle…" maxlength="300" data-cin="' + p.id + '" aria-label="Yorum yaz"><button data-act="quickCmt" data-p="' + p.id + '">Paylaş</button></div>' +
    '</article>';
  };

  /* ── etkileşimler ── */
  F.like = function (pid, forceOn) {
    var p = N.post(pid), me = N.me(); if (!p || !me) return;
    var i = p.likes.indexOf(me.id), on = forceOn ? true : i < 0;
    if (on && i >= 0) { F.syncLike(p); return; }
    if (on) { p.likes.push(me.id); N.notify(p.authorId, 'like', me.id, p.id); }
    else p.likes.splice(i, 1);
    N.save(); F.syncLike(p);
    ui.beep(on ? 'like' : 'tick'); if (on) ui.haptic(10);
  };
  F.syncLike = function (p) {
    var me = N.me(), on = p.likes.indexOf(me.id) >= 0;
    $$('[data-act="like"][data-p="' + p.id + '"]').forEach(function (b) {
      b.classList.toggle('on', on);
      var s = b.querySelector('svg'); if (s) s.outerHTML = N.ico(on ? 'heartF' : 'heart');
      var sp = b.querySelector('.sp'); if (sp) sp.innerHTML = ui.sparks();
      var lbl = b.querySelector('.rn'); if (lbl) lbl.textContent = N.nf(p.likes.length);
    });
    $$('[data-likes="' + p.id + '"]').forEach(function (e) { e.textContent = N.nf(p.likes.length) + ' beğeni'; });
  };
  F.burst = function (pid) {
    var b = $('[data-burst="' + pid + '"]'); if (!b) return;
    b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  };
  F.save = function (pid) {
    var p = N.post(pid), me = N.me(); if (!p || !me) return;
    var i = p.saves.indexOf(me.id), on = i < 0;
    if (on) p.saves.push(me.id); else p.saves.splice(i, 1);
    N.save();
    $$('[data-act="save"][data-p="' + pid + '"]').forEach(function (b) {
      b.classList.toggle('on', on);
      var s = b.querySelector('svg'); if (s) s.outerHTML = N.ico(on ? 'bookmarkF' : 'bookmark');
    });
    ui.beep(on ? 'ok' : 'tick');
    if (on) ui.toast('Kaydedildi', 'ok', { label:'Geri al', fn:function(){ F.save(pid); if(N.app.route.k==='saved') N.app.render(); } });
    else ui.toast('Kayıt kaldırıldı', 'info');
    if (N.app.route.k === 'saved') N.app.render();
  };
  F.repostMenu = function (pid) {
    var p = N.post(pid), me = N.me(), on = p.reposts.indexOf(me.id) >= 0;
    ui.sheet('Yeniden paylaş',
      '<button class="mrow" data-act="rpNow" data-p="' + pid + '">' + N.ico('repost') + '<span><b>' + (on?'Yeniden paylaşımı kaldır':'Yeniden paylaş') + '</b><div style="font-size:12.5px;color:var(--text3)">Akışında anında görünsün</div></span></button>' +
      '<button class="mrow" data-act="rpQuote" data-p="' + pid + '">' + N.ico('quote') + '<span><b>Alıntı yap</b><div style="font-size:12.5px;color:var(--text3)">Kendi yorumunla paylaş</div></span></button>' +
      '<button class="mrow" data-act="share" data-p="' + pid + '">' + N.ico('link') + '<span><b>Bağlantıyı kopyala</b></span></button>');
  };
  F.repostNow = function (pid) {
    var p = N.post(pid), me = N.me(); if (!p || !me) return;
    var i = p.reposts.indexOf(me.id), on = i < 0;
    if (on) { p.reposts.push(me.id); N.notify(p.authorId, 'repost', me.id, pid); } else p.reposts.splice(i, 1);
    N.save(); ui.closeAll(); N.app.render();
    ui.beep(on ? 'ok' : 'tick'); ui.toast(on ? 'Yeniden paylaşıldı' : 'Kaldırıldı', 'ok');
  };
  F.share = function (pid) {
    var p = N.post(pid), u = N.user(p.authorId);
    var url = location.origin + location.pathname + '#/profile/' + u.handle;
    var txt = (p.text || 'Nexus gönderisi') + '\n' + url;
    if (navigator.share) navigator.share({ title:'Nexus', text:txt, url:url }).catch(function(){});
    else ui.copy(txt, 'Bağlantı kopyalandı');
    ui.closeAll(); ui.beep('tick');
  };
  F.remove = function (pid) {
    var i = -1; N.DB.posts.forEach(function(p,k){ if(p.id===pid) i=k; });
    if (i < 0) return;
    var copy = N.DB.posts[i];
    N.DB.posts.splice(i, 1); N.save(); ui.closeAll(); N.app.render(); ui.beep('del');
    ui.toast('Gönderi silindi', 'info', { label:'Geri al', fn:function(){ N.DB.posts.splice(i,0,copy); N.save(); N.app.render(); ui.toast('Geri alındı','ok'); } });
  };

  /* ── yorumlar ── */
  var cmtId = null;
  F.comments = function (pid) {
    cmtId = pid; var p = N.post(pid); if (!p) return;
    ui.sheet('Yorumlar', F.cmtList(p),
      '<img class="av a32" src="' + N.avatarOf(N.me()) + '" alt="">' +
      '<input class="inp" id="cmtIn" placeholder="Yorum ekle…" maxlength="300" style="border-radius:99px">' +
      '<button class="btn pri sm" data-act="sendCmt">Paylaş</button>');
    setTimeout(function(){ var i = $('#cmtIn'); if (i && !N.isMobile()) i.focus(); }, 380);
  };
  F.cmtList = function (p) {
    if (!p.comments.length) return ui.empty('comment', 'Henüz yorum yok', 'İlk yorumu sen yaz.');
    var me = N.me();
    return p.comments.slice().sort(function(a,b){ return b.createdAt-a.createdAt; }).map(function (c) {
      var u = N.user(c.authorId); if (!u) return '';
      var on = c.likes.indexOf(me.id) >= 0;
      return '<div class="cmt"><img class="av a32" src="' + N.avatarOf(u) + '" alt="">' +
        '<div class="cb"><div class="cn">' + N.esc(u.handle) + ui.vf(u) + '<time>' + N.ago(c.createdAt) + '</time></div>' +
        '<div class="cx">' + ui.rich(c.text) + '</div>' +
        '<div class="ca"><button data-act="cmtReply" data-h="' + N.esc(u.handle) + '">Yanıtla</button>' +
        (c.authorId === me.id || me.role === 'admin' ? '<button data-act="cmtDel" data-c="' + c.id + '">Sil</button>' : '') + '</div></div>' +
        '<button class="cl' + (on?' on':'') + '" data-act="cmtLike" data-c="' + c.id + '">' + N.ico(on?'heartF':'heart') + '<span>' + c.likes.length + '</span></button></div>';
    }).join('');
  };
  F.sendCmt = function (pid, text) {
    var p = N.post(pid), me = N.me(); if (!p || !me || !text.trim()) return;
    p.comments.push({ id:N.uid(), authorId:me.id, text:text.trim(), createdAt:Date.now(), likes:[] });
    N.notify(p.authorId, 'comment', me.id, pid);
    N.save(); ui.beep('post'); ui.haptic(10);
    if (cmtId === pid && $('#sheet').classList.contains('on')) { $('#sheetBody').innerHTML = F.cmtList(p); $('#cmtIn').value = ''; }
    N.app.render();
    if ($('#detailPanel').classList.contains('on')) F.detail(pid);
    ui.toast('Yorumun eklendi', 'ok');
  };
  F.cmtAction = function (act, cid) {
    var p = N.post(cmtId), me = N.me(); if (!p) return;
    var c = p.comments.filter(function(x){ return x.id===cid; })[0]; if (!c) return;
    if (act === 'like') {
      var i = c.likes.indexOf(me.id);
      if (i >= 0) c.likes.splice(i,1); else c.likes.push(me.id);
      ui.beep('tick');
    } else {
      p.comments = p.comments.filter(function(x){ return x.id !== cid; });
      ui.toast('Yorum silindi', 'info');
    }
    N.save(); $('#sheetBody').innerHTML = F.cmtList(p); N.app.render();
  };

  /* ── detay paneli ── */
  F.detail = function (pid) {
    var p = N.post(pid); if (!p) return;
    var me = N.me(), mine = p.authorId === me.id || me.role === 'admin';
    $('#detailBody').innerHTML = F.card(p, 'd') +
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line)">' +
        '<h4 style="font-size:13px;font-weight:800;margin-bottom:8px">Yorumlar · ' + p.comments.length + '</h4>' +
        F.cmtList(p) +
      '</div>' +
      (mine ? '<div style="display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)">' +
        '<button class="btn" data-act="editPost" data-p="' + pid + '">' + N.ico('edit') + 'Düzenle</button>' +
        '<button class="btn dgr" data-act="delPost" data-p="' + pid + '">' + N.ico('trash') + 'Sil</button></div>' : '');
    F.bindCarousels($('#detailBody'));
    F.bindInline($('#detailBody'));
    ui.panel('#detailPanel');
  };
  F.editPost = function (pid) {
    var p = N.post(pid); if (!p) return;
    ui.sheet('Gönderiyi düzenle',
      '<textarea class="inp" id="edIn" maxlength="280" style="min-height:120px">' + N.esc(p.text) + '</textarea>' +
      '<div style="display:flex;gap:9px;margin-top:14px"><button class="btn pri" data-act="saveEdit" data-p="' + pid + '" style="flex:1">' + N.ico('check') + 'Kaydet</button>' +
      '<button class="btn" data-close style="flex:1">Vazgeç</button></div>');
  };
  F.saveEdit = function (pid) {
    var p = N.post(pid), v = $('#edIn').value.trim();
    if (!v && !p.media.length) return ui.toast('Gönderi boş olamaz', 'warn');
    p.text = v; p.edited = true; N.save(); ui.closeAll(); N.app.render();
    ui.beep('ok'); ui.toast('Güncellendi', 'ok');
  };
  F.postMenu = function (pid) {
    var p = N.post(pid), me = N.me(), u = N.user(p.authorId);
    var mine = p.authorId === me.id, admin = me.role === 'admin';
    var saved = p.saves.indexOf(me.id) >= 0, fol = me.following.indexOf(u.id) >= 0;
    ui.sheet('Gönderi',
      '<button class="mrow" data-act="save" data-p="' + pid + '">' + N.ico(saved?'bookmarkF':'bookmark') + (saved?'Kaydı kaldır':'Kaydet') + '</button>' +
      '<button class="mrow" data-act="share" data-p="' + pid + '">' + N.ico('link') + 'Bağlantıyı kopyala</button>' +
      '<button class="mrow" data-act="detail" data-p="' + pid + '">' + N.ico('eye') + 'Detayı aç</button>' +
      (mine || admin ? '<button class="mrow" data-act="editPost" data-p="' + pid + '">' + N.ico('edit') + 'Düzenle</button>' +
        '<button class="mrow dgr" data-act="delPost" data-p="' + pid + '">' + N.ico('trash') + 'Sil</button>' : '') +
      (!mine ? '<button class="mrow" data-act="follow" data-u="' + u.id + '">' + N.ico('user') + (fol?'Takipten çık':'Takip et') + '</button>' +
        '<button class="mrow dgr" data-act="hide" data-p="' + pid + '">' + N.ico('eyeOff') + 'Bu gönderiyi gizle</button>' : '') +
      (admin && !mine ? '<button class="mrow" data-act="go" data-to="#/admin/' + u.id + '">' + N.ico('shield') + 'Hesabı yönet</button>' : ''));
  };
  F.hide = function (pid) {
    var i = -1; N.DB.posts.forEach(function(p,k){ if(p.id===pid) i=k; });
    if (i<0) return;
    var cp = N.DB.posts[i]; N.DB.posts.splice(i,1); N.save(); ui.closeAll(); N.app.render();
    ui.toast('Gönderi gizlendi','info',{ label:'Geri al', fn:function(){ N.DB.posts.splice(i,0,cp); N.save(); N.app.render(); } });
  };

  /* ── compose ── */
  F.composeHTML = function () {
    var me = N.me(), q = F.draft.quote ? N.post(F.draft.quote) : null, qu = q ? N.user(q.authorId) : null;
    return '<div class="cp-top"><span class="ring off"><img class="av a40" src="' + N.avatarOf(me) + '" alt=""></span>' +
      '<div style="flex:1;min-width:0"><b style="font-size:14px;display:flex;align-items:center;gap:5px">' + N.esc(me.handle) + ui.vf(me) + '</b>' +
      '<span style="font-size:12px;color:var(--text3)">Herkese açık gönderi</span></div></div>' +
      (q && qu ? '<div class="cp-quote"><b style="color:var(--text)">' + N.esc(qu.handle) + '</b> alıntılanıyor<div style="margin-top:3px">' + N.esc(q.text.slice(0,120)) + '</div></div>' : '') +
      '<textarea class="cp-in" id="cpIn" placeholder="Aklında ne var?" maxlength="280" aria-label="Gönderi metni">' + N.esc(F.draft.text) + '</textarea>' +
      '<div class="cp-thumbs" id="cpThumbs">' + F.thumbs() + '</div>' +
      '<div class="cp-bar">' +
        '<button class="cp-t" data-act="pickImg" title="Fotoğraf">' + N.ico('image') + '</button>' +
        '<button class="cp-t m" data-act="emoji" title="Emoji">' + N.ico('emoji') + '</button>' +
        '<button class="cp-t a" data-act="poll" title="Anket">' + N.ico('poll') + '</button>' +
        '<button class="cp-t v" data-act="openCam" title="Reels">' + N.ico('reels') + '</button>' +
        '<div class="cp-right"><svg class="ringc" viewBox="0 0 26 26"><circle class="bg" cx="13" cy="13" r="10"/><circle class="fg" id="cpRing" cx="13" cy="13" r="10" stroke-dasharray="62.83" stroke-dashoffset="62.83"/></svg>' +
        '<button class="btn pri" id="cpGo" data-act="publish" disabled>Paylaş</button></div>' +
      '</div>' +
      '<div class="emoji" id="emojiPop">' + '😀 😂 🥹 😍 🤔 😎 🥶 🤯 🔥 💀 ✨ 🧪 🚀 💻 🎧 📸 🏀 ☕ 📚 🌙 ⚡ 🎨 🧠 👀 💜 🩵 🧡 💚 ❤️ 🎯 🍕 🐱'.split(' ')
        .map(function(e){ return '<button data-act="insEmoji" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>';
  };
  F.thumbs = function () {
    return F.draft.media.map(function (m, i) {
      return '<div class="cth" draggable="true" data-th="' + i + '"><img src="' + m.src + '" alt="Görsel ' + (i+1) + '">' +
        '<span class="o">' + (i+1) + '</span>' +
        '<button class="x" data-act="rmThumb" data-i="' + i + '" aria-label="Kaldır">' + N.ico('x') + '</button>' +
        '<span class="mv"><button data-act="mvThumb" data-i="' + i + '" data-d="-1" aria-label="Sola">' + N.ico('left') + '</button>' +
        '<button data-act="mvThumb" data-i="' + i + '" data-d="1" aria-label="Sağa">' + N.ico('right') + '</button></span></div>';
    }).join('');
  };
  F.openCompose = function (quote) {
    if (quote) F.draft.quote = quote;
    $('#composeBody').innerHTML = F.composeHTML();
    ui.panel('#composePanel');
    F.sync(); F.bindDrag();
    var t = $('#cpIn');
    t.addEventListener('input', function(){ F.draft.text = t.value; F.sync(); t.style.height='auto'; t.style.height=Math.min(240,t.scrollHeight)+'px'; });
    t.addEventListener('keydown', function(e){ if((e.ctrlKey||e.metaKey) && e.key==='Enter') F.publish(); });
    setTimeout(function(){ t.focus(); }, 400);
  };
  F.sync = function () {
    var len = F.draft.text.length, pct = N.clamp(len/280, 0, 1);
    var r = $('#cpRing'), b = $('#cpGo'), th = $('#cpThumbs');
    if (r) { r.style.strokeDashoffset = String(62.83*(1-pct)); r.style.stroke = len>260?'var(--danger)':len>220?'var(--warning)':'var(--tw)'; }
    if (b) b.disabled = !(F.draft.text.trim() || F.draft.media.length);
    if (th) { th.innerHTML = F.thumbs(); F.bindDrag(); }
  };
  F.bindDrag = function () {
    $$('.cth').forEach(function (el) {
      el.addEventListener('dragstart', function(e){ el.classList.add('drag'); e.dataTransfer.setData('text/plain', el.dataset.th); e.dataTransfer.effectAllowed='move'; });
      el.addEventListener('dragend', function(){ el.classList.remove('drag'); $$('.cth').forEach(function(x){ x.classList.remove('over'); }); });
      el.addEventListener('dragover', function(e){ e.preventDefault(); el.classList.add('over'); });
      el.addEventListener('dragleave', function(){ el.classList.remove('over'); });
      el.addEventListener('drop', function(e){
        e.preventDefault(); el.classList.remove('over');
        var from = +e.dataTransfer.getData('text/plain'), to = +el.dataset.th;
        if (from === to || isNaN(from)) return;
        var a = F.draft.media.splice(from,1)[0]; F.draft.media.splice(to,0,a); F.sync(); ui.beep('tick');
      });
    });
  };
  F.addFiles = function (files) {
    var arr = Array.prototype.slice.call(files).filter(function(f){ return f.type.indexOf('image/')===0; }).slice(0, 4 - F.draft.media.length);
    if (!arr.length) return ui.toast('En fazla 4 görsel ekleyebilirsin', 'warn');
    var done = 0;
    arr.forEach(function (f) {
      ui.readImage(f, 1000, function (src) {
        F.draft.media.push({ src:src, seed:'up-'+N.uid() });
        if (++done === arr.length) { F.sync(); ui.beep('ok'); ui.toast(arr.length + ' görsel eklendi', 'ok'); }
      });
    });
  };
  F.publish = function () {
    var me = N.me();
    if (!F.draft.text.trim() && !F.draft.media.length) return;
    var p = { id:N.uid(), authorId:me.id, text:F.draft.text.trim(), media:F.draft.media.slice(), reel:null,
      quote:F.draft.quote, createdAt:Date.now(), likes:[], saves:[], reposts:[], comments:[] };
    N.DB.posts.unshift(p);
    F.draft = { text:'', media:[], quote:null };
    N.save(); ui.beep('post'); ui.haptic(14); ui.closeAll();
    if (N.app.route.k !== 'home') N.app.nav('#/home'); else N.app.render();
    ui.toast('Gönderin yayında', 'ok', { label:'Gör', fn:function(){ F.detail(p.id); } });
  };

  /* ── carousel & inline bağlama ── */
  F.bindCarousels = function (root) {
    $$('[data-track]', root || document).forEach(function (tr) {
      if (tr._bound) return; tr._bound = true;
      var tick = false;
      tr.addEventListener('scroll', function () {
        if (tick) return; tick = true;
        requestAnimationFrame(function () {
          tick = false;
          var i = Math.round(tr.scrollLeft / tr.clientWidth), n = tr.children.length;
          var c = $('[data-count="' + tr.id + '"]'), d = $('[data-dots="' + tr.id + '"]');
          if (c) c.textContent = (i+1) + '/' + n;
          if (d) $$('i', d).forEach(function (x, j) { x.classList.toggle('on', j === i); });
          var w = tr.closest('.carousel');
          if (w) { var p = w.querySelector('.cnav.p'), nx = w.querySelector('.cnav.n');
            if (p) p.disabled = i === 0; if (nx) nx.disabled = i >= n-1; }
        });
      }, { passive:true });
      var w = tr.closest('.carousel');
      if (w) {
        var pv = w.querySelector('.cnav.p'); if (pv) pv.disabled = true;
        var last = 0;
        tr.addEventListener('click', function (e) {
          var now = Date.now();
          if (now - last < 330) { e.preventDefault(); F.like(w.dataset.car, true); F.burst(w.dataset.car); }
          last = now;
        });
        tr.addEventListener('dblclick', function (e) { e.preventDefault(); F.like(w.dataset.car, true); F.burst(w.dataset.car); });
      }
    });
  };
  F.bindInline = function (root) {
    $$('[data-cin]', root || document).forEach(function (inp) {
      if (inp._b) return; inp._b = true;
      var btn = inp.parentElement.querySelector('button');
      inp.addEventListener('input', function(){ btn.classList.toggle('on', !!inp.value.trim()); });
      inp.addEventListener('keydown', function(e){ if(e.key==='Enter' && inp.value.trim()){ F.sendCmt(inp.dataset.cin, inp.value); inp.value=''; btn.classList.remove('on'); } });
    });
  };

  /* ── görünümler ── */
  F.filtered = function () {
    var me = N.me(), list = N.DB.posts.slice(), f = N.DB.ui.filter, s = N.DB.ui.sort;
    if (f === 'following') list = list.filter(function(p){ return me.following.indexOf(p.authorId)>=0 || p.authorId===me.id || p.reposts.indexOf(me.id)>=0; });
    if (f === 'media') list = list.filter(function(p){ return p.media.length; });
    if (f === 'reels') list = list.filter(function(p){ return p.reel; });
    if (f === 'mine') list = list.filter(function(p){ return p.authorId===me.id; });
    if (s === 'top') list.sort(function(a,b){ return (b.likes.length+b.comments.length*3)-(a.likes.length+a.comments.length*3); });
    else if (s === 'talk') list.sort(function(a,b){ return b.comments.length-a.comments.length; });
    else list.sort(function(a,b){ return b.createdAt-a.createdAt; });
    return list;
  };
  F.stories = function () {
    var me = N.me();
    var others = N.DB.users.filter(function(u){ return u.id !== me.id && N.postsOf(u.id).some(function(p){ return p.media.length; }); });
    var h = '<div class="stories"><button class="story add" data-act="pickImg"><span class="ring off"><img class="av a56" src="' + N.avatarOf(me) + '" alt=""></span><span class="plus">' + N.ico('plus') + '</span><span>Hikayen</span></button>';
    others.forEach(function (u) {
      h += '<button class="story" data-act="go" data-to="#/profile/' + u.handle + '"><span class="ring"><img class="av a56" src="' + N.avatarOf(u) + '" alt=""></span><span>' + N.esc(u.handle) + '</span></button>';
    });
    if (!others.length) {
      h += '<div style="display:flex;align-items:center;padding:0 10px;font-size:12.5px;color:var(--text3);line-height:1.5;max-width:230px">Admin panelden arkadaşlarını ekle, hikâyeleri burada görünsün.</div>';
    }
    return h + '</div>';
  };
  F.home = function () {
    var list = F.filtered();
    var chips = [['all','Tümü','sparkle'],['following','Takip','users'],['media','Fotoğraflı','image'],['reels','Reels','reels'],['mine','Benim','user']];
    var bar = '<div class="chips">' + chips.map(function(c){
      return '<button class="chip' + (N.DB.ui.filter===c[0]?' on':'') + '" data-act="filter" data-f="' + c[0] + '">' + N.ico(c[2]) + c[1] + '</button>'; }).join('') +
      '<select class="sortsel" id="sortSel" aria-label="Sırala"><option value="recent"' + (N.DB.ui.sort==='recent'?' selected':'') + '>En yeni</option><option value="top"' + (N.DB.ui.sort==='top'?' selected':'') + '>En beğenilen</option><option value="talk"' + (N.DB.ui.sort==='talk'?' selected':'') + '>En konuşulan</option></select></div>';
    var body = list.length
      ? list.map(function(p,i){ return '<div style="animation-delay:' + Math.min(i*40,320) + 'ms">' + F.card(p,'f') + '</div>'; }).join('')
      : ui.empty('feather', 'Akışın henüz boş', 'Kanat simgesine bas ve ilk gönderini yaz. Fotoğraf da ekleyebilirsin.',
          '<button class="btn pri" data-act="compose">' + N.ico('feather') + 'İlk gönderiyi yaz</button>');
    return '<div class="feed-pad">' + F.stories() + bar + '<div id="feedList">' + body + '</div></div>';
  };
  F.explore = function () {
    var q = (N.DB.ui.query || '').trim().toLowerCase();
    var head = '<div class="feed-pad"><div class="search">' + N.ico('search') +
      '<input id="searchIn" placeholder="Kişi, gönderi veya #etiket ara…" value="' + N.esc(N.DB.ui.query||'') + '" aria-label="Ara">' +
      '<button class="clr' + (q?' on':'') + '" data-act="clrSearch" aria-label="Temizle">' + N.ico('x') + '</button></div>';
    if (!q) {
      var media = N.DB.posts.filter(function(p){ return p.media.length; });
      if (!media.length) return head + ui.empty('compass','Keşfedilecek bir şey yok','Fotoğraflı gönderi paylaşıldıkça burada birikir.','<button class="btn pri" data-act="compose">'+N.ico('plus')+'Gönderi oluştur</button>') + '</div>';
      return head + '<div class="masonry">' + media.map(function (p, i) {
        var tall = (i % 7 === 0 || i % 7 === 3);
        return '<div class="gtile mtile' + (tall?' tall':'') + '" data-act="detail" data-p="' + p.id + '">' +
          N.imgTag(p.media[0].src, p.media[0].seed, '', p.text.slice(0,40)) +
          '<span class="kd">' + N.ico(p.reel?'reels':p.media.length>1?'stack':'image') + '</span>' +
          '<span class="ov"><span>' + N.ico('heartF') + N.nf(p.likes.length) + '</span><span>' + N.ico('comment') + p.comments.length + '</span></span></div>';
      }).join('') + '</div></div>';
    }
    function hl(s){ return N.esc(s).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')','ig'), '<mark>$1</mark>'); }
    var us = N.DB.users.filter(function(u){ return u.name.toLowerCase().indexOf(q)>=0 || u.handle.toLowerCase().indexOf(q)>=0; });
    var ps = N.DB.posts.filter(function(p){ return p.text.toLowerCase().indexOf(q)>=0; });
    var tg = {};
    N.DB.posts.forEach(function(p){ (p.text.match(/#([\wğüşıöçĞÜŞİÖÇ]+)/g)||[]).forEach(function(t){ if(t.toLowerCase().indexOf(q)>=0) tg[t]=(tg[t]||0)+1; }); });
    var out = '';
    if (us.length) out += '<div class="res-h">Kişiler · ' + us.length + '</div>' + us.map(function(u){
      return '<div class="res-row" data-act="go" data-to="#/profile/' + u.handle + '"><img class="av a44" src="' + N.avatarOf(u) + '" alt="">' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;display:flex;align-items:center;gap:5px">' + hl(u.name) + ui.vf(u) + '</div>' +
        '<div style="font-size:13px;color:var(--text3)">@' + hl(u.handle) + '</div></div>' + N.ico('right',17) + '</div>'; }).join('');
    if (Object.keys(tg).length) out += '<div class="res-h">Etiketler</div>' + Object.keys(tg).map(function(t){
      return '<div class="res-row" data-act="tag" data-tag="' + t.slice(1) + '"><span class="nic c">' + N.ico('sparkle') + '</span>' +
        '<div style="flex:1"><div style="font-weight:700">' + hl(t) + '</div><div style="font-size:12.5px;color:var(--text3)">' + tg[t] + ' gönderi</div></div>' + N.ico('right',17) + '</div>'; }).join('');
    if (ps.length) out += '<div class="res-h">Gönderiler · ' + ps.length + '</div>' + ps.map(function(p){ return F.card(p,'e'); }).join('');
    if (!out) out = ui.empty('search','Sonuç yok','"' + N.DB.ui.query + '" için bir şey bulamadım.');
    return head + out + '</div>';
  };
  F.saved = function () {
    var me = N.me(), list = N.DB.posts.filter(function(p){ return p.saves.indexOf(me.id)>=0; });
    var bulk = N.DB.ui.bulk, picked = N.DB.ui.picked || [];
    var head = '<div class="feed-pad"><div class="chips"><button class="chip' + (!bulk?' on':'') + '" data-act="bulkOff">' + N.ico('bookmark') + 'Tümü · ' + list.length + '</button>' +
      (list.length ? '<button class="chip' + (bulk?' on':'') + '" data-act="bulkOn">' + N.ico('check') + 'Seç</button>' : '') + '</div>';
    if (bulk) head += '<div class="bulkbar"><b style="font-size:14px">' + picked.length + ' seçili</b>' +
      '<button class="btn sm" data-act="pickAll">Tümünü seç</button>' +
      '<button class="btn sm dgr" data-act="bulkUnsave">Kaydı kaldır</button>' +
      '<button class="btn sm" data-act="bulkOff" style="margin-left:auto">Bitti</button></div>';
    if (!list.length) return head + ui.empty('bookmark','Kaydedilen yok','Gönderilerdeki yer imi simgesine dokun, burada birikir.') + '</div>';
    return head + '<div class="grid3' + (bulk?' selecting':'') + '">' + list.map(function (p) {
      var on = picked.indexOf(p.id) >= 0;
      var inner = p.media.length ? N.imgTag(p.media[0].src, p.media[0].seed, '', p.text.slice(0,40))
        : '<div class="tx">' + N.esc(p.text.slice(0,130)) + '</div>';
      return '<div class="gtile' + (on?' pick':'') + '" data-act="' + (bulk?'pick':'detail') + '" data-p="' + p.id + '">' + inner +
        '<span class="sel">' + (on?N.ico('check',12):'') + '</span>' +
        '<span class="kd">' + N.ico(p.reel?'reels':p.media.length>1?'stack':'image') + '</span>' +
        '<span class="ov"><span>' + N.ico('heartF') + N.nf(p.likes.length) + '</span><span>' + N.ico('comment') + p.comments.length + '</span></span></div>';
    }).join('') + '</div></div>';
  };
  F.notifs = function () {
    var me = N.me(), list = N.DB.notifs.filter(function(n){ return n.userId===me.id; });
    if (!list.length) return '<div class="feed-pad">' + ui.empty('bell','Bildirim yok','Beğeni, yorum ve takipler burada görünecek.') + '</div>';
    var T = { like:'gönderini beğendi', follow:'seni takip etmeye başladı', comment:'gönderine yorum yaptı', repost:'gönderini yeniden paylaştı', warn:'sana bir uyarı gönderdi', premium:'hesabına premium tanımladı' };
    var I = { like:'heartF', follow:'user', comment:'comment', repost:'repost', warn:'warn', premium:'crown' };
    var C = { like:'l', follow:'f', comment:'c', repost:'r', warn:'a', premium:'a' };
    return '<div class="feed-pad"><div class="chips"><button class="chip on" data-act="readAll">' + N.ico('check') + 'Tümünü okundu işaretle</button></div>' +
      list.map(function (n, i) {
        var u = N.user(n.fromId), p = n.postId ? N.post(n.postId) : null;
        if (!u) return '';
        return '<div class="notif' + (n.read?'':' unread') + '" style="animation-delay:' + Math.min(i*35,280) + 'ms" data-act="' + (p?'detail':'go') + '" ' + (p?'data-p="'+p.id+'"':'data-to="#/profile/'+u.handle+'"') + '>' +
          '<span class="nic ' + C[n.type] + '">' + N.ico(I[n.type]) + '</span>' +
          '<img class="av a40" src="' + N.avatarOf(u) + '" alt="">' +
          '<div class="nx"><b>' + N.esc(u.handle) + '</b> ' + T[n.type] + ' <time>' + N.ago(n.at) + '</time></div>' +
          (p && p.media.length ? N.imgTag(p.media[0].src, p.media[0].seed, 'av a44', '', 200, 200).replace('class="av a44"','class="av a44" style="border-radius:6px"') : '') +
        '</div>';
      }).join('') + '</div>';
  };
  F.bind = function () {
    F.bindCarousels(); F.bindInline();
    var s = $('#sortSel');
    if (s) s.onchange = function(){ N.DB.ui.sort = s.value; N.save(); N.app.render(); ui.beep('tick'); };
    var si = $('#searchIn');
    if (si) si.addEventListener('input', function () {
      var pos = si.selectionStart; N.DB.ui.query = si.value; N.app.render();
      var n = $('#searchIn'); if (n) { n.focus(); try { n.setSelectionRange(pos,pos); } catch(e){} }
    });
  };
})(window.NX);

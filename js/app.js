/* Nexus · kabuk, yönlendirme, olay delegasyonu, boot */
(function (N) {
  var app = N.app = {}, ui = N.ui, $ = N.$, $$ = N.$$;
  app.route = { k:'home', arg:null };

  var NAV = [
    { k:'home',    path:'#/home',          label:'Ana Sayfa',    ic:'home',    on:'homeF',    sub:'Akışın' },
    { k:'explore', path:'#/explore',       label:'Keşfet',       ic:'search',  on:'search',   sub:'Ara ve keşfet' },
    { k:'reels',   path:'#/reels',         label:'Reels',        ic:'reels',   on:'reels',    sub:'Dikey akış' },
    { k:'notifs',  path:'#/notifications', label:'Bildirimler',  ic:'bell',    on:'bell',     sub:'Etkileşimler' },
    { k:'saved',   path:'#/saved',         label:'Kaydedilenler',ic:'bookmark',on:'bookmarkF',sub:'Koleksiyonun' },
    { k:'profile', path:'#/profile/me',    label:'Profil',       ic:'user',    on:'user',     sub:'Hesabın' }
  ];

  function parse() {
    var h = location.hash || '#/home', m;
    m = h.match(/^#\/admin\/(.+)$/); if (m) return { k:'adminUser', arg:m[1] };
    if (h === '#/admin') return { k:'admin', arg:null };
    m = h.match(/^#\/profile\/(.+)$/); if (m) return { k:'profile', arg:m[1] };
    var r = NAV.filter(function(x){ return x.path === h; })[0];
    return { k: r ? r.k : 'home', arg:null };
  }
  app.nav = function (to) { if (location.hash === to) app.render(); else location.hash = to; };

  app.showAuth = function () {
    $('#app').hidden = true; $('#auth').hidden = false; $('#gate').classList.remove('on');
    document.title = 'Nexus · Giriş';
    N.auth.init();
    window.scrollTo(0,0);
  };
  app.enter = function () {
    N.auth.stopArt();
    $('#auth').hidden = true; $('#app').hidden = false;
    if (!N.auth.gate()) return;
    chrome();
    if (!location.hash || location.hash === '#/') location.hash = '#/home';
    app.render();
  };

  function chrome() {
    var me = N.me(); if (!me) return;
    var unread = N.unread();
    var items = NAV.slice();
    if (me.role === 'admin') items.splice(5, 0, { k:'admin', path:'#/admin', label:'Admin Panel', ic:'shield', on:'shield', sub:'Yönetim', adm:true });
    $('#sideNav').innerHTML = items.map(function (r) {
      var on = app.route.k === r.k || (r.k === 'admin' && app.route.k === 'adminUser') || (r.k === 'profile' && app.route.k === 'profile');
      var icon = r.k === 'profile'
        ? '<img class="ni-av" src="' + N.avatarOf(me) + '" alt="">'
        : N.ico(on ? r.on : r.ic);
      return '<a class="nav-i' + (on?' on':'') + (r.adm?' adm':'') + '" href="' + r.path + '">' +
        '<span class="ni-ic">' + icon + '</span><span>' + r.label + '</span>' +
        (r.k === 'notifs' && unread ? '<span class="ni-badge">' + unread + '</span>' : '') + '</a>';
    }).join('');
    $('#sideMore').querySelector('.ni-ic').innerHTML = N.ico('menu');

    var tabs = [
      { k:'home', ic:'home', on:'homeF', path:'#/home', label:'Ana sayfa' },
      { k:'explore', ic:'search', on:'search', path:'#/explore', label:'Keşfet' },
      { k:'create' },
      { k:'reels', ic:'reels', on:'reels', path:'#/reels', label:'Reels' },
      { k:'profile', label:'Profil' }
    ];
    $('#tabbar').innerHTML = tabs.map(function (t) {
      if (t.k === 'create') return '<button class="tb" data-act="openCam" aria-label="Reels oluştur"><span class="cbox">' + N.ico('plus') + '</span></button>';
      var on = app.route.k === t.k;
      if (t.k === 'profile') return '<button class="tb' + (on?' on':'') + '" data-act="go" data-to="#/profile/me" aria-label="Profil"><img class="tav" src="' + N.avatarOf(me) + '" alt=""></button>';
      return '<button class="tb' + (on?' on':'') + '" data-act="go" data-to="' + t.path + '" aria-label="' + t.label + '">' + N.ico(on?t.on:t.ic) +
        (t.k === 'home' && unread ? '<span class="bd"></span>' : '') + '</button>';
    }).join('');

    $('#tbFeather').innerHTML = N.ico('feather');
    $('#tbNotif').innerHTML = N.ico('bell') + '<i></i>';
    $('#tbNotif').classList.toggle('has', unread > 0);
    $('#menuBtn').innerHTML = N.ico('menu');
    $('#themeBtn').querySelector('.i-sun').innerHTML = N.ico('sun');
    $('#themeBtn').querySelector('.i-moon').innerHTML = N.ico('moon');
    $('#fab').innerHTML = N.ico('feather');
    ui.paintSound();

    var others = N.DB.users.filter(function(u){ return u.id !== me.id; });
    var sugg = others.filter(function(u){ return me.following.indexOf(u.id) < 0; }).slice(0,5);
    var recent = N.DB.posts.slice().sort(function(a,b){ return b.createdAt-a.createdAt; }).slice(0,3);
    $('#rail').innerHTML =
      '<div class="rail-me"><img class="av a56" src="' + N.avatarOf(me) + '" alt="">' +
        '<div style="min-width:0"><div class="nm">' + N.esc(me.handle) + '</div><div class="hd">' + N.esc(me.name) + '</div></div>' +
        '<button data-act="go" data-to="#/profile/me">Profil</button></div>' +
      '<div><div class="rail-t"><span>Senin için öneriler</span>' + (others.length?'<button data-act="go" data-to="#/explore">Tümü</button>':'') + '</div>' +
        (sugg.length ? sugg.map(function (u) {
          return '<div class="rail-row"><img class="av a44" src="' + N.avatarOf(u) + '" alt="" data-act="go" data-to="#/profile/' + u.handle + '" style="cursor:pointer">' +
            '<div style="min-width:0"><div class="nm">' + N.esc(u.handle) + ui.vf(u) + '</div><div class="hd">' + N.esc(u.name) + '</div></div>' +
            '<button data-act="follow" data-u="' + u.id + '">Takip et</button></div>';
        }).join('')
        : '<div class="rail-empty">Henüz başka hesap yok.' + (me.role==='admin' ? ' <b style="color:var(--text2)">Admin Panel → Hesap ekle</b> ile arkadaşlarını oluştur.' : '') + '</div>') +
      '</div>' +
      (recent.length ? '<div><div class="rail-t"><span>Son hareketler</span></div>' +
        recent.map(function (p) { var u = N.user(p.authorId); if(!u) return '';
          return '<div class="rail-row" data-act="detail" data-p="' + p.id + '" style="cursor:pointer"><img class="av a32" src="' + N.avatarOf(u) + '" alt="">' +
            '<div style="min-width:0"><div class="nm" style="font-size:12.5px">' + N.esc(u.handle) + '</div>' +
            '<div class="hd" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px">' + N.esc((p.text||'Görsel').slice(0,40)) + '</div></div></div>';
        }).join('') + '</div>' : '') +
      '<div class="rail-foot">Nexus · Heisenberg Lab<br>Bu prototipte tüm veriler yalnızca bu tarayıcıda saklanır.<br>© 2026</div>';
  }

  app.render = function () {
    var me = N.me();
    if (!me) { app.showAuth(); return; }
    if (!N.auth.gate()) return;
    app.route = parse();
    if ((app.route.k === 'admin' || app.route.k === 'adminUser') && me.role !== 'admin') { app.nav('#/home'); return; }

    var meta = NAV.filter(function(r){ return r.k === app.route.k; })[0] || NAV[0];
    var title = meta.label, sub = meta.sub;
    if (app.route.k === 'profile') { var u = N.profile.target(); title = u ? u.name : 'Profil'; sub = u ? '@'+u.handle : ''; }
    if (app.route.k === 'admin') { title = 'Admin Panel'; sub = 'Hesap yönetimi'; }
    if (app.route.k === 'adminUser') { var t = N.user(app.route.arg); title = t ? t.name : 'Hesap'; sub = t ? '@'+t.handle+' · yönetim' : ''; }
    if (app.route.k === 'home') sub = N.feed.filtered().length + ' gönderi';
    if (app.route.k === 'notifs') { var n = N.unread(); sub = n ? n + ' yeni' : 'tümü okundu'; }
    $('#tbTitle').textContent = title; $('#tbSub').textContent = sub;
    $('#mhTitle').textContent = title; $('#mhSub').textContent = sub;
    document.title = 'Nexus · ' + title;

    N.reels.stop();
    var V = {
      home:N.feed.home, explore:N.feed.explore, reels:N.reels.view,
      notifs:N.feed.notifs, saved:N.feed.saved, profile:N.profile.view,
      admin:N.admin.view, adminUser:function(){ return N.admin.detail(app.route.arg); }
    }[app.route.k] || N.feed.home;
    $('#view').innerHTML = V();

    var isReels = app.route.k === 'reels';
    $('#iosStatus').classList.toggle('hide', isReels);
    $('#fab').classList.toggle('on', app.route.k === 'home' && !N.isMobile());
    $('#tbFeather').style.display = (app.route.k === 'home' || app.route.k === 'explore') ? '' : 'none';

    chrome();
    N.feed.bind(); N.admin.bind();
    if (isReels) N.reels.init();
    if (app.route.k === 'notifs') setTimeout(function () {
      N.DB.notifs.forEach(function(x){ if (x.userId === me.id) x.read = true; });
      N.save(); chrome();
    }, 1500);
    window.scrollTo(0, 0);
  };

  function menu() {
    var me = N.me(), unread = N.unread();
    $('#menuBody').innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;padding:2px 4px 16px"><img class="av a56" src="' + N.avatarOf(me) + '" alt="">' +
        '<div style="min-width:0"><div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:5px">' + N.esc(me.handle) + ui.vf(me) + '</div>' +
        '<div style="font-size:13px;color:var(--text3)">' + N.esc(me.name) + '</div></div>' +
        '<button class="btn sm" data-act="go" data-to="#/profile/me" style="margin-left:auto">Profil</button></div>' +
      '<div class="msec"><h4>Gezinme</h4>' +
        NAV.map(function(r){ return '<button class="mrow" data-act="go" data-to="' + r.path + '">' + N.ico(r.ic) + r.label +
          (r.k==='notifs'&&unread?'<span class="rt">'+unread+' yeni</span>':'') + '</button>'; }).join('') +
        (me.role==='admin' ? '<button class="mrow" data-act="go" data-to="#/admin" style="color:var(--amber)">' + N.ico('shield') + 'Admin Panel<span class="rt">' + N.DB.users.length + ' hesap</span></button>' : '') +
      '</div>' +
      '<div class="msec"><h4>Oluştur</h4>' +
        '<button class="mrow" data-act="compose">' + N.ico('feather') + 'Gönderi yaz</button>' +
        '<button class="mrow" data-act="openCam">' + N.ico('reels') + 'Reels oluştur</button>' +
        '<button class="mrow" data-act="go" data-to="#/saved">' + N.ico('bookmark') + 'Kaydedilenler<span class="rt">' + N.DB.posts.filter(function(p){return p.saves.indexOf(me.id)>=0;}).length + '</span></button>' +
      '</div>' +
      '<div class="msec"><h4>Ayarlar</h4>' +
        '<button class="mrow" data-act="theme">' + N.ico(N.DB.settings.theme==='light'?'moon':'sun') + 'Karanlık mod<span class="sw' + (N.DB.settings.theme!=='light'?' on':'') + '"><i></i></span></button>' +
        '<button class="mrow" data-act="sound">' + N.ico(N.DB.settings.sound?'vol':'volX') + 'Ses efektleri<span class="sw' + (N.DB.settings.sound?' on':'') + '"><i></i></span></button>' +
        '<button class="mrow" data-act="editProfile">' + N.ico('edit') + 'Profili düzenle</button>' +
        '<button class="mrow" data-act="changePw">' + N.ico('key') + 'Şifremi değiştir</button>' +
        '<button class="mrow" data-act="activity">' + N.ico('activity') + 'Etkinliğim</button>' +
        '<button class="mrow" data-act="privacy">' + N.ico('shield') + 'Gizlilik ve veri</button>' +
      '</div>' +
      '<div class="msec"><h4>Hesap</h4>' +
        '<button class="mrow" data-act="logout">' + N.ico('logout') + 'Çıkış yap</button>' +
        '<button class="mrow dgr" data-act="reset">' + N.ico('refresh') + 'Tüm veriyi sıfırla</button>' +
      '</div>' +
      '<p style="font-size:11.5px;color:var(--text3);line-height:1.7;padding:6px 4px">Nexus prototip · veriler yalnızca bu tarayıcıda. Gerçek şifre kullanma.</p>';
    ui.panel('#menuPanel');
  }

  function changePw() {
    ui.sheet('Şifremi değiştir',
      '<label class="lbl">Mevcut şifre</label><input class="inp" type="password" id="pwOld" style="margin-bottom:12px">' +
      '<label class="lbl">Yeni şifre</label><input class="inp" type="password" id="pwNew" style="margin-bottom:12px">' +
      '<label class="lbl">Yeni şifre tekrar</label><input class="inp" type="password" id="pwNew2" style="margin-bottom:18px">' +
      '<button class="btn pri blk" data-act="pwGo">' + N.ico('key') + 'Şifreyi güncelle</button>');
  }
  function changePwGo() {
    var me = N.me(), o = $('#pwOld').value, a = $('#pwNew').value, b = $('#pwNew2').value;
    if (a.length < 6) return ui.toast('Yeni şifre en az 6 karakter olmalı','warn');
    if (a !== b) return ui.toast('Yeni şifreler eşleşmiyor','err');
    N.auth.login(me.handle, o).then(function () {
      return N.auth.setPass(me, a);
    }).then(function () {
      N.DB.session = me.id; N.save(); N.log('şifre değiştirdi', me.id, '@'+me.handle);
      ui.closeAll(); ui.beep('ok'); ui.toast('Şifren güncellendi','ok');
    }).catch(function (m) { ui.toast(typeof m === 'string' ? m : 'Mevcut şifre yanlış','err'); });
  }
  function activity() {
    var me = N.me();
    var rows = [
      ['Beğendiğin', N.DB.posts.filter(function(p){return p.likes.indexOf(me.id)>=0;}).length, '#DD2A7B'],
      ['Yorumların', N.DB.posts.reduce(function(a,p){return a+p.comments.filter(function(c){return c.authorId===me.id;}).length;},0), '#1D9BF0'],
      ['Kaydettiklerin', N.DB.posts.filter(function(p){return p.saves.indexOf(me.id)>=0;}).length, '#F58529'],
      ['Gönderilerin', N.postsOf(me.id).length, '#8134AF'],
      ['Yeniden paylaştığın', N.DB.posts.filter(function(p){return p.reposts.indexOf(me.id)>=0;}).length, '#00E676'],
      ['Takip ettiğin', me.following.length, '#22D3EE'],
      ['Reels', N.postsOf(me.id).filter(function(p){return p.reel;}).length, '#FF3B30']
    ];
    var mx = Math.max(1, Math.max.apply(null, rows.map(function(r){return r[1];})));
    ui.sheet('Etkinliğin', rows.map(function (r) {
      return '<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>' +
        '<div style="height:8px;border-radius:99px;background:var(--chip);overflow:hidden"><div style="height:100%;width:' + (r[1]/mx*100) + '%;background:' + r[2] + ';border-radius:99px"></div></div></div>';
    }).join('') + '<p style="font-size:12px;color:var(--text3);margin-top:14px">Bu tarayıcıdaki gerçek etkileşimlerin.</p>');
  }
  function privacy() {
    ui.sheet('Gizlilik ve veri',
      '<div style="font-size:13.5px;line-height:1.75;color:var(--text2)">' +
      '<p style="margin:0 0 12px"><b style="color:var(--text)">Her şey bu cihazda.</b> Hesaplar, gönderiler, yorumlar ve görseller yalnızca tarayıcının yerel deposunda tutulur. Hiçbir sunucuya istek gönderilmez.</p>' +
      '<p style="margin:0 0 12px">IP adresi toplanmaz. Engelleme, hesap ve rastgele üretilmiş cihaz kimliği üzerinden çalışır.</p>' +
      '<p style="margin:0 0 12px">Kamera görüntüsü cihazda işlenir; kaydedilen video bu oturumda bellekte tutulur, sayfayı yenilediğinde kaybolur.</p>' +
      '<p style="margin:0 0 12px">Instagram reels, Instagram’ın kendi resmî embed sayfası olarak gösterilir; video Nexus’a kopyalanmaz.</p>' +
      '<p style="margin:0 0 16px">Şifreler SHA-256 ile özetlenip saklanır ama bu bir prototiptir — aynı tarayıcıyı kullanan herkes verilere erişebilir. Gerçek şifreni kullanma.</p>' +
      '<button class="btn dgr blk" data-act="reset">' + N.ico('trash') + 'Tüm veriyi sil</button></div>');
  }

  /* ── olay delegasyonu ── */
  document.addEventListener('click', function (e) {
    var close = e.target.closest('[data-close]');
    if (close) { e.preventDefault(); ui.closeAll(); ui.beep('tick'); return; }
    var t = e.target.closest('[data-act]');
    if (!t) {
      if (!e.target.closest('.emoji') && !e.target.closest('[data-act="emoji"]')) { var em = $('#emojiPop'); if (em) em.classList.remove('on'); }
      return;
    }
    var a = t.dataset.act, p = t.dataset.p, u = t.dataset.u;
    var stop = function(){ e.preventDefault(); e.stopPropagation(); };
    var F = N.feed, R = N.reels, P = N.profile, AD = N.admin;

    switch (a) {
      case 'go': stop(); ui.closeAll(); app.nav(t.dataset.to); ui.beep('tick'); break;
      case 'theme': stop(); ui.toggleTheme(); if ($('#menuPanel').classList.contains('on')) menu(); break;
      case 'sound': stop(); ui.toggleSound(); if ($('#menuPanel').classList.contains('on')) menu(); break;
      case 'menu': stop(); menu(); break;
      case 'logout': stop(); N.auth.logout(); break;
      case 'ackWarn': stop(); N.auth.ack(t.dataset.w); break;

      case 'compose': stop(); F.openCompose(); break;
      case 'publish': stop(); F.publish(); break;
      case 'pickImg': stop(); if (!$('#composePanel').classList.contains('on')) F.openCompose(); $('#fileIn').click(); break;
      case 'pickAvatar': stop(); $('#avatarIn').click(); break;
      case 'rmThumb': stop(); F.draft.media.splice(+t.dataset.i, 1); F.sync(); ui.beep('tick'); break;
      case 'mvThumb': { stop(); var i = +t.dataset.i, d = +t.dataset.d, j = i + d;
        if (j < 0 || j >= F.draft.media.length) break;
        var x = F.draft.media.splice(i,1)[0]; F.draft.media.splice(j,0,x); F.sync(); ui.beep('tick'); break; }
      case 'emoji': stop(); { var ep = $('#emojiPop'); if (ep) ep.classList.toggle('on'); } break;
      case 'insEmoji': stop(); F.draft.text = (F.draft.text + t.dataset.e).slice(0,280);
        { var ci = $('#cpIn'); if (ci) ci.value = F.draft.text; } F.sync(); ui.beep('tick'); break;
      case 'poll': stop(); F.draft.text = (F.draft.text + (F.draft.text?'\n':'') + '📊 Anket: ').slice(0,280);
        { var c2 = $('#cpIn'); if (c2) { c2.value = F.draft.text; c2.focus(); } } F.sync();
        ui.toast('Sorunu yaz, seçenekleri satır satır ekle','info'); break;

      case 'like': stop(); F.like(p); break;
      case 'save': stop(); F.save(p); break;
      case 'repost': stop(); F.repostMenu(p); break;
      case 'rpNow': stop(); F.repostNow(p); break;
      case 'rpQuote': stop(); ui.closeAll(); F.openCompose(p); break;
      case 'share': stop(); F.share(p); break;
      case 'comments': stop(); F.comments(p); break;
      case 'sendCmt': { stop(); var ci3 = $('#cmtIn'); if (ci3) F.sendCmt(N.feed._cmt || lastCmt(), ci3.value); break; }
      case 'quickCmt': { stop(); var inp = $('[data-cin="' + p + '"]'); if (inp && inp.value.trim()) { F.sendCmt(p, inp.value); } break; }
      case 'cmtLike': stop(); F.cmtAction('like', t.dataset.c); break;
      case 'cmtDel': stop(); F.cmtAction('del', t.dataset.c); break;
      case 'cmtReply': { stop(); var cr = $('#cmtIn'); if (cr) { cr.value = '@' + t.dataset.h + ' '; cr.focus(); } break; }
      case 'detail': stop(); F.detail(p); break;
      case 'postMenu': stop(); F.postMenu(p); break;
      case 'hide': stop(); F.hide(p); break;
      case 'editPost': stop(); F.editPost(p); break;
      case 'saveEdit': stop(); F.saveEdit(p); break;
      case 'delPost': stop(); ui.confirm('Gönderiyi sil','Bu gönderi silinecek. Kısa süre geri alabilirsin.','Sil',function(){ F.remove(p); },true); break;
      case 'cnav': { stop(); var tr = document.getElementById(t.dataset.t);
        if (tr) tr.scrollBy({ left: tr.clientWidth * (+t.dataset.d), behavior:'smooth' }); ui.beep('tick'); break; }

      case 'filter': stop(); N.DB.ui.filter = t.dataset.f; N.save(); app.render(); ui.beep('tick'); break;
      case 'clrSearch': stop(); N.DB.ui.query = ''; app.render(); break;
      case 'tag': stop(); N.DB.ui.query = '#' + t.dataset.tag; ui.closeAll(); app.nav('#/explore'); break;
      case 'handle': stop(); ui.closeAll(); app.nav('#/profile/' + t.dataset.h); break;
      case 'readAll': stop(); { var mm = N.me(); N.DB.notifs.forEach(function(n){ if(n.userId===mm.id) n.read = true; }); N.save(); app.render(); ui.toast('Tümü okundu','ok'); } break;
      case 'bulkOn': stop(); N.DB.ui.bulk = true; N.DB.ui.picked = []; app.render(); break;
      case 'bulkOff': stop(); N.DB.ui.bulk = false; N.DB.ui.picked = []; app.render(); break;
      case 'pick': { stop(); var pk = N.DB.ui.picked || []; var ix = pk.indexOf(p);
        if (ix >= 0) pk.splice(ix,1); else pk.push(p); N.DB.ui.picked = pk; app.render(); ui.beep('tick'); break; }
      case 'pickAll': stop(); { var m2 = N.me(); N.DB.ui.picked = N.DB.posts.filter(function(x){return x.saves.indexOf(m2.id)>=0;}).map(function(x){return x.id;}); app.render(); } break;
      case 'bulkUnsave': { stop(); var ids = (N.DB.ui.picked||[]).slice(); if (!ids.length) { ui.toast('Önce seçim yap','warn'); break; }
        var m3 = N.me();
        N.DB.posts.forEach(function(x){ if (ids.indexOf(x.id)>=0) x.saves = x.saves.filter(function(s){return s!==m3.id;}); });
        N.DB.ui.bulk = false; N.DB.ui.picked = []; N.save(); app.render(); ui.beep('del');
        ui.toast(ids.length + ' gönderi kayıttan kaldırıldı','info',{ label:'Geri al', fn:function(){
          N.DB.posts.forEach(function(x){ if (ids.indexOf(x.id)>=0 && x.saves.indexOf(m3.id)<0) x.saves.push(m3.id); });
          N.save(); app.render(); ui.toast('Geri alındı','ok'); } }); break; }

      case 'ptab': stop(); N.DB.ui.ptab = t.dataset.t; N.save(); app.render(); ui.beep('tick'); break;
      case 'follow': stop(); P.follow(u); break;
      case 'followList': stop(); P.followList(t.dataset.u, t.dataset.kind); break;
      case 'editProfile': stop(); P.edit(); break;
      case 'epSave': stop(); P.saveEdit(); break;
      case 'shareProfile': { stop(); var uu = N.user(u); ui.copy(location.origin + location.pathname + '#/profile/' + uu.handle, 'Profil bağlantısı kopyalandı'); break; }
      case 'msg': stop(); P.msg(u); break;
      case 'msgSend': stop(); P.sendMsg(u); break;
      case 'changePw': stop(); changePw(); break;
      case 'pwGo': stop(); changePwGo(); break;
      case 'activity': stop(); activity(); break;
      case 'privacy': stop(); privacy(); break;
      case 'reset': stop(); ui.confirm('Tüm veriyi sıfırla','Hesaplar, gönderiler ve ayarlar silinip başlangıç durumuna dönülecek. Yönetici hesabı yeniden @heisenberg / Emirhan2012 olur.','Sıfırla',function(){
        N.reset(); ui.applyTheme(); app.showAuth(); ui.toast('Sıfırlandı','ok'); }, true); break;

      case 'openCam': stop(); R.open(); break;
      case 'camTab': stop(); R.tab(t.dataset.t); break;
      case 'camStart': stop(); R.startCam(); break;
      case 'camFlip': stop(); R.flip(); break;
      case 'camShoot': stop(); R.shoot(); break;
      case 'camStop': stop(); R.stopCam(); $('#camPane').innerHTML = R.camPane(); ui.toast('Kamera kapatıldı','info'); break;
      case 'camRetake': stop(); R.retake(); break;
      case 'camPublish': stop(); R.publishLocal(); break;
      case 'camPublishGo': stop(); R.publishLocalGo(); break;
      case 'igPreview': stop(); R.preview(); break;
      case 'igAdd': stop(); R.addIG(); break;
      case 'reelMute': stop(); ui.toggleSound(); break;
      case 'capToggle': stop(); t.classList.toggle('open'); break;

      case 'newUser': stop(); AD.newUser(); break;
      case 'nuGen': stop(); { var chars='abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'; var s='';
        for (var q=0;q<10;q++) s += chars[Math.floor(Math.random()*chars.length)]; $('#nuPass').value = s; ui.beep('tick'); } break;
      case 'nuCreate': stop(); AD.create(); break;
      case 'copyCred': stop(); ui.copy('Kullanıcı adı: @' + t.dataset.h + '\nŞifre: ' + t.dataset.p, 'Giriş bilgileri kopyalandı'); break;
      case 'rpGen': stop(); { var ch2='abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'; var s2='';
        for (var w=0;w<10;w++) s2 += ch2[Math.floor(Math.random()*ch2.length)]; $('#rpPass').value = s2; ui.beep('tick'); } break;
      case 'rpGo': stop(); AD.resetPwGo(u); break;
      case 'admClr': stop(); N.DB.ui.aq = ''; app.render(); break;
      case 'adSaveInfo': stop(); AD.saveInfo(u); break;
      case 'adVerify': stop(); AD.verify(u); break;
      case 'adResetPw': stop(); AD.resetPw(u); break;
      case 'adPremOn': stop(); AD.prem(u, true); break;
      case 'adPremOff': stop(); AD.prem(u, false); break;
      case 'adWarn': stop(); AD.warn(u); break;
      case 'adFreeze': stop(); AD.freeze(u, true); break;
      case 'adUnfreeze': stop(); AD.freeze(u, false); break;
      case 'adBan': stop(); AD.ban(u, true); break;
      case 'adUnban': stop(); AD.ban(u, false); break;
      case 'adDelPosts': stop(); AD.delPosts(u); break;
      case 'adDelete': stop(); AD.delUser(u); break;
    }
  });

  function lastCmt(){ return N.feed._lastCmt; }
  var _oc = N.feed.comments;
  N.feed.comments = function (pid) { N.feed._lastCmt = pid; _oc(pid); };

  $('#scrim').addEventListener('click', function(){ ui.closeAll(); ui.beep('tick'); });
  $('#menuBtn').addEventListener('click', function(e){ e.stopPropagation(); });
  $('#sideMore').addEventListener('click', function(){ menu(); });
  $('#themeBtn').addEventListener('click', function(){ ui.toggleTheme(); });
  $('#soundBtn').addEventListener('click', function(){ ui.toggleSound(); });
  $('#tbFeather').addEventListener('click', function(){ N.feed.openCompose(); });
  $('#fab').addEventListener('click', function(){ N.feed.openCompose(); });
  $('#tbNotif').addEventListener('click', function(){ app.nav('#/notifications'); });

  $('#fileIn').addEventListener('change', function (e) { N.feed.addFiles(e.target.files); e.target.value = ''; });
  $('#avatarIn').addEventListener('change', function (e) { if (e.target.files[0]) N.profile.setAvatar(e.target.files[0]); e.target.value = ''; });
  ['dragover','drop'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (e.dataTransfer && e.dataTransfer.types && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) {
        e.preventDefault();
        if (ev === 'drop' && e.dataTransfer.files.length) {
          if (!$('#composePanel').classList.contains('on')) N.feed.openCompose();
          N.feed.addFiles(e.dataTransfer.files);
        }
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { ui.closeAll(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if ($('#app').hidden) return;
    if (e.key === '/') { e.preventDefault(); app.nav('#/explore'); setTimeout(function(){ var i = $('#searchIn'); if (i) i.focus(); }, 180); }
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); N.feed.openCompose(); }
    if (e.key === 't' || e.key === 'T') ui.toggleTheme();
    if (e.key === 'm' || e.key === 'M') ui.toggleSound();
  });
  window.addEventListener('hashchange', function(){ if (!$('#app').hidden) app.render(); });
  window.addEventListener('scroll', function () {
    $('#topbar').classList.toggle('stuck', window.scrollY > 6);
  }, { passive:true });
  window.addEventListener('resize', function () {
    var f = $('#fab'); if (f) f.classList.toggle('on', app.route.k === 'home' && !N.isMobile() && !$('#app').hidden);
  });
  window.addEventListener('beforeunload', function(){ N.reels.stopCam(); });
  window.addEventListener('error', function(e){ console.warn('Nexus:', e.message); });

  /* ── boot ── */
  N.load();
  ui.applyTheme();
  ui.paintClock(); setInterval(ui.paintClock, 20000);
  if (N.me() && N.auth.gate()) app.enter(); else app.showAuth();
})(window.NX);

/* Nexus · yönetici paneli ve hesap yönetimi */
(function (N) {
  var A = N.admin = {}, ui = N.ui, $ = N.$, $$ = N.$$;

  function guard() { var m = N.me(); return m && m.role === 'admin'; }
  function randPass() {
    var a = 'abcdefghjkmnpqrstuvwxyz', b = 'ABCDEFGHJKMNPQRSTUVWXYZ', c = '23456789', s = '!@#$%';
    var p = '';
    for (var i=0;i<4;i++) p += a[Math.floor(Math.random()*a.length)];
    for (var j=0;j<2;j++) p += b[Math.floor(Math.random()*b.length)];
    for (var k=0;k<2;k++) p += c[Math.floor(Math.random()*c.length)];
    p += s[Math.floor(Math.random()*s.length)];
    return p;
  }
  function slug(s) {
    return String(s).toLowerCase()
      .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
      .replace(/[^a-z0-9_.]/g,'').slice(0,20);
  }
  A.statusBadge = function (u) {
    if (u.banned) return '<span class="badge ban">' + N.ico('ban',10) + 'ENGELLİ</span>';
    if (u.status === 'frozen' && u.frozenUntil > Date.now()) return '<span class="badge frz">' + N.ico('snow',10) + 'DONDURULDU</span>';
    if (u.warnings.length) return '<span class="badge warn">' + N.ico('warn',10) + u.warnings.length + ' UYARI</span>';
    return '<span class="badge ok">' + N.ico('check',10) + 'AKTİF</span>';
  };

  /* ── panel ── */
  A.view = function () {
    if (!guard()) return ui.empty('lock','Yetkin yok','Bu bölüm yalnızca yönetici hesabına açıktır.');
    var us = N.DB.users, posts = N.DB.posts;
    var banned = us.filter(function(u){ return u.banned; }).length;
    var frozen = us.filter(function(u){ return u.status==='frozen' && u.frozenUntil>Date.now(); }).length;
    var prem = us.filter(function(u){ return u.premium && u.premium.active; }).length;
    var warns = us.reduce(function(a,u){ return a + u.warnings.length; }, 0);
    var likes = posts.reduce(function(a,p){ return a + p.likes.length; }, 0);
    var cmts = posts.reduce(function(a,p){ return a + p.comments.length; }, 0);
    var reels = posts.filter(function(p){ return p.reel; }).length;

    var stats = [
      ['Hesap', us.length, '#515BD4', 'users'],
      ['Gönderi', posts.length, '#8134AF', 'grid'],
      ['Reels', reels, '#DD2A7B', 'reels'],
      ['Beğeni', likes, '#FF3B30', 'heart'],
      ['Yorum', cmts, '#1D9BF0', 'comment'],
      ['Premium', prem, '#F58529', 'crown'],
      ['Uyarı', warns, '#FFB300', 'warn'],
      ['Engelli', banned + frozen, '#00C853', 'ban']
    ];
    var q = (N.DB.ui.aq || '').toLowerCase();
    var list = us.filter(function(u){ return !q || u.name.toLowerCase().indexOf(q)>=0 || u.handle.toLowerCase().indexOf(q)>=0; });
    list.sort(function(a,b){ return (b.lastLogin||0)-(a.lastLogin||0); });

    var days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'], counts = [0,0,0,0,0,0,0];
    posts.forEach(function(p){ counts[(new Date(p.createdAt).getDay()+6)%7]++; });
    var mx = Math.max(1, Math.max.apply(null, counts));
    var cols = ['#1D9BF0','#515BD4','#8134AF','#DD2A7B','#F58529','#00E676','#22D3EE'];

    return '<div class="adm"><div class="adm-hero"><div class="in">' +
      '<h2>' + N.ico('shield') + 'Yönetici Paneli</h2>' +
      '<p>Hesapları buradan oluştur ve yönet. Bir hesabın adına dokun; uyarı, dondurma, engelleme, premium ve tüm alanlar tek ekranda.</p>' +
      '</div></div>' +
      '<div class="adm-stats">' + stats.map(function(s){
        return '<div class="astat" style="--c:' + s[2] + '"><span class="ai">' + N.ico(s[3]) + '</span><b>' + N.nf(s[1]) + '</b><span>' + s[0].toUpperCase() + '</span></div>'; }).join('') + '</div>' +
      '<div class="acard" style="margin-bottom:16px"><h3>' + N.ico('chart') + 'Haftalık gönderi dağılımı</h3><div class="chart">' +
        counts.map(function(c,i){ return '<div class="bar"><span class="bv">' + c + '</span><div class="bb" style="height:' + (c/mx*76) + '%;background:' + cols[i] + '"></div><span class="bl">' + days[i] + '</span></div>'; }).join('') +
      '</div></div>' +
      '<div class="adm-bar"><div class="search">' + N.ico('search') +
        '<input id="admSearch" placeholder="Hesap ara…" value="' + N.esc(N.DB.ui.aq||'') + '" aria-label="Hesap ara">' +
        '<button class="clr' + (q?' on':'') + '" data-act="admClr" aria-label="Temizle">' + N.ico('x') + '</button></div>' +
        '<button class="btn ig" data-act="newUser">' + N.ico('plus') + 'Hesap ekle</button></div>' +
      '<div class="adm-list">' + (list.length ? list.map(function (u, i) {
        var np = N.postsOf(u.id).length;
        return '<div class="urow' + (u.banned?' banned':u.status==='frozen'?' frozen':'') + '" style="animation-delay:' + Math.min(i*35,280) + 'ms" data-act="go" data-to="#/admin/' + u.id + '">' +
          '<img class="av a44" src="' + N.avatarOf(u) + '" alt="">' +
          '<div class="ui"><div class="un">' + N.esc(u.name) + ui.vf(u) +
            (u.role==='admin'?'<span class="badge admin">YÖNETİCİ</span>':'') +
            (u.premium&&u.premium.active?'<span class="badge prem">PREM</span>':'') + A.statusBadge(u) + '</div>' +
            '<div class="uh">@' + N.esc(u.handle) + '</div>' +
            '<div class="um"><span>' + np + ' gönderi</span><span>' + (u.lastLogin ? 'son giriş ' + N.ago(u.lastLogin) : 'hiç giriş yapmadı') + '</span></div></div>' +
          '<span class="uc">' + N.ico('right') + '</span></div>';
      }).join('') : ui.empty('users','Hesap bulunamadı','Aramanı değiştir ya da yeni hesap ekle.','<button class="btn ig" data-act="newUser">'+N.ico('plus')+'Hesap ekle</button>')) + '</div>' +
      (N.DB.audit.length ? '<div class="acard" style="margin-top:18px"><h3>' + N.ico('activity') + 'Son işlemler</h3><div class="audit">' +
        N.DB.audit.slice(0,25).map(function(a){
          var c = /engelle|sil|kes/.test(a.action) ? '#FF3B30' : /premium|tik/.test(a.action) ? '#F58529' : /uyarı|dondur/.test(a.action) ? '#FFB300' : '#1D9BF0';
          return '<div class="al" style="--c:' + c + '"><span class="ad"></span><div class="ax"><b>' + N.esc(a.action) + '</b>' +
            (a.detail ? ' — ' + N.esc(a.detail) : '') + '<time>' + N.fullDate(a.at) + ' · ' + N.esc(a.actor) + '</time></div></div>';
        }).join('') + '</div></div>' : '') +
      '</div>';
  };

  /* ── hesap detayı ── */
  A.detail = function (id) {
    if (!guard()) return ui.empty('lock','Yetkin yok','Bu bölüm yalnızca yönetici hesabına açıktır.');
    var u = N.user(id);
    if (!u) return ui.empty('user','Hesap bulunamadı','Bu hesap silinmiş olabilir.','<button class="btn" data-act="go" data-to="#/admin">Panele dön</button>');
    var posts = N.postsOf(u.id), me = N.me(), self = u.id === me.id;
    var frozen = u.status === 'frozen' && u.frozenUntil > Date.now();
    var likes = posts.reduce(function(a,p){ return a+p.likes.length; }, 0);
    var logs = N.DB.audit.filter(function(a){ return a.target === u.id; }).slice(0,20);

    return '<div class="ud"><button class="ud-back" data-act="go" data-to="#/admin">' + N.ico('left') + 'Yönetici paneline dön</button>' +
      '<div class="ud-head"><img class="av a80" src="' + N.avatarOf(u) + '" alt="">' +
        '<div class="udi"><h2>' + N.esc(u.name) + ui.vf(u) + '</h2><div class="udh">@' + N.esc(u.handle) + '</div>' +
        '<div class="ud-tags">' + (u.role==='admin'?'<span class="badge admin">YÖNETİCİ</span>':'<span class="badge ok">ÜYE</span>') +
          A.statusBadge(u) + (u.premium&&u.premium.active?'<span class="badge prem">'+N.ico('crown',10)+'PREMIUM</span>':'') + '</div></div>' +
        '<button class="btn" data-act="go" data-to="#/profile/' + u.handle + '">' + N.ico('eye') + 'Profili gör</button></div>' +

      '<div class="ud-grid">' +
        '<div class="acard"><h3>' + N.ico('chart') + 'Özet</h3><div class="afull">' +
          '<div class="kv"><span>Gönderi</span><b>' + posts.length + '</b></div>' +
          '<div class="kv"><span>Aldığı beğeni</span><b>' + N.nf(likes) + '</b></div>' +
          '<div class="kv"><span>Takip ettiği</span><b>' + u.following.length + '</b></div>' +
          '<div class="kv"><span>Katılım</span><b>' + new Date(u.createdAt).toLocaleDateString('tr-TR') + '</b></div>' +
          '<div class="kv"><span>Son giriş</span><b>' + (u.lastLogin ? N.ago(u.lastLogin) : '—') + '</b></div>' +
          '<div class="kv"><span>Cihaz kimliği</span><b><code>' + N.esc(u.deviceId) + '</code></b></div>' +
        '</div></div>' +

        '<div class="acard"><h3>' + N.ico('edit') + 'Hesap bilgileri</h3><div class="afull">' +
          '<div><label class="lbl">Görünen ad</label><input class="inp" id="adName" value="' + N.esc(u.name) + '" maxlength="30"></div>' +
          '<div><label class="lbl">Kullanıcı adı</label><input class="inp" id="adHandle" value="' + N.esc(u.handle) + '" maxlength="20"></div>' +
          '<div><label class="lbl">Biyografi</label><textarea class="inp" id="adBio" maxlength="160" style="min-height:64px">' + N.esc(u.bio) + '</textarea></div>' +
          '<button class="btn pri blk" data-act="adSaveInfo" data-u="' + u.id + '">' + N.ico('check') + 'Bilgileri kaydet</button>' +
          '<div class="arow" style="margin-top:4px"><button class="btn" data-act="adVerify" data-u="' + u.id + '">' + N.ico('verified') + (u.verified?'Mavi tiki al':'Mavi tik ver') + '</button>' +
          '<button class="btn" data-act="adResetPw" data-u="' + u.id + '">' + N.ico('key') + 'Şifre sıfırla</button></div>' +
        '</div></div>' +

        '<div class="acard prem"><h3>' + N.ico('crown') + 'Premium</h3>' +
          '<div class="kv"><span>Durum</span><b>' + (u.premium&&u.premium.active?'Aktif':'Pasif') + '</b></div>' +
          '<div class="kv"><span>Bitiş</span><b>' + (u.premium&&u.premium.until?N.fullDate(u.premium.until):'—') + '</b></div>' +
          '<div style="margin:12px 0 10px"><label class="lbl">Süre</label><select class="inp" id="adPremDays">' +
            '<option value="1">1 gün</option><option value="7">7 gün</option><option value="30" selected>30 gün</option><option value="90">90 gün</option><option value="365">1 yıl</option></select></div>' +
          '<div class="arow"><button class="btn ig" data-act="adPremOn" data-u="' + u.id + '">' + N.ico('crown') + 'Premium ver</button>' +
          '<button class="btn dgr" data-act="adPremOff" data-u="' + u.id + '">Premium kes</button></div>' +
        '</div>' +

        '<div class="acard"><h3>' + N.ico('warn') + 'Uyarı gönder</h3>' +
          '<div class="kv"><span>Mevcut uyarı</span><b>' + u.warnings.length + ' / 3</b></div>' +
          '<div style="margin:12px 0 10px"><label class="lbl">Seviye</label><select class="inp" id="adWarnLv">' +
            '<option value="1">1 · Yazılı uyarı</option><option value="2">2 · 3 gün dondurma</option><option value="3">3 · Kalıcı engelleme</option></select></div>' +
          '<label class="lbl">Mesaj</label><textarea class="inp" id="adWarnMsg" maxlength="240" style="min-height:70px" placeholder="Kullanıcı giriş yaptığında bu mesajı görecek."></textarea>' +
          '<button class="btn blk" style="margin-top:11px;color:var(--warning);border-color:rgba(255,179,0,.4)" data-act="adWarn" data-u="' + u.id + '">' + N.ico('warn') + 'Uyarıyı gönder</button>' +
          (u.warnings.length ? '<div class="warnlog" style="margin-top:13px">' + u.warnings.slice().reverse().map(function(w){
            var c = w.level===3?'#FF3B30':w.level===2?'#0A84FF':'#FFB300';
            return '<div class="wl" style="--c:' + c + '"><div class="wt"><span>SEVİYE ' + w.level + '</span><span>' + N.ago(w.at) + '</span></div><div class="wx">' + N.esc(w.message) + '</div></div>';
          }).join('') + '</div>' : '') +
        '</div>' +

        '<div class="acard' + (frozen?' ok':'') + '"><h3>' + N.ico('snow') + 'Dondurma</h3>' +
          '<div class="kv"><span>Durum</span><b>' + (frozen?'Donduruldu':'Aktif') + '</b></div>' +
          (frozen ? '<div class="kv"><span>Açılış</span><b>' + N.fullDate(u.frozenUntil) + '</b></div>' : '') +
          '<div style="margin:12px 0 10px"><label class="lbl">Süre</label><select class="inp" id="adFrzDays">' +
            '<option value="1">1 gün</option><option value="3" selected>3 gün</option><option value="7">7 gün</option><option value="30">30 gün</option></select></div>' +
          '<div class="arow">' + (frozen
            ? '<button class="btn ok" data-act="adUnfreeze" data-u="' + u.id + '">' + N.ico('check') + 'Dondurmayı kaldır</button>'
            : '<button class="btn" style="color:var(--info);border-color:rgba(10,132,255,.4)" data-act="adFreeze" data-u="' + u.id + '">' + N.ico('snow') + 'Hesabı dondur') + '</button></div>' +
        '</div>' +

        '<div class="acard dgr"><h3>' + N.ico('ban') + 'Engelleme</h3>' +
          '<p style="font-size:12.5px;color:var(--text3);line-height:1.6;margin:0 0 12px">Bu prototipte engelleme hesap ve cihaz kimliği üzerinden çalışır. Gerçek IP engellemesi sunucu gerektirir; tarayıcıdan IP okunamaz.</p>' +
          '<div class="kv"><span>Cihaz</span><b><code>' + N.esc(u.deviceId) + '</code></b></div>' +
          '<div class="kv"><span>Engel</span><b>' + (u.banned?'Kalıcı engel aktif':'Yok') + '</b></div>' +
          '<div class="arow" style="margin-top:12px">' + (u.banned
            ? '<button class="btn ok" data-act="adUnban" data-u="' + u.id + '">' + N.ico('check') + 'Engeli kaldır</button>'
            : '<button class="btn dgr" data-act="adBan" data-u="' + u.id + '">' + N.ico('ban') + 'Kalıcı engelle') + '</button></div>' +
        '</div>' +

        '<div class="acard"><h3>' + N.ico('grid') + 'Gönderileri</h3>' +
          (posts.length ? '<div style="max-height:210px;overflow-y:auto">' + posts.slice(0,12).map(function(p){
            return '<div class="res-row" data-act="detail" data-p="' + p.id + '"><span class="nic c">' + N.ico(p.reel?'reels':p.media.length?'image':'quote') + '</span>' +
              '<div style="flex:1;min-width:0"><div style="font-size:13px">' + N.esc((p.text||'Görsel gönderi').slice(0,44)) + '</div>' +
              '<div style="font-size:11.5px;color:var(--text3)">' + N.ago(p.createdAt) + ' · ' + p.likes.length + ' beğeni</div></div>' +
              '<button class="btn sm dgr" data-act="delPost" data-p="' + p.id + '">' + N.ico('trash',13) + '</button></div>';
          }).join('') + '</div>' : '<p style="font-size:13px;color:var(--text3)">Bu hesabın gönderisi yok.</p>') +
          (posts.length ? '<button class="btn dgr blk" style="margin-top:11px" data-act="adDelPosts" data-u="' + u.id + '">' + N.ico('trash') + 'Tüm gönderileri sil (' + posts.length + ')</button>' : '') +
        '</div>' +

        '<div class="acard"><h3>' + N.ico('activity') + 'Bu hesapta yapılanlar</h3>' +
          (logs.length ? '<div class="audit">' + logs.map(function(a){
            return '<div class="al"><span class="ad"></span><div class="ax"><b>' + N.esc(a.action) + '</b>' + (a.detail?' — ' + N.esc(a.detail):'') +
              '<time>' + N.fullDate(a.at) + ' · ' + N.esc(a.actor) + '</time></div></div>'; }).join('') + '</div>'
            : '<p style="font-size:13px;color:var(--text3)">Henüz işlem yapılmamış.</p>') +
        '</div>' +
      '</div>' +

      (self ? '<p style="font-size:12.5px;color:var(--text3);text-align:center;padding:8px">Bu senin yönetici hesabın. Kendini engelleyemez veya silemezsin.</p>'
            : '<div class="acard dgr"><h3>' + N.ico('trash') + 'Tehlikeli bölge</h3>' +
              '<p style="font-size:13px;color:var(--text2);line-height:1.6;margin:0 0 12px">Hesap ve tüm gönderileri kalıcı olarak silinir. Bu işlem geri alınamaz.</p>' +
              '<button class="btn dgr" data-act="adDelete" data-u="' + u.id + '">' + N.ico('trash') + 'Hesabı kalıcı olarak sil</button></div>') +
      '</div>';
  };

  /* ── işlemler ── */
  A.newUser = function () {
    if (!guard()) return;
    ui.sheet('Yeni hesap ekle',
      '<div class="newu"><div><label class="lbl">Ad soyad</label><input class="inp" id="nuName" maxlength="30" placeholder="Örn. Ahmet Yılmaz"></div>' +
      '<div><label class="lbl">Kullanıcı adı</label><input class="inp" id="nuHandle" maxlength="20" placeholder="ahmetyilmaz"></div>' +
      '<div><label class="lbl">Geçici şifre</label><div class="genpw"><input class="inp" id="nuPass" value="' + randPass() + '">' +
      '<button class="btn" data-act="nuGen" aria-label="Yeni şifre üret">' + N.ico('refresh') + '</button></div></div>' +
      '<label style="display:flex;align-items:center;gap:9px;font-size:13.5px;cursor:pointer"><input type="checkbox" id="nuPrem" style="width:17px;height:17px">Premium olarak başlat (30 gün)</label>' +
      '<p style="font-size:12px;color:var(--text3);line-height:1.6;margin:2px 0 0">Şifreyi arkadaşına ilet; ilk girişten sonra profilinden değiştirebilir. Hesap bu tarayıcıda oluşur.</p>' +
      '<button class="btn ig blk" data-act="nuCreate">' + N.ico('plus') + 'Hesabı oluştur</button></div>');
    var n = $('#nuName'), h = $('#nuHandle');
    n.addEventListener('input', function(){ if (!h._touched) h.value = slug(n.value); });
    h.addEventListener('input', function(){ h._touched = true; h.value = slug(h.value); });
  };
  A.create = function () {
    var name = $('#nuName').value.trim(), handle = slug($('#nuHandle').value), pass = $('#nuPass').value;
    if (name.length < 2) return ui.toast('Ad en az 2 karakter olmalı','warn');
    if (!/^[a-z0-9_.]{3,20}$/.test(handle)) return ui.toast('Kullanıcı adı 3-20 karakter olmalı','warn');
    if (N.byHandle(handle)) return ui.toast('Bu kullanıcı adı alınmış','err');
    if (pass.length < 6) return ui.toast('Şifre en az 6 karakter olmalı','warn');
    var prem = $('#nuPrem').checked;
    var u = { id:'u_'+N.uid(), handle:handle, name:name, role:'user', verified:false, passHash:null,
      avatar:null, bio:'', link:'', loc:'', status:'active', frozenUntil:0, banned:false,
      deviceId:'nx-' + N.uid(), premium:{ active:prem, until:prem?Date.now()+30*86400000:0 },
      warnings:[], followers:[], following:[], createdAt:Date.now(), lastLogin:0 };
    N.auth.setPass(u, pass).then(function () {
      N.DB.users.push(u); N.log('hesap oluşturdu', u.id, '@'+handle); N.save();
      ui.beep('post'); ui.haptic(14);
      ui.sheet('Hesap hazır',
        '<div class="credbox"><b>' + N.esc(name) + '</b> için giriş bilgileri:<br>' +
        'Kullanıcı adı: <code>@' + N.esc(handle) + '</code><br>Şifre: <code>' + N.esc(pass) + '</code></div>' +
        '<div style="display:flex;gap:9px;margin-top:16px"><button class="btn pri" data-act="copyCred" data-h="' + N.esc(handle) + '" data-p="' + N.esc(pass) + '" style="flex:1">' + N.ico('copy') + 'Kopyala</button>' +
        '<button class="btn ig" data-act="go" data-to="#/admin/' + u.id + '" style="flex:1">' + N.ico('shield') + 'Hesabı yönet</button></div>');
      N.app.render();
    });
  };
  A.saveInfo = function (id) {
    var u = N.user(id); if (!u) return;
    var name = $('#adName').value.trim(), h = slug($('#adHandle').value);
    if (name.length < 2) return ui.toast('Ad en az 2 karakter olmalı','warn');
    if (!/^[a-z0-9_.]{3,20}$/.test(h)) return ui.toast('Kullanıcı adı geçersiz','warn');
    var o = N.byHandle(h); if (o && o.id !== u.id) return ui.toast('Bu kullanıcı adı alınmış','err');
    var old = u.handle;
    u.name = name; u.handle = h; u.bio = $('#adBio').value;
    if (!u.avatar) u.avatar = N.avatar(name, 120);
    N.log('bilgi güncelledi', u.id, old !== h ? '@'+old+' → @'+h : name);
    N.save(); N.app.render(); ui.beep('ok'); ui.toast('Bilgiler kaydedildi','ok');
  };
  A.verify = function (id) {
    var u = N.user(id); if (!u) return;
    u.verified = !u.verified;
    N.log(u.verified ? 'mavi tik verdi' : 'mavi tiki aldı', u.id, '@'+u.handle);
    N.save(); N.app.render(); ui.beep('ok');
    ui.toast(u.verified ? 'Mavi tik verildi' : 'Mavi tik kaldırıldı', 'ok');
  };
  A.resetPw = function (id) {
    var u = N.user(id); if (!u) return;
    ui.sheet('Şifre sıfırla · @' + u.handle,
      '<label class="lbl">Yeni şifre</label><div class="genpw"><input class="inp" id="rpPass" value="' + randPass() + '">' +
      '<button class="btn" data-act="rpGen">' + N.ico('refresh') + '</button></div>' +
      '<p style="font-size:12px;color:var(--text3);line-height:1.6;margin:12px 0 16px">Yeni şifreyi kullanıcıya ilet. Eski şifre geçersiz olur.</p>' +
      '<button class="btn pri blk" data-act="rpGo" data-u="' + id + '">' + N.ico('key') + 'Şifreyi değiştir</button>');
  };
  A.resetPwGo = function (id) {
    var u = N.user(id), p = $('#rpPass').value;
    if (p.length < 6) return ui.toast('Şifre en az 6 karakter olmalı','warn');
    N.auth.setPass(u, p).then(function () {
      N.log('şifre sıfırladı', u.id, '@'+u.handle); N.save(); ui.beep('ok');
      ui.sheet('Şifre değiştirildi',
        '<div class="credbox">@' + N.esc(u.handle) + '<br>Yeni şifre: <code>' + N.esc(p) + '</code></div>' +
        '<button class="btn pri blk" style="margin-top:14px" data-act="copyCred" data-h="' + N.esc(u.handle) + '" data-p="' + N.esc(p) + '">' + N.ico('copy') + 'Kopyala</button>');
    });
  };
  A.prem = function (id, on) {
    var u = N.user(id); if (!u) return;
    if (on) {
      var d = +$('#adPremDays').value;
      var base = (u.premium && u.premium.active && u.premium.until > Date.now()) ? u.premium.until : Date.now();
      u.premium = { active:true, until: base + d*86400000 };
      N.notify(u.id, 'premium', N.me().id, null);
      N.log('premium verdi', u.id, d + ' gün · @' + u.handle);
      ui.toast('@' + u.handle + ' artık premium · ' + d + ' gün', 'ok');
    } else {
      u.premium = { active:false, until:0 };
      N.log('premium kesti', u.id, '@'+u.handle);
      ui.toast('Premium kaldırıldı', 'info');
    }
    N.save(); N.app.render(); ui.beep(on ? 'ok' : 'del'); ui.haptic(10);
  };
  A.warn = function (id) {
    var u = N.user(id); if (!u) return;
    var lv = +$('#adWarnLv').value, msg = $('#adWarnMsg').value.trim();
    if (!msg) return ui.toast('Uyarı mesajı boş olamaz','warn');
    if (u.id === N.me().id) return ui.toast('Kendine uyarı gönderemezsin','warn');
    u.warnings.push({ id:N.uid(), level:lv, message:msg, at:Date.now(), by:N.me().handle, seen:false });
    N.notify(u.id, 'warn', N.me().id, null);
    var extra = '';
    if (lv === 2) { u.status = 'frozen'; u.frozenUntil = Date.now() + 3*86400000; extra = ' · 3 gün donduruldu'; }
    if (lv === 3) { u.banned = true; u.status = 'banned'; extra = ' · kalıcı engellendi'; }
    N.log('uyarı gönderdi (seviye ' + lv + ')', u.id, '@' + u.handle + extra);
    N.save(); N.app.render(); ui.beep('del'); ui.haptic(16);
    ui.toast('Uyarı gönderildi' + extra, 'warn');
  };
  A.freeze = function (id, on) {
    var u = N.user(id); if (!u) return;
    if (u.id === N.me().id) return ui.toast('Kendini donduramazsın','warn');
    if (on) { var d = +$('#adFrzDays').value; u.status='frozen'; u.frozenUntil = Date.now()+d*86400000;
      N.log('hesabı dondurdu', u.id, d+' gün · @'+u.handle); ui.toast(d+' gün donduruldu','info'); }
    else { u.status='active'; u.frozenUntil=0; N.log('dondurmayı kaldırdı', u.id, '@'+u.handle); ui.toast('Dondurma kaldırıldı','ok'); }
    N.save(); N.app.render(); ui.beep(on ? 'del' : 'ok');
  };
  A.ban = function (id, on) {
    var u = N.user(id); if (!u) return;
    if (u.id === N.me().id) return ui.toast('Kendini engelleyemezsin','warn');
    if (on) {
      ui.confirm('Kalıcı engelle', '@' + u.handle + ' hesabı ve cihaz kimliği erişime kapatılacak. İstediğin zaman kaldırabilirsin.', 'Engelle', function () {
        u.banned = true; u.status = 'banned';
        N.log('kalıcı engelledi', u.id, '@'+u.handle+' · '+u.deviceId);
        N.save(); N.app.render(); ui.beep('del'); ui.haptic(20); ui.toast('Hesap engellendi','warn');
      }, true);
    } else {
      u.banned = false; u.status = 'active'; u.frozenUntil = 0;
      N.log('engeli kaldırdı', u.id, '@'+u.handle);
      N.save(); N.app.render(); ui.beep('ok'); ui.toast('Engel kaldırıldı','ok');
    }
  };
  A.delPosts = function (id) {
    var u = N.user(id), list = N.postsOf(id);
    if (!list.length) return;
    ui.confirm('Gönderileri sil', '@' + u.handle + ' hesabının ' + list.length + ' gönderisi silinecek.', 'Hepsini sil', function () {
      var backup = list.slice();
      N.DB.posts = N.DB.posts.filter(function(p){ return p.authorId !== id; });
      N.log('tüm gönderileri sildi', id, backup.length+' gönderi · @'+u.handle);
      N.save(); N.app.render(); ui.beep('del');
      ui.toast(backup.length + ' gönderi silindi','info',{ label:'Geri al', fn:function(){
        N.DB.posts = N.DB.posts.concat(backup); N.save(); N.app.render(); ui.toast('Geri alındı','ok'); } });
    }, true);
  };
  A.delUser = function (id) {
    var u = N.user(id); if (!u || u.id === N.me().id) return;
    ui.confirm('Hesabı sil', '@' + u.handle + ' ve tüm gönderileri kalıcı olarak silinecek. Bu işlem geri alınamaz.', 'Kalıcı olarak sil', function () {
      N.DB.users = N.DB.users.filter(function(x){ return x.id !== id; });
      N.DB.posts = N.DB.posts.filter(function(p){ return p.authorId !== id; });
      N.DB.notifs = N.DB.notifs.filter(function(n){ return n.userId !== id && n.fromId !== id; });
      N.DB.users.forEach(function(x){ x.following = x.following.filter(function(f){ return f !== id; }); });
      N.log('hesabı sildi', id, '@'+u.handle);
      N.save(); ui.beep('del'); ui.haptic(20);
      N.app.nav('#/admin'); ui.toast('Hesap silindi','info');
    }, true);
  };
  A.bind = function () {
    var s = $('#admSearch');
    if (s) s.addEventListener('input', function () {
      var pos = s.selectionStart; N.DB.ui.aq = s.value; N.app.render();
      var n = $('#admSearch'); if (n) { n.focus(); try { n.setSelectionRange(pos,pos); } catch(e){} }
    });
  };
})(window.NX);

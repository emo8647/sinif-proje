/* Nexus · profil, düzenleme, takip listeleri */
(function (N) {
  var P = N.profile = {}, ui = N.ui, $ = N.$, $$ = N.$$;

  P.target = function () {
    var a = N.app.route.arg;
    if (!a || a === 'me') return N.me();
    return N.byHandle(a) || N.user(a) || N.me();
  };

  P.view = function () {
    var u = P.target(), me = N.me();
    if (!u) return ui.empty('user','Hesap bulunamadı','Bu kullanıcı adına sahip bir hesap yok.');
    var mine = u.id === me.id, fol = me.following.indexOf(u.id) >= 0;
    var posts = N.postsOf(u.id), tab = N.DB.ui.ptab || 'posts';
    var likes = posts.reduce(function(a,p){ return a + p.likes.length; }, 0);
    var set = posts;
    if (tab === 'reels') set = posts.filter(function(p){ return p.reel; });
    if (tab === 'tagged') set = N.DB.posts.filter(function(p){ return p.text.indexOf('@'+u.handle) >= 0; });
    if (tab === 'saved') set = mine ? N.DB.posts.filter(function(p){ return p.saves.indexOf(me.id)>=0; }) : [];

    var tabs = [['posts','Gönderiler','grid'],['reels','Reels','reels'],['tagged','Etiketli','tag']];
    if (mine) tabs.push(['saved','Kaydedilen','bookmark']);

    var grid = set.length ? '<div class="pgrid">' + set.map(function (p) {
      var inner = p.media.length ? N.imgTag(p.media[0].src, p.media[0].seed, '', p.text.slice(0,40))
        : (p.reel ? '<div class="tx" style="background:linear-gradient(150deg,#515BD4,#8134AF,#DD2A7B);color:#fff">' + N.esc(p.text.slice(0,90)) + '</div>'
                  : '<div class="tx">' + N.esc(p.text.slice(0,130)) + '</div>');
      return '<div class="gtile' + (tab==='reels'?' reel-t':'') + '" data-act="detail" data-p="' + p.id + '">' + inner +
        '<span class="kd">' + N.ico(p.reel?'reels':p.media.length>1?'stack':'image') + '</span>' +
        '<span class="ov"><span>' + N.ico('heartF') + N.nf(p.likes.length) + '</span><span>' + N.ico('comment') + p.comments.length + '</span></span></div>';
    }).join('') + '</div>'
      : ui.empty(tab==='reels'?'reels':tab==='tagged'?'tag':tab==='saved'?'bookmark':'camera',
          tab==='saved' ? 'Kaydedilen yok' : tab==='tagged' ? 'Etiketli gönderi yok' : tab==='reels' ? 'Reels yok' : 'Henüz gönderi yok',
          mine ? 'İlk gönderini paylaş, profilin dolmaya başlasın.' : 'Bu hesapta burada gösterilecek içerik yok.',
          mine && tab==='posts' ? '<button class="btn pri" data-act="compose">' + N.ico('feather') + 'Gönderi yaz</button>' : '');

    var followers = N.DB.users.filter(function(x){ return x.following.indexOf(u.id) >= 0; }).length;

    return '<div class="prof"><div class="prof-top">' +
      '<div class="prof-avwrap' + (mine?' edit':'') + '"' + (mine?' data-act="pickAvatar"':'') + '>' +
        '<span class="ring' + (posts.some(function(p){return p.media.length;})?'':' off') + '"><img class="av a150" src="' + N.avatarOf(u) + '" alt="' + N.esc(u.name) + '"></span>' +
        (mine ? '<span class="cam">' + N.ico('camera') + '</span>' : '') + '</div>' +
      '<div class="prof-info">' +
        '<div class="prof-r1"><h2>' + N.esc(u.handle) + ui.vf(u) + '</h2>' +
          '<div class="prof-btns">' +
            (mine ? '<button class="btn" data-act="editProfile">' + N.ico('edit') + 'Profili düzenle</button>' +
                    '<button class="btn" data-act="compose">' + N.ico('feather') + 'Oluştur</button>'
                  : '<button class="btn' + (fol?'':' pri') + '" data-act="follow" data-u="' + u.id + '">' + (fol?N.ico('check')+'Takiptesin':N.ico('plus')+'Takip et') + '</button>' +
                    '<button class="btn" data-act="msg" data-u="' + u.id + '">Mesaj</button>') +
            (me.role === 'admin' && !mine ? '<button class="btn" data-act="go" data-to="#/admin/' + u.id + '">' + N.ico('shield') + 'Yönet</button>' : '') +
            '<button class="btn" data-act="shareProfile" data-u="' + u.id + '" aria-label="Paylaş">' + N.ico('send') + '</button>' +
          '</div></div>' +
        '<div class="prof-stats">' +
          '<div><b>' + posts.length + '</b> <span>gönderi</span></div>' +
          '<div class="clk" data-act="followList" data-kind="followers" data-u="' + u.id + '"><b>' + N.nf(followers) + '</b> <span>takipçi</span></div>' +
          '<div class="clk" data-act="followList" data-kind="following" data-u="' + u.id + '"><b>' + N.nf(u.following.length) + '</b> <span>takip</span></div>' +
          '<div><b>' + N.nf(likes) + '</b> <span>beğeni</span></div>' +
        '</div>' +
        '<div class="prof-name">' + N.esc(u.name) +
          (u.role==='admin' ? '<span class="badge admin">YÖNETİCİ</span>' : '') +
          (u.premium && u.premium.active ? '<span class="badge prem">' + N.ico('crown',11) + 'PREMIUM</span>' : '') + '</div>' +
        (u.bio ? '<div class="prof-bio">' + ui.rich(u.bio) + '</div>' : '') +
        (u.link ? '<a class="prof-link" href="' + (/^https?:/.test(u.link)?N.esc(u.link):'https://'+N.esc(u.link)) + '" target="_blank" rel="noopener">' + N.ico('link') + N.esc(u.link) + '</a>' : '') +
        '<div class="prof-meta">' +
          (u.loc ? '<span>' + N.ico('pin') + N.esc(u.loc) + '</span>' : '') +
          '<span>' + N.ico('clock') + new Date(u.createdAt).toLocaleDateString('tr-TR',{month:'long',year:'numeric'}) + ' tarihinde katıldı</span>' +
        '</div>' +
      '</div></div>' +
      (mine ? P.highlights() : '') +
      '<div class="ptabs">' + tabs.map(function(t){
        return '<button class="ptab' + (tab===t[0]?' on':'') + '" data-act="ptab" data-t="' + t[0] + '">' + N.ico(t[2]) + t[1] + '</button>'; }).join('') + '</div>' +
      grid + '</div>';
  };

  P.highlights = function () {
    var me = N.me();
    var media = N.DB.posts.filter(function(p){ return p.authorId===me.id && p.media.length; }).slice(0,6);
    if (!media.length) return '';
    return '<div class="hl-row">' + media.map(function (p, i) {
      return '<button class="hl" data-act="detail" data-p="' + p.id + '"><span class="cir">' +
        N.imgTag(p.media[0].src, p.media[0].seed, '', '', 200, 200) + '</span><span>' + (i===0?'Yeni':'An '+(i+1)) + '</span></button>';
    }).join('') + '<button class="hl" data-act="pickImg"><span class="cir">' + N.ico('plus') + '</span><span>Ekle</span></button></div>';
  };

  P.edit = function () {
    var u = N.me();
    ui.sheet('Profili düzenle',
      '<div style="display:flex;gap:14px;align-items:center;margin-bottom:18px"><img class="av a80" src="' + N.avatarOf(u) + '" alt="">' +
      '<button class="btn" data-act="pickAvatar">' + N.ico('camera') + 'Fotoğrafı değiştir</button></div>' +
      '<label class="lbl">Ad soyad</label><input class="inp" id="epName" maxlength="30" value="' + N.esc(u.name) + '" style="margin-bottom:12px">' +
      '<label class="lbl">Kullanıcı adı</label><input class="inp" id="epHandle" maxlength="20" value="' + N.esc(u.handle) + '" style="margin-bottom:12px">' +
      '<label class="lbl">Biyografi</label><textarea class="inp" id="epBio" maxlength="160" style="margin-bottom:12px">' + N.esc(u.bio) + '</textarea>' +
      '<label class="lbl">Bağlantı</label><input class="inp" id="epLink" maxlength="80" value="' + N.esc(u.link||'') + '" style="margin-bottom:12px">' +
      '<label class="lbl">Konum</label><input class="inp" id="epLoc" maxlength="40" value="' + N.esc(u.loc||'') + '" style="margin-bottom:18px">' +
      '<button class="btn pri blk" data-act="epSave">' + N.ico('check') + 'Kaydet</button>');
  };
  P.saveEdit = function () {
    var u = N.me();
    var name = $('#epName').value.trim(), h = $('#epHandle').value.trim().toLowerCase().replace(/[^a-z0-9_.]/g,'');
    if (name.length < 2) return ui.toast('Ad en az 2 karakter olmalı', 'warn');
    if (!/^[a-z0-9_.]{3,20}$/.test(h)) return ui.toast('Kullanıcı adı 3-20 karakter olmalı', 'warn');
    var other = N.byHandle(h);
    if (other && other.id !== u.id) return ui.toast('Bu kullanıcı adı alınmış', 'err');
    u.name = name; u.handle = h; u.bio = $('#epBio').value; u.link = $('#epLink').value.trim(); u.loc = $('#epLoc').value.trim();
    if (!u.avatar) u.avatar = N.avatar(name, 120);
    N.save(); ui.closeAll(); N.app.nav('#/profile/me'); N.app.render();
    ui.beep('ok'); ui.toast('Profil güncellendi', 'ok');
  };
  P.setAvatar = function (file) {
    ui.readImage(file, 320, function (src) {
      var u = N.me(); u.avatar = src; N.save(); ui.closeAll(); N.app.render();
      ui.beep('ok'); ui.toast('Profil fotoğrafı güncellendi', 'ok');
    });
  };
  P.follow = function (uid) {
    var me = N.me(), u = N.user(uid); if (!u || u.id === me.id) return;
    var i = me.following.indexOf(uid);
    if (i >= 0) { me.following.splice(i,1); ui.toast(u.handle + ' takipten çıkarıldı', 'info'); }
    else { me.following.push(uid); N.notify(uid, 'follow', me.id, null); ui.toast(u.handle + ' takip ediliyor', 'ok'); ui.beep('ok'); ui.haptic(10); }
    N.save(); N.app.render();
    if ($('#sheet').classList.contains('on')) ui.closeAll();
  };
  P.followList = function (uid, kind) {
    var u = N.user(uid); if (!u) return;
    var list = kind === 'following'
      ? u.following.map(function(id){ return N.user(id); }).filter(Boolean)
      : N.DB.users.filter(function(x){ return x.following.indexOf(uid) >= 0; });
    var me = N.me();
    ui.sheet(kind === 'following' ? 'Takip edilenler' : 'Takipçiler',
      list.length ? list.map(function (x) {
        var on = me.following.indexOf(x.id) >= 0;
        return '<div class="res-row"><img class="av a44" src="' + N.avatarOf(x) + '" alt="" data-act="go" data-to="#/profile/' + x.handle + '">' +
          '<div style="flex:1;min-width:0" data-act="go" data-to="#/profile/' + x.handle + '"><div style="font-weight:700;display:flex;align-items:center;gap:5px">' + N.esc(x.handle) + ui.vf(x) + '</div>' +
          '<div style="font-size:12.5px;color:var(--text3)">' + N.esc(x.name) + '</div></div>' +
          (x.id !== me.id ? '<button class="btn sm' + (on?'':' pri') + '" data-act="follow" data-u="' + x.id + '">' + (on?'Takiptesin':'Takip et') + '</button>' : '') + '</div>';
      }).join('') : ui.empty('users', kind==='following'?'Kimse takip edilmiyor':'Henüz takipçi yok', 'Takip ettikçe bu liste dolar.'));
  };
  P.msg = function (uid) {
    var u = N.user(uid);
    ui.sheet(u.handle + ' ile mesaj',
      '<p style="font-size:13px;color:var(--text3);line-height:1.6;margin:0 0 14px">Mesajlaşma bu prototipte yerel olarak çalışır; karşı tarafa iletilmez.</p>' +
      '<div id="msgLog" style="min-height:120px;max-height:240px;overflow-y:auto;margin-bottom:14px"></div>' +
      '<div style="display:flex;gap:9px"><input class="inp" id="msgIn" placeholder="Mesaj yaz…" style="border-radius:99px"><button class="btn pri" data-act="msgSend" data-u="' + uid + '">' + N.ico('send') + '</button></div>');
    P._msgTo = uid; P.paintMsg();
  };
  P.paintMsg = function () {
    var me = N.me(), box = $('#msgLog'); if (!box) return;
    var key = 'nexus.msg.' + me.id + '.' + P._msgTo;
    var arr = []; try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
    box.innerHTML = arr.length ? arr.map(function (m) {
      return '<div style="display:flex;justify-content:flex-end;margin-bottom:7px"><div style="max-width:78%;padding:9px 13px;border-radius:16px 16px 4px 16px;background:var(--tw);color:#fff;font-size:13.5px">' + N.esc(m.t) + '</div></div>';
    }).join('') : '<p style="font-size:13px;color:var(--text3);text-align:center;padding:30px 0">Henüz mesaj yok.</p>';
    box.scrollTop = box.scrollHeight;
  };
  P.sendMsg = function (uid) {
    var i = $('#msgIn'), v = i.value.trim(); if (!v) return;
    var me = N.me(), key = 'nexus.msg.' + me.id + '.' + uid, arr = [];
    try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
    arr.push({ t:v, at:Date.now() }); if (arr.length > 60) arr.shift();
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e){}
    i.value = ''; P.paintMsg(); ui.beep('post');
  };
})(window.NX);

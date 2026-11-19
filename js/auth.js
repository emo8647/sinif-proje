/* Nexus · kayıt, giriş, oturum, hesap durumu */
(function (N) {
  var A = N.auth = {}, ui = N.ui, $ = N.$, $$ = N.$$;
  var mode = 'login', busy = false, artTimer = null, artIdx = 0;

  function sha(str) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest && window.isSecureContext) {
      var buf = new TextEncoder().encode('nexus::' + str);
      return crypto.subtle.digest('SHA-256', buf).then(function (h) {
        return Array.prototype.map.call(new Uint8Array(h), function(b){ return ('0'+b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve('fb' + N.hash('nexus::' + str).toString(16) + N.hash(str + '::salt').toString(16));
  }
  function checkPass(u, plain) {
    if (u.passPlain != null) {
      if (u.passPlain !== plain) return Promise.resolve(false);
      return sha(plain).then(function (h) { u.passHash = h; delete u.passPlain; N.save(); return true; });
    }
    return sha(plain).then(function (h) { return h === u.passHash; });
  }
  A.setPass = function (u, plain) { return sha(plain).then(function (h) { u.passHash = h; delete u.passPlain; N.save(); }); };

  function err(m) { $('#authErr').textContent = m || ''; if (m) ui.beep('err'); }

  function paintMode() {
    var su = mode === 'signup';
    $('#fName').hidden = !su; $('#fPass2').hidden = !su; $('#pwMeter').hidden = !su;
    $('#segInd').classList.toggle('right', su);
    $$('.seg-b').forEach(function (b) { b.classList.toggle('on', b.dataset.auth === mode); });
    $('#authGo').querySelector('span').textContent = su ? 'Hesap oluştur' : 'Giriş yap';
    $('#authTag').textContent = su ? 'Birkaç saniye sürer, sonrası senin.' : 'Arkadaşlarınla aynı akışta buluş.';
    $('#switchText').textContent = su ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?';
    $('#switchBtn').textContent = su ? 'Giriş yap' : 'Kayıt ol';
    $('#authAlt').textContent = su ? 'Kullanım koşullarını gör' : 'Şifreni mi unuttun?';
    $('#handleOk').innerHTML = ''; $('#handleOk').className = 'field-ok';
    err('');
  }
  function setMode(m) { mode = m; paintMode(); ui.beep('tick'); }

  function pwScore(v) {
    var s = 0;
    if (v.length >= 6) s++; if (v.length >= 10) s++;
    if (/[A-ZĞÜŞİÖÇ]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(s, 4);
  }
  function paintMeter() {
    var v = $('#aPass').value, s = pwScore(v), m = $('#pwMeter');
    var C = ['var(--danger)','var(--danger)','var(--warning)','var(--info)','var(--success)'];
    var T = ['çok zayıf','zayıf','orta','iyi','güçlü'];
    m.querySelector('i').style.setProperty('--w', (v ? (s+1)*20 : 0) + '%');
    m.querySelector('i').style.setProperty('--c', C[s]);
    m.querySelector('span').textContent = v ? T[s] : '';
  }
  function validHandle(h) { return /^[a-z0-9_.]{3,20}$/.test(h); }
  function paintHandleOk() {
    var el = $('#handleOk'), h = $('#aHandle').value.trim().toLowerCase().replace(/^@/,'');
    if (!h) { el.innerHTML=''; el.className='field-ok'; return; }
    var taken = !!N.byHandle(h);
    if (mode === 'signup') {
      var ok = validHandle(h) && !taken;
      el.className = 'field-ok ' + (ok ? 'yes' : 'no');
      el.innerHTML = N.ico(ok ? 'check' : 'x');
    } else { el.innerHTML=''; el.className='field-ok'; }
  }

  A.login = function (handle, plain) {
    var u = N.byHandle(handle);
    if (!u) return Promise.reject('Böyle bir hesap yok.');
    return checkPass(u, plain).then(function (ok) {
      if (!ok) throw 'Şifre yanlış.';
      if (u.banned) throw 'Bu hesap kalıcı olarak engellendi.';
      N.DB.session = u.id; u.lastLogin = Date.now(); N.save();
      N.log('giriş', u.id, u.handle);
      return u;
    });
  };
  A.signup = function (name, handle, plain) {
    if (N.byHandle(handle)) return Promise.reject('Bu kullanıcı adı alınmış.');
    return sha(plain).then(function (h) {
      var u = {
        id:'u_'+N.uid(), handle:handle, name:name, role:'user', verified:false,
        passHash:h, avatar:null, bio:'', link:'', loc:'',
        status:'active', frozenUntil:0, banned:false, deviceId:N.deviceId(),
        premium:{active:false,until:0}, warnings:[], followers:[], following:[],
        createdAt:Date.now(), lastLogin:Date.now()
      };
      N.DB.users.push(u); N.DB.session = u.id; N.save();
      N.log('kayıt', u.id, handle);
      return u;
    });
  };
  A.logout = function () {
    var m = N.me(); if (m) N.log('çıkış', m.id, m.handle);
    N.DB.session = null; N.save();
    ui.closeAll(); N.app.showAuth();
  };

  /* ── hesap durum kapıları ── */
  A.gate = function () {
    var u = N.me(), g = $('#gate');
    if (!u) { g.classList.remove('on'); return true; }
    if (u.banned) {
      g.innerHTML = '<div class="gate-card"><div class="gate-ic" style="background:linear-gradient(135deg,#FF3B30,#DD2A7B)">' + N.ico('ban') + '</div>' +
        '<h2>Hesabın engellendi</h2><p>Bu hesap ve cihaz kimliği kalıcı olarak erişime kapatıldı.</p>' +
        '<div class="gate-meta">Cihaz: <code>' + N.esc(u.deviceId) + '</code></div>' +
        '<div class="gate-btns"><button class="btn" data-act="logout">Çıkış yap</button></div></div>';
      g.classList.add('on'); return false;
    }
    if (u.status === 'frozen' && u.frozenUntil > Date.now()) {
      var left = u.frozenUntil - Date.now(), d = Math.floor(left/86400000), h = Math.floor(left%86400000/3600000), m = Math.floor(left%3600000/60000);
      g.innerHTML = '<div class="gate-card"><div class="gate-ic" style="background:linear-gradient(135deg,#0A84FF,#22D3EE)">' + N.ico('snow') + '</div>' +
        '<h2>Hesabın donduruldu</h2><p>Erişimin geçici olarak durduruldu. Süre dolduğunda otomatik açılır.</p>' +
        '<div class="gate-msg"><b>Kalan süre:</b> ' + d + ' gün ' + h + ' saat ' + m + ' dakika<br><b>Açılış:</b> ' + N.fullDate(u.frozenUntil) + '</div>' +
        '<div class="gate-btns"><button class="btn" data-act="logout">Çıkış yap</button></div></div>';
      g.classList.add('on'); return false;
    }
    if (u.status === 'frozen' && u.frozenUntil <= Date.now()) { u.status='active'; u.frozenUntil=0; N.save(); }
    var unseen = u.warnings.filter(function(w){ return !w.seen; });
    if (unseen.length) {
      var w = unseen[unseen.length-1];
      g.innerHTML = '<div class="gate-card"><div class="gate-ic" style="background:linear-gradient(135deg,#FFB300,#F58529)">' + N.ico('warn') + '</div>' +
        '<h2>Uyarı ' + w.level + '/3</h2><p>Yönetici hesabına bir uyarı gönderdi. Devam etmeden önce oku.</p>' +
        '<div class="gate-msg">' + N.esc(w.message) + '</div>' +
        '<div class="gate-meta">' + N.fullDate(w.at) + ' · ' + N.esc(w.by) + '</div>' +
        '<div class="gate-btns"><button class="btn ig" data-act="ackWarn" data-w="' + w.id + '">' + N.ico('check') + 'Okudum, anladım</button></div></div>';
      g.classList.add('on'); return false;
    }
    g.classList.remove('on'); return true;
  };
  A.ack = function (wid) {
    var u = N.me(); if (!u) return;
    u.warnings.forEach(function(w){ if (w.id === wid) w.seen = true; });
    N.save(); ui.beep('ok'); A.gate(); N.app.render();
  };

  /* ── auth ekranı sanatı ── */
  function buildArt() {
    var slides = [
      '<div class="ps-slide"><div class="ps-top"><span class="ps-logo">Nexus</span></div><div class="ps-body">' +
        '<div class="ps-row"><span class="ps-dot"><i></i></span><span class="ps-dot"><i></i></span><span class="ps-dot"><i></i></span><span class="ps-dot"><i></i></span></div>' +
        '<div class="ps-row"><span class="ps-dot"><i></i></span><div style="flex:1"><div class="ps-l" style="width:56%"></div><div class="ps-l" style="width:34%;margin-top:5px;height:5px"></div></div></div>' +
        '<div class="ps-img"></div><div class="ps-acts"><i></i><i></i><i></i><i style="margin-left:auto"></i></div>' +
        '<div style="padding:0 12px"><div class="ps-l" style="width:38%"></div><div class="ps-l" style="width:76%;margin-top:6px;height:5px"></div><div class="ps-l" style="width:60%;margin-top:5px;height:5px"></div></div>' +
      '</div></div>',
      '<div class="ps-slide"><div class="ps-reel"></div><div class="ps-reel-ov"></div>' +
        '<div class="ps-reel-txt"><div class="ps-l" style="width:44%"></div><div class="ps-l" style="width:82%"></div><div class="ps-l" style="width:64%"></div></div>' +
        '<div class="ps-reel-side"><i></i><i></i><i></i><i></i></div></div>',
      '<div class="ps-slide"><div class="ps-top"><span class="ps-logo">Nexus</span></div><div class="ps-admin">' +
        '<div class="ps-stat"><div><b>24</b><span>HESAP</span></div><div><b>132</b><span>GÖNDERİ</span></div><div><b>3</b><span>UYARI</span></div></div>' +
        '<div class="ps-user"><span class="ps-dot"><i></i></span><div style="flex:1"><div class="ps-l" style="width:52%"></div></div></div>' +
        '<div class="ps-user"><span class="ps-dot"><i></i></span><div style="flex:1"><div class="ps-l" style="width:66%"></div></div></div>' +
        '<div class="ps-user"><span class="ps-dot"><i></i></span><div style="flex:1"><div class="ps-l" style="width:40%"></div></div></div>' +
        '<div class="ps-user"><span class="ps-dot"><i></i></span><div style="flex:1"><div class="ps-l" style="width:58%"></div></div></div>' +
      '</div></div>'
    ];
    $('#phoneScreen').innerHTML = slides.join('');
    var items = [
      ['feather','linear-gradient(135deg,#1D9BF0,#515BD4)','Tweet at, fotoğraf kaydır'],
      ['reels','linear-gradient(135deg,#DD2A7B,#8134AF)','Reels çek ya da Instagram’dan ekle'],
      ['shield','linear-gradient(135deg,#F58529,#FFB300)','Kendi topluluğunu yönet'],
      ['moon','linear-gradient(135deg,#8134AF,#22D3EE)','Karanlık ve aydınlık mod']
    ];
    $('#pitchList').innerHTML = items.map(function (it, i) {
      return '<li style="animation-delay:' + (0.3 + i*0.09) + 's"><span class="pi" style="background:' + it[1] + '">' + N.ico(it[0]) + '</span>' + N.esc(it[2]) + '</li>';
    }).join('');
    artIdx = 0; paintArt();
    clearInterval(artTimer);
    artTimer = setInterval(function () { artIdx = (artIdx+1)%3; paintArt(); }, 3800);
  }
  function paintArt(){ $$('.ps-slide').forEach(function(s,i){ s.classList.toggle('on', i===artIdx); }); }
  A.stopArt = function(){ clearInterval(artTimer); artTimer = null; };

  /* ── bağlama ── */
  A.init = function () {
    buildArt(); paintMode();
    $('#aHandle').parentElement.classList.add('has-pre');
    $$('.seg-b').forEach(function (b) { b.onclick = function(){ setMode(b.dataset.auth); }; });
    $('#switchBtn').onclick = function(){ setMode(mode === 'login' ? 'signup' : 'login'); };
    $('#aHandle').addEventListener('input', function(e){
      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g,'');
      paintHandleOk(); err('');
    });
    $('#aPass').addEventListener('input', function(){ paintMeter(); err(''); });
    $('#passEye').innerHTML = N.ico('eye');
    $('#passEye').onclick = function () {
      var i = $('#aPass'), on = i.type === 'password';
      i.type = on ? 'text' : 'password';
      this.innerHTML = N.ico(on ? 'eyeOff' : 'eye');
    };
    $('#authAlt').onclick = function () {
      if (mode === 'signup') {
        ui.sheet('Kullanım koşulları',
          '<div style="font-size:13.5px;line-height:1.75;color:var(--text2)">' +
          '<p style="margin:0 0 12px"><b style="color:var(--text)">Bu bir prototiptir.</b> Nexus şu an tamamen tarayıcıda çalışır. Hesaplar, gönderiler ve görseller yalnızca bu cihazın yerel deposunda tutulur; hiçbir sunucuya gönderilmez.</p>' +
          '<p style="margin:0 0 12px">Gerçek bir şifre kullanma. Buraya yazdığın şifre bu cihazda saklanır ve aynı tarayıcıyı kullanan herkes erişebilir.</p>' +
          '<p style="margin:0 0 12px">Yönetici hesabı diğer hesapları düzenleyebilir, uyarabilir ve engelleyebilir. Engelleme bu prototipte cihaz kimliği üzerinden çalışır; gerçek IP engellemesi için sunucu gerekir.</p>' +
          '<p style="margin:0">Başkalarına ait içerik paylaşma, kimseyi hedef gösterme.</p></div>');
      } else {
        ui.sheet('Şifreni mi unuttun?',
          '<div style="font-size:13.5px;line-height:1.75;color:var(--text2)">' +
          '<p style="margin:0 0 12px">Bu prototipte e-posta veya SMS doğrulaması yok, dolayısıyla uzaktan sıfırlama da yok.</p>' +
          '<p style="margin:0 0 12px">Yönetici hesabına giriş yapabiliyorsan <b style="color:var(--text)">Admin Panel → hesap → Şifre sıfırla</b> adımından yeni şifre belirleyebilirsin.</p>' +
          '<p style="margin:0">Hiçbir hesaba giremiyorsan tarayıcı verisini sıfırlaman gerekir; bu durumda tüm gönderiler de silinir.</p></div>');
      }
    };
    $('#authForm').addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      var handle = $('#aHandle').value.trim().toLowerCase().replace(/^@/,'');
      var pass = $('#aPass').value;
      if (!handle) return err('Kullanıcı adı gerekli.');
      if (!pass) return err('Şifre gerekli.');
      busy = true; $('#authGo').classList.add('load'); $('#authGo').disabled = true;
      var done = function(){ busy=false; $('#authGo').classList.remove('load'); $('#authGo').disabled=false; };

      if (mode === 'login') {
        A.login(handle, pass).then(function (u) {
          done(); err(''); ui.beep('ok'); ui.haptic(14);
          $('#aPass').value = '';
          N.app.enter();
          ui.toast('Hoş geldin, ' + u.name.split(' ')[0] + (u.role==='admin'?' · yönetici':''), 'ok');
        }).catch(function (m) { done(); err(typeof m === 'string' ? m : 'Giriş yapılamadı.'); });
      } else {
        var name = $('#aName').value.trim(), p2 = $('#aPass2').value;
        if (name.length < 2) { done(); return err('Ad soyad en az 2 karakter olmalı.'); }
        if (!validHandle(handle)) { done(); return err('Kullanıcı adı 3-20 karakter; harf, rakam, nokta ve alt çizgi.'); }
        if (pass.length < 6) { done(); return err('Şifre en az 6 karakter olmalı.'); }
        if (pass !== p2) { done(); return err('Şifreler eşleşmiyor.'); }
        A.signup(name, handle, pass).then(function (u) {
          done(); err(''); ui.beep('post'); ui.haptic(14);
          $('#aPass').value=''; $('#aPass2').value='';
          N.app.enter();
          ui.toast('Hesabın hazır, ' + u.name.split(' ')[0] + ' 🎉', 'ok');
        }).catch(function (m) { done(); err(typeof m === 'string' ? m : 'Hesap oluşturulamadı.'); });
      }
    });
  };
})(window.NX);

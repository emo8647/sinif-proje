/* Nexus · yerel veri katmanı */
(function (N) {
  var KEY = 'nexus.v1';
  var HUES = ['#F58529','#DD2A7B','#8134AF','#515BD4','#1D9BF0','#00E676','#22D3EE'];

  N.uid = function(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); };
  N.hash = function(s){ var h=2166136261; for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return Math.abs(h); };
  N.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  N.nf = function(n){ n=Number(n)||0; return n>=1e6?(n/1e6).toFixed(1).replace('.0','')+'M':n>=1e3?(n/1e3).toFixed(1).replace('.0','')+'B':String(n); };
  N.clamp = function(v,a,b){ return Math.max(a,Math.min(b,v)); };
  N.ago = function(t){
    var d=(Date.now()-t)/1000;
    if(d<45) return 'şimdi';
    if(d<3600) return Math.floor(d/60)+' dk';
    if(d<86400) return Math.floor(d/3600)+' sa';
    if(d<604800) return Math.floor(d/86400)+' g';
    return new Date(t).toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
  };
  N.fullDate = function(t){ return new Date(t).toLocaleString('tr-TR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}); };
  N.isMobile = function(){ return window.matchMedia('(max-width:767px)').matches; };

  N.avatar = function (seed, size) {
    var h=N.hash(seed||'nx'), a=HUES[h%7], b=HUES[(h>>3)%7], rot=h%360, s=size||120;
    var init=(seed||'N').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ ]/g,'').trim().split(/\s+/)
      .map(function(w){return w[0];}).join('').slice(0,2).toUpperCase()||'NX';
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 120 120">'+
      '<defs><linearGradient id="g" gradientTransform="rotate('+rot+' .5 .5)"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient>'+
      '<radialGradient id="r"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'+
      '<rect width="120" height="120" fill="url(#g)"/>'+
      '<circle cx="'+(24+h%70)+'" cy="'+(22+(h>>4)%70)+'" r="54" fill="url(#r)"/>'+
      '<circle cx="'+(88-h%50)+'" cy="'+(92-(h>>2)%44)+'" r="'+(16+h%20)+'" fill="#000" opacity=".12"/>'+
      '<text x="60" y="62" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="44" font-weight="800" fill="#fff" fill-opacity=".96" text-anchor="middle" dominant-baseline="central" letter-spacing="-1.5">'+init+'</text></svg>';
    return 'data:image/svg+xml,'+encodeURIComponent(svg);
  };

  var fbc = {};
  N.fallback = function (seed, w, h) {
    var k = seed+'|'+w+'|'+h; if (fbc[k]) return fbc[k];
    var c=document.createElement('canvas'); c.width=w; c.height=h;
    var x=c.getContext('2d'), H=N.hash(seed);
    var g=x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,HUES[H%7]); g.addColorStop(.5,HUES[(H>>3)%7]); g.addColorStop(1,HUES[(H>>6)%7]);
    x.fillStyle=g; x.fillRect(0,0,w,h);
    for(var i=0;i<5;i++){
      var rx=w*((H>>(i*2))%100/100), ry=h*((H>>(i*3))%100/100);
      var rg=x.createRadialGradient(rx,ry,0,rx,ry,w*.55);
      rg.addColorStop(0,'rgba(255,255,255,'+(.08+(i%4)*.07)+')'); rg.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=rg; x.fillRect(0,0,w,h);
    }
    x.globalAlpha=.13; x.strokeStyle='#fff'; x.lineWidth=2;
    for(var j=0;j<6;j++){ x.beginPath(); x.arc(w*((H>>j)%100/100),h*((H>>(j+2))%100/100),26+j*24,0,Math.PI*2); x.stroke(); }
    x.globalAlpha=1;
    var out=c.toDataURL('image/jpeg',.8); fbc[k]=out; return out;
  };
  N.photo = function(seed,i){ return 'https://picsum.photos/seed/'+encodeURIComponent(seed+'-'+i)+'/900/1125'; };
  N.imgTag = function(src,seed,cls,alt,w,h){
    w=w||900; h=h||1125;
    return '<img class="'+(cls||'')+'" src="'+src+'" alt="'+N.esc(alt||'Görsel')+'" loading="lazy" decoding="async" '+
      'onerror="this.onerror=null;this.src=NX.fallback(\''+String(seed).replace(/'/g,'')+'\','+w+','+h+')">';
  };

  N.deviceId = function () {
    var d = localStorage.getItem('nexus.device');
    if (!d) { d = 'nx-' + N.uid(); localStorage.setItem('nexus.device', d); }
    return d;
  };

  function seed() {
    var now = Date.now();
    var admin = {
      id:'u_admin', handle:'heisenberg', name:'Emirhan', role:'admin', verified:true,
      passHash:null, passPlain:'Emirhan2012',
      avatar:null, bio:'', link:'', loc:'',
      status:'active', frozenUntil:0, banned:false, deviceId:N.deviceId(),
      premium:{active:false, until:0},
      warnings:[], followers:[], following:[],
      createdAt:now, lastLogin:0
    };
    var posts = [
      { id:N.uid(), authorId:'u_admin', text:'Nexus ayakta. Kendi akışım, kendi kurallarım. 🧪',
        media:[], reel:null, createdAt:now-1000*60*42 },
      { id:N.uid(), authorId:'u_admin', text:'Bugün ilk deploy tamamlandı. Windows 8.1 canavarı pes etmedi. #nexus',
        media:[{src:N.photo('nexus-launch',0),seed:'nexus-launch-0'},{src:N.photo('nexus-launch',1),seed:'nexus-launch-1'},{src:N.photo('nexus-launch',2),seed:'nexus-launch-2'}],
        reel:null, createdAt:now-1000*60*60*5 },
      { id:N.uid(), authorId:'u_admin', text:'Sıradaki adım: admin panelden hesapları yönetmek. Uyarı, dondurma, premium — hepsi tek ekranda.',
        media:[], reel:null, createdAt:now-1000*60*60*22 }
    ];
    posts.forEach(function(p){ p.likes=[]; p.saves=[]; p.reposts=[]; p.comments=[]; });
    return {
      v:1, users:[admin], posts:posts, notifs:[], audit:[],
      session:null, settings:{ theme:null, sound:true },
      ui:{ filter:'all', sort:'recent', ptab:'posts', query:'' }
    };
  }

  N.DB = null;
  N.load = function () {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var p = JSON.parse(raw); if (p && p.users && p.posts) { N.DB = p; N.DB.ui = N.DB.ui || {filter:'all',sort:'recent',ptab:'posts',query:''}; return; } }
    } catch (e) {}
    N.DB = seed(); N.save();
  };
  var st = null;
  N.save = function () {
    clearTimeout(st);
    st = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(N.DB)); }
      catch (e) {
        var n = 0;
        N.DB.posts.forEach(function (p) { (p.media||[]).forEach(function (m) {
          if (m.src && m.src.indexOf('data:') === 0 && n < 10) { m.src = N.fallback(m.seed, 900, 1125); n++; } }); });
        try { localStorage.setItem(KEY, JSON.stringify(N.DB)); if(N.ui) N.ui.toast('Depolama doldu, eski görseller sadeleştirildi','warn'); }
        catch (e2) { if(N.ui) N.ui.toast('Tarayıcı deposu dolu — değişiklikler bu oturumda geçerli','warn'); }
      }
    }, 200);
  };
  N.reset = function () { localStorage.removeItem(KEY); N.DB = seed(); N.save(); };

  N.user = function (id) { return N.DB.users.filter(function(u){return u.id===id;})[0] || null; };
  N.byHandle = function (h) { h=String(h||'').toLowerCase().replace(/^@/,''); return N.DB.users.filter(function(u){return u.handle.toLowerCase()===h;})[0] || null; };
  N.post = function (id) { return N.DB.posts.filter(function(p){return p.id===id;})[0] || null; };
  N.me = function () { return N.DB.session ? N.user(N.DB.session) : null; };
  N.avatarOf = function (u) { return u && u.avatar ? u.avatar : N.avatar(u ? u.name : 'N', 120); };
  N.postsOf = function (uid) { return N.DB.posts.filter(function(p){return p.authorId===uid;}); };

  N.log = function (action, targetId, detail) {
    var actor = N.me();
    N.DB.audit.unshift({ id:N.uid(), at:Date.now(), actor: actor?actor.handle:'sistem', action:action, target:targetId||'', detail:detail||'' });
    if (N.DB.audit.length > 300) N.DB.audit.length = 300;
    N.save();
  };
  N.notify = function (userId, type, fromId, postId) {
    if (!userId || userId === fromId) return;
    N.DB.notifs.unshift({ id:N.uid(), userId:userId, type:type, fromId:fromId, postId:postId||null, at:Date.now(), read:false });
    if (N.DB.notifs.length > 120) N.DB.notifs.length = 120;
    N.save();
  };
  N.unread = function () { var m=N.me(); if(!m) return 0; return N.DB.notifs.filter(function(n){return n.userId===m.id && !n.read;}).length; };
})(window.NX);

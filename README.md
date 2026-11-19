# Nexus

Twitter × Instagram karışımı, tamamen tarayıcıda çalışan sosyal ağ prototipi.
Sunucu yok, kurulum yok, derleme adımı yok. `index.html` açılır ve çalışır.

## Varsayılan yönetici hesabı

| Alan | Değer |
|---|---|
| Kullanıcı adı | `heisenberg` |
| Şifre | `Emirhan2012` |

Bu hesapla giriş yapınca mavi tik ve sol menüde **Admin Panel** görünür.

## Klasör yapısı
nexus/
├── index.html
├── README.md
├── css/
│ ├── core.css renk sistemi, tipografi, scrollbar, ortak bileşenler
│ ├── auth.css giriş / kayıt ekranı
│ ├── app.css sidebar, tabbar, akış, gönderi paneli, carousel
│ ├── reels.css dikey reels oynatıcı ve kamera
│ ├── profile.css profil düzeni
│ └── admin.css yönetici paneli ve hesap detayı
└── js/
├── icons.js SVG ikon seti
├── store.js yerel veritabanı, şema, yardımcılar
├── auth.js kayıt, giriş, oturum, hesap durum kapıları
├── ui.js toast, sheet, panel, tema, ses
├── feed.js akış, gönderi kartları, carousel, yorum, keşfet
├── reels.js Instagram embed + kameradan reels
├── profile.js profil, düzenleme, takip listeleri
├── admin.js hesap CRUD, uyarı, dondurma, engel, premium
└── app.js yönlendirme, kabuk, olay delegasyonu, boot


Bir hata çıkarsa sadece ilgili dosyayı düzeltmek yeter. Script sırası `index.html`
içinde önemlidir: `icons → store → ui → auth → feed → reels → profile → admin → app`.

## Yayınlama (Vercel)

1. GitHub'da yeni repo aç.
2. **Add file → Upload files** ile bu klasörün içeriğini sürükle.
   Alt klasörler korunur; `css/` ve `js/` yapısı bozulmamalı.
3. **Commit changes**.
4. vercel.com → **Add New → Project** → repoyu seç → **Deploy**.
5. Framework sorarsa **Other**, Build Command ve Output Directory boş.

Node, npm veya Vercel CLI gerekmez.

## Özellikler

**Giriş / Kayıt** — telefon mockup'lısplit ekran, canlı kullanıcı adı kontrolü,
şifre gücü ölçeri, SHA-256 özetleme.

**Ana sayfa** — Twitter tarzı metin öncelikli akış, Instagram chrome'u.
Kanat simgesi (masaüstünde sağ alt FAB, mobilde üst bar) sağdan panel açar:
metin + 4'e kadar fotoğraf, sürükle-sırala, emoji, 280 karakter halkası.
Fotoğraflar Instagram gibi kaydırmalı carousel; çift dokunuşta beğeni patlaması.

**Reels** — dikey snap oynatıcı. Ortadaki **+** kamera izni ister, MediaRecorder ile
60 saniyeye kadar çeker, önizler ve paylaşır. Alternatif sekmeden Instagram reels
bağlantısı yapıştırılır → resmî `/reel/KOD/embed/` iframe'i.

**Profil** — Instagram düzeni: avatar, istatistikler, öne çıkanlar,
Gönderiler / Reels / Etiketli / Kaydedilen sekmeleri.

**Admin Panel** — hesap listesi, arama, istatistik kartları, haftalık grafik, işlem günlüğü.
Bir hesaba tıklayınca açılan sayfada: ad/kullanıcı adı/biyografi düzenleme, mavi tik,
şifre sıfırlama, premium ver/kes (1–365 gün), uyarı gönder (1 yazılı / 2 üç gün dondurma /
3 kalıcı engel), dondur/kaldır, engelle/kaldır, gönderileri sil, hesabı sil.

Uyarı alan kullanıcı bir sonraki girişte mesajı okumadan uygulamaya giremez.
Dondurulan hesap geri sayım ekranı görür. Engellenen hesap tamamen kapanır.

**Diğer** — karanlık/aydınlık mod, ses efektleri (tek düğmeyle susturulur),
kaydetme + toplu seçim + geri al, arama/filtre/sıralama, bildirimler,
yerel mesajlaşma, etkinlik özeti, klavye kısayolları (`n` yaz, `/` ara, `t` tema, `m` ses).

## Sınırlar — dürüst notlar

- **Sunucu yok.** Tüm veriler `localStorage`'da. Başka cihazdan kimse görmez.
- **Gerçek IP okunamaz.** Engelleme hesap + rastgele cihaz kimliği üzerinden çalışır.
  Gerçek IP engeli backend gerektirir.
- **Instagram kazınamaz.** Yalnızca resmî embed kullanılır. Gizli gönderiler açılmaz.
- **Yerel videolar kalıcı değil.** Kamera kaydı blob URL'dir; yenilemede kaybolur.
- **Güvenlik gerçek değil.** Aynı tarayıcıyı kullanan herkes veriye erişebilir.
  Gerçek şifreni kullanma.

Bunları aşmak için sonraki adım: bir backend (Supabase / Firebase) + gerçek
kimlik doğrulama + sunucu tarafı moderasyon.

# 🌱 Sanal Bahçe


Kendi sanal bahçeni oluştur, tohum ek, bitkilerini sula ve zamanla büyümelerini izle! Sürükle-bırak inşa, gece/gündüz döngüsü ve hava efektleriyle keyifli ve rahatlatıcı bir bitki büyütme simülasyonu.

🔗 **Resmi Site (İndir & Sürüm Bilgisi):** [Sanal Bahçe — İndir](https://batuhanklcky.github.io/sanalbahce/anasayfa.html)

📱 **Android:** Play Store / kapalı test için yerel paket (`android/dist/sanalbahce-2.1.0.aab`). Oyun dosyaları APK içinde; Chrome veya site adresi açılmaz.

---

## 🌐 Hangi versiyonu kullanmalıyım?

| | Web (GitHub Pages) | Android (Play / APK) |
|---|---|---|
| Kurulum gerekir mi? | Hayır, tarayıcıda açılır | Evet |
| Nasıl çalışır? | Site üzerinden | Oyun APK içine paketlenir (WebView) |
| Önerilen kullanım | Hızlı deneme | Telefonda kalıcı kullanım |

---

## ☁️ Rahat diorama (Cozyrama tarzı)

Sol menüdeki **☁️** ile aç/kapa (varsayılan: açık):
- Yüzen ada, yumuşak ışık, sabit sıcak gün ışığı
- Görev/XP baskısı gizlenir, zararlı böcek doğmaz, bitkiler kuramaz
- **✋ Düzenle**: objeye dokun → döndür / büyüt-küçült / taşı
- **📷 Foto**: arayüzü gizleyip sahneyi çek

Klasik bahçe moduna dönmek için ☁️’ye tekrar bas.

## 🎮 Özellikler

- 🔔 **Bildirimler** — Sulama zamanı, hasat hazır, zararlı böcek ve günlük görev hatırlatıcıları
- 📊 **İstatistikler** — Günlük streak, toplam sulama, hasat sayıları, oynama süresi ve coin takibi
- 🌙 **Gece/Gündüz Döngüsü** — Gerçek saatle senkronize gökyüzü; şafak, gündüz, akşam ve gece atmosferleri
- 🏡 **Sürükle-Bırak İnşa** — 20+ obje (ağaç, gölet, ev, çeşme, çardak, ağaç evi ve daha fazlası)
- 🌧️ **Hava Efektleri** — Gece yağmuru bitkileri sular, kar yağabilir, sonbahar yaprakları dökülür
- 📝 **Günlük Görevler** — Her gün yeni görevler, XP kazanma ve 10 seviyeye kadar ilerleme
- 💾 **Otomatik Kayıt** — Bahçen, dekorların ve hayvanların tarayıcında (local) güvenle kaydedilir, güncelleme sonrası kayıp yok. *(Not: kayıt cihaza/tarayıcıya bağlıdır — farklı bir cihaz veya tarayıcıda açtığında bahçen sıfırdan başlar.)*
- 🔗 **Paylaşım** — Bahçe durumunu arkadaşlarınla paylaş: seviye, coin ve streak bilgilerin
- 🏪 **Mağaza** — Coin biriktirip özel tohum, dekor ve nadir eşyalar satın al
- 🥕 **Hasat Sistemi** — Domates, çilek ve kabak ek, büyüt, hasat et ve coin kazan
- 🐾 **Evcil Hayvanlar** — Bahçende dolaşan sevimli kedi ve köpekler edin

## 🚀 Nasıl Çalıştırılır

Projeyi bilgisayarına indir veya klonla, ardından `index.html` dosyasını herhangi bir tarayıcıda aç:

```bash
git clone https://github.com/BatuhanKlcky/sanalbahce.git
cd sanalbahce
```

Sonrasında `anasayfa.html` dosyasına çift tıklaman yeterli — herhangi bir kurulum gerekmiyor. (`index.html` GitHub Pages için ayrı bir giriş dosyasıysa, bunu README'de belirtmen ziyaretçilerin kafasını karıştırmaz.)

## 🛠️ Kullanılan Teknolojiler

- HTML / CSS / JavaScript
- [Three.js](https://threejs.org/) — 3D bahçe sahnesi ve nesneler
- [Supabase](https://supabase.com/) — ziyaret istatistikleri
- Web Audio API — oyun içi ses efektleri
- Web Notifications API — sulama/hasat hatırlatıcıları

## 🗺️ Yol Haritası

- [ ] Yeni bitki türleri eklemek
- [ ] Ses efektleri
- [x] Mobil uyumlu tasarım (web) — çentik güvenlik alanı, esnek panel genişliği, performans modu
- [ ] Kayıt/skor sistemi
- [x] Google Play hazırlığı (gizlilik, TWA iskeleti, asset links)
- [ ] Google Play production yayını

## 🔒 Gizlilik

Tam metin: [Gizlilik Politikası](https://batuhanklcky.github.io/sanalbahce/gizlilik.html)

Ziyaret istatistikleri (örn. IP, tarayıcı bilgisi) anonim şekilde kaydedilebilir. Oyun kaydı cihazında kalır; veriler satılmaz.

## 🤝 Katkıda Bulunma

Öneri ve katkılara açığım! Bir issue açabilir veya pull request gönderebilirsin.

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

Geliştiren: [Batuhan Kılıçkaya](https://github.com/BatuhanKlcky) https://www.linkedin.com/in/batuhanklcky/

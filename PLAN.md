# Düğün Fotoğraf & Video Toplama Uygulaması — Plan

## 1. Gereksinim Özeti

- Tek QR / tek link, herkes aynı sayfadan yükleme yapar
- **Auth yok** — misafir sadece adını yazar (opsiyonel), yükler
- **Toplu yükleme** (bulk) — bir seferde onlarca dosya seçilip queue ile yüklenir
- **Sıkıştırma / kırpma YOK** — orijinal fotoğraf ve video byte-for-byte saklanır
- **Video desteği** — 4K dahil, kırpma/re-encode yok
- Admin paneli: kim ne yükledi listesi, kolaj görünümü, toplu ZIP indirme
- Ücretsiz veya çok düşük maliyet

---

## 2. Depolama Hesabı (Kapasite Planı)

**Varsayımlar — 200 kişilik ortalama bir düğün:**

| Parametre | Değer |
|---|---|
| Toplam misafir | 200 |
| Aktif yükleyen oranı | %40 → **80 kişi** |
| Kişi başı fotoğraf | 15 adet |
| Fotoğraf boyutu (modern telefon, HEIC/JPEG, orijinal) | ~3 MB |
| Kişi başı video | 3 adet |
| Video uzunluğu (ortalama) | 30 sn |
| Video kalitesi | 1080p @ 30fps ≈ 60 MB / 30 sn |

**Hesap:**

```
Fotoğraf toplam: 80 × 15 × 3 MB  =  3.600 MB  ≈  3,5 GB
Video toplam:    80 × 3  × 60 MB = 14.400 MB  ≈  14 GB
                                              --------
                                    TOPLAM  ≈  ~18 GB
```

**Senaryolar:**

| Senaryo | Açıklama | Tahmin |
|---|---|---|
| Düşük | Az kişi yükler, kısa videolar | **~8 GB** |
| Orta ⭐ (baz) | Yukarıdaki hesap | **~18 GB** |
| Yüksek | 4K video ağırlıklı (30sn 4K ≈ 175 MB) | **~45 GB** |
| Uç durum | Uzun 4K videolar, çok kişi | **~80 GB** |

Planı **50 GB tavan** üzerinden kuruyoruz (uç duruma karşı güvenli marj).

---

## 3. Maliyet Karşılaştırması (50 GB / 1 ay için)

| Sağlayıcı | Depolama | Egress (İndirme) | 50 GB Aylık | Notlar |
|---|---|---|---|---|
| **Cloudflare R2** ⭐ | 10 GB free, sonrası $0.015/GB | **$0 (ücretsiz!)** | **~$0.60** | Egress ücretsiz olması kritik — sonda hepsini indireceğiz |
| Backblaze B2 | 10 GB free, $0.006/GB | $0.01/GB egress | ~$0.24 + indirme | R2'ye alternatif, biraz daha ucuz depolama ama egress ücretli |
| Supabase Pro | 100 GB dahil, $25/ay | 250 GB dahil | **$25** | Tek sistem, en kolay entegrasyon |
| Supabase Free | 1 GB → **yetmez** | 5 GB | — | Free tier bu iş için yetmez |
| Cloudinary Free | 25 GB | 25 GB | Free ama... | Videoları otomatik re-encode eder → **eleniyor** (kalite korunmaz) |
| AWS S3 | $0.023/GB | $0.09/GB | ~$1.15 + indirme | Setup daha karmaşık |

### Tavsiye Edilen Kombinasyon ⭐

- **Dosya depolama: Cloudflare R2** (ücretsiz egress = kritik)
- **Veritabanı (metadata): Supabase Free** (Postgres 500 MB, milyonlarca kayıt için fazlasıyla yeterli)
- **Uygulama hosting: Vercel Free** (Next.js için)
- **Direct upload:** Presigned URL ile dosyalar direkt R2'ye yüklenir → Vercel bandwidth harcamaz

**Toplam tahmini maliyet:**

| Kullanım | R2 Depolama | Egress | Vercel | Supabase | **Toplam** |
|---|---|---|---|---|---|
| 10 GB | Free | Free | Free | Free | **$0** |
| 20 GB | $0.15 | Free | Free | Free | **~$0.15** |
| 50 GB | $0.60 | Free | Free | Free | **~$0.60** |
| 80 GB | $1.05 | Free | Free | Free | **~$1.05** |

**Düğün sonrası:** Tüm dosyalar indirilip R2 bucket'ı silinir → 0₺.

### Alternatif: All-in Supabase Pro

- Tek panel, tek SDK, en az efor
- **$25 (tek ay), sonra iptal**
- Storage 100 GB, egress 250 GB dahil
- Kişi Supabase'i bilmesi zaten avantaj

**Karar:** Efor / kolaylık öncelikse **Supabase Pro** ($25). Maliyet öncelikse **R2 + Supabase Free** (~$0-1). İkisi de sağlam.

---

## 4. Sağlık Sınırları (Rate Limits)

Sistem sağlığı için (kalite kaybı değil, sadece kötüye kullanım koruması):

| Sınır | Değer | Neden |
|---|---|---|
| Tek session'da max dosya | 100 adet | UI donmasın |
| Tek dosya max boyut | 2 GB | Çok uzun 4K video → resumable upload gerekli |
| Aynı IP'den max dosya / saat | 200 | Spam koruması |
| Toplam bucket üst limit (alarm) | 80 GB | Beklenmedik patlama uyarısı |
| Paralel upload | 3 dosya | Ağı boğmasın, mobil için iyi |

Not: Sıkıştırma yok, kırpma yok. Sadece "aşırıya kaçmayı" engelleyen soft limitler.

---

## 5. Teknik Mimari

```
                    ┌─────────────────┐
   Misafir Telefonu │   Next.js Web   │  Vercel (Free)
   (QR ile açıyor)  │   /upload sayfası│
                    └────────┬────────┘
                             │
             ┌───────────────┼──────────────────┐
             │ 1) Presigned URL iste            │ 2) Direct upload (dosya)
             ▼                                  ▼
    ┌──────────────────┐              ┌──────────────────┐
    │ Supabase Free    │              │ Cloudflare R2    │
    │  - photos tablo  │◄─── 3) Meta ─┤  - Orijinal      │
    │  - Postgres      │    kaydı     │    fotoğraf/video│
    └──────────────────┘              └──────────────────┘
             ▲
             │
    ┌────────┴─────────┐
    │  Admin Panel     │  (parola korumalı /admin route)
    │  - Liste         │
    │  - Kolaj         │
    │  - ZIP indir     │
    └──────────────────┘
```

### Veri Modeli (Supabase)

```sql
create table uploads (
  id          uuid primary key default gen_random_uuid(),
  uploader    text,                  -- misafir adı (opsiyonel)
  file_name   text not null,
  file_size   bigint not null,
  mime_type   text not null,
  r2_key      text not null unique,  -- R2'deki path
  width       int,
  height      int,
  duration_ms int,                   -- video için
  created_at  timestamptz default now(),
  ip_hash     text                   -- rate limit için (sha256(ip))
);

create index on uploads (uploader);
create index on uploads (created_at desc);
```

### Upload Akışı (Toplu)

1. Kullanıcı `<input multiple>` veya sürükle-bırak ile 30 dosya seçer
2. Client, her dosya için server'dan **presigned PUT URL** ister (tek istekte batch)
3. Client, 3'lü paralel kuyruk ile R2'ye direkt yükler
4. Büyük videolar (>50 MB) için **multipart / resumable** upload kullanılır — bağlantı koparsa devam eder
5. Her başarılı upload sonrası Supabase'e metadata kaydı atılır
6. UI: her dosya için progress bar + toplam progress + başarılı/başarısız sayaç

### Admin Panel (`/admin?key=XXX`)

- **Yükleyicilere göre gruplama:** ad → thumbnail grid
- **Kolaj görünümü:** CSS masonry (react-photo-album)
- **Video oynatma:** inline `<video>` player
- **Toplu ZIP indir:** server-side, R2'den stream ederek zip → tarayıcıya (tek büyük ZIP yerine "kişiye göre" veya "hepsi" seçenekleri)
- **Silme:** yanlış/uygunsuz içerik için tek tıkla sil

---

## 6. Uygulanacak Teknoloji

| Katman | Seçim | Neden |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Vercel free, TypeScript, API routes |
| UI | **Tailwind + shadcn/ui** | Hızlı, temiz |
| Upload | **Uppy** (`@uppy/aws-s3-multipart`) | Resumable, paralel, drag-drop, progress bar hazır. R2 S3-uyumlu API destekler |
| QR üretimi | https://qr-code-generator.com/ (tek seferlik) | Yazdırılıp masalara konur |
| Kolaj | **react-photo-album** (masonry) | Hazır çözüm |
| ZIP | **archiver** (Node.js), stream tabanlı | Bellek şişmeden büyük ZIP |
| Storage | **Cloudflare R2** | Ücretsiz egress |
| DB | **Supabase Postgres** (Free) | Metadata |
| Hosting | **Vercel Free** | Next.js için ideal |

---

## 7. Yol Haritası (2 Günlük Plan)

### Gün 1 — Kurulum + Upload

- [ ] Next.js projesi init, Tailwind kur
- [ ] R2 bucket + API token oluştur
- [ ] Supabase projesi + `uploads` tablosu
- [ ] `/upload` sayfası: Uppy entegrasyonu (multi-file, drag-drop, resumable)
- [ ] `/api/presign` endpoint: R2 için presigned PUT URL üretir
- [ ] `/api/complete` endpoint: upload sonrası Supabase'e metadata yazar
- [ ] Rate limit (upstash veya basit IP+hour tablosu)
- [ ] Mobil test (iPhone Safari + Android Chrome)

### Gün 2 — Admin + Deploy

- [ ] `/admin` route (parola env var)
- [ ] Yükleyici listesi + thumbnail grid
- [ ] Video player inline
- [ ] `/api/download-zip` — R2'den stream ile ZIP
- [ ] "Kişiye göre" ve "Tümü" ZIP seçenekleri
- [ ] Vercel'e deploy, domain ekle (isteğe bağlı düğün adıyla)
- [ ] QR kodu üret, PDF olarak masalara yazdırılmaya hazır hale getir
- [ ] Uçtan uca test: 20 dosyayı bir seferde yükle, admin panelden indir

### Düğün Öncesi

- [ ] QR'ları yazdır (birkaç yedek)
- [ ] Rate limit değerlerini son bir kez kontrol et
- [ ] R2 alarm: 80 GB'ta uyarı e-postası

### Düğün Sonrası

- [ ] Herşeyi ZIP olarak indir (arkadaşa teslim)
- [ ] Vercel projesi durdurulabilir
- [ ] R2 bucket silinir → **maliyet 0'a döner**

---

## 8. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Kötü niyetli kişi çok büyük dosya spam eder | IP + saat rate limit, dosya boyut limiti 2 GB |
| Uygunsuz içerik yükleme | Admin panelden hızlı silme, dosyalar public URL ile paylaşılmıyor |
| Mobil'de yükleme yarım kalır | Uppy resumable → bağlantı gelince devam eder |
| Beklenenden fazla veri | R2'de 80 GB'ta alarm e-postası, hard cap değil sadece bildirim |
| QR'ı yanlış kişi görüp yükler | Riski düşük, admin panelden istenmeyen içerik silinir |

---

## 9. Karar Bekleyen Konular

1. **Storage tercihi:** R2 (~$0-1, biraz daha teknik setup) mu, Supabase Pro ($25, tek panel) mu?
   → **Öneri:** Ay sonu $25 gözüne batmıyorsa **Supabase Pro** (en kolay). Sıkı bütçe ise **R2**.
2. **Alan adı:** `arkadasadi-duguni.vercel.app` yeter mi, özel domain ($10/yıl) ister misiniz?
3. **Uygulama dili:** Türkçe UI mi? (default olarak Türkçe planlıyorum)
4. **Misafir adı:** Zorunlu mu, opsiyonel mi? (Opsiyonel önerim — sürtünmeyi azaltır)

---

## 10. Özet

- **Toplam maliyet: $0 – $25** (seçime göre)
- **Geliştirme süresi: ~2 gün**
- **Kalite kaybı: sıfır** (orijinal byte'lar saklanır)
- **Toplu yükleme: var** (Uppy ile 100 dosyaya kadar, resumable)
- **Video: 4K dahil desteklenir, kırpma yok**

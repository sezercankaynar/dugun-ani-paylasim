# Anıla — Özel Anları Toplu Foto & Video Toplama SaaS

Kullanıcılar hesap açar → albüm oluşturur → benzersiz QR/link üretilir → misafirler QR'ı okutup albüme fotoğraf/video yükler → sahibi panelinden görür, kişiye göre gruplar, ZIP olarak indirir.

## Yapı

```
/                       Landing (tanıtım)
/signup                 Hesap oluştur (email + password)
/login                  Giriş
/dashboard              Kullanıcının albüm listesi + yeni albüm oluşturma
/dashboard/albums/[id]  Albüm detayı: QR, upload linki, yüklenen medyalar
/u/[slug]               Public upload sayfası (misafirler için, auth yok)
```

## Kurulum

### 1. Cloudflare R2

1. https://dash.cloudflare.com → **R2** → **Create bucket** → adı: `anila`
2. **Manage R2 API Tokens** → **Create API token** → **Object Read & Write** → bucket: `anila`
3. Notlar: **Account ID**, **Access Key ID**, **Secret Access Key**

### 2. Supabase

1. https://supabase.com → **New project** (free tier)
2. **Authentication → Providers → Email** → aktif (varsayılan). Prod'da e-posta doğrulaması istiyorsan aç, geliştirmede kapatabilirsin
3. **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır ve çalıştır
4. **Project Settings → API** → **URL**, **anon key**, **service_role key** al

### 3. Ortam Değişkenleri

```powershell
Copy-Item .env.example .env.local
```

`.env.local` dosyasını doldur. **Vercel'e deploy ederken tüm bu değişkenleri Environment Variables kısmına da eklemeyi unutma.**

### 4. Bağımlılıklar

```powershell
npm install
```

### 5. Lokal çalıştırma

```powershell
npm run dev
```

http://localhost:3000

## Multi-tenancy Modeli

- **auth.users** → Supabase Auth (email/password)
- **albums** → user_id ile sahiplenme, RLS ile korunur
- **uploads** → album_id ile bağlı, RLS ile sahiplenme kontrolü
- **R2 anahtar yapısı:** `albums/{slug}/{tarih}/{ts-rand-name}` — silme/temizlik kolay

## Sınırlar (`src/lib/rate-limit.ts`)

- Dosya başı: 2 GB
- Session başı: 100 dosya
- IP başı saatlik: 200 dosya (tüm albümler toplam)

## Maliyet (İlk Kullanım — Arkadaşın Düğünü)

Tahmini 15-50 GB → **$0 – $1/ay** (Cloudflare R2 free 10 GB + $0.015/GB üstü, egress ücretsiz). Supabase + Vercel free tier'da kalır. Detay için `PLAN.md`.

## Düğün / Etkinlik Sonrası

- Panel → **Tümünü ZIP indir**
- Albüm silinirse R2'deki dosyaları da otomatik siler (`/api/albums/[id]` DELETE)
- Uzun süre kullanılmayan bucket → 0₺

import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export default function LandingPage() {
  return (
    <>
      <SiteNav />

      <section className="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-20 text-center">
        <p className="text-wedding-accent uppercase tracking-widest text-xs mb-4">
          Düğün · Doğum Günü · Mezuniyet · Kına
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-tight mb-6">
          Özel gününüzden{" "}
          <span className="text-wedding-accent">geriye kalan her kare</span>,
          <br />
          tek bir yerde.
        </h1>
        <p className="text-lg sm:text-xl text-wedding-ink/70 max-w-2xl mx-auto mb-10">
          Misafirlerinize QR kodu gösterin. Onlar da telefonlarındaki fotoğraf ve videoları
          birkaç dokunuşla, orijinal kalitede sizinle paylaşsın. Uygulama indirmek yok, üye
          olmak yok.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-wedding-ink text-white rounded-lg font-medium text-base shadow-lg"
          >
            Ücretsiz Hesap Aç
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 border border-wedding-soft rounded-lg text-base"
          >
            Zaten Üyeyim
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-8">
          <Feature
            step="1"
            title="Albüm oluştur"
            body="Panelinden 30 saniyede bir albüm aç. Anıla senin için benzersiz bir yükleme linki ve QR kodu üretir."
          />
          <Feature
            step="2"
            title="QR'ı paylaş"
            body="QR'ı düğün masalarına, davetiye köşesine ya da salon girişine koy. Herkes tek dokunuşla yükleme sayfasını açar."
          />
          <Feature
            step="3"
            title="Anıları topla"
            body="Yüklenen fotoğraf ve videoları panelinden anında gör, kimin yüklediğine göre grupla, tek tıkla ZIP olarak indir."
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="font-display text-3xl text-center mb-10">Neden Anıla?</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Card
            title="Orijinal kalitede"
            body="Fotoğraflar ve videolar hiç sıkıştırılmadan, kırpılmadan saklanır. 4K video dahil dosya başı 2 GB'a kadar."
          />
          <Card
            title="Toplu yükleme"
            body="Misafirlerin fotoğrafları tek tek seçmek zorunda kalmaz. Bir seferde 100 dosyaya kadar sürükle-bırak."
          />
          <Card
            title="Kesintiye dayanıklı"
            body="Büyük video yüklemeleri bölünerek gönderilir. Bağlantı koparsa kaldığı yerden devam eder."
          />
          <Card
            title="Misafire dostane"
            body="Uygulama kurmak yok, üye olmak yok. QR'ı okuttukları anda yüklemeye başlarlar."
          />
          <Card
            title="Sen kontrol edersin"
            body="Kim ne yükledi görürsün, istemediğin dosyayı silersin, tümünü tek ZIP olarak bilgisayarına indirirsin."
          />
          <Card
            title="Ücretsiz başla"
            body="Arkadaşının ilk düğünü için tamamen ücretsiz. İhtiyaç büyürse uygun fiyatlı planlara geçebilirsin."
          />
        </div>
      </section>

      <section className="bg-wedding-ink text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl mb-4">Bir dakikada başla.</h2>
          <p className="text-white/70 mb-8 text-lg">
            Sadece e-posta ve parola. Kredi kartı istemiyoruz.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-wedding-ink rounded-lg font-medium"
          >
            Hesabımı Oluştur
          </Link>
        </div>
      </section>

      <footer className="text-center text-sm text-wedding-ink/50 py-8">
        © {new Date().getFullYear()} Anıla
      </footer>
    </>
  );
}

function Feature({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="text-left">
      <div className="w-10 h-10 rounded-full bg-wedding-accent text-white flex items-center justify-center font-medium mb-4">
        {step}
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-wedding-ink/70 leading-relaxed">{body}</p>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-wedding-soft">
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-wedding-ink/70 leading-relaxed">{body}</p>
    </div>
  );
}

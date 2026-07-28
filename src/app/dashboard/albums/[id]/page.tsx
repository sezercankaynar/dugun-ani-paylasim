import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { supabaseServer } from "@/lib/supabase-server";
import AlbumView from "@/components/AlbumView";
import type { Album } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!album) notFound();
  const a = album as Album;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const uploadUrl = `${appUrl}/u/${a.slug}`;
  const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
    width: 480,
    margin: 2,
    color: { dark: "#2c2417", light: "#faf7f2" },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-wedding-ink/60 hover:underline">
          ← Tüm albümler
        </Link>
        <h1 className="font-display text-3xl mt-2">{a.name}</h1>
        {a.cover_message && <p className="text-wedding-ink/70 mt-1">{a.cover_message}</p>}
      </div>

      <section className="bg-white border border-wedding-soft rounded-xl p-6 grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <img src={qrDataUrl} alt="QR" className="w-48 h-48 rounded-lg" />
        <div className="space-y-3">
          <h2 className="font-display text-xl">Yükleme Linki</h2>
          <p className="text-sm text-wedding-ink/70">
            QR kodu misafirlerine göster ya da linki paylaş. Yükleme yapmak için hesap açmaları gerekmiyor.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={uploadUrl}
              className="flex-1 px-4 py-3 rounded-lg border border-wedding-soft bg-wedding-bg text-sm font-mono"
            />
            <a
              href={qrDataUrl}
              download={`anila-qr-${a.slug}.png`}
              className="px-4 py-3 rounded-lg bg-wedding-accent text-white text-sm font-medium text-center"
            >
              QR'ı İndir
            </a>
          </div>
          <div className="flex gap-2">
            <a
              href={uploadUrl}
              target="_blank"
              rel="noopener"
              className="text-sm text-wedding-accent underline"
            >
              Yükleme sayfasını aç
            </a>
          </div>
        </div>
      </section>

      <AlbumView albumId={a.id} albumName={a.name} />
    </div>
  );
}

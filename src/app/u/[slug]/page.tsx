import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Uploader from "@/components/Uploader";

export const dynamic = "force-dynamic";

export default async function PublicUploadPage({ params }: { params: { slug: string } }) {
  const { data: album } = await supabaseAdmin
    .from("albums")
    .select("id, name, cover_message")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!album) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <header className="text-center max-w-xl mb-8">
        <p className="text-wedding-accent uppercase tracking-widest text-xs mb-3">Anıla</p>
        <h1 className="font-display text-4xl sm:text-5xl text-wedding-ink mb-3">{album.name}</h1>
        <p className="text-wedding-ink/70 text-base sm:text-lg leading-relaxed">
          {album.cover_message ?? "Bu özel günde çektiğin fotoğraf ve videoları bizimle paylaş."}
        </p>
      </header>

      <div className="w-full max-w-2xl">
        <Uploader albumId={album.id} />
      </div>

      <footer className="mt-12 text-xs text-wedding-ink/50 text-center max-w-md">
        Fotoğraflar ve videolar orijinal kalitede saklanır. Hiçbir sıkıştırma uygulanmaz.
      </footer>
    </main>
  );
}

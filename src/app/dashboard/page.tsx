import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import CreateAlbumForm from "@/components/CreateAlbumForm";
import type { Album } from "@/lib/supabase";

export default async function DashboardHome() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: albums } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (albums ?? []) as Album[];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Albümlerim</h1>
          <p className="text-sm text-wedding-ink/60">{user?.email}</p>
        </div>
      </header>

      <CreateAlbumForm />

      {list.length === 0 ? (
        <div className="bg-white border border-wedding-soft rounded-xl p-10 text-center">
          <p className="text-wedding-ink/70">Henüz albümün yok. Yukarıdan ilkini oluştur.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/albums/${a.id}`}
              className="bg-white border border-wedding-soft rounded-xl p-6 hover:shadow-md transition"
            >
              <h3 className="font-display text-xl mb-1">{a.name}</h3>
              <p className="text-xs text-wedding-ink/50">
                {new Date(a.created_at).toLocaleDateString("tr-TR")} · /{a.slug}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type Upload = {
  id: string;
  uploader: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  r2_key: string;
  kind: "image" | "video" | "other";
  created_at: string;
  url: string;
};

export default function AlbumView({ albumId, albumName }: { albumId: string; albumName: string }) {
  const [rows, setRows] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("__all__");
  const [view, setView] = useState<"mosaic" | "by-uploader">("mosaic");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/albums/${albumId}/uploads`);
    const data = await res.json();
    setRows(data.uploads ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [albumId]);

  const byUploader = useMemo(() => {
    const m = new Map<string, Upload[]>();
    rows.forEach((r) => {
      const k = r.uploader ?? "İsimsiz";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    });
    return m;
  }, [rows]);

  const visible = useMemo(() => {
    if (filter === "__all__") return rows;
    return rows.filter((r) => (r.uploader ?? "İsimsiz") === filter);
  }, [rows, filter]);

  const stats = useMemo(() => {
    const totalBytes = rows.reduce((a, r) => a + r.file_size, 0);
    const images = rows.filter((r) => r.kind === "image").length;
    const videos = rows.filter((r) => r.kind === "video").length;
    return { totalBytes, images, videos, count: rows.length, uploaders: byUploader.size };
  }, [rows, byUploader]);

  async function remove(id: string, key: string) {
    if (!confirm("Silinsin mi?")) return;
    await fetch(`/api/albums/${albumId}/uploads`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, key }),
    });
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Yüklenenler</h2>
        <div className="text-sm text-wedding-ink/70">
          {stats.count} dosya · {stats.images} foto · {stats.videos} video ·{" "}
          {stats.uploaders} kişi · {formatBytes(stats.totalBytes)}
        </div>
      </header>

      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg border border-wedding-soft">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-wedding-soft rounded"
          >
            <option value="__all__">Herkes ({rows.length})</option>
            {[...byUploader.entries()]
              .sort((a, b) => b[1].length - a[1].length)
              .map(([name, list]) => (
                <option key={name} value={name}>
                  {name} ({list.length})
                </option>
              ))}
          </select>

          <div className="flex rounded overflow-hidden border border-wedding-soft">
            <button
              onClick={() => setView("mosaic")}
              className={`px-3 py-2 text-sm ${view === "mosaic" ? "bg-wedding-ink text-white" : "bg-white"}`}
            >
              Mozaik
            </button>
            <button
              onClick={() => setView("by-uploader")}
              className={`px-3 py-2 text-sm ${view === "by-uploader" ? "bg-wedding-ink text-white" : "bg-white"}`}
            >
              Kişiye göre
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <a
              href={`/api/albums/${albumId}/download-zip`}
              className="px-4 py-2 bg-wedding-accent text-white rounded font-medium text-sm"
            >
              Tümünü ZIP indir
            </a>
            {filter !== "__all__" && (
              <a
                href={`/api/albums/${albumId}/download-zip?uploader=${encodeURIComponent(filter)}`}
                className="px-4 py-2 bg-wedding-ink text-white rounded font-medium text-sm"
              >
                {filter} için ZIP
              </a>
            )}
            <button onClick={load} className="px-4 py-2 border border-wedding-soft rounded text-sm">
              Yenile
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-wedding-soft rounded-xl p-10 text-center text-wedding-ink/70">
          Henüz yükleme yok. QR'ı paylaşmaya başlayabilirsin.
        </div>
      ) : view === "mosaic" ? (
        <MediaGrid items={visible} onDelete={remove} />
      ) : (
        <div className="space-y-8">
          {[...byUploader.entries()]
            .filter(([name]) => filter === "__all__" || name === filter)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([name, items]) => (
              <div key={name}>
                <h3 className="font-display text-lg mb-3 flex items-baseline gap-2">
                  {name}
                  <span className="text-sm text-wedding-ink/60">
                    ({items.length} · {formatBytes(items.reduce((a, r) => a + r.file_size, 0))})
                  </span>
                  <a
                    href={`/api/albums/${albumId}/download-zip?uploader=${encodeURIComponent(name)}`}
                    className="ml-auto text-sm text-wedding-accent underline"
                  >
                    ZIP indir
                  </a>
                </h3>
                <MediaGrid items={items} onDelete={remove} />
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

function MediaGrid({
  items,
  onDelete,
}: {
  items: Upload[];
  onDelete: (id: string, key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {items.map((it) => (
        <div key={it.id} className="relative group aspect-square bg-wedding-soft/30 rounded overflow-hidden">
          {it.kind === "image" ? (
            <img src={it.url} alt={it.file_name} className="w-full h-full object-cover" loading="lazy" />
          ) : it.kind === "video" ? (
            <video src={it.url} className="w-full h-full object-cover" controls preload="metadata" />
          ) : (
            <div className="p-2 text-xs">{it.file_name}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition">
            <div className="truncate">{it.file_name}</div>
            <div className="flex justify-between items-center">
              <span>{formatBytes(it.file_size)}</span>
              <button
                onClick={() => onDelete(it.id, it.r2_key)}
                className="text-red-300 hover:text-red-100 text-xs"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

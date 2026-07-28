"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAlbumForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, coverMessage }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Hata");
      return;
    }
    const { id } = await res.json();
    router.push(`/dashboard/albums/${id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-wedding-ink text-white font-medium"
      >
        + Yeni Albüm
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-wedding-soft rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Albüm adı</label>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ayşe & Mehmet Düğünü"
          className="w-full rounded-lg border border-wedding-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-accent"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Karşılama mesajı (opsiyonel)</label>
        <input
          maxLength={140}
          value={coverMessage}
          onChange={(e) => setCoverMessage(e.target.value)}
          placeholder="Anılarınızı bizimle paylaşın!"
          className="w-full rounded-lg border border-wedding-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-accent"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-wedding-ink text-white font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Oluştur"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-3 rounded-lg border border-wedding-soft"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getClientIp, guessKind, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { albumId, key, fileName, fileType, fileSize, uploader } = await req.json();
  if (!albumId || !key || !fileName || typeof fileSize !== "number") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: album } = await supabaseAdmin
    .from("albums")
    .select("id, slug")
    .eq("id", albumId)
    .maybeSingle();
  if (!album) return NextResponse.json({ error: "album_not_found" }, { status: 404 });

  if (!key.startsWith(`albums/${album.slug}/`)) {
    return NextResponse.json({ error: "key_mismatch" }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(req.headers));
  const cleanUploader =
    typeof uploader === "string" && uploader.trim().length > 0
      ? uploader.trim().slice(0, 60)
      : null;

  const { error } = await supabaseAdmin.from("uploads").insert({
    album_id: albumId,
    r2_key: key,
    file_name: fileName,
    file_size: fileSize,
    mime_type: fileType || "application/octet-stream",
    kind: guessKind(fileType || ""),
    uploader: cleanUploader,
    ip_hash: ipHash,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

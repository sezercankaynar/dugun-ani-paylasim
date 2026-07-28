import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, type UploadRow } from "@/lib/supabase";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";

export const runtime = "nodejs";

async function requireOwner(albumId: string) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401 };
  const { data: album } = await supabase
    .from("albums")
    .select("id, user_id")
    .eq("id", albumId)
    .maybeSingle();
  if (!album || album.user_id !== user.id) return { error: "not_found" as const, status: 404 };
  return { userId: user.id };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireOwner(params.id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { data, error } = await supabaseAdmin
    .from("uploads")
    .select("*")
    .eq("album_id", params.id)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as UploadRow[];
  const withUrls = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      url: await getSignedUrl(
        r2,
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: r.r2_key }),
        { expiresIn: 60 * 60 * 2 }
      ),
    }))
  );
  return NextResponse.json({ uploads: withUrls });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireOwner(params.id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id, key } = await req.json();
  if (!id || !key) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data: row } = await supabaseAdmin
    .from("uploads")
    .select("id, album_id, r2_key")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.album_id !== params.id || row.r2_key !== key) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const { error } = await supabaseAdmin.from("uploads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

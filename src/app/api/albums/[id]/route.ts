import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { r2, R2_BUCKET } from "@/lib/r2";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: album } = await supabase
    .from("albums")
    .select("id, slug, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!album || album.user_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let ContinuationToken: string | undefined;
  do {
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: `albums/${album.slug}/`,
        ContinuationToken,
      })
    );
    const keys = (list.Contents ?? []).map((o) => ({ Key: o.Key! })).filter((k) => k.Key);
    if (keys.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: keys } })
      );
    }
    ContinuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (ContinuationToken);

  const { error } = await supabaseAdmin.from("albums").delete().eq("id", album.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

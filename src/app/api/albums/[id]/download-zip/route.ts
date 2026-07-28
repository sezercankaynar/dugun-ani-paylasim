import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { PassThrough, Readable } from "stream";
import { r2, R2_BUCKET } from "@/lib/r2";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin, type UploadRow, type Album } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!album || (album as Album).user_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const a = album as Album;

  const uploader = new URL(req.url).searchParams.get("uploader");
  let q = supabaseAdmin
    .from("uploads")
    .select("*")
    .eq("album_id", a.id)
    .order("created_at", { ascending: true });
  if (uploader) q = q.eq("uploader", uploader);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as UploadRow[];
  if (rows.length === 0) return NextResponse.json({ error: "no_files" }, { status: 404 });

  const archive = archiver("zip", { store: true });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);
  archive.on("warning", (err) => console.warn("zip warn", err));
  archive.on("error", (err) => passthrough.destroy(err));

  (async () => {
    try {
      for (const row of rows) {
        const obj = await r2.send(
          new GetObjectCommand({ Bucket: R2_BUCKET, Key: row.r2_key })
        );
        const body = obj.Body as Readable | undefined;
        if (!body) continue;
        const folder = row.uploader ? sanitize(row.uploader) : "isimsiz";
        const name = `${folder}/${row.id.slice(0, 8)}-${sanitize(row.file_name)}`;
        archive.append(body, { name });
      }
      await archive.finalize();
    } catch (e) {
      passthrough.destroy(e as Error);
    }
  })();

  const stream = Readable.toWeb(passthrough) as ReadableStream;
  const label = uploader ? sanitize(uploader) : sanitize(a.name);
  return new Response(stream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${label}-${Date.now()}.zip"`,
    },
  });
}

function sanitize(s: string): string {
  return s.replace(/[^\w.\- ]+/g, "_").trim() || "dosya";
}

import { NextResponse } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase";
import { LIMITS, checkIpQuota, getClientIp, hashIp, safeKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { albumId, fileName, fileType, fileSize } = await req.json();
  if (!albumId || !fileName || !fileType) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (typeof fileSize === "number" && fileSize > LIMITS.MAX_FILE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const { data: album } = await supabaseAdmin
    .from("albums")
    .select("id, slug")
    .eq("id", albumId)
    .maybeSingle();
  if (!album) return NextResponse.json({ error: "album_not_found" }, { status: 404 });

  const ipHash = hashIp(getClientIp(req.headers));
  const quota = await checkIpQuota(ipHash);
  if (!quota.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const key = safeKey(album.slug, fileName);
  const cmd = new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });
  const res = await r2.send(cmd);
  return NextResponse.json({ uploadId: res.UploadId, key });
}

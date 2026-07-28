import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase";
import { LIMITS, checkIpQuota, getClientIp, hashIp, safeKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { albumId, fileName, fileType, fileSize } = await req.json();
  if (!albumId || !fileName || !fileType || typeof fileSize !== "number") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (fileSize > LIMITS.MAX_FILE_BYTES) {
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
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: fileType }),
    { expiresIn: 60 * 60 }
  );

  return NextResponse.json({ url, key });
}

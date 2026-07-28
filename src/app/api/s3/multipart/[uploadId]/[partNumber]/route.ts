import { NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { uploadId: string; partNumber: string } }
) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });
  const partNumber = Number(params.partNumber);
  if (!Number.isFinite(partNumber) || partNumber < 1) {
    return NextResponse.json({ error: "bad_part" }, { status: 400 });
  }
  const url = await getSignedUrl(
    r2,
    new UploadPartCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: params.uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 60 * 60 }
  );
  return NextResponse.json({ url });
}

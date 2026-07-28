import { NextResponse } from "next/server";
import { AbortMultipartUploadCommand, ListPartsCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });

  const parts: Array<{ PartNumber: number; Size: number; ETag: string }> = [];
  let marker: number | undefined = undefined;
  while (true) {
    const out: any = await r2.send(
      new ListPartsCommand({
        Bucket: R2_BUCKET,
        Key: key,
        UploadId: params.uploadId,
        PartNumberMarker: marker as any,
      })
    );
    (out.Parts ?? []).forEach((p: any) =>
      parts.push({ PartNumber: p.PartNumber, Size: p.Size, ETag: p.ETag })
    );
    if (!out.IsTruncated) break;
    marker = out.NextPartNumberMarker;
  }
  return NextResponse.json(parts);
}

export async function DELETE(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });
  await r2.send(
    new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: params.uploadId,
    })
  );
  return NextResponse.json({ ok: true });
}

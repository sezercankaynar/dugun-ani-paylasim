import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const body = await req.json();
  const { key, parts } = body as {
    key: string;
    parts: Array<{ PartNumber: number; ETag: string }>;
  };
  if (!key || !Array.isArray(parts)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const res = await r2.send(
    new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: params.uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.PartNumber - b.PartNumber)
          .map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag })),
      },
    })
  );
  return NextResponse.json({ location: res.Location, key });
}

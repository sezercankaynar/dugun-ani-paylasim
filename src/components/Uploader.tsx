"use client";

import { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_FILES = 100;
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

export default function Uploader({ albumId }: { albumId: string }) {
  const [uploader, setUploader] = useState("");
  const uploaderRef = useRef("");
  uploaderRef.current = uploader;
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    const u = new Uppy({
      autoProceed: false,
      restrictions: {
        maxFileSize: MAX_FILE_BYTES,
        maxNumberOfFiles: MAX_FILES,
        allowedFileTypes: ["image/*", "video/*"],
      },
      locale: {
        strings: {
          dropPasteFiles: "Fotoğraf/video sürükle bırak ya da %{browseFiles}",
          browseFiles: "seç",
          uploadXFiles: {
            0: "%{smart_count} dosyayı yükle",
            1: "%{smart_count} dosyayı yükle",
          },
          uploading: "Yükleniyor",
          complete: "Tamamlandı",
          uploadFailed: "Yükleme başarısız",
        },
      } as any,
    });

    u.use(AwsS3, {
      shouldUseMultipart: (file) => (file.size ?? 0) > MULTIPART_THRESHOLD,
      limit: 3,
      endpoint: "",
      getUploadParameters: async (file) => {
        const res = await fetch("/api/s3/params", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            albumId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        (file as any).meta = { ...(file as any).meta, r2_key: data.key };
        return {
          method: "PUT",
          url: data.url,
          headers: { "content-type": file.type || "application/octet-stream" },
        };
      },
      createMultipartUpload: async (file) => {
        const res = await fetch("/api/s3/multipart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            albumId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        (file as any).meta = { ...(file as any).meta, r2_key: data.key };
        return { uploadId: data.uploadId, key: data.key };
      },
      listParts: async (_file, { uploadId, key }) => {
        const res = await fetch(
          `/api/s3/multipart/${encodeURIComponent(uploadId!)}?key=${encodeURIComponent(key!)}`
        );
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      signPart: async (_file, { uploadId, key, partNumber, signal }) => {
        const res = await fetch(
          `/api/s3/multipart/${encodeURIComponent(uploadId!)}/${partNumber}?key=${encodeURIComponent(key!)}`,
          { signal }
        );
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      completeMultipartUpload: async (_file, { uploadId, key, parts }) => {
        const res = await fetch(
          `/api/s3/multipart/${encodeURIComponent(uploadId!)}/complete`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ key, parts }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      abortMultipartUpload: async (_file, { uploadId, key }) => {
        await fetch(
          `/api/s3/multipart/${encodeURIComponent(uploadId!)}?key=${encodeURIComponent(key!)}`,
          { method: "DELETE" }
        );
      },
    });

    u.on("upload-success", async (file) => {
      if (!file) return;
      const key = (file as any).meta?.r2_key;
      if (!key) return;
      try {
        await fetch("/api/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            albumId,
            key,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploader: uploaderRef.current.trim() || null,
          }),
        });
      } catch (e) {
        console.error("metadata register failed", e);
      }
    });

    setUppy(u);
    return () => {
      u.destroy();
    };
  }, [albumId]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-wedding-ink/80">Adın (opsiyonel)</span>
        <input
          type="text"
          value={uploader}
          onChange={(e) => setUploader(e.target.value)}
          placeholder="Örn: Ayşe Yılmaz"
          className="mt-1 w-full rounded-lg border border-wedding-soft bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-accent"
          maxLength={60}
        />
      </label>

      <div className="rounded-xl border border-wedding-soft bg-white p-1">
        {uppy && (
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            width="100%"
            height={420}
            note="Fotoğraf ve videoları toplu seçebilirsin. Max 100 dosya, dosya başı 2 GB. Orijinal kalitede yüklenir."
            showProgressDetails
          />
        )}
      </div>
    </div>
  );
}

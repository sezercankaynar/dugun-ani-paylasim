import { createHash } from "crypto";
import { supabaseAdmin } from "./supabase";

export const LIMITS = {
  MAX_FILE_BYTES: 2 * 1024 * 1024 * 1024,
  MAX_FILES_PER_IP_PER_HOUR: 200,
} as const;

export function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || "salt";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function checkIpQuota(ipHash: string): Promise<{ ok: boolean; count: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);
  if (error) throw error;
  const c = count ?? 0;
  return { ok: c < LIMITS.MAX_FILES_PER_IP_PER_HOUR, count: c };
}

export function guessKind(mime: string): "image" | "video" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

export function safeKey(albumSlug: string, fileName: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const clean = fileName
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-80);
  const day = new Date().toISOString().slice(0, 10);
  return `albums/${albumSlug}/${day}/${ts}-${rand}-${clean}`;
}

export function randomSlug(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

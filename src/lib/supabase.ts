import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export type Album = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  cover_message: string | null;
  created_at: string;
};

export type UploadRow = {
  id: string;
  album_id: string;
  uploader: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  r2_key: string;
  kind: "image" | "video" | "other";
  ip_hash: string | null;
  created_at: string;
};

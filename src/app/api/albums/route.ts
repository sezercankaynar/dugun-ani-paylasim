import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { randomSlug } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, coverMessage } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomSlug();
    const { data, error } = await supabaseAdmin
      .from("albums")
      .insert({
        user_id: user.id,
        name: name.trim().slice(0, 80),
        cover_message: typeof coverMessage === "string" ? coverMessage.trim().slice(0, 140) : null,
        slug,
      })
      .select("id, slug")
      .single();
    if (!error && data) return NextResponse.json(data);
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "slug_collision" }, { status: 500 });
}

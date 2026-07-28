"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="px-3 py-2 rounded hover:bg-wedding-soft/30 text-sm"
    >
      Çıkış
    </button>
  );
}

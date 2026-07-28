import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import SignOutButton from "./SignOutButton";

export default async function SiteNav() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="w-full border-b border-wedding-soft bg-wedding-bg/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-wedding-ink">
          Anıla
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded hover:bg-wedding-soft/30"
              >
                Panelim
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 rounded hover:bg-wedding-soft/30"
              >
                Giriş
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded bg-wedding-ink text-white font-medium"
              >
                Ücretsiz Başla
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

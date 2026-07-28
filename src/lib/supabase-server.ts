import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Component'te set çağrısı hata verirse yut — middleware zaten refresh eder.
          }
        },
      },
    }
  );
}

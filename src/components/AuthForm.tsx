"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (!data.session) {
        setInfo("E-postana bir doğrulama bağlantısı gönderdik. Onayladıktan sonra giriş yapabilirsin.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/dashboard");
      router.refresh();
    }
  }

  const isSignup = mode === "signup";

  return (
    <form onSubmit={submit} className="bg-white p-8 rounded-xl border border-wedding-soft w-full max-w-md space-y-4 shadow-sm">
      <h1 className="font-display text-3xl">{isSignup ? "Hesap Oluştur" : "Giriş Yap"}</h1>
      <p className="text-sm text-wedding-ink/60">
        {isSignup
          ? "Ücretsiz hesap. Sadece e-posta ve parola."
          : "Anıla hesabınla giriş yap."}
      </p>

      <label className="block">
        <span className="text-sm font-medium">E-posta</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wedding-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-accent"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Parola</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wedding-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-accent"
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {info && <p className="text-green-700 text-sm">{info}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-wedding-ink text-white py-3 font-medium disabled:opacity-50"
      >
        {loading ? "..." : isSignup ? "Hesap Oluştur" : "Giriş Yap"}
      </button>

      <p className="text-sm text-center text-wedding-ink/70">
        {isSignup ? (
          <>
            Zaten üye misin?{" "}
            <Link href="/login" className="text-wedding-accent underline">
              Giriş yap
            </Link>
          </>
        ) : (
          <>
            Hesabın yok mu?{" "}
            <Link href="/signup" className="text-wedding-accent underline">
              Ücretsiz aç
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

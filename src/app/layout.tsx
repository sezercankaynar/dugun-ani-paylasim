import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anıla — Özel anlarınız için toplu foto & video toplama",
  description:
    "Düğün, doğum günü, mezuniyet... Tek QR kodla misafirlerinizin çektiği tüm foto ve videoları orijinal kalitede toplayın.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-wedding-bg text-wedding-ink">{children}</body>
    </html>
  );
}

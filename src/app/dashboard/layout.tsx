import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </>
  );
}

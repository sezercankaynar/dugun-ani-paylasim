import AuthForm from "@/components/AuthForm";
import SiteNav from "@/components/SiteNav";

export default function LoginPage() {
  return (
    <>
      <SiteNav />
      <main className="flex items-center justify-center px-4 py-12">
        <AuthForm mode="login" />
      </main>
    </>
  );
}

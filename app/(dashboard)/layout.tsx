import { requireMembership, getUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Asıl kimlik kapısı (middleware hızlı yol, bu katman yetkili kontrol).
  await requireMembership();
  const user = await getUser();

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user?.email ?? ""} />
        <main className="bg-background flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

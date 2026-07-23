import Link from "next/link";
import { redirect } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role as string;
  const isAdmin = role === "PRINCIPAL" || role === "ACCOUNTANT";

  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-blue-700 tracking-tight">
              SchoolManager
            </Link>
            <nav className="hidden space-x-4 md:flex">
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/invoices" className="text-sm font-medium text-slate-600 hover:text-slate-900">Invoices</Link>
              <Link href="/notices" className="text-sm font-medium text-slate-600 hover:text-slate-900">Notice Board</Link>
              <Link href="/schedule" className="text-sm font-medium text-slate-600 hover:text-slate-900">Schedule</Link>
              {isAdmin && (
                <>
                  <Link href="/reports" className="text-sm font-medium text-slate-600 hover:text-slate-900">Reports</Link>
                  <Link href="/settings/gateways" className="text-sm font-medium text-slate-600 hover:text-slate-900">Settings</Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 ml-6">
            {isAdmin && <GlobalSearch />}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

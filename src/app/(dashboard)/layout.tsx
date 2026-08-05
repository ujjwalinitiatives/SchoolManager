import { redirect } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { DashboardLayoutClient } from "./dashboard-layout-client";
import { NotificationBell } from "@/components/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = viewer?.role || "PARENT";
  const isAdmin = role === "PRINCIPAL" || role === "ACCOUNTANT";

  const unreadNotificationsCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false }
  });

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav role={role} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-sm flex-shrink-0">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight truncate">{session.user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role}</p>
          </div>
        </div>
      </div>
    </>
  );

  const headerActions = (
    <>
      {isAdmin && <GlobalSearch />}
      <NotificationBell count={unreadNotificationsCount} />
      <ModeToggle />
      <LogoutButton />
    </>
  );

  return (
    <DashboardLayoutClient 
      sidebarContent={sidebarContent}
      headerActions={headerActions}
    >
      {children}
    </DashboardLayoutClient>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your recent alerts and messages.</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-800">
            <CheckCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
            <p className="text-sm text-slate-500">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${notification.isRead ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" : "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10"}`}>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{notification.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                {notification.link && (
                  <Link href={notification.link} className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View Details &rarr;</Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ count }: { count: number }) {
  return (
    <Link 
      href="/notifications" 
      className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  Settings,
  MessageSquare,
  Receipt,
  FileText,
  Calendar,
  LucideIcon
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const getNavItems = (role: string): NavItem[] => {
  const r = role.toUpperCase();
  if (r === "PRINCIPAL") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Students", href: "/students", icon: Users },
      { label: "Staff", href: "/staff", icon: UserCheck },
      { label: "Notices", href: "/notices", icon: Bell },
      { label: "Settings", href: "/settings/profile", icon: Settings },
    ];
  } else if (r === "TEACHER") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Class", href: "/students", icon: Users },
      { label: "Attendance", href: "/attendance", icon: UserCheck },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Notices", href: "/notices", icon: Bell },
    ];
  } else if (r === "ACCOUNTANT") {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Classes & Fees", href: "/accountant/classes", icon: Users },
      { label: "Invoices", href: "/invoices", icon: Receipt },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Settings", href: "/settings/profile", icon: Settings },
    ];
  } else {
    // PARENT / STUDENT and fallback
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Invoices", href: "/invoices", icon: Receipt },
      { label: "Notices", href: "/notices", icon: Bell },
      { label: "Schedule", href: "/schedule", icon: Calendar },
    ];
  }
};

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Bell,
  Calendar,
  Settings,
  Receipt,
  MessageSquare,
  Megaphone,
} from "lucide-react";

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  
  const isAdmin = role === "PRINCIPAL" || role === "ACCOUNTANT";
  const isPrincipal = role === "PRINCIPAL";
  const isTeacher = role === "TEACHER";
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";
  const isAccountant = role === "ACCOUNTANT";
  
  const showNotices = ["PRINCIPAL", "TEACHER", "PARENT", "STUDENT"].includes(role);
  const showSchedule = ["PRINCIPAL", "TEACHER", "PARENT", "STUDENT"].includes(role);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || pathname?.startsWith(path + "/");
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;
  };

  return (
    <nav className="space-y-1 px-3">
      <Link href="/dashboard" className={getLinkClass("/dashboard")}>
        <LayoutDashboard className="h-4 w-4" /> Dashboard
      </Link>
      
      {isPrincipal && (
        <>
          <Link href="/students" className={getLinkClass("/students")}>
            <Users className="h-4 w-4" /> Students
          </Link>
          <Link href="/staff" className={getLinkClass("/staff")}>
            <UserCheck className="h-4 w-4" /> Staff
          </Link>
        </>
      )}

      {isTeacher && (
        <>
          <Link href="/students" className={getLinkClass("/students")}>
            <Users className="h-4 w-4" /> My Class
          </Link>
          <Link href="/attendance" className={getLinkClass("/attendance")}>
            <UserCheck className="h-4 w-4" /> Attendance
          </Link>
          <Link href="/messages" className={getLinkClass("/messages")}>
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
        </>
      )}

      {isAccountant && (
        <>
          <Link href="/accountant/classes" className={getLinkClass("/accountant/classes")}>
            <Users className="h-4 w-4" /> Classes & Fees
          </Link>
        </>
      )}
      
      {(isParent || isStudent) && (
        <>
          <Link href="/messages" className={getLinkClass("/messages")}>
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
        </>
      )}

      {isAdmin && (
        <Link href="/reports" className={getLinkClass("/reports")}>
          <FileText className="h-4 w-4" /> Reports
        </Link>
      )}
      
      {showNotices && (
        <Link href="/notices" className={getLinkClass("/notices")}>
          <Bell className="h-4 w-4" /> Notices
        </Link>
      )}

      {isAdmin && (
        <Link href="/invoices" className={getLinkClass("/invoices")}>
          <Receipt className="h-4 w-4" /> Invoices
        </Link>
      )}

      {(isParent || isStudent) && (
        <Link href="/invoices" className={getLinkClass("/invoices")}>
          <Receipt className="h-4 w-4" /> Invoices
        </Link>
      )}

      {showSchedule && (
        <Link href="/schedule" className={getLinkClass("/schedule")}>
          <Calendar className="h-4 w-4" /> Schedule
        </Link>
      )}
      
      <Link href="/settings/profile" className={getLinkClass("/settings/profile")}>
        <Settings className="h-4 w-4" /> Settings
      </Link>

      {isAdmin && (
        <Link href="/settings/gateways" className={getLinkClass("/settings/gateways")}>
          <Settings className="h-4 w-4" /> Payment Settings
        </Link>
      )}
    </nav>
  );
}

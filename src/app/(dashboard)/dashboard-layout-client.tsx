"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function DashboardLayoutClient({ 
  sidebarContent, 
  headerActions,
  children 
}: { 
  sidebarContent: React.ReactNode;
  headerActions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-200 ease-in-out md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="md:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-xs font-black text-white">
              SM
            </div>
            <span className="text-lg font-bold text-blue-700 tracking-tight">
              SchoolManager
            </span>
          </Link>
        </div>
        
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {headerActions}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}

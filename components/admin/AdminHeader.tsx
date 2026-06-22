"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

type AdminHeaderProps = {
  title: string;
  setSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  username: string;
  jabatan: string;
};

export function AdminHeader({
  title,
  setSidebarOpen,
  isSidebarCollapsed,
  toggleSidebar,
  username,
  jabatan,
}: AdminHeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 md:px-8 justify-between shadow-sm transition-colors duration-300 flex-none z-40">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6 text-slate-600 dark:text-slate-200" />
        </button>
        <button
          className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{username}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{jabatan}</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
          <User className="h-6 w-6" />
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}

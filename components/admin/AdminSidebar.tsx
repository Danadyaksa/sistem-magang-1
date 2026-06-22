"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  BookOpen,
  Users,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AdminSidebarProps = {
  active: "dashboard" | "applicants" | "pkl" | "penelitian" | "users" | "settings";
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  onLogout: () => void;
};

export function AdminSidebar({
  active,
  sidebarOpen,
  setSidebarOpen,
  isSidebarCollapsed,
  onLogout,
}: AdminSidebarProps) {
  const router = useRouter();

  const SidebarItem = ({ icon: Icon, label, itemKey, onClick, className = "" }: any) => {
    const isActive = active === itemKey;
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={onClick}
              className={`w-full flex items-center transition-colors duration-200 ${
                isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"
              } ${
                isActive
                  ? "bg-slate-800 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              } ${className}`}
            >
              <Icon className={`h-5 w-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
              {!isSidebarCollapsed && <span>{label}</span>}
            </Button>
          </TooltipTrigger>
          {isSidebarCollapsed && (
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 ml-2">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white shadow-xl flex flex-col h-full transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}
    >
      <div
        className={`h-16 flex items-center border-b border-slate-800 flex-none ${
          isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"
        }`}
      >
        <div className="flex items-center justify-center">
          <Image
            src="/logo-disdikpora.png"
            alt="Logo Disdikpora"
            width={isSidebarCollapsed ? 28 : 32}
            height={isSidebarCollapsed ? 28 : 32}
            className="object-contain transition-all duration-300"
          />
        </div>
        {!isSidebarCollapsed && (
          <h1 className="font-bold text-xl tracking-wider truncate animate-in fade-in duration-300">
            Dinas DIKPORA
          </h1>
        )}
        <button
          className="ml-auto md:hidden text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarItem
          icon={LayoutDashboard}
          label="Master Data"
          itemKey="dashboard"
          onClick={() => router.push("/admin/dashboard")}
        />
        <SidebarItem
          icon={FileText}
          label="Pendaftar"
          itemKey="applicants"
          onClick={() => router.push("/admin/applicants")}
        />
        <SidebarItem
          icon={CalendarClock}
          label="Daftar PKL"
          itemKey="pkl"
          onClick={() => router.push("/admin/pkl")}
        />
        <SidebarItem
          icon={BookOpen}
          label="Penelitian"
          itemKey="penelitian"
          onClick={() => router.push("/admin/penelitian")}
        />
        <SidebarItem
          icon={Users}
          label="User Admin"
          itemKey="users"
          onClick={() => router.push("/admin/users")}
        />
        <SidebarItem
          icon={Settings}
          label="Pengaturan"
          itemKey="settings"
          onClick={() => router.push("/admin/pengaturan")}
        />
        <div className={`pt-4 mt-4 border-t border-slate-800 ${isSidebarCollapsed ? "mx-2" : ""}`}>
          <SidebarItem
            icon={LogOut}
            label="Keluar"
            itemKey="logout"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={onLogout}
          />
        </div>
      </nav>
    </aside>
  );
}

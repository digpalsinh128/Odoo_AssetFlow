"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as any;
  const role = user?.role || "EMPLOYEE";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Assets & Allocations", href: "/assets", icon: "📦" },
    { name: "Bookings", href: "/bookings", icon: "📅" },
    { name: "Maintenance", href: "/maintenance", icon: "🔧" },
    { name: "Audits", href: "/audits", icon: "📝" },
    { name: "Reports", href: "/reports", icon: "📈" },
    { name: "Activity Logs", href: "/activity", icon: "📑" },
  ];

  // Admin only tab
  if (role === "ADMIN") {
    navigation.push({ name: "Org Setup", href: "/org-setup", icon: "⚙️" });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen text-slate-100">
      {/* Brand logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          AssetFlow
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logged in User Profile Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {user && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-200 truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate mb-2">{user.email}</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/60 text-purple-300 border border-purple-500/30">
              {role.replace("_", " ")}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:border-red-900/50 transition-colors"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

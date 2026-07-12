"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface KPIInfo {
  totalAssets: number;
  allocatedAssets: number;
  maintenanceAssets: number;
  overdueAssets: number;
}

interface OverdueAllocation {
  id: string;
  asset: { id: string; name: string; serialNumber: string };
  user?: { name: string; email: string } | null;
  department?: { name: string } | null;
  expectedReturnDate: string;
}

interface LogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string; role: string } | null;
}

export default function DashboardClient() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || "EMPLOYEE";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [kpis, setKpis] = useState<KPIInfo>({
    totalAssets: 0,
    allocatedAssets: 0,
    maintenanceAssets: 0,
    overdueAssets: 0,
  });
  const [overdues, setOverdues] = useState<OverdueAllocation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const data = await res.json();
      setKpis(data.kpis);
      setOverdues(data.overdueList || []);
      setLogs(data.activityLogs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const getActionEmoji = (action: string) => {
    switch (action) {
      case "CREATE_ASSET":
        return "🆕";
      case "ALLOCATE_ASSET":
        return "📦";
      case "RETURN_ASSET":
        return "📥";
      case "REQUEST_TRANSFER":
        return "🔄";
      case "APPROVE_TRANSFER":
        return "✅";
      case "REJECT_TRANSFER":
        return "❌";
      default:
        return "⚙️";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-slate-200 font-semibold">{user?.name}</span>. Here is your asset summary.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          System Status: <span className="text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-xl hover:border-slate-700 transition-all duration-300">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Assets</div>
              <div className="text-3xl font-bold mt-2 text-slate-100">{kpis.totalAssets}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {userRole === "ADMIN" ? "Corporate inventory count" : "Assets allocated to you"}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-xl hover:border-slate-700 transition-all duration-300">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Allocations</div>
              <div className="text-3xl font-bold mt-2 text-purple-400">{kpis.allocatedAssets}</div>
              <div className="text-[10px] text-slate-500 mt-1">Currently checked out</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-xl hover:border-slate-700 transition-all duration-300">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Under Maintenance</div>
              <div className="text-3xl font-bold mt-2 text-amber-500">{kpis.maintenanceAssets}</div>
              <div className="text-[10px] text-slate-500 mt-1">In diagnostics or repair</div>
            </div>

            <div className={`p-6 rounded-xl border transition-all duration-300 ${kpis.overdueAssets > 0
                ? "bg-red-950/20 border-red-800/50 hover:border-red-800"
                : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
              }`}>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Overdue Returns</div>
              <div className={`text-3xl font-bold mt-2 ${kpis.overdueAssets > 0 ? "text-red-400" : "text-slate-100"}`}>
                {kpis.overdueAssets}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Exceeded expected return date</div>
            </div>
          </div>

          {/* Red Alert Widget for Overdue Returns */}
          {overdues.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/60 rounded-xl overflow-hidden shadow-xl shadow-red-950/10">
              <div className="bg-red-950/40 p-4 border-b border-red-900/60 flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <h2 className="text-sm font-bold text-red-400 uppercase tracking-wide">Critical Attention Required: Overdue Items</h2>
                  <p className="text-xs text-red-300/80">The following asset checkouts have exceeded their expected return dates.</p>
                </div>
              </div>
              <div className="divide-y divide-red-900/30">
                {overdues.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-red-950/10 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">
                        {item.asset.name} <span className="text-xs text-slate-500 font-mono">({item.asset.serialNumber})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Assigned to:{" "}
                        <span className="text-slate-300 font-medium">
                          {item.user ? item.user.name : item.department ? `Dept: ${item.department.name}` : "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-xs text-red-400 font-semibold">Overdue since</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {new Date(item.expectedReturnDate).toLocaleDateString()}
                        </div>
                      </div>
                      {["ADMIN", "ASSET_MANAGER"].includes(userRole) && (
                        <Link
                          href="/assets"
                          className="bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800 px-3 py-1 rounded text-xs transition-colors font-medium"
                        >
                          Process Check-In
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions (Admin only) */}
          {userRole === "ADMIN" && (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-slate-200 mb-4">⚙️ Administration Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/assets"
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                >
                  📦 Manage Catalog & Issue Allocations
                </Link>
                <Link
                  href="/org-setup"
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                >
                  🏢 Manage Departments & Categories
                </Link>
                <Link
                  href="/org-setup"
                  className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                >
                  👥 Promote Roles & Directory
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity Log Feed */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">📑 Recent Activity Log</h2>
              <button
                onClick={fetchDashboardMetrics}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                🔄 Refresh Logs
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic text-sm">
                  No activity logged in the database yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-800/10 transition-colors">
                    <div className="text-xl bg-slate-850 p-2 rounded-lg h-10 w-10 flex items-center justify-center border border-slate-800">
                      {getActionEmoji(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">{log.details}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {log.user && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                            👤 {log.user.name} ({log.user.role.replace("_", " ")})
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

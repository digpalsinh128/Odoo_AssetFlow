"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: string;
  category: { name: string };
}

interface Booking {
  id: string;
  assetId: string;
  createdAt: string;
  asset: Asset;
}

interface MaintenanceRequest {
  id: string;
  assetId: string;
  createdAt: string;
  asset: Asset;
}

export default function BookingsMaintenanceClient() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || "EMPLOYEE";

  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  const [activeTab, setActiveTab] = useState<"bookings" | "maintenance">(
    initialAction === "maintenance" ? "maintenance" : "bookings"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Forms
  const [bookingAssetId, setBookingAssetId] = useState("");
  const [maintenanceAssetId, setMaintenanceAssetId] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch assets list for dropdown
      const assetsRes = await fetch("/api/assets");
      if (assetsRes.ok) {
        const aData = await assetsRes.json();
        setAssets(aData.assets || []);
      }

      if (activeTab === "bookings") {
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Failed to load bookings");
        const data = await res.json();
        setBookings(data || []);
      } else {
        const res = await fetch("/api/maintenance");
        if (!res.ok) throw new Error("Failed to load maintenance requests");
        const data = await res.json();
        setMaintenance(data || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: bookingAssetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book resource");

      showSuccess("Resource booked successfully!");
      setBookingAssetId("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: maintenanceAssetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to raise maintenance request");

      showSuccess("Maintenance request raised successfully!");
      setMaintenanceAssetId("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMaintenance = async (requestId: string) => {
    if (!confirm("Are you sure this asset has completed maintenance and should be marked available?")) {
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/maintenance?id=${requestId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve maintenance request");

      showSuccess("Asset marked as Available successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only AVAILABLE assets can be booked
  const bookableAssets = assets.filter((a) => a.status === "AVAILABLE");

  // Assets that are not already under maintenance can be sent to maintenance
  const maintainableAssets = assets.filter((a) => a.status !== "UNDER_MAINTENANCE");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Bookings & Maintenance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Reserve equipment and report utility diagnoses/repairs</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-sm flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveTab("bookings"); setError(""); }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === "bookings"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          📅 Active Bookings
        </button>
        <button
          onClick={() => { setActiveTab("maintenance"); setError(""); }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === "maintenance"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
          }`}
        >
          🔧 Maintenance Diagnoses
        </button>
      </div>

      {loading && <div className="text-center py-10 text-slate-400 animate-pulse">Loading list data...</div>}

      {/* Tab A: Bookings */}
      {!loading && activeTab === "bookings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form Panel */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-200">➕ Book Resource</h2>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Equipment / Asset
                </label>
                <select
                  value={bookingAssetId}
                  onChange={(e) => setBookingAssetId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">Choose Available Asset</option>
                  {bookableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (S/N: {a.serialNumber}) - {a.category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg py-2.5 transition-colors text-sm"
              >
                Create Booking Reservation
              </button>
            </form>
          </div>

          {/* Bookings List Panel */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-950/20">
              <h2 className="text-xl font-bold text-slate-200 font-sans">Reservations List</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800">
                  <th className="p-4">Asset Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Booking Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500 italic">
                      No active bookings registered.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{b.asset.name}</div>
                        <div className="text-xs text-slate-500">Model: {b.asset.model} | S/N: {b.asset.serialNumber}</div>
                      </td>
                      <td className="p-4 text-slate-300">{b.asset.category.name}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab B: Maintenance */}
      {!loading && activeTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Maintenance Form Panel */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-200">➕ Raise Maintenance Request</h2>
            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Target Equipment
                </label>
                <select
                  value={maintenanceAssetId}
                  onChange={(e) => setMaintenanceAssetId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">Choose Asset to Diagnose</option>
                  {maintainableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (S/N: {a.serialNumber}) [{a.status.replace("_", " ")}]
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg py-2.5 transition-colors text-sm"
              >
                Submit Maintenance Request
              </button>
            </form>
          </div>

          {/* Maintenance List Panel */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-950/20">
              <h2 className="text-xl font-bold text-slate-200">Maintenance & Diagnostics History</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800">
                  <th className="p-4">Asset Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date Filed</th>
                  {["ADMIN", "ASSET_MANAGER"].includes(userRole) && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {maintenance.length === 0 ? (
                  <tr>
                    <td colSpan={["ADMIN", "ASSET_MANAGER"].includes(userRole) ? 4 : 3} className="p-6 text-center text-slate-500 italic">
                      No assets are currently reported for maintenance.
                    </td>
                  </tr>
                ) : (
                  maintenance.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{m.asset.name}</div>
                        <div className="text-xs text-slate-500">Model: {m.asset.model} | S/N: {m.asset.serialNumber}</div>
                      </td>
                      <td className="p-4 text-slate-300">{m.asset.category.name}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      {["ADMIN", "ASSET_MANAGER"].includes(userRole) && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleResolveMaintenance(m.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold border border-emerald-800 bg-emerald-950/20 px-2.5 py-1 rounded"
                          >
                            Mark Available
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

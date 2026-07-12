"use client";

import React, { useState, useEffect } from 'react';

export default function ReportsDashboard() {
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/maintenance').then(r => r.json()),
      fetch('/api/reports/utilization').then(r => r.json())
    ])
    .then(([maint, util]) => {
      setMaintenanceData(maint);
      setUtilizationData(util);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading reports...</div>;

  const maxMaintRequests = Math.max(...maintenanceData.map(d => d.totalRequests), 1);
  const maxUtilHours = Math.max(...utilizationData.map(d => d.totalHoursBooked), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Maintenance Analytics */}
        <div className="bg-slate-900/60 border border-slate-800 border-slate-800 p-6 rounded shadow-lg shadow-black/20 ">
          <h2 className="text-xl font-bold mb-6 text-slate-200 border-b pb-2">Maintenance Frequency</h2>
          
          <div className="space-y-6">
            {maintenanceData.map((data, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{data.categoryName}</span>
                  <span className="text-slate-300">{data.totalRequests} Requests (Avg Resolve: {data.avgResolutionTimeHours} hrs)</span>
                </div>
                <div className="w-full bg-slate-800 rounded h-4 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${(data.totalRequests / maxMaintRequests) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {maintenanceData.length === 0 && <p className="text-slate-400">No maintenance data available.</p>}
          </div>
        </div>

        {/* Utilization Analytics */}
        <div className="bg-slate-900/60 border border-slate-800 border-slate-800 p-6 rounded shadow-lg shadow-black/20 ">
          <h2 className="text-xl font-bold mb-6 text-slate-200 border-b pb-2">Asset Utilization (Bookings)</h2>
          
          <div className="space-y-6">
            {utilizationData.map((data, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{data.assetName} <span className="font-mono text-slate-400 text-xs">({data.serialNumber})</span></span>
                  <span className="text-slate-300">{data.totalHoursBooked} hrs ({data.totalBookings} bookings)</span>
                </div>
                <div className="w-full bg-slate-800 rounded h-4 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full" 
                    style={{ width: `${(data.totalHoursBooked / maxUtilHours) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {utilizationData.length === 0 && <p className="text-slate-400">No utilization data available.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}



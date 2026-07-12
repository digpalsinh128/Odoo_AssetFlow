"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MaintenanceDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, newStatus: string, extraData?: any) => {
    try {
      const payload = { status: newStatus, ...extraData };
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
        return;
      }
      
      loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const promptAssign = (id: string) => {
    const techName = prompt("Enter Technician Name:");
    if (techName && techName.trim()) {
      handleAction(id, 'TECHNICIAN_ASSIGNED', { technicianName: techName.trim() });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-950/40 text-amber-400';
      case 'APPROVED': return 'bg-purple-900/40 text-purple-300';
      case 'REJECTED': return 'bg-red-950/40 text-red-400';
      case 'TECHNICIAN_ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-orange-950/40 text-orange-400';
      case 'RESOLVED': return 'bg-emerald-950/40 text-emerald-400';
      default: return 'bg-gray-100 text-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
        <Link href="/maintenance/new" className="bg-purple-600 text-white px-4 py-2 rounded shadow-lg shadow-black/20  hover:bg-purple-500">
          + Raise Request
        </Link>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="grid gap-4">
          {requests.length === 0 && (
            <p className="text-slate-400 bg-slate-900/60 border border-slate-800 border-slate-800 p-6 rounded shadow-lg shadow-black/20  text-center">No maintenance requests found.</p>
          )}
          {requests.map(req => (
            <div key={req.id} className="bg-slate-900/60 border border-slate-800 border-slate-800 p-6 rounded shadow-lg shadow-black/20  flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{req.asset?.name || 'Unknown Asset'}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{req.asset?.serialNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <span className="text-xs border border-slate-800 px-2 py-1 rounded">Priority: {req.priority}</span>
                </div>
                <p className="text-slate-300 mb-2">{req.issue}</p>
                <div className="text-sm text-slate-400 flex gap-4">
                  <span>Raised by: {req.raisedBy?.name || 'Unknown'}</span>
                  <span>Date: {new Date(req.createdAt).toLocaleDateString()}</span>
                  {req.technicianName && <span>Technician: <strong>{req.technicianName}</strong></span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                {req.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleAction(req.id, 'APPROVED')} className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm hover:bg-purple-500">Approve</button>
                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="bg-red-950/40 text-red-400 px-4 py-1.5 rounded text-sm hover:bg-red-200">Reject</button>
                  </>
                )}
                {req.status === 'APPROVED' && (
                  <button onClick={() => promptAssign(req.id)} className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm hover:bg-purple-700">Assign Tech</button>
                )}
                {req.status === 'TECHNICIAN_ASSIGNED' && (
                  <button onClick={() => handleAction(req.id, 'IN_PROGRESS')} className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-600">Start Work</button>
                )}
                {req.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleAction(req.id, 'RESOLVED')} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">Mark Resolved</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



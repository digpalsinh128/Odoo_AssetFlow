"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AuditExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudit();
  }, [params.id]);

  const loadAudit = () => {
    setLoading(true);
    fetch(`/api/audits/${params.id}`)
      .then(res => res.json())
      .then(data => setAudit(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateItem = async (itemId: string, updates: any) => {
    try {
      await fetch(`/api/audits/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      // Optimistic update locally
      setAudit((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, ...updates } : i)
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to update item');
      loadAudit();
    }
  };

  const handleCloseCycle = async () => {
    if (!confirm('Are you sure you want to close this cycle? All "MISSING" items will be marked as "LOST" permanently.')) return;

    try {
      const res = await fetch(`/api/audits/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (res.ok) {
        alert('Audit Cycle Closed!');
        loadAudit();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to close');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!audit) return <div className="p-6">Audit not found</div>;

  const isClosed = audit.status === 'CLOSED';
  const discrepancies = audit.items.filter((i: any) => i.status === 'MISSING' || i.status === 'DAMAGED');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start bg-white p-6 rounded shadow">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Cycle</h1>
          <p className="text-gray-600">Dates: {new Date(audit.startDate).toLocaleDateString()} — {new Date(audit.endDate).toLocaleDateString()}</p>
          <p className="text-gray-600">Scope: Dept: {audit.scopeDept || 'All'}, Location: {audit.scopeLocation || 'All'}</p>
          <p className="text-gray-600">Auditors: {audit.auditors.map((a: any) => a.user.name).join(', ')}</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <span className={`px-3 py-1 rounded font-bold ${isClosed ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
            {audit.status}
          </span>
          {!isClosed && (
            <button onClick={handleCloseCycle} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow">
              Close Audit Cycle
            </button>
          )}
        </div>
      </div>

      {discrepancies.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded shadow">
          <h2 className="text-xl font-bold text-red-800 mb-4">Discrepancy List</h2>
          <ul className="space-y-2">
            {discrepancies.map((i: any) => (
              <li key={`disc-${i.id}`} className="flex justify-between items-center text-red-900 bg-white p-2 rounded border border-red-100">
                <span><strong>{i.asset.name}</strong> ({i.asset.serialNumber})</span>
                <span className="font-bold">{i.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Audit Items ({audit.items.length})</h2>
        {audit.items.length === 0 ? (
          <p className="text-gray-500">No assets matched the scope criteria.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3">Asset</th>
                <th className="p-3">Tag</th>
                <th className="p-3 w-48">Status</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {audit.items.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.asset.name}</td>
                  <td className="p-3 text-sm text-gray-600 font-mono">{item.asset.serialNumber}</td>
                  <td className="p-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, { status: e.target.value })}
                      disabled={isClosed}
                      className={`w-full p-2 border rounded text-sm ${
                        item.status === 'VERIFIED' ? 'bg-green-50 border-green-200' :
                        item.status === 'MISSING' ? 'bg-red-50 border-red-200' :
                        item.status === 'DAMAGED' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
                      }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="MISSING">Missing</option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={item.notes || ''}
                      onChange={(e) => {
                        // Optimistic text update
                        setAudit((prev: any) => ({
                          ...prev,
                          items: prev.items.map((i: any) => i.id === item.id ? { ...i, notes: e.target.value } : i)
                        }));
                      }}
                      onBlur={(e) => updateItem(item.id, { notes: e.target.value })}
                      disabled={isClosed}
                      className="w-full border p-2 rounded text-sm disabled:bg-gray-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

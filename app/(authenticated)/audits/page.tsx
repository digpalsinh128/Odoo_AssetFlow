"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuditsDashboard() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audits')
      .then(res => res.json())
      .then(data => setAudits(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Cycles</h1>
        <Link href="/audits/new" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + New Audit Cycle
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {audits.length === 0 && (
            <p className="text-gray-500 bg-white p-6 rounded shadow text-center">No audit cycles found.</p>
          )}
          {audits.map(audit => (
            <div key={audit.id} className="bg-white p-6 rounded shadow flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">
                    Audit: {new Date(audit.startDate).toLocaleDateString()} — {new Date(audit.endDate).toLocaleDateString()}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${audit.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {audit.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Scope:</strong> Department {audit.scopeDept || 'All'} • Location {audit.scopeLocation || 'All'}</p>
                  <p><strong>Auditors:</strong> {audit.auditors.map((a: any) => a.user.name).join(', ')}</p>
                </div>
              </div>
              <div>
                <Link href={`/audits/${audit.id}`} className="bg-gray-100 border text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
                  View Execution
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (action: string) => {
    if (action.includes('REGISTERED') || action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED') || action.includes('APPROVED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETED') || action.includes('LOST')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading activity logs...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Activity Logs</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            <p className="text-lg">No activity recorded yet.</p>
            <p className="text-sm mt-2">Actions like registering assets or booking resources will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map((log: any) => {
              let detailsStr = '';
              if (log.details) {
                try {
                  const parsed = JSON.parse(log.details);
                  detailsStr = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' | ');
                } catch (e) {
                  detailsStr = log.details;
                }
              }

              return (
                <li key={log.id} className="p-6 hover:bg-gray-50 transition-colors flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm ${getActionColor(log.action)}`}>
                      {log.action.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {log.user ? log.user.name : 'System'}
                      </p>
                      <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {log.entity}
                      </span>
                    </div>
                    {detailsStr && (
                      <p className="mt-2 text-sm text-gray-500 italic">
                        {detailsStr}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

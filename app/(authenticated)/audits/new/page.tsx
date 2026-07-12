"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAuditPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    scopeDept: '',
    scopeLocation: '',
    startDate: '',
    endDate: '',
    auditorIds: [] as string[]
  });

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepartments).catch(console.error);
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(console.error);
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuditorChange = (userId: string) => {
    setFormData(prev => {
      const ids = prev.auditorIds.includes(userId)
        ? prev.auditorIds.filter(id => id !== userId)
        : [...prev.auditorIds, userId];
      return { ...prev, auditorIds: ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create audit cycle');
      }

      router.push('/audits');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Audit Cycle</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 mb-4">Define Scope</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select name="scopeDept" value={formData.scopeDept} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input type="text" name="scopeLocation" value={formData.scopeLocation} onChange={handleChange} placeholder="e.g. Office A" className="w-full border p-2 rounded" />
          </div>
        </div>

        <h2 className="text-xl font-bold border-b pb-2 mb-4 mt-6">Timeline</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input required type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <h2 className="text-xl font-bold border-b pb-2 mb-4 mt-6">Assign Auditors *</h2>
        <div className="space-y-2 border p-3 rounded max-h-40 overflow-y-auto">
          {users.map(u => (
            <label key={u.id} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.auditorIds.includes(u.id)}
                onChange={() => handleAuditorChange(u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
        {formData.auditorIds.length === 0 && <p className="text-xs text-red-500">Please select at least one auditor.</p>}

        <div className="pt-6 border-t mt-6">
          <button type="submit" disabled={loading || formData.auditorIds.length === 0} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Generating Items...' : 'Create Cycle & Auto-Generate Scope'}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RaiseMaintenancePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    assetId: '',
    raisedById: '',
    issue: '',
    priority: 'MEDIUM',
    photoUrl: '',
  });

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setAssets(data))
      .catch(console.error);

    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to raise request');
      }

      router.push('/maintenance');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Raise Maintenance Request</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Asset *</label>
          <select required name="assetId" value={formData.assetId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Asset</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.serialNumber})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Raised By (User) *</label>
          <select required name="raisedById" value={formData.raisedById} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Issue Description *</label>
          <textarea required name="issue" value={formData.issue} onChange={handleChange} rows={4} className="w-full border p-2 rounded" placeholder="Describe the problem..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photo URL (Optional)</label>
          <input type="url" name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="https://..." className="w-full border p-2 rounded" />
        </div>

        <div className="pt-4 border-t">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}


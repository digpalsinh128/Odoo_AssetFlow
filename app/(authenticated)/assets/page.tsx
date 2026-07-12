"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AssetDirectory() {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'ALLOCATED': return 'bg-blue-100 text-blue-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_MAINTENANCE': return 'bg-orange-100 text-orange-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'RETIRED': return 'bg-gray-100 text-gray-800';
      case 'DISPOSED': return 'bg-gray-300 text-gray-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Asset Directory</h1>
        <Link href="/assets/new" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + Register Asset
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search by Tag, Name, Serial..." 
          className="border p-2 rounded flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="RESERVED">Reserved</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="LOST">Lost</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading assets...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4">Tag</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono">{asset.serialNumber}</td>
                  <td className="p-4">{asset.name}</td>
                  <td className="p-4">{asset.category?.name || 'N/A'}</td>
                  <td className="p-4">{asset.location || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/assets/${asset.id}`} className="text-blue-600 hover:underline">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No assets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


"use client";

import React, { useState, useEffect } from 'react';

export default function BookingsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Form State
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookedById, setBookedById] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch bookable assets
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => {
        const bookable = data.filter((a: any) => a.isBookable);
        setAssets(bookable);
      })
      .catch(console.error);

    // Fetch users for the dropdown
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      loadBookings(selectedAsset.id);
    }
  }, [selectedAsset]);

  const loadBookings = async (assetId: string) => {
    try {
      const res = await fetch(`/api/bookings?assetId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          bookedById,
          startTime,
          endTime,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book asset');
      }

      setSuccess('Booking created successfully!');
      loadBookings(selectedAsset.id);
      
      // Reset form
      setStartTime('');
      setEndTime('');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (res.ok) {
        loadBookings(selectedAsset.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex gap-6">
      {/* Left Sidebar: Assets */}
      <div className="w-1/3 bg-slate-900/60 border border-slate-800 border-slate-800 rounded shadow-lg shadow-black/20  flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-slate-950/40">
          <h2 className="text-xl font-bold">Bookable Resources</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {assets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`w-full text-left p-3 rounded border border-slate-800 transition-colors ${selectedAsset?.id === asset.id ? 'bg-purple-950/40 border-purple-500' : 'hover:bg-slate-950/40'}`}
            >
              <div className="font-semibold">{asset.name}</div>
              <div className="text-xs text-slate-400">{asset.serialNumber} • {asset.location || 'No Location'}</div>
            </button>
          ))}
          {assets.length === 0 && <p className="text-slate-400">No bookable resources found.</p>}
        </div>
      </div>

      {/* Right Area: Calendar/List & Form */}
      <div className="w-2/3 flex flex-col h-full gap-6">
        {!selectedAsset ? (
          <div className="flex-1 bg-slate-900/60 border border-slate-800 border-slate-800 rounded shadow-lg shadow-black/20  flex items-center justify-center text-slate-400">
            Select a resource from the left to view and create bookings.
          </div>
        ) : (
          <>
            <div className="bg-slate-900/60 border border-slate-800 border-slate-800 rounded shadow-lg shadow-black/20  p-6">
              <h2 className="text-2xl font-bold mb-4">Book {selectedAsset.name}</h2>
              
              {error && <div className="mb-4 bg-red-950/40 text-red-400 p-3 rounded">{error}</div>}
              {success && <div className="mb-4 bg-emerald-950/40 text-emerald-400 p-3 rounded">{success}</div>}
              
              <form onSubmit={handleBookingSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Book For (User)</label>
                  <select required value={bookedById} onChange={(e) => setBookedById(e.target.value)} className="w-full border border-slate-800 p-2 rounded">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div></div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input required type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border border-slate-800 p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input required type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-slate-800 p-2 rounded" />
                </div>
                
                <div className="col-span-2 pt-2">
                  <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-500 disabled:opacity-50">
                    {loading ? 'Booking...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex-1 bg-slate-900/60 border border-slate-800 border-slate-800 rounded shadow-lg shadow-black/20  p-6 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Timeline / Existing Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-slate-400">No bookings exist for this resource.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map(booking => {
                    const isCancelled = booking.status === 'CANCELLED';
                    return (
                      <div key={booking.id} className={`p-4 border border-slate-800 rounded ${isCancelled ? 'bg-slate-950/40 border-slate-800' : 'border-purple-800 bg-blue-50/30'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-semibold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                              {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-300 mt-1">Booked by: {booking.bookedBy?.name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              isCancelled ? 'bg-slate-800 text-slate-300' :
                              booking.status === 'UPCOMING' ? 'bg-purple-100 text-purple-700' :
                              booking.status === 'ONGOING' ? 'bg-emerald-950/40 text-emerald-400' :
                              'bg-purple-900/40 text-purple-300'
                            }`}>
                              {booking.status}
                            </span>
                            {!isCancelled && booking.status !== 'COMPLETED' && (
                              <button onClick={() => handleCancel(booking.id)} className="text-xs text-red-600 hover:underline">
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}



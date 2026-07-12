"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Category {
  id: string;
  name: string;
  fields: string | null; // JSON
}

interface Allocation {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; serialNumber: string } | null;
  userId: string | null;
  user?: { id: string; name: string; email: string } | null;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  status: string;
  expectedReturnDate: string | null;
  returnDate: string | null;
  checkOutNote: string | null;
  checkInNote: string | null;
}

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: string;
  categoryId: string;
  category: { id: string; name: string };
  customFields: string | null; // JSON
  allocations: Allocation[];
  createdAt: string;
}

interface TransferRequest {
  id: string;
  allocationId: string;
  allocation: {
    id: string;
    asset: { id: string; name: string; serialNumber: string };
    user?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
  };
  targetUserId: string | null;
  targetDepartmentId: string | null;
  status: string;
  requestedBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string } | null;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface DeptOption {
  id: string;
  name: string;
}

export default function AssetsClient() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const userRole = currentUser?.role || "EMPLOYEE";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data list states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);

  // Search/Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // UI Dialog/Form Toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState<string | null>(null); // assetId
  const [showConflictDialog, setShowConflictDialog] = useState<Asset | null>(null); // conflictAsset
  const [showReturnDialog, setShowReturnDialog] = useState<string | null>(null); // assetId
  const [showTransferDialog, setShowTransferDialog] = useState<Allocation | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState({
    name: "",
    serialNumber: "",
    model: "",
    categoryId: "",
    customFields: {} as Record<string, string>,
  });

  const [allocForm, setAllocForm] = useState({
    targetType: "user", // "user" | "department"
    userId: "",
    departmentId: "",
    expectedReturnDate: "",
    checkOutNote: "",
  });

  const [returnForm, setReturnForm] = useState({
    checkInNote: "",
  });

  const [transferForm, setTransferForm] = useState({
    targetType: "user",
    targetUserId: "",
    targetDepartmentId: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const assetsRes = await fetch("/api/assets");
      if (!assetsRes.ok) throw new Error("Failed to load assets");
      const data = await assetsRes.json();
      setAssets(data.assets || []);
      setCategories(data.categories || []);
      setUsers(data.users || []);
      setDepartments(data.departments || []);

      const transfersRes = await fetch("/api/assets/transfer");
      if (transfersRes.ok) {
        const tData = await transfersRes.json();
        setTransfers(tData || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load database records");
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // Add Asset Handlers
  const handleCatChange = (catId: string) => {
    const selected = categories.find((c) => c.id === catId);
    let initialFields: Record<string, string> = {};
    if (selected && selected.fields) {
      try {
        const fieldsArr = JSON.parse(selected.fields);
        fieldsArr.forEach((f: any) => {
          initialFields[f.name] = "";
        });
      } catch (e) {}
    }
    setNewAsset({
      ...newAsset,
      categoryId: catId,
      customFields: initialFields,
    });
  };

  const handleCustomFieldChange = (name: string, val: string) => {
    setNewAsset({
      ...newAsset,
      customFields: { ...newAsset.customFields, [name]: val },
    });
  };

  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAsset.name,
          serialNumber: newAsset.serialNumber,
          model: newAsset.model,
          categoryId: newAsset.categoryId,
          customFields: newAsset.customFields,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register asset");

      showSuccessMessage("Asset registered successfully");
      setNewAsset({ name: "", serialNumber: "", model: "", categoryId: "", customFields: {} });
      setShowAddForm(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Allocate Asset Handlers
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { targetType, userId, departmentId, expectedReturnDate, checkOutNote } = allocForm;
      const payload = {
        assetId: showAllocateDialog,
        userId: targetType === "user" ? userId : null,
        departmentId: targetType === "department" ? departmentId : null,
        expectedReturnDate: expectedReturnDate || null,
        checkOutNote: checkOutNote || null,
      };

      const res = await fetch("/api/assets/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to allocate asset");

      showSuccessMessage("Asset allocated successfully");
      setShowAllocateDialog(null);
      setAllocForm({ targetType: "user", userId: "", departmentId: "", expectedReturnDate: "", checkOutNote: "" });
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Return Asset Handlers
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/assets/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: showReturnDialog,
          checkInNote: returnForm.checkInNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to return asset");

      showSuccessMessage("Asset returned to inventory");
      setShowReturnDialog(null);
      setReturnForm({ checkInNote: "" });
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Transfer Request Handlers
  const handleTransferRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { targetType, targetUserId, targetDepartmentId } = transferForm;
      const payload = {
        action: "request",
        allocationId: showTransferDialog?.id,
        targetUserId: targetType === "user" ? targetUserId : null,
        targetDepartmentId: targetType === "department" ? targetDepartmentId : null,
      };

      const res = await fetch("/api/assets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit transfer request");

      showSuccessMessage("Transfer request submitted successfully");
      setShowTransferDialog(null);
      setTransferForm({ targetType: "user", targetUserId: "", targetDepartmentId: "" });
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTransfer = async (requestId: string, action: "approve" | "reject") => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/assets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process transfer request");

      showSuccessMessage(`Transfer request ${action}ed successfully`);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      asset.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isWriteAuthorized = userRole === "ADMIN" || userRole === "ASSET_MANAGER";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
            Assets & Allocations
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage asset lifecycle, issue assignments, and coordinate transfers</p>
        </div>
        {isWriteAuthorized && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            {showAddForm ? "✕ Close Form" : "➕ Register Asset"}
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-700">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-sm flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-700 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Add Asset Form Card */}
      {showAddForm && (
        <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl space-y-4 max-w-xl mx-auto animate-fade-in shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900">➕ Register New Asset</h2>
          <form onSubmit={handleAddAssetSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="MacBook Pro"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={newAsset.model}
                  onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="M3 Pro 16in"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={newAsset.serialNumber}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="SN-12345"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={newAsset.categoryId}
                  onChange={(e) => handleCatChange(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Custom Fields */}
            {newAsset.categoryId && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category specific fields
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const catObj = categories.find((c) => c.id === newAsset.categoryId);
                    if (!catObj || !catObj.fields) return null;
                    try {
                      const fieldsArr = JSON.parse(catObj.fields);
                      return fieldsArr.map((f: any) => (
                        <div key={f.name}>
                          <label className="block text-xs font-semibold text-gray-500 mb-2">
                            {f.name} {f.required && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                            value={newAsset.customFields[f.name] || ""}
                            onChange={(e) => handleCustomFieldChange(f.name, e.target.value)}
                            required={f.required}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                          />
                        </div>
                      ));
                    } catch (err) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "Registering..." : "Save Asset"}
            </button>
          </form>
        </div>
      )}

      {/* Filters & Inventory List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search serial, model, name..."
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-900 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>
        </div>

        {/* Assets Catalog Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
              <th className="p-4">Asset Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Attributes</th>
              <th className="p-4">Current Allocation</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No assets match your search filters.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                // Parse dynamic custom fields
                let customFieldsObj: Record<string, string> = {};
                try {
                  customFieldsObj = asset.customFields ? JSON.parse(asset.customFields) : {};
                } catch (e) {}

                // Active allocation (if any)
                const activeAlloc = asset.allocations[0];

                return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Model: {asset.model}</div>
                      <div className="text-xs text-gray-500">S/N: {asset.serialNumber}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700 font-medium">{asset.category.name}</span>
                    </td>
                    <td className="p-4 max-w-xs">
                      {Object.keys(customFieldsObj).length === 0 ? (
                        <span className="text-gray-400 italic text-xs">None</span>
                      ) : (
                        <div className="space-y-0.5 text-xs text-gray-500">
                          {Object.entries(customFieldsObj).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-gray-500">{k}:</span> {v}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {activeAlloc ? (
                        <div className="text-gray-900">
                          {activeAlloc.user ? (
                            <span>👤 {activeAlloc.user.name}</span>
                          ) : activeAlloc.department ? (
                            <span>Department: {activeAlloc.department.name}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          {activeAlloc.expectedReturnDate && (
                            <div className="text-[10px] text-amber-500 mt-0.5">
                              Due: {new Date(activeAlloc.expectedReturnDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${
                          asset.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : asset.status === "ALLOCATED"
                            ? "bg-blue-950/40 text-blue-400 border-blue-800/40"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {asset.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isWriteAuthorized && (
                        <button
                          onClick={() => {
                            if (asset.status === "AVAILABLE") {
                              setShowAllocateDialog(asset.id);
                            } else {
                              setShowConflictDialog(asset);
                            }
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Allocate
                        </button>
                      )}

                      {asset.status === "ALLOCATED" && (
                        <>
                          {isWriteAuthorized && (
                            <button
                              onClick={() => setShowReturnDialog(asset.id)}
                              className="text-xs text-emerald-700 hover:text-emerald-300 font-semibold"
                            >
                              Return
                            </button>
                          )}
                          <button
                            onClick={() => setShowTransferDialog({ ...activeAlloc, asset: { id: asset.id, name: asset.name, serialNumber: asset.serialNumber } })}
                            className="text-xs text-amber-700 hover:text-amber-300 font-semibold"
                          >
                            Transfer
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Allocation Dialog Overlay */}
      {showAllocateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-gray-200 w-full max-w-md p-6 rounded-xl space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">📦 Allocate Asset</h2>
            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Allocation Target Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="targetType"
                      checked={allocForm.targetType === "user"}
                      onChange={() => setAllocForm({ ...allocForm, targetType: "user" })}
                      className="text-blue-600 bg-gray-50 border-gray-200 focus:ring-0 focus:ring-offset-0"
                    />
                    Assign to Employee
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="targetType"
                      checked={allocForm.targetType === "department"}
                      onChange={() => setAllocForm({ ...allocForm, targetType: "department" })}
                      className="text-blue-600 bg-gray-50 border-gray-200 focus:ring-0 focus:ring-offset-0"
                    />
                    Assign to Department
                  </label>
                </div>
              </div>

              {allocForm.targetType === "user" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Select Employee
                  </label>
                  <select
                    value={allocForm.userId}
                    onChange={(e) => setAllocForm({ ...allocForm, userId: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                  >
                    <option value="">Choose Employee</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Select Department
                  </label>
                  <select
                    value={allocForm.departmentId}
                    onChange={(e) => setAllocForm({ ...allocForm, departmentId: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                  >
                    <option value="">Choose Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Expected Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={allocForm.expectedReturnDate}
                  onChange={(e) => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Checkout Note
                </label>
                <textarea
                  value={allocForm.checkOutNote}
                  onChange={(e) => setAllocForm({ ...allocForm, checkOutNote: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none h-20 resize-none"
                  placeholder="Describe initial setup condition..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Allocate
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocateDialog(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Dialog Overlay */}
      {showReturnDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-gray-200 w-full max-w-md p-6 rounded-xl space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">📥 Check In / Return Asset</h2>
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Condition Notes
                </label>
                <textarea
                  value={returnForm.checkInNote}
                  onChange={(e) => setReturnForm({ checkInNote: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none h-24 resize-none"
                  placeholder="e.g. Returned in clean condition, no screen scratches."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Return to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnDialog(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict / Allocation Blocked Dialog Overlay */}
      {showConflictDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 w-full max-w-md p-6 rounded-xl space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-red-600">Allocation Blocked</h2>
            </div>
            
            <p className="text-gray-700 text-sm">
              The asset <span className="text-gray-900 font-semibold">{showConflictDialog.name}</span> cannot be allocated directly because it is not available.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-500">
              {showConflictDialog.status === "ALLOCATED" ? (
                <>
                  <div className="font-semibold text-gray-700">Current Status: Allocated</div>
                  <div className="mt-1">
                    Currently held by:{" "}
                    <span className="text-blue-400 font-medium">
                      {(() => {
                        const activeAlloc = showConflictDialog.allocations?.[0];
                        if (!activeAlloc) return "Unknown";
                        return activeAlloc.user 
                          ? activeAlloc.user.name 
                          : activeAlloc.department 
                          ? `Dept: ${activeAlloc.department.name}` 
                          : "Unknown";
                      })()}
                    </span>
                  </div>
                </>
              ) : showConflictDialog.status === "UNDER_MAINTENANCE" ? (
                <div className="font-semibold text-amber-500">Current Status: Under Maintenance</div>
              ) : (
                <div className="font-semibold text-gray-500">Current Status: {showConflictDialog.status.replace("_", " ")}</div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {showConflictDialog.status === "ALLOCATED" && (
                <button
                  type="button"
                  onClick={() => {
                    const activeAlloc = showConflictDialog.allocations?.[0];
                    if (activeAlloc) {
                      setShowTransferDialog({
                        ...activeAlloc,
                        asset: {
                          id: showConflictDialog.id,
                          name: showConflictDialog.name,
                          serialNumber: showConflictDialog.serialNumber
                        }
                      });
                    }
                    setShowConflictDialog(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  🔄 Request Transfer instead
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowConflictDialog(null)}
                className={`px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm ${
                  showConflictDialog.status !== "ALLOCATED" ? "w-full" : ""
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Request Dialog Overlay */}
      {showTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-gray-200 w-full max-w-md p-6 rounded-xl space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">🔄 Request Asset Transfer</h2>
            <p className="text-gray-500 text-xs">
              This will request to transfer asset <span className="text-gray-900 font-semibold">{showTransferDialog.asset?.name}</span>.
            </p>
            <form onSubmit={handleTransferRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Target Transfer Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="transTargetType"
                      checked={transferForm.targetType === "user"}
                      onChange={() => setTransferForm({ ...transferForm, targetType: "user" })}
                      className="text-blue-600 bg-gray-50 border-gray-200 focus:ring-0 focus:ring-offset-0"
                    />
                    Transfer to User
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="transTargetType"
                      checked={transferForm.targetType === "department"}
                      onChange={() => setTransferForm({ ...transferForm, targetType: "department" })}
                      className="text-blue-600 bg-gray-50 border-gray-200 focus:ring-0 focus:ring-offset-0"
                    />
                    Transfer to Department
                  </label>
                </div>
              </div>

              {transferForm.targetType === "user" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Target User
                  </label>
                  <select
                    value={transferForm.targetUserId}
                    onChange={(e) => setTransferForm({ ...transferForm, targetUserId: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                  >
                    <option value="">Select Target User</option>
                    {users
                      .filter((u) => u.id !== showTransferDialog.userId) // Exclude current holder
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Target Department
                  </label>
                  <select
                    value={transferForm.targetDepartmentId}
                    onChange={(e) => setTransferForm({ ...transferForm, targetDepartmentId: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 text-sm focus:outline-none"
                  >
                    <option value="">Select Target Department</option>
                    {departments
                      .filter((d) => d.id !== showTransferDialog.departmentId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferDialog(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Requests Board */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">🔄 Transfer Requests</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
              <th className="p-4">Asset</th>
              <th className="p-4">Requested By</th>
              <th className="p-4">Transfer Target</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No active transfer requests found.
                </td>
              </tr>
            ) : (
              transfers.map((req) => {
                let targetName = "";
                if (req.targetUserId) {
                  const targetUser = users.find((u) => u.id === req.targetUserId);
                  targetName = targetUser ? `User: ${targetUser.name}` : "Unknown User";
                } else if (req.targetDepartmentId) {
                  const targetDept = departments.find((d) => d.id === req.targetDepartmentId);
                  targetName = targetDept ? `Dept: ${targetDept.name}` : "Unknown Dept";
                }

                const canProcess = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(userRole);

                return (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{req.allocation.asset.name}</div>
                      <div className="text-xs text-gray-500">S/N: {req.allocation.asset.serialNumber}</div>
                    </td>
                    <td className="p-4 text-gray-700">
                      <div>{req.requestedBy.name}</div>
                      <div className="text-xs text-gray-500">{req.requestedBy.email}</div>
                    </td>
                    <td className="p-4 text-gray-700">
                      <span className="font-medium text-gray-900">{targetName}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          req.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : req.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-950/40 text-red-600 border border-red-200/40"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {req.status === "PENDING" && canProcess ? (
                        <>
                          <button
                            onClick={() => handleProcessTransfer(req.id, "approve")}
                            className="text-xs text-emerald-700 hover:text-emerald-300 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessTransfer(req.id, "reject")}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


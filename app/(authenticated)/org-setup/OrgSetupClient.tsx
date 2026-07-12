"use client";

import React, { useEffect, useState } from "react";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Department {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  parent?: Department | null;
  managerId: string | null;
  manager?: UserOption | null;
}

interface CustomField {
  name: string;
  type: string;
  required: boolean;
}

interface AssetCategory {
  id: string;
  name: string;
  fields: string | null; // JSON string
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
}

export default function OrgSetupClient() {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deptOptions, setDeptOptions] = useState<{ id: string; name: string }[]>([]);

  // Department Form State
  const [deptForm, setDeptForm] = useState({
    name: "",
    parentId: "",
    managerId: "",
    status: "ACTIVE",
  });
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catFields, setCatFields] = useState<CustomField[]>([]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Employee Edit State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    role: "",
    status: "",
    departmentId: "",
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "departments") {
        const res = await fetch("/api/org/departments");
        if (!res.ok) throw new Error("Failed to load departments");
        const data = await res.json();
        setDepartments(data.departments || []);
        setUsers(data.users || []);
      } else if (activeTab === "categories") {
        const res = await fetch("/api/org/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(data || []);
      } else if (activeTab === "employees") {
        const res = await fetch("/api/org/employees");
        if (!res.ok) throw new Error("Failed to load employees");
        const data = await res.json();
        setEmployees(data.employees || []);
        setDeptOptions(data.departments || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // Department Actions
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const method = editingDeptId ? "PUT" : "POST";
      const payload = editingDeptId ? { id: editingDeptId, ...deptForm } : deptForm;

      const res = await fetch("/api/org/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save department");

      showSuccess(editingDeptId ? "Department updated successfully" : "Department created successfully");
      setDeptForm({ name: "", parentId: "", managerId: "", status: "ACTIVE" });
      setEditingDeptId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDept = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptForm({
      name: dept.name,
      parentId: dept.parentId || "",
      managerId: dept.managerId || "",
      status: dept.status,
    });
  };

  const handleToggleDeptStatus = async (dept: Department) => {
    setError("");
    setLoading(true);
    try {
      const newStatus = dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch("/api/org/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dept.id,
          name: dept.name,
          parentId: dept.parentId,
          managerId: dept.managerId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status");
      showSuccess(`Department marked as ${newStatus.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Category Actions
  const handleAddAttr = () => {
    setCatFields([...catFields, { name: "", type: "text", required: false }]);
  };

  const handleRemoveAttr = (index: number) => {
    setCatFields(catFields.filter((_, i) => i !== index));
  };

  const handleAttrChange = (index: number, key: keyof CustomField, value: any) => {
    const updated = [...catFields];
    updated[index] = { ...updated[index], [key]: value };
    setCatFields(updated);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Validate fields
      if (catFields.some((f) => !f.name.trim())) {
        throw new Error("All custom fields must have a name");
      }

      const method = editingCatId ? "PUT" : "POST";
      const payload = editingCatId
        ? { id: editingCatId, name: catName, fields: catFields }
        : { name: catName, fields: catFields };

      const res = await fetch("/api/org/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      showSuccess(editingCatId ? "Category updated successfully" : "Category created successfully");
      setCatName("");
      setCatFields([]);
      setEditingCatId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCat = (cat: AssetCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    try {
      setCatFields(cat.fields ? JSON.parse(cat.fields) : []);
    } catch (e) {
      setCatFields([]);
    }
  };

  // Employee Actions
  const handleEditEmp = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpForm({
      role: emp.role,
      status: emp.status,
      departmentId: emp.departmentId || "",
    });
  };

  const handleSaveEmp = async (empId: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: empId,
          role: empForm.role,
          status: empForm.status,
          departmentId: empForm.departmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee");

      showSuccess("Employee information updated successfully");
      setEditingEmpId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
            Organization Setup
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage corporate departments, asset categories, and user directory</p>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-600 hover:text-red-700">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-sm flex justify-between items-center animate-fade-in">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-700 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("departments"); setError(""); }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === "departments"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
          }`}
        >
          🏬 Departments
        </button>
        <button
          onClick={() => { setActiveTab("categories"); setError(""); }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === "categories"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
          }`}
        >
          🏷️ Asset Categories
        </button>
        <button
          onClick={() => { setActiveTab("employees"); setError(""); }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === "employees"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
          }`}
        >
          👥 Employee Directory
        </button>
      </div>

      {loading && <div className="text-center py-10 text-gray-500 animate-pulse">Loading data from servers...</div>}

      {/* Tab A: Departments */}
      {!loading && activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Form Panel */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingDeptId ? "✏️ Edit Department" : "➕ Create Department"}
            </h2>
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Sales"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Parent Department (Optional)
                </label>
                <select
                  value={deptForm.parentId}
                  onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">None (Top-Level)</option>
                  {departments
                    .filter((d) => d.id !== editingDeptId) // Prevent self-referencing hierarchy
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Department Head / Manager
                </label>
                <select
                  value={deptForm.managerId}
                  onChange={(e) => setDeptForm({ ...deptForm, managerId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">No Manager Assigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={deptForm.status}
                  onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2 transition-colors text-sm"
                >
                  {editingDeptId ? "Save Changes" : "Create"}
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null);
                      setDeptForm({ name: "", parentId: "", managerId: "", status: "ACTIVE" });
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Department List Panel */}
          <div className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Corporate Hierarchy</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                  <th className="p-4">Name</th>
                  <th className="p-4">Manager</th>
                  <th className="p-4">Parent Dept</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No departments configured.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{dept.name}</td>
                      <td className="p-4 text-gray-700">
                        {dept.manager ? (
                          <span>👤 {dept.manager.name}</span>
                        ) : (
                          <span className="text-gray-500 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500">
                        {dept.parent ? dept.parent.name : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            dept.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-950/40 text-red-600 border border-red-200/40"
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditDept(dept)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleDeptStatus(dept)}
                          className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                        >
                          {dept.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab B: Asset Categories */}
      {!loading && activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Form Panel */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingCatId ? "🏷️ Edit Category" : "➕ Create Category"}
            </h2>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Laptops"
                />
              </div>

              {/* Dynamic Custom Fields Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Custom Attributes Schema
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAttr}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {catFields.map((field, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttr(idx)}
                        className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-600"
                      >
                        ✕
                      </button>
                      <div>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleAttrChange(idx, "name", e.target.value)}
                          placeholder="Attribute Name (e.g. RAM)"
                          required
                          className="w-full bg-white shadow-sm border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={field.type}
                          onChange={(e) => handleAttrChange(idx, "type", e.target.value)}
                          className="flex-1 bg-white shadow-sm border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Yes / No</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleAttrChange(idx, "required", e.target.checked)}
                            className="rounded border-gray-200 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-white shadow-sm"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))}
                  {catFields.length === 0 && (
                    <div className="text-center p-3 text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-lg">
                      No custom fields added yet. Default fields (Serial, Model, Name) are included automatically.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2 transition-colors text-sm"
                >
                  {editingCatId ? "Save Changes" : "Create"}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName("");
                      setCatFields([]);
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Category List Panel */}
          <div className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Asset Categories</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Custom Fields Schema</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      No asset categories defined.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    let fieldsArr: CustomField[] = [];
                    try {
                      fieldsArr = cat.fields ? JSON.parse(cat.fields) : [];
                    } catch (e) {}

                    return (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-semibold text-gray-900 vertical-align-top">{cat.name}</td>
                        <td className="p-4 text-gray-500 max-w-sm">
                          {fieldsArr.length === 0 ? (
                            <span className="text-gray-400 italic">None (only base attributes)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {fieldsArr.map((f, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-slate-700/50"
                                >
                                  {f.name} ({f.type})
                                  {f.required && <span className="text-red-600 ml-1 font-bold">*</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditCat(cat)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab C: Employee Directory */}
      {!loading && activeTab === "employees" && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Directory & Permissions Management</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role / Permissions</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No employees found in directory.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isEditing = editingEmpId === emp.id;
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{emp.name}</td>
                      <td className="p-4 text-gray-500">{emp.email}</td>
                      <td className="p-4 text-gray-700">
                        {isEditing ? (
                          <select
                            value={empForm.departmentId}
                            onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                          >
                            <option value="">No Department</option>
                            {deptOptions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        ) : emp.department ? (
                          <span>🏢 {emp.department.name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={empForm.role}
                            onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                          >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="DEPARTMENT_HEAD">Department Head</option>
                            <option value="ASSET_MANAGER">Asset Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-950/40 text-blue-300 border border-blue-800/40 font-medium">
                            {emp.role.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={empForm.status}
                            onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              emp.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-950/40 text-red-600 border border-red-200/40"
                            }`}
                          >
                            {emp.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEmp(emp.id)}
                              className="text-xs text-emerald-700 hover:text-emerald-300 font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEmpId(null)}
                              className="text-xs text-gray-500 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditEmp(emp)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


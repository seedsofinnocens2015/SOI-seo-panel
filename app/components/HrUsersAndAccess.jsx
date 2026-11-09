'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  fetchPanelUsers,
  createPanelMember,
  updatePanelUser,
  deletePanelUser,
} from '../../lib/panelUsersApi';
import { HR_NAV_ITEMS } from '../page';

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function HrUsersAndAccess({ currentUser }) {
  // Dynamically derive modules directly from whatever is in HR_NAV_ITEMS
  const dynamicModules = useMemo(() => {
    const items = Array.isArray(HR_NAV_ITEMS) ? HR_NAV_ITEMS : [];
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
    }));
  }, []);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check if current logged in user has 'full' access to users-access or is super admin
  const hasFullAccess = useMemo(() => {
    if (!currentUser) return false;
    const isSuper =
      currentUser.role === 'admin' ||
      currentUser.isAdministrator ||
      currentUser.email === 'amitkumaryadav8314@gmail.com';
    if (isSuper) return true;
    const level = currentUser.permissions?.['users-access'] || currentUser.permissions?.usersAccess;
    return level === 'full';
  }, [currentUser]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form Drawer / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form Fields
  const [loginId, setLoginId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [recruiter, setRecruiter] = useState('');
  const [workVisibility, setWorkVisibility] = useState(true);
  const [permissions, setPermissions] = useState({});

  // Initialize permissions dynamically based on active modules
  const createDefaultPermissions = (level = 'none') => {
    const map = {};
    dynamicModules.forEach((m) => {
      map[m.id] = m.id === 'dashboard' && level === 'none' ? 'view' : level;
    });
    return map;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPanelUsers('hr');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute recruiters list from active HR users and recruiters
  const recruiterOptions = useMemo(() => {
    const list = users
      .filter((u) => u.name || u.loginId)
      .map((u) => u.name || u.loginId);
    return Array.from(new Set(list)).filter(Boolean);
  }, [users]);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (u.loginId && u.loginId.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.recruiter && u.recruiter.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All' || (u.status || 'Active') === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  // Open "Add New User"
  const handleOpenAdd = () => {
    setEditingUser(null);
    setLoginId('');
    setName('');
    setEmail('');
    setPassword('');
    setStatus('Active');
    setCanManageTeam(false);
    setIsAdministrator(false);
    setRecruiter('');
    setWorkVisibility(true);
    setPermissions(createDefaultPermissions('none'));
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open "Edit User"
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setLoginId(user.loginId || '');
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword('');
    setStatus(user.status || 'Active');
    setCanManageTeam(Boolean(user.canManageTeam));
    setIsAdministrator(Boolean(user.isAdministrator));
    setRecruiter(user.recruiter || '');
    setWorkVisibility(Boolean(user.workVisibility));

    // Map existing permissions, fallback to 'none' (or 'full' if administrator) for newly added modules
    const currentPerms = user.permissions || {};
    const mapped = {};
    dynamicModules.forEach((m) => {
      if (user.isAdministrator) {
        mapped[m.id] = 'full';
      } else {
        mapped[m.id] = currentPerms[m.id] || (m.id === 'dashboard' ? 'view' : 'none');
      }
    });
    setPermissions(mapped);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick set helper
  const handleQuickSet = (level) => {
    const updated = {};
    dynamicModules.forEach((m) => {
      updated[m.id] = level;
    });
    setPermissions(updated);
  };

  // Permission changer
  const handlePermissionChange = (moduleId, level) => {
    setPermissions((prev) => ({ ...prev, [moduleId]: level }));
  };

  // Delete user
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      setSuccess('');
      await deletePanelUser(deleteTarget.id);
      setSuccess(`User "${deleteTarget.name || deleteTarget.loginId}" deleted successfully!`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Save (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setError('Login ID is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const submissionPerms = isAdministrator
        ? Object.fromEntries(dynamicModules.map((m) => [m.id, 'full']))
        : permissions;

      if (editingUser) {
        // Update existing user
        await updatePanelUser(editingUser.id, {
          loginId: loginId.trim(),
          name: name.trim() || loginId.trim(),
          email: email.trim(),
          status,
          canManageTeam,
          isAdministrator,
          recruiter: recruiter.trim(),
          workVisibility,
          permissions: submissionPerms,
          password: password.trim() ? password.trim() : undefined,
        });
        setSuccess(`User "${name || loginId}" access updated successfully!`);
      } else {
        // Create new user
        if (!password.trim() || password.length < 6) {
          setError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        await createPanelMember({
          loginId: loginId.trim(),
          name: name.trim() || loginId.trim(),
          password: password.trim(),
          options: {
            canManageTeam,
            isAdministrator,
          },
          recruiter: recruiter.trim(),
          workVisibility,
          permissions: submissionPerms,
        });
        setSuccess(`Team member "${loginId}" created successfully!`);
      }

      setIsFormOpen(false);
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header matching HR panel */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Role & Security Management
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Users & Access
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Create and manage logins for HR team members. Select module access levels: <span className="font-semibold text-zinc-700">View only</span>, <span className="font-semibold text-zinc-700">View + Add/Edit</span>, or <span className="font-semibold text-zinc-700">Full</span>. Setting <span className="font-bold text-red-600">No access</span> hides the module completely from their sidebar.
          </p>
        </div>
        <div className="flex flex-wrap w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#cc2627] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Team Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
        </div>
      ) : null}

      {/* Add / Edit Form Drawer Card */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">
                {editingUser ? 'Update Permissions' : 'New User Account'}
              </p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingUser ? `Edit User: ${name || loginId}` : 'Add New Team Member'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingUser(null); }}
              className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800"
              aria-label="Close form"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Row 1: Credentials */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Login ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. priya.hr"
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">
                  Password {editingUser ? <span className="text-zinc-400 font-normal">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'New password (optional)' : 'Password (min 6)'}
                    required={!editingUser}
                    minLength={6}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition whitespace-nowrap shadow-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Recruiter, Visibility, Status */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Recruiter Assignment</label>
                <select
                  value={recruiter}
                  onChange={(e) => setRecruiter(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select recruiter --</option>
                  {recruiterOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={workVisibility}
                    onChange={(e) => setWorkVisibility(e.target.checked)}
                    className="rounded border-zinc-300 text-[#cc2627] focus:ring-[#cc2627]"
                  />
                  <span>Show only requisitions & candidates assigned to this recruiter</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isAdministrator}
                    onChange={(e) => {
                      setIsAdministrator(e.target.checked);
                      if (e.target.checked) handleQuickSet('full');
                    }}
                    className="rounded border-zinc-300 text-[#cc2627] focus:ring-[#cc2627]"
                  />
                  <span>Administrator (Full access to all modules)</span>
                </label>
              </div>
            </div>

            {/* Row 3: Module Access Matrix (Automatically includes all sidebar pages) */}
            <div className="pt-4 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#cc2627]">Module Access Matrix</h4>
                  <p className="text-xs font-medium text-zinc-500">
                    All current and future sidebar modules automatically appear here. Choose level for each module.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-zinc-600 mr-1">Quick Set:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSet('none')}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-sm"
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSet('view')}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-sm"
                  >
                    All View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSet('addEdit')}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-sm"
                  >
                    All Add/Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSet('full')}
                    className="rounded-lg border border-[#cc2627]/30 bg-[#cc2627]/10 px-3 py-1 text-xs font-bold text-[#cc2627] hover:bg-[#cc2627]/20 transition shadow-sm"
                  >
                    All Full
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100/80 text-zinc-700 font-bold border-b border-zinc-200">
                      <th className="py-3 px-4 w-1/3">Sidebar Module</th>
                      <th className="py-3 px-4 text-center">No access</th>
                      <th className="py-3 px-4 text-center">View only</th>
                      <th className="py-3 px-4 text-center">View + Add/Edit</th>
                      <th className="py-3 px-4 text-center">Full (incl. delete)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70">
                    {dynamicModules.map((mod) => {
                      const currentVal = permissions[mod.id] || 'none';
                      return (
                        <tr key={mod.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-zinc-800 flex items-center gap-2">
                            <span className="text-[#cc2627] opacity-80">{mod.icon}</span>
                            <span>{mod.label}</span>
                          </td>
                          {/* No access */}
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`perm_${mod.id}`}
                              checked={currentVal === 'none'}
                              onChange={() => handlePermissionChange(mod.id, 'none')}
                              className="cursor-pointer text-[#cc2627] focus:ring-[#cc2627]"
                            />
                          </td>
                          {/* View only */}
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`perm_${mod.id}`}
                              checked={currentVal === 'view'}
                              onChange={() => handlePermissionChange(mod.id, 'view')}
                              className="cursor-pointer text-[#cc2627] focus:ring-[#cc2627]"
                            />
                          </td>
                          {/* View + Add/Edit */}
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`perm_${mod.id}`}
                              checked={currentVal === 'addEdit'}
                              onChange={() => handlePermissionChange(mod.id, 'addEdit')}
                              className="cursor-pointer text-[#cc2627] focus:ring-[#cc2627]"
                            />
                          </td>
                          {/* Full */}
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`perm_${mod.id}`}
                              checked={currentVal === 'full'}
                              onChange={() => handlePermissionChange(mod.id, 'full')}
                              className="cursor-pointer text-[#cc2627] focus:ring-[#cc2627]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingUser(null); }}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-6 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingUser ? 'Update User Access' : 'Create Team Member'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Toolbar matching HR panel */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
            >
              ✕
            </button>
          ) : null}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={loadData}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          Refresh
        </button>
      </div>

      {/* Main Table Card matching HR panel style */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 text-zinc-700 font-bold border-b border-zinc-200/80">
                <th className="py-3.5 px-4 whitespace-nowrap">Login ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap">User Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Recruiter / Visibility</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Module Access</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Added By</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm font-medium text-zinc-400">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm font-medium text-zinc-400">No HR users found.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isProtected = u.isAdministrator || u.loginId === 'admin' || u.email === 'amitkumaryadav8314@gmail.com';
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{u.loginId}</td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800">{u.name || '-'}</td>
                      <td className="py-3.5 px-4 font-medium text-zinc-600">
                        {u.userType || (isProtected ? 'Administrator' : 'Team Member')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {u.recruiter ? (
                          <span className="font-medium text-zinc-700">
                            {u.recruiter} <span className="text-[11px] text-zinc-500 font-normal">{u.workVisibility ? '(Own work only)' : '(All work)'}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isProtected ? (
                          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                            Full Access
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1679b9] border border-blue-200">
                            Custom Access
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {isProtected ? <span className="italic text-zinc-400">Protected</span> : (u.addedBy || 'Administrator')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-[#cc2627] hover:text-white hover:border-[#cc2627] transition shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Access
                          </button>

                          {hasFullAccess && !isProtected && u.id !== currentUser?.id ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition shadow-sm"
                              title="Delete user account"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-3 text-xs font-semibold text-zinc-500 flex items-center justify-between">
          <span>{filteredUsers.length} user(s) displayed</span>
          <span>Role & Security Management</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 text-red-600">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">Delete User Account</h3>
                <p className="text-xs text-zinc-500 font-semibold">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Are you sure you want to permanently delete user <span className="font-bold text-zinc-900">{deleteTarget.name || deleteTarget.loginId}</span> ({deleteTarget.loginId})? They will immediately lose all access to the panel.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

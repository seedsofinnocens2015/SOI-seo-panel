'use client';

import { useEffect, useState } from 'react';
import { deletePanelUser, fetchPanelUsers, updatePanelUser } from '../../lib/panelUsersApi';

function getInitials(name = '') {
  return String(name || 'User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'U';
}

export default function PanelUsers({ panelRole, currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const panelLabel = panelRole === 'hr' ? 'HR' : 'SEO';
  const isFullAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchPanelUsers(panelRole)
      .then((rows) => {
        if (!cancelled) setUsers(rows.filter((user) => user.role !== 'admin'));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Unable to load panel users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panelRole]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      if (deleteConfirmation && !deletingId) {
        setDeleteConfirmation(null);
        return;
      }
      if (!deleteConfirmation) onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [deleteConfirmation, deletingId, onClose]);

  function startEditing(user) {
    setEditingUser(user);
    setEditForm({ name: user.name || '', email: user.email || '', password: '' });
    setShowPassword(false);
    setError('');
    setSuccess('');
  }

  function cancelEditing() {
    setEditingUser(null);
    setEditForm({ name: '', email: '', password: '' });
    setShowPassword(false);
    setError('');
  }

  async function handleUpdateUser(event) {
    event.preventDefault();
    if (!editingUser || saving) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updatedUser = await updatePanelUser(editingUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        password: editForm.password,
      });
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === editingUser.id ? { ...user, ...updatedUser } : user
      )));
      setEditingUser(null);
      setEditForm({ name: '', email: '', password: '' });
      setShowPassword(false);
      setSuccess(`${updatedUser.name || 'User'} details updated successfully.`);
    } catch (updateError) {
      setError(updateError.message || 'Unable to update panel user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteConfirmation || deletingId) return;
    const userToDelete = deleteConfirmation;
    setDeletingId(userToDelete.id);
    setError('');
    setSuccess('');
    try {
      await deletePanelUser(userToDelete.id);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userToDelete.id));
      setDeleteConfirmation(null);
      setSuccess(`${userToDelete.name || 'User'} deleted successfully.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete panel user');
      setDeleteConfirmation(null);
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-2 backdrop-blur-[2px] sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="panel-users-title" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[82vh] sm:rounded-3xl">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2EA6F7]">Access Directory</p>
          <h2 id="panel-users-title" className="mt-1 text-xl font-bold text-zinc-900">{panelLabel} Panel Users</h2>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{editingUser ? `Update ${panelLabel} user details.` : 'Registered users who have access to this workspace.'}</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error ? <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1679b9] sm:inline-flex">{users.length} users</span> : null}
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100" aria-label="Close panel users">✕</button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {success ? <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}

      {editingUser && isFullAdmin ? (
        <form onSubmit={handleUpdateUser} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2EA6F7] to-[#1c7fbe] text-sm font-extrabold text-white">{getInitials(editingUser.name)}</div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900">Edit panel user</p>
              <p className="truncate text-xs text-zinc-500">{editingUser.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700">
              Name
              <input
                type="text"
                value={editForm.name}
                onChange={(event) => setEditForm((form) => ({ ...form, name: event.target.value }))}
                required
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Email address
              <input
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm((form) => ({ ...form, email: event.target.value }))}
                required
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-zinc-700">
            New password <span className="font-normal text-zinc-500">(optional)</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={editForm.password}
                onChange={(event) => setEditForm((form) => ({ ...form, password: event.target.value }))}
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Leave blank to keep the current password"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 pr-16 font-normal text-zinc-900 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 text-xs font-bold text-[#1679b9]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <span className="mt-1.5 block text-xs font-normal text-zinc-500">Use at least 10 characters. The current password is never shown.</span>
          </label>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={cancelEditing} disabled={saving} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 sm:w-auto">Cancel</button>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#1679b9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#126ca5] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      ) : loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading panel users...</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="font-bold text-zinc-800">No registered users found</p>
          <p className="mt-1 text-sm text-zinc-500">Users will appear here after completing signup.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((user) => {
            const isCurrentUser = String(user.email || '').toLowerCase() === String(currentUser?.email || '').toLowerCase();
            return (
              <article key={user.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2EA6F7] to-[#1c7fbe] text-sm font-extrabold text-white">{getInitials(user.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold text-zinc-900">{user.name || 'Unnamed User'}</h3>
                      {isCurrentUser ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">You</span> : null}
                    </div>
                    <a href={`mailto:${user.email}`} className="mt-1 block break-all text-sm text-[#1679b9] hover:underline">{user.email}</a>
                  </div>
                </div>
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">{panelLabel} User</span>
                    {isFullAdmin ? (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEditing(user)} className="rounded-lg border border-[#2EA6F7]/30 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1679b9] transition hover:bg-blue-100">Edit</button>
                        <button type="button" onClick={() => { setDeleteConfirmation(user); setError(''); setSuccess(''); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100">Delete</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>
      </div>
      {deleteConfirmation ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setDeleteConfirmation(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-panel-user-title" aria-describedby="delete-panel-user-description" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-black text-red-600" aria-hidden="true">!</div>
            <h3 id="delete-panel-user-title" className="mt-4 text-xl font-bold text-zinc-900">Delete this panel user?</h3>
            <p id="delete-panel-user-description" className="mt-2 text-sm leading-6 text-zinc-600">
              <strong className="text-zinc-900">{deleteConfirmation.name || 'This user'}</strong> ({deleteConfirmation.email}) will permanently lose access to the {panelLabel} Panel.
            </p>
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">This action cannot be undone.</div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button type="button" autoFocus disabled={Boolean(deletingId)} onClick={() => setDeleteConfirmation(null)} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 sm:w-auto">Cancel</button>
              <button type="button" disabled={Boolean(deletingId)} onClick={handleDeleteUser} className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto">{deletingId ? 'Deleting...' : 'Confirm Delete'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

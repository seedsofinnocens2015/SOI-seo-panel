'use client';

import { useMaster } from '../context/MasterContext';

import { useEffect, useState, useMemo } from 'react';
import {
  fetchFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../../lib/recruitmentFollowUpApi';
import { fetchCandidates } from '../../lib/candidateMasterApi';

function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const MODES = [];
const STATUSES = [];

export default function HrRecruitmentFollowUp({ currentUser }) {
  const { getDropdown } = useMaster();
  const masterModes = getDropdown('follow_up_mode');
  const masterStatuses = getDropdown('follow_up_status');
  const masterRecruiters = getDropdown('recruiters');
  const masterCentres = getDropdown('centres');
  const [records, setRecords] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('All centres');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    followUpDate: formatDateForInput(new Date()),
    candidateId: '',
    recruiter: '',
    mode: 'Call',
    discussionOutcome: '',
    nextFollowUpDate: '',
    followUpStatus: 'Open',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check delete access (Full permission on recruitment-followup or super admin)
  const canDelete = useMemo(() => {
    if (!currentUser) return false;
    const isSuper =
      currentUser.role === 'admin' ||
      currentUser.isAdministrator ||
      currentUser.email === 'amitkumaryadav8314@gmail.com';
    if (isSuper) return true;
    const lvl = currentUser.permissions?.['recruitment-followup'] || currentUser.permissions?.recruitmentFollowUp;
    return lvl === 'full';
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [followUpsData, candidatesRes] = await Promise.all([
        fetchFollowUps({ search, centre: selectedCentre }),
        fetchCandidates().catch(() => []),
      ]);
      setRecords(Array.isArray(followUpsData) ? followUpsData : []);
      const cList = Array.isArray(candidatesRes)
        ? candidatesRes
        : Array.isArray(candidatesRes?.data)
        ? candidatesRes.data
        : [];
      setCandidates(cList);
    } catch (err) {
      setError(err.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCentre]);

  // Unique Centres for filter dropdown
  const allAvailableCentres = useMemo(() => {
    const fromRecords = records.map((r) => r.centre).filter(Boolean);
    const fromCandidates = (Array.isArray(candidates) ? candidates : []).map((c) => c?.centre).filter(Boolean);
    return Array.from(new Set([...fromRecords, ...fromCandidates]));
  }, [records, candidates]);

  // Recruiters list from candidates + users
  const recruiterOptions = useMemo(() => {
    const list = (Array.isArray(candidates) ? candidates : []).map((c) => c?.recruiter).filter(Boolean);
    (masterRecruiters || []).forEach((r) => list.push(r));
    return Array.from(new Set(list));
  }, [candidates, masterRecruiters]);

  // Open "Add New"
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      followUpDate: formatDateForInput(new Date()),
      candidateId: '',
      recruiter: '',
      mode: 'Call',
      discussionOutcome: '',
      nextFollowUpDate: '',
      followUpStatus: 'Open',
      remarks: '',
    });
    setIsFormOpen(true);
  };

  // Open "Edit"
  const handleOpenEdit = (item) => {
    setEditingId(item._id || item.id);
    setFormData({
      followUpDate: formatDateForInput(item.followUpDate),
      candidateId: item.candidateId?._id || item.candidateId || '',
      recruiter: item.recruiter || '',
      mode: item.mode || 'Call',
      discussionOutcome: item.discussionOutcome || '',
      nextFollowUpDate: formatDateForInput(item.nextFollowUpDate),
      followUpStatus: item.followUpStatus || 'Open',
      remarks: item.remarks || '',
    });
    setIsFormOpen(true);
  };

  // Auto-fill recruiter when selecting candidate
  const handleCandidateChange = (candId) => {
    const cand = (Array.isArray(candidates) ? candidates : []).find((c) => String(c?.id || c?._id) === String(candId));
    setFormData((prev) => ({
      ...prev,
      candidateId: candId,
      recruiter: cand?.recruiter || prev.recruiter,
    }));
  };

  // Save Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.candidateId) {
      setError('Please select a candidate');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingId) {
        await updateFollowUp(editingId, formData);
        setSuccess('Follow-up updated successfully!');
      } else {
        await createFollowUp(formData);
        setSuccess('Follow-up logged successfully!');
      }

      setIsFormOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await deleteFollowUp(deleteTarget._id || deleteTarget.id);
      setSuccess('Follow-up deleted successfully!');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete follow-up');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header matching HR panel */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Candidate Relationship & Engagement
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Recruitment Follow-up
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Log every call / email / WhatsApp. Open + Next Follow-up Date gives <span className="font-semibold text-amber-600">Due Today</span> / <span className="font-semibold text-red-600">Overdue</span> alerts automatically.
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
            Add New
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

      {/* Filter Toolbar */}
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
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Search follow-ups..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => { setSearch(''); }}
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
            >
              ✕
            </button>
          ) : null}
        </div>

        <select
          value={selectedCentre}
          onChange={(e) => setSelectedCentre(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
        >
          <option value="All centres">All centres</option>
          {allAvailableCentres.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadData}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          Filter
        </button>
      </div>

      {/* Add / Edit Form Card matching HR style */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Follow-up Entry</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Edit Follow-up Record' : 'Log New Follow-up'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingId(null); }}
              className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800"
              aria-label="Close form"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Top Row: Follow-up Date, Candidate, Recruiter, Mode */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-bold text-zinc-700">Follow-up Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Candidate <span className="text-red-500">*</span></label>
                <select
                  value={formData.candidateId}
                  onChange={(e) => handleCandidateChange(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {(Array.isArray(candidates) ? candidates : []).map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.candidateId ? `${c.candidateId} - ` : ''}{c.candidateName} {c.designation ? `(${c.designation})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Recruiter</label>
                <select
                  value={formData.recruiter}
                  onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {recruiterOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {(masterModes.length > 0 ? masterModes : []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Middle Row: Discussion / Outcome */}
            <div>
              <label className="text-xs font-bold text-zinc-700">Discussion / Outcome</label>
              <textarea
                rows={3}
                value={formData.discussionOutcome}
                onChange={(e) => setFormData({ ...formData, discussionOutcome: e.target.value })}
                placeholder="Log discussion notes, key questions, feedback, or next expectations..."
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
              />
            </div>

            {/* Bottom Row: Next Follow-up Date, Follow-up Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-zinc-700">Next Follow-up Date</label>
                <input
                  type="date"
                  value={formData.nextFollowUpDate}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Follow-up Status</label>
                <select
                  value={formData.followUpStatus}
                  onChange={(e) => setFormData({ ...formData, followUpStatus: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#cc2627] focus:bg-white focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {(masterStatuses.length > 0 ? masterStatuses : []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-6 py-2.5 text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Record' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Records Table Card matching HR panel style */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5 whitespace-nowrap">Follow-up Date</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate Name</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Company</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Recruiter</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Mode</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Discussion / Outcome</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Next Follow-up Date</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Follow-up Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Alert</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading follow-ups...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 px-4 text-center text-zinc-400 font-medium">
                    No records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  return (
                    <tr key={r._id || r.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap font-medium">
                        {formatDateDisplay(r.followUpDate)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                        {r.candidateCode || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">
                        {r.candidateName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap font-medium">
                        {r.company || 'Seeds of Innocence'}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">
                        {r.centre || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">
                        {r.recruiter || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-700">
                          {r.mode || 'Call'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 max-w-xs truncate" title={r.discussionOutcome}>
                        {r.discussionOutcome || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap font-medium">
                        {formatDateDisplay(r.nextFollowUpDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          r.followUpStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : r.followUpStatus === 'Cancelled'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : r.followUpStatus === 'Closed'
                            ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            : 'bg-blue-100 text-[#1679b9] border border-blue-200'
                        }`}>
                          {r.followUpStatus || 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.alert === 'Overdue' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                            Overdue
                          </span>
                        ) : r.alert === 'Due Today' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Due Today
                          </span>
                        ) : r.alert && r.alert !== '-' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {r.alert}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-[#cc2627] hover:text-white hover:border-[#cc2627] transition shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(r)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition shadow-sm"
                              title="Delete follow-up record"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}
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
          <span>{records.length} record(s) · Page 1 of 1</span>
          <span>Recruitment Follow-up</span>
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
                <h3 className="text-lg font-black text-zinc-900">Delete Follow-up</h3>
                <p className="text-xs text-zinc-500 font-semibold">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Are you sure you want to permanently delete follow-up entry for <span className="font-bold text-zinc-900">{deleteTarget.candidateName}</span> ({deleteTarget.candidateCode || 'No Code'})?
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
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMaster } from '../context/MasterContext';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
} from '../../lib/onboardingChecklistApi';
import { fetchCandidates } from '../../lib/candidateMasterApi';

const DEFAULT_CENTRES = [];

const CHECKLIST_FIELDS = [
  { key: 'offerLetterSigned', label: 'Offer Letter Signed' },
  { key: 'idProofAadhaar', label: 'ID Proof (Aadhaar)' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'addressProof', label: 'Address Proof' },
  { key: 'educationCertificates', label: 'Education Certificates' },
  { key: 'experienceRelievingLetter', label: 'Experience / Relieving Letter' },
  { key: 'passportPhotos', label: 'Passport Photos' },
  { key: 'bankDetails', label: 'Bank Details' },
  { key: 'employeeIdCreated', label: 'Employee ID Created' },
  { key: 'emailSystemAccess', label: 'Email / System Access' },
  { key: 'inductionCompleted', label: 'Induction Completed' },
];

function formatDateDisplay(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function HrOnboardingChecklist() {
  const { getDropdown } = useMaster();
  const masterCentres = getDropdown('centres');
  const masterChecklistStatuses = getDropdown('checklist_status');
  const [checklists, setChecklists] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('All centres');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [itemsState, setItemsState] = useState({});
  const [remarks, setRemarks] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [checklistsRes, candidatesRes] = await Promise.all([
        fetchChecklists({
          search: search.trim() || undefined,
          centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
        }),
        fetchCandidates(),
      ]);
      setChecklists(Array.isArray(checklistsRes?.data) ? checklistsRes.data : []);
      setCandidates(Array.isArray(candidatesRes?.data) ? candidatesRes.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load checklists');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCentre]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allAvailableCentres = useMemo(() => {
    const set = new Set(DEFAULT_CENTRES);
    checklists.forEach((c) => {
      if (c.centre) set.add(c.centre);
    });
    candidates.forEach((c) => {
      if (c.centre) set.add(c.centre);
    });
    return Array.from(set);
  }, [checklists, candidates]);

  function handleOpenNew() {
    setError('');
    setSuccess('');
    setEditingId(null);
    setSelectedCandidateId(candidates[0]?._id || '');
    setRemarks('');
    const initialItems = {};
    CHECKLIST_FIELDS.forEach((f) => {
      initialItems[f.key] = { status: 'Pending', notApplicable: false };
    });
    setItemsState(initialItems);
    setIsFormOpen(true);
  }

  function handleEdit(doc) {
    setError('');
    setSuccess('');
    setEditingId(doc._id);
    setSelectedCandidateId(doc.candidateId?._id || doc.candidateId || '');
    setRemarks(doc.remarks || '');
    const currentItems = {};
    CHECKLIST_FIELDS.forEach((f) => {
      currentItems[f.key] = {
        status: doc[f.key]?.status || 'Pending',
        notApplicable: Boolean(doc[f.key]?.notApplicable),
      };
    });
    setItemsState(currentItems);
    setIsFormOpen(true);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete onboarding checklist for “${name || 'this candidate'}”?`)) return;
    try {
      await deleteChecklist(id);
      setSuccess('Checklist deleted.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete checklist');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCandidateId) {
      setError('Please select a candidate.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      candidateId: selectedCandidateId,
      remarks,
      ...itemsState,
    };

    try {
      if (editingId) {
        await updateChecklist(editingId, payload);
        setSuccess('Checklist updated successfully.');
      } else {
        await createChecklist(payload);
        setSuccess('Checklist created successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  }

  const renderStatusBadge = (item) => {
    if (!item || item.notApplicable || item.status === 'NA') {
      return <span className="text-zinc-400 font-mono text-[10px]">N/A</span>;
    }
    if (item.status === 'Yes') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Yes
        </span>
      );
    }
    if (item.status === 'No') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          No
        </span>
      );
    }
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Pending
      </span>
    );
  };

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Documentation & Setup
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Onboarding Checklist
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">
            Select Yes / Pending / No / NA for each item. Completion % is automatic.
          </p>
        </div>
        <div className="flex flex-wrap w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#cc2627] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Add New
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 flex items-center justify-between shadow-sm">
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
            placeholder="Search candidate, centre..."
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

      {/* Add / Edit Form Modal Card (Screenshot 2 Match) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Checklist Items</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Edit Onboarding Checklist' : 'New Onboarding Checklist'}
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
            {/* Candidate Selector */}
            <div className="max-w-md">
              <label className="text-xs font-bold text-zinc-700">Candidate *</label>
              <select
                required
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
              >
                <option value="">-- select --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.candidateId ? `${c.candidateId} - ` : ''}{c.candidateName} ({c.centre || 'No Centre'})
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist Checkboxes Grid (Exact layout from Screenshot 2) */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-t border-b border-zinc-100 py-6">
              {CHECKLIST_FIELDS.map((f) => {
                const current = itemsState[f.key] || { status: 'Pending', notApplicable: false };
                const isChecked = current.status === 'Yes';
                const isNA = Boolean(current.notApplicable);

                return (
                  <div key={f.key} className="flex flex-col gap-1.5 p-2 rounded-xl bg-zinc-50/50 border border-zinc-100">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isNA}
                        checked={isChecked}
                        onChange={(e) => {
                          setItemsState((prev) => ({
                            ...prev,
                            [f.key]: {
                              ...prev[f.key],
                              status: e.target.checked ? 'Yes' : 'Pending',
                            },
                          }));
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#cc2627] focus:ring-0 disabled:opacity-30"
                      />
                      <span className={`text-xs font-semibold ${isNA ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                        {f.label}
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 pl-6 text-[10px] font-medium text-zinc-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isNA}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setItemsState((prev) => ({
                            ...prev,
                            [f.key]: {
                              status: val ? 'NA' : 'Pending',
                              notApplicable: val,
                            },
                          }));
                        }}
                        className="h-3 w-3 rounded border-zinc-300 text-zinc-600 focus:ring-0"
                      />
                      <span>Not applicable</span>
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Remarks */}
            <div>
              <label className="text-xs font-bold text-zinc-700">Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Missing documents deadline, verification remarks..."
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium leading-relaxed text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingId(null); }}
              className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-xl bg-[#cc2627] px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingId ? 'Update Checklist' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Main Table Container (Screenshot 1 Match) */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3.5 whitespace-nowrap">Candidate</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Candidate Name</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Company</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Actual DOJ</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Offer Signed</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">ID Proof</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">PAN Card</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Address Proof</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Education</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Exp / Relieving</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Photos</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Bank Details</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Emp ID</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Email/System</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Induction</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Done</th>
                <th className="px-3 py-3.5 whitespace-nowrap text-center">Applicable</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Completion %</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Onboarding Status</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Remarks</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={22} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading checklists...</span>
                    </div>
                  </td>
                </tr>
              ) : checklists.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-12 px-4 text-center text-zinc-400 font-medium">
                    No records yet.
                  </td>
                </tr>
              ) : (
                checklists.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                      {item.candidateIdStr || item.candidateId?.candidateId || '-'}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-zinc-900 whitespace-nowrap">
                      {item.candidateName}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 whitespace-nowrap font-medium">{item.company}</td>
                    <td className="px-3.5 py-3 text-zinc-900 font-bold whitespace-nowrap">{item.centre || '-'}</td>
                    <td className="px-3.5 py-3 text-center text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(item.actualDoj)}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.offerLetterSigned)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.idProofAadhaar)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.panCard)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.addressProof)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.educationCertificates)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.experienceRelievingLetter)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.passportPhotos)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.bankDetails)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.employeeIdCreated)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.emailSystemAccess)}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{renderStatusBadge(item.inductionCompleted)}</td>

                    <td className="px-3 py-3 text-center font-bold text-emerald-600 whitespace-nowrap">{item.done ?? 0}</td>
                    <td className="px-3 py-3 text-center font-medium text-zinc-600 whitespace-nowrap">{item.applicable ?? 11}</td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-zinc-800 text-[11px]">{item.completionPct ?? 0}%</span>
                        <div className="w-12 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              item.completionPct === 100
                                ? 'bg-emerald-500'
                                : item.completionPct > 50
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.completionPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.onboardingStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.onboardingStatus === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {item.onboardingStatus || 'In Progress'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-500 max-w-xs truncate" title={item.remarks}>
                      {item.remarks || '-'}
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 transition hover:bg-[#cc2627]/10 hover:text-[#cc2627]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id, item.candidateName)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 text-xs font-semibold text-zinc-500">
          <span>{checklists.length} record(s)</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

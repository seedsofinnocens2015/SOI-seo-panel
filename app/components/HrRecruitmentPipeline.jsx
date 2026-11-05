'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRecruitmentPipeline,
  createPipelineEntry,
  updatePipelineEntry,
  deletePipelineEntry,
} from '../../lib/recruitmentPipelineApi';
import { fetchCandidates } from '../../lib/candidateMasterApi';

const DEFAULT_CENTRES = [
  'Malviya Nagar (Delhi)',
  'Jasola (Delhi)',
  'Janakpuri (Delhi)',
  'Ghaziabad (UP)',
  'Noida (UP)',
  'Faridabad (Haryana)',
  'Gurugram (Haryana)',
  'Meerut (UP)',
  'Patna (Bihar)',
  'Ranchi (Jharkhand)',
  'Lucknow (UP)',
  'Varanasi (UP)',
  'Kanpur (UP)',
  'Prayagraj (UP)',
  'Bhubaneswar (Odisha)',
  'Srinagar (J&K)',
  'Agra (UP)',
  'Bareilly (UP)',
  'Corporate Office',
];

const DEFAULT_STAGES = [
  'Sourced',
  'Screening',
  'L1 Interview',
  'L2 Interview',
  'HR Round',
  'Offer Stage',
  'Joined',
  'Rejected',
  'On Hold',
];

const STAGE_STATUS_MAP = {
  Sourced: 'Active',
  Screening: 'Active',
  'L1 Interview': 'Active',
  'L2 Interview': 'Active',
  'HR Round': 'Active',
  'Offer Stage': 'Offer Released',
  Joined: 'Joined',
  Rejected: 'Rejected',
  'On Hold': 'On Hold',
};

function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateVal) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function HrRecruitmentPipeline() {
  const [pipeline, setPipeline] = useState([]);
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

  // Form Fields (Screenshot 2 Match)
  const [formData, setFormData] = useState({
    candidateId: '',
    currentStage: 'Sourced',
    stageDate: formatDateForInput(new Date()),
    nextAction: '',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pipelineRes, candidatesRes] = await Promise.all([
        fetchRecruitmentPipeline({
          search: search.trim() || undefined,
          centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
        }),
        fetchCandidates(),
      ]);
      setPipeline(Array.isArray(pipelineRes?.data) ? pipelineRes.data : []);
      setCandidates(Array.isArray(candidatesRes?.data) ? candidatesRes.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load recruitment pipeline');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCentre]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allAvailableCentres = useMemo(() => {
    const set = new Set(DEFAULT_CENTRES);
    pipeline.forEach((p) => {
      if (p.centre) set.add(p.centre);
    });
    return Array.from(set);
  }, [pipeline]);

  function handleOpenNew() {
    setError('');
    setSuccess('');
    setEditingId(null);
    setFormData({
      candidateId: candidates[0]?._id || '',
      currentStage: 'Sourced',
      stageDate: formatDateForInput(new Date()),
      nextAction: '',
      remarks: '',
    });
    setIsFormOpen(true);
  }

  function handleEdit(item) {
    setError('');
    setSuccess('');
    setEditingId(item._id);
    setFormData({
      candidateId: item.candidateId?._id || item.candidateId || '',
      currentStage: item.currentStage || 'Sourced',
      stageDate: formatDateForInput(item.stageDate),
      nextAction: item.nextAction || '',
      remarks: item.remarks || '',
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete pipeline record for “${name || 'this candidate'}”?`)) return;
    try {
      await deletePipelineEntry(id);
      setSuccess('Pipeline entry deleted successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete pipeline entry');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.candidateId) {
      setError('Please select a candidate.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updatePipelineEntry(editingId, formData);
        setSuccess('Pipeline entry updated successfully.');
      } else {
        await createPipelineEntry(formData);
        setSuccess('Pipeline entry created successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save pipeline entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Matching HR Panel */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Hiring Workflow
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Recruitment Pipeline
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">
            Update Current Stage + Stage Date as the candidate moves. Status comes from the stage table in Settings.
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
             Add New
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
            placeholder="Search candidate, stage, centre..."
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Pipeline Stage Movement</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Update Pipeline Entry' : 'Add Candidate to Pipeline'}
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
            {/* Row 1 - Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-bold text-zinc-700">Candidate *</label>
                <select
                  required
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {candidates.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.candidateId ? `${c.candidateId} - ` : ''}{c.candidateName} ({c.designation || 'No Role'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Current Stage *</label>
                <select
                  required
                  value={formData.currentStage}
                  onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {DEFAULT_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Stage Date</label>
                <input
                  type="date"
                  value={formData.stageDate}
                  onChange={(e) => setFormData({ ...formData, stageDate: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Next Action</label>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  placeholder="e.g. Schedule L2 Interview / Collect docs"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>
            </div>

            {/* Row 2 - Remarks */}
            <div>
              <label className="text-xs font-bold text-zinc-700">Remarks</label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Stage notes, interviewer feedback, status comments..."
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
              {saving ? 'Saving...' : editingId ? 'Update Pipeline' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Main Table Container (Screenshot 1 Match) */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate Name</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Company</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Designation</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Recruiter</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Source</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Current Stage</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Stage Date</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Days in Pipeline</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Pipeline Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Next Action</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Remarks</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading pipeline...</span>
                    </div>
                  </td>
                </tr>
              ) : pipeline.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 px-4 text-center text-zinc-400 font-medium">
                    No records yet.
                  </td>
                </tr>
              ) : (
                pipeline.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                      {item.candidateIdStr || item.candidateId?.candidateId || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">
                      {item.candidateName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{item.company}</td>
                    <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">{item.centre || '-'}</td>
                    <td className="px-4 py-3 text-zinc-900 whitespace-nowrap font-semibold">
                      {item.designation || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{item.recruiter || '-'}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{item.source || '-'}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {item.currentStage || 'Sourced'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(item.stageDate)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-zinc-700 whitespace-nowrap">
                      {item.daysInPipeline ?? 0} d
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.pipelineStatus === 'Joined'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.pipelineStatus === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : item.pipelineStatus === 'Offer Released'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.pipelineStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">
                      {item.nextAction || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={item.remarks}>
                      {item.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
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

        {/* Footer Info */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 text-xs font-semibold text-zinc-500">
          <span>{pipeline.length} record(s)</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

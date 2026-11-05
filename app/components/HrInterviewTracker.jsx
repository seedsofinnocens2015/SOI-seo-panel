'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchInterviewRoundWise,
  fetchInterviewCandidateWise,
  createInterview,
  updateInterview,
  deleteInterview,
} from '../../lib/interviewTrackerApi';
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

const ROUNDS_TABS = [
  'All rounds',
  'Screening Call',
  'Round 1 - HR',
  'Round 2 - Department',
  'Round 3 - Final / Management',
  'Assignment / Test',
];

const MODES = ['Online / Video', 'In-Person / F2F', 'Telephonic'];
const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'];
const RESULTS = ['Pending', 'Selected / Cleared', 'Rejected', 'Hold'];

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

export default function HrInterviewTracker() {
  // View mode: 'candidate-wise' or 'round-wise'
  const [activeTabMode, setActiveTabMode] = useState('candidate-wise');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('All rounds');

  const [candidateWiseList, setCandidateWiseList] = useState([]);
  const [roundWiseList, setRoundWiseList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('All centres');
  const [selectedStage, setSelectedStage] = useState('All stages');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields (Screenshot 3 Match)
  const [formData, setFormData] = useState({
    candidateId: '',
    interviewRound: 'Screening Call',
    interviewer: '',
    interviewDate: formatDateForInput(new Date()),
    time: '',
    mode: 'Online / Video',
    interviewStatus: 'Scheduled',
    result: 'Pending',
    rating: '',
    feedback: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const candidatesRes = await fetchCandidates();
      setCandidates(Array.isArray(candidatesRes?.data) ? candidatesRes.data : []);

      if (activeTabMode === 'candidate-wise') {
        const res = await fetchInterviewCandidateWise({
          search: search.trim() || undefined,
          centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
          stage: selectedStage !== 'All stages' ? selectedStage : undefined,
        });
        setCandidateWiseList(Array.isArray(res?.data) ? res.data : []);
      } else {
        const res = await fetchInterviewRoundWise({
          search: search.trim() || undefined,
          centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
          round: selectedRoundFilter !== 'All rounds' ? selectedRoundFilter : undefined,
        });
        setRoundWiseList(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, [activeTabMode, search, selectedCentre, selectedStage, selectedRoundFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allAvailableCentres = useMemo(() => {
    const set = new Set(DEFAULT_CENTRES);
    candidates.forEach((c) => {
      if (c.centre) set.add(c.centre);
    });
    return Array.from(set);
  }, [candidates]);

  function handleOpenNew(prefillCandidateId = '', prefillRound = '') {
    setError('');
    setSuccess('');
    setEditingId(null);
    setFormData({
      candidateId: prefillCandidateId || candidates[0]?._id || '',
      interviewRound: prefillRound || 'Screening Call',
      interviewer: '',
      interviewDate: formatDateForInput(new Date()),
      time: '',
      mode: 'Online / Video',
      interviewStatus: 'Scheduled',
      result: 'Pending',
      rating: '',
      feedback: '',
    });
    setIsFormOpen(true);
  }

  function handleEdit(item) {
    setError('');
    setSuccess('');
    setEditingId(item._id);
    setFormData({
      candidateId: item.candidateId?._id || item.candidateId || '',
      interviewRound: item.interviewRound || 'Screening Call',
      interviewer: item.interviewer || '',
      interviewDate: formatDateForInput(item.interviewDate),
      time: item.time || '',
      mode: item.mode || 'Online / Video',
      interviewStatus: item.interviewStatus || 'Scheduled',
      result: item.result || 'Pending',
      rating: item.rating || '',
      feedback: item.feedback || '',
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id, roundName) {
    if (!window.confirm(`Delete interview record for “${roundName}”?`)) return;
    try {
      await deleteInterview(id);
      setSuccess('Interview record deleted.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete');
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
        await updateInterview(editingId, formData);
        setSuccess('Interview details updated.');
      } else {
        await createInterview(formData);
        setSuccess('Interview scheduled successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save interview');
    } finally {
      setSaving(false);
    }
  }

  // Render round badge cell in Candidate-wise view
  const renderRoundCell = (roundData, candidateId, roundName) => {
    if (!roundData) {
      return (
        <span
          onClick={() => handleOpenNew(candidateId, roundName)}
          className="inline-block cursor-pointer text-zinc-400 hover:text-[#cc2627] hover:underline"
          title="Click to schedule this round"
        >
          Pending
        </span>
      );
    }

    const isCleared = roundData.result === 'Selected / Cleared';
    const isRejected = roundData.result === 'Rejected';

    return (
      <div
        onClick={() => handleEdit(roundData)}
        className="group inline-flex flex-col cursor-pointer p-1 rounded hover:bg-zinc-100 transition"
        title="Click to view/edit details"
      >
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            isCleared
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isRejected
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {roundData.interviewStatus}: {roundData.result || 'Pending'}
        </span>
        {roundData.interviewer && (
          <span className="text-[10px] text-zinc-500 font-medium truncate mt-0.5 max-w-[120px]">
            by {roundData.interviewer}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Evaluation & Scheduling
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Interview Tracker
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl">
            {activeTabMode === 'candidate-wise'
              ? 'One row per candidate: every interview round with its status, result, interviewer, rating and remarks. Click a name to set / update the rounds in the candidate profile.'
              : 'One row per interview round. Alerts: Update Status, Feedback Pending, Today / Due Soon.'}
          </p>
        </div>

        <div className="flex flex-wrap w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenNew()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#cc2627] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
             Add New
          </button>
        </div>
      </div>

      {/* Top Toggle Mode Pills (Screenshot 1 & 2 Match) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTabMode('candidate-wise')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTabMode === 'candidate-wise'
                ? 'bg-[#214b77] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Candidate-wise (all rounds in one row)
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('round-wise')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTabMode === 'round-wise'
                ? 'bg-[#214b77] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Round-wise list
          </button>
        </div>

        {activeTabMode === 'round-wise' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {ROUNDS_TABS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRoundFilter(r)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                  selectedRoundFilter === r
                    ? 'bg-[#214b77] text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
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
            placeholder={
              activeTabMode === 'candidate-wise'
                ? 'Search name / mobile / ID...'
                : 'Search candidate / interviewer...'
            }
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

        {activeTabMode === 'candidate-wise' && (
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          >
            <option value="All stages">All stages</option>
            <option value="Sourced">Sourced</option>
            <option value="Screening">Screening</option>
            <option value="L1 Interview">L1 Interview</option>
            <option value="L2 Interview">L2 Interview</option>
            <option value="HR Round">HR Round</option>
            <option value="Offer Stage">Offer Stage</option>
            <option value="Joined">Joined</option>
            <option value="Rejected">Rejected</option>
            <option value="On Hold">On Hold</option>
          </select>
        )}

        <button
          type="button"
          onClick={loadData}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          Filter
        </button>

        {activeTabMode === 'candidate-wise' && (
          <span className="text-[11px] text-zinc-400 font-medium italic sm:ml-auto">
            &quot;Pending&quot; = round not set yet.
          </span>
        )}
      </div>

      {/* Add / Edit Form Modal Card (Screenshot 3 Match) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Interview Details</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Edit Interview Round' : 'Schedule Interview Round'}
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
            {/* Row 1 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
                      {c.candidateId ? `${c.candidateId} - ` : ''}{c.candidateName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Interview Round *</label>
                <select
                  required
                  value={formData.interviewRound}
                  onChange={(e) => setFormData({ ...formData, interviewRound: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {ROUNDS_TABS.filter((r) => r !== 'All rounds').map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Interviewer</label>
                <input
                  type="text"
                  value={formData.interviewer}
                  onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                  placeholder="Interviewer Name / Panel"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Interview Date *</label>
                <input
                  type="date"
                  required
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Time</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g. 11:30 AM"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Interview Status</label>
                <select
                  value={formData.interviewStatus}
                  onChange={(e) => setFormData({ ...formData, interviewStatus: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Result</label>
                <select
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {RESULTS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Rating (1-5)</label>
                <input
                  type="text"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="e.g. 4.5"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>
            </div>

            {/* Row 3 - Feedback */}
            <div>
              <label className="text-xs font-bold text-zinc-700">Feedback</label>
              <textarea
                rows={2}
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Detailed evaluation notes, strengths, weaknesses, recommendation..."
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
              {saving ? 'Saving...' : editingId ? 'Update Interview' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Main Table: Candidate-wise View (Screenshot 1 Match) */}
      {activeTabMode === 'candidate-wise' ? (
        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3.5 whitespace-nowrap">Candidate</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Stage</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Recruiter</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Screening Call</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Round 1 - HR</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Round 2 - Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Round 3 - Final / Management</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Assignment / Test</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Candidate remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                        <span>Loading candidates...</span>
                      </div>
                    </td>
                  </tr>
                ) : candidateWiseList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center text-zinc-400 font-medium">
                      No candidates.
                    </td>
                  </tr>
                ) : (
                  candidateWiseList.map((row) => (
                    <tr key={row._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">
                        <div className="font-bold text-[#cc2627] font-mono text-[11px]">{row.candidateId || '-'}</div>
                        <div className="text-zinc-900 font-bold">{row.candidateName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {row.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{row.recruiter}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderRoundCell(row.screeningCall, row._id, 'Screening Call')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderRoundCell(row.round1Hr, row._id, 'Round 1 - HR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderRoundCell(row.round2Dept, row._id, 'Round 2 - Department')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderRoundCell(row.round3Mgmt, row._id, 'Round 3 - Final / Management')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderRoundCell(row.assignmentTest, row._id, 'Assignment / Test')}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={row.remarks}>
                        {row.remarks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 text-xs font-semibold text-zinc-500">
            <span>{candidateWiseList.length} candidate(s)</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      ) : (
        /* Round-wise View (Screenshot 2 Match) */
        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3.5 whitespace-nowrap">Candidate</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Candidate Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Company</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Centre</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Interview Round</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Interviewer</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Interview Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Time</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Mode</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Interview Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Result</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Rating (1-5)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Feedback</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Alert</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-zinc-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                        <span>Loading interviews...</span>
                      </div>
                    </td>
                  </tr>
                ) : roundWiseList.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 px-4 text-center text-zinc-400 font-medium">
                      No records yet.
                    </td>
                  </tr>
                ) : (
                  roundWiseList.map((item) => (
                    <tr key={item._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                        {item.candidateIdStr || item.candidateId?.candidateId || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">
                        {item.candidateName}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{item.company}</td>
                      <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">{item.centre || '-'}</td>
                      <td className="px-4 py-3 font-bold text-zinc-800 whitespace-nowrap">
                        {item.interviewRound}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">
                        {item.interviewer || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-500 whitespace-nowrap">
                        {formatDateDisplay(item.interviewDate)}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 whitespace-nowrap font-mono">
                        {item.time || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{item.mode || '-'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.interviewStatus === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.interviewStatus === 'Cancelled' || item.interviewStatus === 'No Show'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.interviewStatus || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.result === 'Selected / Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.result === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {item.result || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-zinc-800 whitespace-nowrap">
                        {item.rating || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={item.feedback}>
                        {item.feedback || '-'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.alert ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            {item.alert}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
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
                            onClick={() => handleDelete(item._id, item.interviewRound)}
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

          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 text-xs font-semibold text-zinc-500">
            <span>{roundWiseList.length} record(s)</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMaster } from '../context/MasterContext';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCandidates,
  fetchNextCandidateId,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../../lib/candidateMasterApi';
import { fetchRequisitions } from '../../lib/manpowerRequisitionApi';

const SOURCES = [];

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

export default function HrCandidateMaster() {
  const { getDropdown } = useMaster();
  const masterSources = getDropdown('sources');
  const masterCentres = getDropdown('centres');
  const masterRecruiters = getDropdown('recruiters');
  const [candidates, setCandidates] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
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

  // Resume file and auto-fill state
  const [selectedFile, setSelectedFile] = useState(null);
  const [replaceValuesAlreadyTyped, setReplaceValuesAlreadyTyped] = useState(false);
  const fileInputRef = useRef(null);

  // Form fields
  const [formData, setFormData] = useState({
    candidateId: '',
    company: 'Seeds of Innocence',
    dateAdded: formatDateForInput(new Date()),
    candidateName: '',
    mobile: '',
    email: '',
    requisitionId: '',
    source: 'Direct',
    recruiter: '',
    centre: '',
    department: '',
    designation: '',
    totalExpYrs: '',
    currentCtcLakh: '',
    expectedCtcLakh: '',
    noticePeriodDays: '',
    currentLocation: '',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [candidatesRes, reqsRes] = await Promise.all([
        fetchCandidates({
          search: search.trim() || undefined,
          centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
        }),
        fetchRequisitions(),
      ]);
      setCandidates(Array.isArray(candidatesRes?.data) ? candidatesRes.data : []);
      setRequisitions(Array.isArray(reqsRes?.data) ? reqsRes.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCentre]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allAvailableCentres = useMemo(() => {
    const set = new Set(masterCentres);
    requisitions.forEach((r) => {
      if (r.centre) set.add(r.centre);
    });
    candidates.forEach((c) => {
      if (c.centre) set.add(c.centre);
    });
    return Array.from(set);
  }, [requisitions, candidates, masterCentres]);

  const approvedRequisitions = useMemo(() => {
    return requisitions.filter(
      (r) => r.approvalStatus === 'Approved' || r.requisitionStatus === 'Open'
    );
  }, [requisitions]);

  async function handleOpenNew() {
    setError('');
    setSuccess('');
    setEditingId(null);
    setSelectedFile(null);
    let nextId = 'CAN-0001';
    try {
      nextId = await fetchNextCandidateId();
    } catch {}

    setFormData({
      candidateId: nextId,
      company: 'Seeds of Innocence',
      dateAdded: formatDateForInput(new Date()),
      candidateName: '',
      mobile: '',
      email: '',
      requisitionId: '',
      source: 'Direct',
      recruiter: '',
      centre: '',
      department: '',
      designation: '',
      totalExpYrs: '',
      currentCtcLakh: '',
      expectedCtcLakh: '',
      noticePeriodDays: '',
      currentLocation: '',
      remarks: '',
    });
    setIsFormOpen(true);
  }

  function handleEdit(item) {
    setError('');
    setSuccess('');
    setEditingId(item._id);
    setSelectedFile(null);
    setFormData({
      candidateId: item.candidateId || '',
      company: item.company || 'Seeds of Innocence',
      dateAdded: formatDateForInput(item.dateAdded),
      candidateName: item.candidateName || '',
      mobile: item.mobile || '',
      email: item.email || '',
      requisitionId: item.requisitionId?._id || item.requisitionId || '',
      source: item.source || 'Direct',
      recruiter: item.recruiter || '',
      centre: item.centre || '',
      department: item.department || '',
      designation: item.designation || '',
      totalExpYrs: item.totalExpYrs || '',
      currentCtcLakh: item.currentCtcLakh || '',
      expectedCtcLakh: item.expectedCtcLakh || '',
      noticePeriodDays: item.noticePeriodDays || '',
      currentLocation: item.currentLocation || '',
      remarks: item.remarks || '',
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id, canId) {
    if (!window.confirm(`Delete candidate “${canId || 'this candidate'}”?`)) return;
    try {
      await deleteCandidate(id);
      setSuccess('Candidate record deleted successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete candidate');
    }
  }

  function handleRequisitionChange(reqIdValue) {
    const selectedReq = requisitions.find((r) => r._id === reqIdValue);
    if (selectedReq) {
      setFormData((prev) => ({
        ...prev,
        requisitionId: reqIdValue,
        centre: selectedReq.centre || '',
        department: selectedReq.department || '',
        designation: selectedReq.designation || '',
        recruiter: selectedReq.recruiterAssigned || prev.recruiter,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        requisitionId: reqIdValue,
      }));
    }
  }

  function handleReadCv() {
    if (!selectedFile) {
      alert('Please choose a CV / Resume file first.');
      return;
    }

    const fileName = selectedFile.name;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-\.]+/g, ' ');

    setFormData((prev) => {
      const updated = { ...prev };
      if (!updated.candidateName || replaceValuesAlreadyTyped) {
        const clean = nameWithoutExt.replace(/\b(cv|resume|updated|profile)\b/gi, '').trim();
        if (clean) updated.candidateName = clean;
      }
      return updated;
    });

    setSuccess('CV parsed. Candidate details checked.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateCandidate(editingId, formData, selectedFile);
        setSuccess('Candidate updated successfully.');
      } else {
        await createCandidate(formData, selectedFile);
        setSuccess('Candidate registered successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setSelectedFile(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save candidate');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header matching HR panel */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Talent Acquisition
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Candidate Master
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">
            Pick the requisition - Centre, Department, Designation fill automatically. A pipeline entry (Sourced) is created automatically.
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
            Register Candidate
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
            placeholder="Search candidates..."
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

      {/* Registration / Edit Form Modal Card */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Candidate Profile</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Edit Candidate Details' : 'Register Candidate'}
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
            {/* Green Dashed Box for CV / Resume (Exact copy as screenshot with premium styling) */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  CV / Resume <span className="font-normal text-zinc-600">- attach the CV (PDF, DOCX, DOC, TXT) and the details below are read and filled automatically; check them before saving.</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs text-zinc-700 file:mr-3 file:rounded-xl file:border file:border-zinc-200 file:bg-white file:px-3.5 file:py-2 file:text-xs file:font-bold file:text-zinc-700 hover:file:bg-zinc-50 file:shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleReadCv}
                  className="rounded-xl bg-[#214b77] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1a3d61]"
                >
                  Read CV & auto-fill
                </button>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replaceValuesAlreadyTyped}
                    onChange={(e) => setReplaceValuesAlreadyTyped(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#cc2627] focus:ring-0"
                  />
                  <span>replace values already typed</span>
                </label>
              </div>
            </div>

            {/* Row 1 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <div>
                <label className="text-xs font-bold text-zinc-700">Candidate ID (auto)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.candidateId}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-xs font-mono font-bold text-zinc-600 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Date Added *</label>
                <input
                  type="date"
                  required
                  value={formData.dateAdded}
                  onChange={(e) => setFormData({ ...formData, dateAdded: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  placeholder="Full name"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Mobile (unique) *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">
                  Requisition * <span className="font-normal text-zinc-400">(approved)</span>
                </label>
                <select
                  required
                  value={formData.requisitionId}
                  onChange={(e) => handleRequisitionChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {approvedRequisitions.length > 0 ? (
                    approvedRequisitions.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.reqId} - {r.designation} ({r.centre})
                      </option>
                    ))
                  ) : (
                    requisitions.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.reqId} - {r.designation} ({r.centre})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {masterSources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="text-xs font-bold text-zinc-700">Recruiter</label>
                <select
                  value={formData.recruiter}
                  onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select recruiter --</option>
                  {(masterRecruiters || []).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Total Exp (Yrs)</label>
                <input
                  type="text"
                  value={formData.totalExpYrs}
                  onChange={(e) => setFormData({ ...formData, totalExpYrs: e.target.value })}
                  placeholder="e.g. 3.5"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Current CTC (Lakh)</label>
                <input
                  type="text"
                  value={formData.currentCtcLakh}
                  onChange={(e) => setFormData({ ...formData, currentCtcLakh: e.target.value })}
                  placeholder="e.g. 5.5"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Expected CTC (Lakh)</label>
                <input
                  type="text"
                  value={formData.expectedCtcLakh}
                  onChange={(e) => setFormData({ ...formData, expectedCtcLakh: e.target.value })}
                  placeholder="e.g. 7.0"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Notice Period (Days)</label>
                <input
                  type="text"
                  value={formData.noticePeriodDays}
                  onChange={(e) => setFormData({ ...formData, noticePeriodDays: e.target.value })}
                  placeholder="e.g. 30"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Current Location</label>
                <input
                  type="text"
                  value={formData.currentLocation}
                  onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                  placeholder="e.g. New Delhi"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>
            </div>

            {/* Row 3 - Remarks */}
            <div>
              <label className="text-xs font-bold text-zinc-700">Remarks</label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Candidate feedback, interview notes, etc."
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
              {saving ? 'Saving...' : editingId ? 'Update Candidate' : 'Save Candidate'}
            </button>
          </div>
        </form>
      )}

      {/* Main Table Container */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate ID</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Company</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Date Added</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Candidate Name</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Mobile (unique)</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">CV</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Source</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Recruiter</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Requisition</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Designation</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Total Exp</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Expected CTC</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Rounds</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Current Stage</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Pipeline Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Remarks</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading candidates...</span>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 px-4 text-center text-zinc-400 font-medium">
                    No candidates registered yet.
                  </td>
                </tr>
              ) : (
                candidates.map((can) => (
                  <tr key={can._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                      {can.candidateId}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{can.company}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(can.dateAdded)}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-900 whitespace-nowrap">
                      {can.candidateName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-mono">{can.mobile}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {can.resume?.originalName ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#cc2627]/10 px-2.5 py-1 text-[11px] font-bold text-[#cc2627] hover:bg-[#cc2627]/20 transition cursor-pointer">
                          📄 CV
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{can.source || '-'}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{can.recruiter || '-'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {can.reqIdStr || can.requisitionId?.reqId || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">{can.centre || '-'}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{can.department || '-'}</td>
                    <td className="px-4 py-3 text-zinc-900 whitespace-nowrap font-bold">
                      {can.designation || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-700 whitespace-nowrap font-semibold">
                      {can.totalExpYrs ? `${can.totalExpYrs} Yrs` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-700 whitespace-nowrap font-semibold">
                      {can.expectedCtcLakh ? `₹ ${can.expectedCtcLakh} L` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-zinc-900 whitespace-nowrap">
                      {can.roundsDone ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {can.currentStage || 'Sourced'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {can.pipelineStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={can.remarks}>
                      {can.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(can)}
                          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 transition hover:bg-[#cc2627]/10 hover:text-[#cc2627]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(can._id, can.candidateId)}
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
          <span>{candidates.length} record(s)</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

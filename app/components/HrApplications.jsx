'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteApplication as deleteApplicantRecord,
  downloadApplicationResume,
  fetchManagedApplications,
  updateApplication as updateApplicantRecord,
  updateApplicationStatus,
  viewApplicationResume,
} from '../../lib/jobApplicationApi';
import { fetchManagedJobs } from '../../lib/jobApi';

const STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Work from home', 'Alternate days'];
const EXPERIENCE_RANGES = [
  { value: '1-3', label: '1 - 3 years', min: 1, max: 3 },
  { value: '4-6', label: '4 - 6 years', min: 4, max: 6 },
  { value: '7-9', label: '7 - 9 years', min: 7, max: 9 },
  { value: '10-11', label: '10 - 11 years', min: 10, max: 11 },
];

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700',
  reviewing: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-violet-50 text-violet-700',
  rejected: 'bg-red-50 text-red-700',
  hired: 'bg-emerald-50 text-emerald-700',
};

const CARD_STYLES = {
  new: 'border-blue-300 bg-blue-50',
  reviewing: 'border-amber-300 bg-amber-50',
  shortlisted: 'border-violet-300 bg-violet-50',
  rejected: 'border-red-300 bg-red-50',
  hired: 'border-emerald-300 bg-emerald-50',
};

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .trim();
}

function getApplicationSearchText(application) {
  const values = [];

  function collectValue(value) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(collectValue);
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(collectValue);
      return;
    }
    values.push(value);
  }

  collectValue(application);
  if (application?.createdAt) {
    const appliedDate = new Date(application.createdAt);
    if (!Number.isNaN(appliedDate.getTime())) {
      values.push(appliedDate.toLocaleDateString('en-IN'));
    }
  }
  values.push(application?.applicationType === 'general' ? 'general application' : 'current opening job application');
  return normalizeSearchText(values.join(' '));
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-800">{value || 'Not provided'}</p>
    </div>
  );
}

function FormField({ label, name, value, onChange, required = false, type = 'text', textarea = false }) {
  const className = 'mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-800 outline-none focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/15';
  return (
    <label className={textarea ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <span className="text-xs font-bold text-zinc-600">{label}{required ? ' *' : ''}</span>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange} required={required} rows={5} className={className} />
      ) : (
        <input name={name} value={value} onChange={onChange} required={required} type={type} className={className} />
      )}
    </label>
  );
}

function FilterSelect({ label, value, onValueChange, allLabel, options }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const normalizedOptions = options.map((option) => ({
    value: typeof option === 'string' ? option : option.value,
    label: typeof option === 'string' ? option : option.label,
  }));
  const selectedLabel = value === 'all'
    ? allLabel
    : normalizedOptions.find((option) => option.value === value)?.label || allLabel;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function chooseValue(nextValue) {
    onValueChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative min-w-[160px] flex-1">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-700 outline-none focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/15">
        <span className="truncate">{selectedLabel}</span>
        <span className={`shrink-0 text-xs text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <button type="button" role="option" aria-selected={value === 'all'} onClick={() => chooseValue('all')} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#cc2627]/10 ${value === 'all' ? 'bg-[#cc2627]/10 text-[#cc2627]' : 'text-zinc-700'}`}>{allLabel}</button>
          {normalizedOptions.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => chooseValue(option.value)} className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#cc2627]/10 ${value === option.value ? 'bg-[#cc2627]/10 text-[#cc2627]' : 'text-zinc-700'}`}>{option.label}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getExperienceYears(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('fresher')) return 0;
  const match = normalized.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function ExperienceFilterDropdown({ rangeValue, customValue, onRangeChange, onCustomChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedRange = EXPERIENCE_RANGES.find((range) => range.value === rangeValue);
  const selectedLabel = customValue !== ''
    ? `${customValue} years (exact)`
    : selectedRange?.label || 'All experience';

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function chooseRange(value) {
    onCustomChange('');
    onRangeChange(value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative min-w-[190px] flex-1">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Experience Range</span>
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-700 outline-none focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/15">
        <span>{selectedLabel}</span>
        <span className={`text-xs text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[240px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <div role="listbox" aria-label="Experience range" className="space-y-1">
            <button type="button" role="option" aria-selected={rangeValue === 'all' && customValue === ''} onClick={() => chooseRange('all')} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100">All experience</button>
            {EXPERIENCE_RANGES.map((range) => (
              <button key={range.value} type="button" role="option" aria-selected={rangeValue === range.value && customValue === ''} onClick={() => chooseRange(range.value)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#cc2627]/10 ${rangeValue === range.value && customValue === '' ? 'bg-[#cc2627]/10 text-[#cc2627]' : 'text-zinc-700'}`}>{range.label}</button>
            ))}
          </div>
          <div className="mt-2 border-t border-zinc-200 p-2 pt-3">
            <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Custom exact experience</span>
              <div className="relative">
                <input type="number" min="0" step="0.5" inputMode="decimal" value={customValue} onChange={(event) => { onCustomChange(event.target.value); if (event.target.value !== '') onRangeChange('all'); }} placeholder="Enter exact years" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 pr-14 text-sm font-semibold text-zinc-700 outline-none focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/15" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">years</span>
              </div>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function HrApplications({ onCountChange, initialSelectedId, onClearSelectedId, mode, onClosePopup, initialFilter = 'all' }) {
  const [applications, setApplications] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [applicationTypeFilter, setApplicationTypeFilter] = useState('all');
  const [jobTitleFilter, setJobTitleFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [customExperienceFilter, setCustomExperienceFilter] = useState('');
  const [jobFieldFilter, setJobFieldFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [viewingId, setViewingId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState('');
  const filterPanelRef = useRef(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCurrentTime(Date.now()), []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, jobs] = await Promise.all([fetchManagedApplications(), fetchManagedJobs()]);
      const safeRows = Array.isArray(rows) ? rows : [];
      setOpenings(Array.isArray(jobs) ? jobs : []);
      setApplications(safeRows);
      
      if (initialSelectedId) {
        const found = safeRows.find((app) => app._id === initialSelectedId);
        if (found) setSelected(found);
        onClearSelectedId?.();
      }

      const jobCounts = {};
      let generalCount = 0;
      safeRows.forEach((app) => {
        if (app.applicationType === 'general') generalCount++;
        const title = app.positionTitle || 'Unknown';
        jobCounts[title] = (jobCounts[title] || 0) + 1;
      });
      const topJobs = Object.entries(jobCounts).map(([t, c]) => ({ title: t, count: c })).sort((a,b) => b.count - a.count).slice(0, 5);

      onCountChange?.({
        total: safeRows.length,
        new: safeRows.filter((item) => item.status === 'new').length,
        new24h: safeRows.filter((item) => item.status === 'new' && (Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000)).length,
        hired: safeRows.filter((item) => item.status === 'hired').length,
        shortlisted: safeRows.filter((item) => item.status === 'shortlisted').length,
        rejected: safeRows.filter((item) => item.status === 'rejected').length,
        reviewing: safeRows.filter((item) => item.status === 'reviewing').length,
        recentApplications: [...safeRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        generalCount,
        topJobs
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to load applications');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadApplications, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadApplications]);

  useEffect(() => {
    function closeFiltersOnOutsideClick(event) {
      if (!filterPanelRef.current?.contains(event.target)) setFiltersOpen(false);
    }
    function closeFiltersOnEscape(event) {
      if (event.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('mousedown', closeFiltersOnOutsideClick);
    document.addEventListener('keydown', closeFiltersOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeFiltersOnOutsideClick);
      document.removeEventListener('keydown', closeFiltersOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!deleteConfirmation) return undefined;
    function closeDeleteConfirmation(event) {
      if (event.key === 'Escape' && !deletingId) setDeleteConfirmation(null);
    }
    document.addEventListener('keydown', closeDeleteConfirmation);
    return () => document.removeEventListener('keydown', closeDeleteConfirmation);
  }, [deleteConfirmation, deletingId]);

  useEffect(() => {
    if (!openActionMenuId) return undefined;
    function closeActionMenu(event) {
      if (event.key === 'Escape') {
        setOpenActionMenuId('');
        return;
      }
      if (event.type === 'mousedown' && !event.target.closest('[data-application-actions]')) {
        setOpenActionMenuId('');
      }
    }
    document.addEventListener('mousedown', closeActionMenu);
    document.addEventListener('keydown', closeActionMenu);
    return () => {
      document.removeEventListener('mousedown', closeActionMenu);
      document.removeEventListener('keydown', closeActionMenu);
    };
  }, [openActionMenuId]);

  const filterOptions = useMemo(() => {
    const unique = (values) => Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    return {
      jobTitles: unique([
        ...applications.map((item) => item.positionTitle),
        ...openings.map((job) => job.title),
      ]),
      jobFields: unique([
        ...applications.map((item) => item.jobField),
        ...openings.map((job) => job.jobField),
      ]),
    };
  }, [applications, openings]);

  const filteredApplications = useMemo(
    () => applications.filter((item) => {
      const searchTerms = normalizeSearchText(searchQuery).split(/\s+/).filter(Boolean);
      const searchText = searchTerms.length ? getApplicationSearchText(item) : '';
      const searchMatches = searchTerms.length === 0 || searchTerms.every((term) => searchText.includes(term));
      const years = getExperienceYears(item.applicantExperience);
      const exactYears = customExperienceFilter === '' ? null : Number(customExperienceFilter);
      const selectedRange = EXPERIENCE_RANGES.find((range) => range.value === experienceFilter);
      const experienceMatches = exactYears !== null
        ? years !== null && years === exactYears
        : !selectedRange || (years !== null && years >= selectedRange.min && years <= selectedRange.max);

      return searchMatches &&
        (filter === 'all' || item.status === filter) &&
        (applicationTypeFilter === 'all' || (item.applicationType || 'job') === applicationTypeFilter) &&
        (jobTitleFilter === 'all' || item.positionTitle === jobTitleFilter) &&
        (workTypeFilter === 'all' || item.employmentType === workTypeFilter) &&
        experienceMatches &&
        (jobFieldFilter === 'all' || item.jobField === jobFieldFilter);
    }),
    [applicationTypeFilter, applications, customExperienceFilter, experienceFilter, filter, jobFieldFilter, jobTitleFilter, searchQuery, workTypeFilter]
  );

  const hasActiveFilters = customExperienceFilter !== '' ||
    [filter, applicationTypeFilter, jobTitleFilter, workTypeFilter, experienceFilter, jobFieldFilter]
      .some((value) => value !== 'all');
  const activeFilterCount = [
    filter !== 'all',
    applicationTypeFilter !== 'all',
    jobTitleFilter !== 'all',
    workTypeFilter !== 'all',
    experienceFilter !== 'all' || customExperienceFilter !== '',
    jobFieldFilter !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setFilter('all');
    setApplicationTypeFilter('all');
    setJobTitleFilter('all');
    setWorkTypeFilter('all');
    setExperienceFilter('all');
    setCustomExperienceFilter('');
    setJobFieldFilter('all');
  }

  async function handleStatusChange(application, status) {
    setUpdatingId(application._id);
    setError('');
    try {
      const updated = await updateApplicationStatus(application._id, status);
      const nextApplications = applications.map((app) => (app._id === application._id ? updated : app));
      setApplications(nextApplications);

      const jobCounts = {};
      let generalCount = 0;
      nextApplications.forEach((app) => {
        if (app.applicationType === 'general') generalCount++;
        const title = app.positionTitle || 'Unknown';
        jobCounts[title] = (jobCounts[title] || 0) + 1;
      });
      const topJobs = Object.entries(jobCounts).map(([t, c]) => ({ title: t, count: c })).sort((a,b) => b.count - a.count).slice(0, 5);

      onCountChange?.({
        total: nextApplications.length,
        new: nextApplications.filter((item) => item.status === 'new').length,
        new24h: nextApplications.filter((item) => item.status === 'new' && (Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000)).length,
        hired: nextApplications.filter((item) => item.status === 'hired').length,
        shortlisted: nextApplications.filter((item) => item.status === 'shortlisted').length,
        rejected: nextApplications.filter((item) => item.status === 'rejected').length,
        reviewing: nextApplications.filter((item) => item.status === 'reviewing').length,
        recentApplications: [...nextApplications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        generalCount,
        topJobs
      });
      setSelected((prev) => prev?._id === application._id ? { ...prev, status: updated.status } : prev);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update status');
    } finally {
      setUpdatingId('');
    }
  }

  async function handleResumeDownload(application) {
    setDownloadingId(application._id);
    setError('');
    try {
      await downloadApplicationResume(application._id, application.resume?.originalName);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download resume');
    } finally {
      setDownloadingId('');
    }
  }

  async function handleResumeView(application) {
    setViewingId(application._id);
    setError('');
    try {
      await viewApplicationResume(application._id);
    } catch (viewError) {
      setError(viewError.message || 'Unable to view resume');
    } finally {
      setViewingId('');
    }
  }

  function startEditing(application) {
    setSelected(application);
    setEditForm({
      fullName: application.fullName || '',
      email: application.email || '',
      phone: application.phone || '',
      applicantExperience: application.applicantExperience || '',
      currentLocation: application.currentLocation || '',
      noticePeriod: application.noticePeriod || '',
      qualification: application.qualification || '',
      currentOrganization: application.currentOrganization || '',
      currentCtc: application.currentCtc || '',
      expectedCtc: application.expectedCtc || '',
      coverLetter: application.coverLetter || '',
      department: application.department || '',
      preferredPosition: application.preferredPosition || application.positionTitle || '',
      requirements: application.requirements || '',
      skills: application.skills || '',
      additionalInfo: application.additionalInfo || application.coverLetter || '',
    });
    setIsEditing(true);
  }

  async function handleApplicantUpdate(event) {
    event.preventDefault();
    if (!selected) return;
    setSavingId(selected._id);
    setError('');
    try {
      const updated = await updateApplicantRecord(selected._id, editForm);
      setApplications((current) => current.map((item) => item._id === updated._id ? updated : item));
      setSelected(updated);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update applicant details');
    } finally {
      setSavingId('');
    }
  }

  function requestApplicantDelete(application) {
    setDeleteConfirmation(application);
  }

  async function handleApplicantDelete() {
    const application = deleteConfirmation;
    if (!application) return;
    setDeletingId(application._id);
    setError('');
    try {
      await deleteApplicantRecord(application._id);
      const nextApplications = applications.filter((item) => item._id !== application._id);
      setApplications(nextApplications);

      const jobCounts = {};
      let generalCount = 0;
      nextApplications.forEach((app) => {
        if (app.applicationType === 'general') generalCount++;
        const title = app.positionTitle || 'Unknown';
        jobCounts[title] = (jobCounts[title] || 0) + 1;
      });
      const topJobs = Object.entries(jobCounts).map(([t, c]) => ({ title: t, count: c })).sort((a,b) => b.count - a.count).slice(0, 5);

      onCountChange?.({
        total: nextApplications.length,
        new: nextApplications.filter((item) => item.status === 'new').length,
        new24h: nextApplications.filter((item) => item.status === 'new' && (Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000)).length,
        hired: nextApplications.filter((item) => item.status === 'hired').length,
        shortlisted: nextApplications.filter((item) => item.status === 'shortlisted').length,
        rejected: nextApplications.filter((item) => item.status === 'rejected').length,
        reviewing: nextApplications.filter((item) => item.status === 'reviewing').length,
        recentApplications: [...nextApplications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        generalCount,
        topJobs
      });
      if (selected?._id === application._id) {
        setSelected(null);
        setIsEditing(false);
      }
      setDeleteConfirmation(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete applicant');
    } finally {
      setDeletingId('');
      if (mode === 'popup_only') onClosePopup?.();
    }
  }

  if (mode === 'popup_only') {
    return selected ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); onClosePopup?.(); } }}>
        <div className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#cc2627]">{selected.applicationType === 'general' ? 'General Application' : 'Candidate Application'}</p>
              <h3 className="mt-1 truncate text-xl font-bold text-zinc-900 sm:text-2xl">{selected.fullName}</h3>
              <p className="mt-1 truncate text-sm font-semibold text-[#c92c49]">{selected.positionTitle}</p>
            </div>
            <button type="button" onClick={() => { setSelected(null); setIsEditing(false); onClosePopup?.(); }} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close application details">✕</button>
          </div>
          <div className="p-4 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleApplicantUpdate}>
                <div className="mb-5 rounded-xl bg-[#cc2627]/10 px-4 py-3 text-sm font-semibold text-[#cc2627]">
                  Edit applicant details. The original Resume/CV will remain unchanged.
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Full Name</span>
                    <input type="text" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Email Address</span>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Phone Number</span>
                    <input type="tel" required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Position Title</span>
                    <input type="text" required value={editForm.positionTitle} onChange={(e) => setEditForm({ ...editForm, positionTitle: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Current Company</span>
                    <input type="text" value={editForm.currentCompany} onChange={(e) => setEditForm({ ...editForm, currentCompany: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Cover Letter / Message</span>
                    <textarea rows="4" value={editForm.coverLetter} onChange={(e) => setEditForm({ ...editForm, coverLetter: e.target.value })} className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Notice Period</span>
                    <input type="text" required value={editForm.noticePeriod} onChange={(e) => setEditForm({ ...editForm, noticePeriod: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Current CTC</span>
                    <input type="text" required value={editForm.currentCTC} onChange={(e) => setEditForm({ ...editForm, currentCTC: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-zinc-700">Expected CTC</span>
                    <input type="text" required value={editForm.expectedCTC} onChange={(e) => setEditForm({ ...editForm, expectedCTC: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-[#cc2627] focus:ring-1 focus:ring-[#cc2627]" />
                  </label>
                </div>
                <div className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-5">
                  <button type="button" disabled={savingId === selected._id} onClick={() => setIsEditing(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-60">Cancel</button>
                  <button type="submit" disabled={savingId === selected._id} className="rounded-xl bg-[#cc2627] px-6 py-2 text-sm font-bold text-white hover:bg-[#b31e1e] disabled:opacity-60">{savingId === selected._id ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Contact Details</h4>
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-sm text-zinc-700"><span className="text-zinc-400">✉</span> {selected.email || 'N/A'}</p>
                      <p className="flex items-center gap-2 text-sm text-zinc-700"><span className="text-zinc-400">☏</span> {selected.phone}</p>
                      <p className="flex items-center gap-2 text-sm text-zinc-700"><span className="text-zinc-400">⚑</span> Applied {new Date(selected.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Professional Details</h4>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-zinc-700"><span className="font-semibold">Current Company:</span> {selected.currentCompany || 'N/A'}</p>
                      <p className="text-sm text-zinc-700"><span className="font-semibold">Notice Period:</span> {selected.noticePeriod || 'N/A'}</p>
                      <p className="text-sm text-zinc-700"><span className="font-semibold">Current CTC:</span> {selected.currentCTC || 'N/A'}</p>
                      <p className="text-sm text-zinc-700"><span className="font-semibold">Expected CTC:</span> {selected.expectedCTC || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Application Status</h4>
                    <div className="mt-3">
                      <select disabled={updatingId === selected._id} value={selected.status} onChange={(event) => handleStatusChange(selected, event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-800 outline-none transition focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/20 disabled:opacity-60">
                        {STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                      </select>
                      {updatingId === selected._id ? <p className="mt-2 text-xs font-semibold text-[#cc2627]">Updating status...</p> : null}
                    </div>
                  </div>
                </div>
                {selected.coverLetter ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Cover Letter</h4>
                    <div className="mt-3 rounded-xl bg-zinc-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{selected.coverLetter}</p>
                    </div>
                  </div>
                ) : null}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Resume / CV</h4>
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#cc2627]/10 text-blue-600">📄</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-900">{selected.resume?.originalName || 'No resume uploaded'}</p>
                      {selected.resume ? <p className="text-xs text-zinc-500">{Math.max(1, Math.round((selected.resume.size || 0) / 1024))} KB • PDF/DOC</p> : null}
                    </div>
                    {selected.resume ? (
                      <div className="flex gap-2">
                        <button type="button" disabled={viewingId === selected._id} onClick={() => handleResumeView(selected)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60">{viewingId === selected._id ? 'Opening...' : 'View CV'}</button>
                        <button type="button" disabled={downloadingId === selected._id} onClick={() => handleResumeDownload(selected)} className="rounded-lg bg-[#cc2627] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b31e1e] disabled:opacity-60">{downloadingId === selected._id ? 'Downloading...' : 'Download'}</button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-4 border-t border-zinc-100 pt-6">
                  <button type="button" disabled={deletingId === selected._id} onClick={() => requestApplicantDelete(selected)} className="rounded-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingId === selected._id ? 'Deleting Application...' : 'Delete Application'}</button>
                  <button type="button" onClick={() => startEditing(selected)} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-bold text-white hover:bg-zinc-800">Edit Details</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">Candidate Management</p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">Job Applications</h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">Review candidate details, resumes, and manage hiring status.</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <span className="sr-only">Search all applications</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search applications..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-9 pr-9 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear application search" className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-500 hover:bg-zinc-200 transition-colors">✕</button>
            ) : null}
          </label>
        <div ref={filterPanelRef} className="relative shrink-0">
          <button type="button" onClick={() => setFiltersOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={filtersOpen} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition-all ${hasActiveFilters ? 'border-[#cc2627]/30 bg-[#cc2627]/5 text-[#cc2627]' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <span>Filters</span>
            {activeFilterCount ? <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#cc2627] px-1 text-[10px] text-white shadow-sm">{activeFilterCount}</span> : null}
          </button>
          {filtersOpen ? (
            <div role="dialog" aria-label="Application filters" className="absolute right-0 top-full z-40 mt-3 w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <p className="font-black tracking-tight text-zinc-900">Filter Applications</p>
                  <p className="text-xs font-semibold text-zinc-500 mt-1">Showing {filteredApplications.length} of {applications.length}</p>
                </div>
                {hasActiveFilters ? <button type="button" onClick={clearFilters} className="text-xs font-bold text-[#cc2627] hover:underline">Clear all</button> : null}
              </div>
              <div className="space-y-4">
                <FilterSelect label="Application Status" value={filter} onValueChange={setFilter} allLabel="All applications" options={STATUSES.map((status) => ({ value: status, label: status[0].toUpperCase() + status.slice(1) }))} />
                <FilterSelect label="Application Type" value={applicationTypeFilter} onValueChange={setApplicationTypeFilter} allLabel="All types" options={[{ value: 'job', label: 'Current opening' }, { value: 'general', label: 'General application' }]} />
                <FilterSelect label="Job Title" value={jobTitleFilter} onValueChange={setJobTitleFilter} allLabel="All job titles" options={filterOptions.jobTitles} />
                <FilterSelect label="Work Type" value={workTypeFilter} onValueChange={setWorkTypeFilter} allLabel="All work types" options={WORK_TYPES} />
                <ExperienceFilterDropdown rangeValue={experienceFilter} customValue={customExperienceFilter} onRangeChange={setExperienceFilter} onCustomChange={setCustomExperienceFilter} />
                <FilterSelect label="Job Field" value={jobFieldFilter} onValueChange={setJobFieldFilter} allLabel="All job fields" options={filterOptions.jobFields} />
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="mt-5 w-full rounded-xl bg-[#cc2627] px-4 py-3 text-sm font-bold text-white hover:bg-[#b31e1e] shadow-md transition-all">View Results</button>
            </div>
          ) : null}
        </div>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <div className="grid place-items-center rounded-[2rem] border border-dashed border-zinc-200 bg-white/50 p-12 min-h-[300px]">
             <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#cc2627]/20 border-t-[#cc2627]" />
                <p className="text-sm font-bold text-zinc-500">Loading applications...</p>
             </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="grid place-items-center rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm min-h-[300px]">
            <div className="flex flex-col items-center max-w-sm">
               <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               </div>
               <h3 className="text-xl font-black text-zinc-900">No Applications Found</h3>
               <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500">{searchQuery ? `No application matches “${searchQuery}”. Try adjusting your search or filters.` : 'Submitted job applications will appear here once candidates apply.'}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredApplications.map((application) => {
              const isOldNew = application.status === 'new' && (currentTime - new Date(application.createdAt).getTime() > 24 * 60 * 60 * 1000);
              return (
              <article key={application._id} className={`group relative flex min-w-0 flex-col justify-between rounded-[1.5rem] border p-5 sm:p-6 transition-all duration-300 ${isOldNew ? 'border-zinc-200 bg-white' : CARD_STYLES[application.status] || CARD_STYLES.new}`}>
                <div data-application-actions className="absolute right-4 top-4 z-20">
                  <button
                    type="button"
                    onClick={() => setOpenActionMenuId((current) => current === application._id ? '' : application._id)}
                    aria-label={`More actions for ${application.fullName}`}
                    aria-haspopup="menu"
                    aria-expanded={openActionMenuId === application._id}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/60 text-zinc-600 shadow-sm transition hover:bg-white hover:text-zinc-900 backdrop-blur-sm border border-zinc-200/50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                  {openActionMenuId === application._id ? (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1">
                      <button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(''); startEditing(application); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit Details</button>
                      <button type="button" role="menuitem" disabled={downloadingId === application._id} onClick={() => { setOpenActionMenuId(''); handleResumeDownload(application); }} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-[#cc2627] hover:bg-[#cc2627]/10 disabled:opacity-60 flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{downloadingId === application._id ? 'Downloading...' : 'Download CV'}</button>
                      <div className="my-1 border-t border-zinc-100" />
                      <button type="button" role="menuitem" disabled={deletingId === application._id} onClick={() => { setOpenActionMenuId(''); requestApplicantDelete(application); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>{deletingId === application._id ? 'Deleting...' : 'Delete Application'}</button>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="min-w-0 pr-10">
                    {application.applicationType === 'general' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100/50 border border-violet-200/50 px-2 py-1 mb-3 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> General Application
                      </span>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="truncate text-xl font-black text-zinc-900">{application.fullName}</h3>
                      {application.status === 'new' && (currentTime - new Date(application.createdAt).getTime() > 24 * 60 * 60 * 1000) ? null : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border border-current/20 ${STATUS_STYLES[application.status] || STATUS_STYLES.new}`}>{application.status}</span>
                      )}
                    </div>
                    <p className="truncate text-sm font-bold text-[#cc2627]">{application.positionTitle}</p>
                    
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/60 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></span>
                        {application.phone}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/60 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
                        <span className="truncate">{application.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-600">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/60 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>
                        Applied {new Date(application.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelected(application)} className="flex-1 rounded-xl bg-white/80 border border-zinc-200/50 px-3 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-white">View Details</button>
                    <button type="button" disabled={viewingId === application._id} onClick={() => handleResumeView(application)} className="flex-1 rounded-xl bg-[#cc2627]/10 border border-[#cc2627]/20 px-3 py-2.5 text-xs font-bold text-[#cc2627] shadow-sm transition hover:bg-[#cc2627]/20 disabled:opacity-60">{viewingId === application._id ? 'Opening...' : 'View CV'}</button>
                  </div>
                </div>
                <div className="mt-6 border-t border-black/5 pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-zinc-500" title={application.resume?.originalName}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <span className="truncate">{application.resume?.originalName || 'No resume'}</span>
                      {application.resume ? `(${Math.max(1, Math.round((application.resume?.size || 0) / 1024))} KB)` : ''}
                    </p>
                    <label className="relative shrink-0">
                      <span className="sr-only">Hiring status</span>
                      <select disabled={updatingId === application._id} value={application.status} onChange={(event) => handleStatusChange(application, event.target.value)} className="w-full sm:w-auto appearance-none rounded-lg border border-black/10 bg-white/50 pl-3 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#cc2627]/20 disabled:opacity-60">
                        {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">▼</span>
                    </label>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); onClosePopup?.(); } }}>
          <div className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#cc2627]">{selected.applicationType === 'general' ? 'General Application' : 'Candidate Application'}</p>
                <h3 className="mt-1 truncate text-xl font-bold text-zinc-900 sm:text-2xl">{selected.fullName}</h3>
                <p className="mt-1 truncate text-sm font-semibold text-[#c92c49]">{selected.positionTitle}</p>
              </div>
              <button type="button" onClick={() => { setSelected(null); setIsEditing(false); onClosePopup?.(); }} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close application details">✕</button>
            </div>
            <div className="p-4 sm:p-6">
              {isEditing ? (
                <form onSubmit={handleApplicantUpdate}>
                  <div className="mb-5 rounded-xl bg-[#cc2627]/10 px-4 py-3 text-sm font-semibold text-[#cc2627]">
                    Edit applicant details. The original Resume/CV will remain unchanged.
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Full name" name="fullName" value={editForm.fullName || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                    <FormField label="Email" name="email" type="email" value={editForm.email || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} />
                    <FormField label="Phone" name="phone" type="tel" value={editForm.phone || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                    <FormField label="Experience" name="applicantExperience" value={editForm.applicantExperience || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                    <FormField label="Current location" name="currentLocation" value={editForm.currentLocation || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                    <FormField label="Qualification" name="qualification" value={editForm.qualification || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                    {selected.applicationType === 'general' ? (
                      <>
                        <FormField label="Area of interest / Department" name="department" value={editForm.department || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Preferred position / Role" name="preferredPosition" value={editForm.preferredPosition || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Notice period" name="noticePeriod" value={editForm.noticePeriod || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Current CTC" name="currentCtc" value={editForm.currentCtc || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Expected CTC" name="expectedCtc" value={editForm.expectedCtc || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Requirements & Expectations" name="requirements" value={editForm.requirements || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required textarea />
                        <FormField label="Skills & Specializations" name="skills" value={editForm.skills || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} textarea />
                        <FormField label="Additional Information / Cover Letter" name="additionalInfo" value={editForm.additionalInfo || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} textarea />
                      </>
                    ) : (
                      <>
                        <FormField label="Notice period" name="noticePeriod" value={editForm.noticePeriod || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Current organization" name="currentOrganization" value={editForm.currentOrganization || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} />
                        <FormField label="Current CTC" name="currentCtc" value={editForm.currentCtc || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Expected CTC" name="expectedCtc" value={editForm.expectedCtc || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} required />
                        <FormField label="Cover letter / Additional information" name="coverLetter" value={editForm.coverLetter || ''} onChange={(event) => setEditForm({ ...editForm, [event.target.name]: event.target.value })} textarea />
                      </>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:flex-wrap sm:justify-between">
                    <button type="button" disabled={deletingId === selected._id} onClick={() => requestApplicantDelete(selected)} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 sm:w-auto">{deletingId === selected._id ? 'Deleting...' : 'Delete Applicant'}</button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                      <button type="button" onClick={() => setIsEditing(false)} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100 sm:w-auto">Cancel</button>
                      <button type="submit" disabled={savingId === selected._id} className="w-full rounded-xl bg-[#cc2627] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b31e1e] disabled:opacity-60 sm:w-auto">{savingId === selected._id ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Email" value={selected.email} />
                <Detail label="Current location" value={selected.currentLocation} />
                <Detail label="Experience" value={selected.applicantExperience} />
                <Detail label="Qualification" value={selected.qualification} />
                {selected.applicationType === 'general' ? (
                  <>
                    <Detail label="Application type" value="General application" />
                    <Detail label="Area of interest / Department" value={selected.jobField || selected.department} />
                    <Detail label="Preferred position / Role" value={selected.preferredPosition || selected.positionTitle} />
                    <Detail label="Notice period" value={selected.noticePeriod} />
                    <Detail label="Current CTC" value={selected.currentCtc} />
                    <Detail label="Expected CTC" value={selected.expectedCtc} />
                  </>
                ) : (
                  <>
                    <Detail label="Position location" value={selected.positionLocation} />
                    <Detail label="Job field" value={selected.jobField} />
                    <Detail label="Work type" value={selected.employmentType} />
                    <Detail label="Notice period" value={selected.noticePeriod} />
                    <Detail label="Current organization" value={selected.currentOrganization} />
                    <Detail label="Current CTC" value={selected.currentCtc} />
                    <Detail label="Expected CTC" value={selected.expectedCtc} />
                  </>
                )}
                <Detail label="Applied on" value={new Date(selected.createdAt).toLocaleString('en-IN')} />
                <Detail label="Application status" value={selected.status} />
                <Detail label="Resume/CV" value={selected.resume?.originalName} />
              </div>
              {selected.applicationType === 'general' ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-zinc-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Requirements & Expectations</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{selected.requirements || 'Not provided'}</p></div>
                  <div className="rounded-xl bg-zinc-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Skills & Specializations</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{selected.skills || 'Not provided'}</p></div>
                  <div className="rounded-xl bg-zinc-50 p-4 md:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Additional Information / Cover Letter</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{selected.additionalInfo || selected.coverLetter || 'Not provided'}</p></div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-zinc-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cover Letter / Additional Information</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{selected.coverLetter || 'Not provided'}</p>
                </div>
              )}
              <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
                <button type="button" disabled={deletingId === selected._id} onClick={() => requestApplicantDelete(selected)} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 sm:mr-auto sm:w-auto">{deletingId === selected._id ? 'Deleting...' : 'Delete Applicant'}</button>
                <button type="button" onClick={() => startEditing(selected)} className="w-full rounded-xl border border-[#cc2627] px-4 py-2.5 text-sm font-bold text-[#cc2627] hover:bg-[#cc2627]/10 sm:w-auto">Edit Details</button>
                <label className="w-full sm:w-auto">
                  <span className="sr-only">Hiring status</span>
                  <select
                    aria-label="Hiring status"
                    disabled={updatingId === selected._id}
                    value={selected.status}
                    onChange={(event) => handleStatusChange(selected, event.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 outline-none focus:border-[#cc2627] focus:ring-2 focus:ring-[#cc2627]/15 disabled:opacity-60 sm:w-auto"
                  >
                    {STATUSES.map((status) => <option key={status} value={status}>Hiring: {status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                </label>
                <button type="button" disabled={viewingId === selected._id} onClick={() => handleResumeView(selected)} className="w-full rounded-xl border border-[#cc2627] px-4 py-2.5 text-sm font-bold text-[#cc2627] hover:bg-[#cc2627]/10 disabled:opacity-60 sm:w-auto">{viewingId === selected._id ? 'Opening...' : 'View Resume/CV'}</button>
                <button type="button" disabled={downloadingId === selected._id} onClick={() => handleResumeDownload(selected)} className="w-full rounded-xl bg-[#cc2627] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b31e1e] disabled:opacity-60 sm:w-auto">{downloadingId === selected._id ? 'Downloading...' : 'Download Resume/CV'}</button>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmation ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setDeleteConfirmation(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-applicant-title" aria-describedby="delete-applicant-description" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-black text-red-600" aria-hidden="true">!</div>
            <h3 id="delete-applicant-title" className="mt-4 text-xl font-bold text-zinc-900">Delete this application?</h3>
            <p id="delete-applicant-description" className="mt-2 text-sm leading-6 text-zinc-600">
              <strong className="text-zinc-900">{deleteConfirmation.fullName}</strong>&apos;s application and Resume/CV will be permanently deleted from MongoDB and Cloudinary.
            </p>
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              This action cannot be undone.
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button type="button" autoFocus disabled={Boolean(deletingId)} onClick={() => setDeleteConfirmation(null)} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 sm:w-auto">Cancel</button>
              <button type="button" disabled={Boolean(deletingId)} onClick={handleApplicantDelete} className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto">{deletingId ? 'Deleting...' : 'Confirm Delete'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

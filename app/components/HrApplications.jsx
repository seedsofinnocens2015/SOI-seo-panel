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
  const className = 'mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-800 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15';
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
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-700 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15">
        <span className="truncate">{selectedLabel}</span>
        <span className={`shrink-0 text-xs text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <button type="button" role="option" aria-selected={value === 'all'} onClick={() => chooseValue('all')} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-blue-50 ${value === 'all' ? 'bg-blue-50 text-[#1679b9]' : 'text-zinc-700'}`}>{allLabel}</button>
          {normalizedOptions.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => chooseValue(option.value)} className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-blue-50 ${value === option.value ? 'bg-blue-50 text-[#1679b9]' : 'text-zinc-700'}`}>{option.label}</button>
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
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-700 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15">
        <span>{selectedLabel}</span>
        <span className={`text-xs text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[240px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <div role="listbox" aria-label="Experience range" className="space-y-1">
            <button type="button" role="option" aria-selected={rangeValue === 'all' && customValue === ''} onClick={() => chooseRange('all')} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100">All experience</button>
            {EXPERIENCE_RANGES.map((range) => (
              <button key={range.value} type="button" role="option" aria-selected={rangeValue === range.value && customValue === ''} onClick={() => chooseRange(range.value)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-blue-50 ${rangeValue === range.value && customValue === '' ? 'bg-blue-50 text-[#1679b9]' : 'text-zinc-700'}`}>{range.label}</button>
            ))}
          </div>
          <div className="mt-2 border-t border-zinc-200 p-2 pt-3">
            <label>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Custom exact experience</span>
              <div className="relative">
                <input type="number" min="0" step="0.5" inputMode="decimal" value={customValue} onChange={(event) => { onCustomChange(event.target.value); if (event.target.value !== '') onRangeChange('all'); }} placeholder="Enter exact years" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 pr-14 text-sm font-semibold text-zinc-700 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">years</span>
              </div>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function HrApplications({ onCountChange }) {
  const [applications, setApplications] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
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

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, jobs] = await Promise.all([fetchManagedApplications(), fetchManagedJobs()]);
      const safeRows = Array.isArray(rows) ? rows : [];
      setOpenings(Array.isArray(jobs) ? jobs : []);
      setApplications(safeRows);
      onCountChange?.({
        total: safeRows.length,
        new: safeRows.filter((item) => item.status === 'new').length,
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
      const nextApplications = applications.map((item) =>
        item._id === application._id ? { ...item, status: updated.status } : item
      );
      setApplications(nextApplications);
      onCountChange?.({
        total: nextApplications.length,
        new: nextApplications.filter((item) => item.status === 'new').length,
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
      onCountChange?.({
        total: nextApplications.length,
        new: nextApplications.filter((item) => item.status === 'new').length,
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
    }
  }

  return (
    <div className="mt-7">
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Job Applications</h2>
          <p className="mt-1 text-sm text-zinc-600">Review candidate details, resumes and hiring status.</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <span className="sr-only">Search all applications</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search applications..."
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-9 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear application search" className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-xs font-bold text-zinc-500 hover:bg-zinc-100">✕</button>
            ) : null}
          </label>
        <div ref={filterPanelRef} className="relative shrink-0">
          <button type="button" onClick={() => setFiltersOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={filtersOpen} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold shadow-sm transition-colors ${hasActiveFilters ? 'border-[#2EA6F7] bg-blue-50 text-[#1679b9]' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'}`}>
            <span aria-hidden="true">☰</span>
            <span>Filters</span>
            {activeFilterCount ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2EA6F7] px-1 text-[10px] text-white">{activeFilterCount}</span> : null}
          </button>
          {filtersOpen ? (
            <div role="dialog" aria-label="Application filters" className="absolute right-0 top-full z-40 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-zinc-900">Filter Applications</p>
                  <p className="text-xs text-zinc-500">Showing {filteredApplications.length} of {applications.length}</p>
                </div>
                {hasActiveFilters ? <button type="button" onClick={clearFilters} className="text-xs font-bold text-[#1679b9] hover:underline">Clear all</button> : null}
              </div>
              <div className="space-y-3">
                <FilterSelect label="Application Status" value={filter} onValueChange={setFilter} allLabel="All applications" options={STATUSES.map((status) => ({ value: status, label: status[0].toUpperCase() + status.slice(1) }))} />
                <FilterSelect label="Application Type" value={applicationTypeFilter} onValueChange={setApplicationTypeFilter} allLabel="All types" options={[{ value: 'job', label: 'Current opening' }, { value: 'general', label: 'General application' }]} />
                <FilterSelect label="Job Title" value={jobTitleFilter} onValueChange={setJobTitleFilter} allLabel="All job titles" options={filterOptions.jobTitles} />
                <FilterSelect label="Work Type" value={workTypeFilter} onValueChange={setWorkTypeFilter} allLabel="All work types" options={WORK_TYPES} />
                <ExperienceFilterDropdown rangeValue={experienceFilter} customValue={customExperienceFilter} onRangeChange={setExperienceFilter} onCustomChange={setCustomExperienceFilter} />
                <FilterSelect label="Job Field" value={jobFieldFilter} onValueChange={setJobFieldFilter} allLabel="All job fields" options={filterOptions.jobFields} />
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="mt-4 w-full rounded-xl bg-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c7fbe]">View Results</button>
            </div>
          ) : null}
        </div>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="font-bold text-zinc-800">No applications found</p>
            <p className="mt-1 text-sm text-zinc-500">{searchQuery ? `No application matches “${searchQuery}”.` : 'Submitted job applications will appear here.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredApplications.map((application) => (
              <article key={application._id} className="relative flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div data-application-actions className="absolute right-3 top-3 z-20">
                  <button
                    type="button"
                    onClick={() => setOpenActionMenuId((current) => current === application._id ? '' : application._id)}
                    aria-label={`More actions for ${application.fullName}`}
                    aria-haspopup="menu"
                    aria-expanded={openActionMenuId === application._id}
                    className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-xl font-bold leading-none text-zinc-600 shadow-sm hover:bg-zinc-100"
                  >
                    ⋮
                  </button>
                  {openActionMenuId === application._id ? (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl">
                      <button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(''); startEditing(application); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-100">Edit Details</button>
                      <button type="button" role="menuitem" disabled={viewingId === application._id} onClick={() => { setOpenActionMenuId(''); handleResumeView(application); }} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-[#1679b9] hover:bg-blue-50 disabled:opacity-60">{viewingId === application._id ? 'Opening...' : 'View CV'}</button>
                      <button type="button" role="menuitem" disabled={downloadingId === application._id} onClick={() => { setOpenActionMenuId(''); handleResumeDownload(application); }} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-[#1679b9] hover:bg-blue-50 disabled:opacity-60">{downloadingId === application._id ? 'Downloading...' : 'Download CV'}</button>
                      <div className="my-1 border-t border-zinc-100" />
                      <button type="button" role="menuitem" disabled={deletingId === application._id} onClick={() => { setOpenActionMenuId(''); requestApplicantDelete(application); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingId === application._id ? 'Deleting...' : 'Delete Application'}</button>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="min-w-0 pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-zinc-900">{application.fullName}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[application.status] || STATUS_STYLES.new}`}>{application.status}</span>
                      {application.applicationType === 'general' ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">General</span> : null}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-[#c92c49]">{application.positionTitle}</p>
                    <p className="mt-2 text-xs font-medium text-zinc-600">{application.phone}</p>
                    <p className="mt-1 break-all text-xs text-zinc-500">{application.email || 'No email'}</p>
                    <p className="mt-1 text-xs text-zinc-400">Applied {new Date(application.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(application)} className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100">View Details</button>
                </div>
                <div className="mt-auto border-t border-zinc-100 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Hiring status</span>
                    <select disabled={updatingId === application._id} value={application.status} onChange={(event) => handleStatusChange(application, event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-60">
                      {STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                    </select>
                  </div>
                  <p className="mt-3 truncate text-xs text-zinc-500" title={application.resume?.originalName}>Resume: {application.resume?.originalName} ({Math.max(1, Math.round((application.resume?.size || 0) / 1024))} KB)</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2EA6F7]">{selected.applicationType === 'general' ? 'General Application' : 'Candidate Application'}</p>
                <h3 className="mt-1 truncate text-xl font-bold text-zinc-900 sm:text-2xl">{selected.fullName}</h3>
                <p className="mt-1 truncate text-sm font-semibold text-[#c92c49]">{selected.positionTitle}</p>
              </div>
              <button type="button" onClick={() => { setSelected(null); setIsEditing(false); }} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close application details">✕</button>
            </div>
            <div className="p-4 sm:p-6">
              {isEditing ? (
                <form onSubmit={handleApplicantUpdate}>
                  <div className="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
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
                      <button type="submit" disabled={savingId === selected._id} className="w-full rounded-xl bg-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c7fbe] disabled:opacity-60 sm:w-auto">{savingId === selected._id ? 'Saving...' : 'Save Changes'}</button>
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
                <button type="button" onClick={() => startEditing(selected)} className="w-full rounded-xl border border-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-[#1679b9] hover:bg-blue-50 sm:w-auto">Edit Details</button>
                <label className="w-full sm:w-auto">
                  <span className="sr-only">Hiring status</span>
                  <select
                    aria-label="Hiring status"
                    disabled={updatingId === selected._id}
                    value={selected.status}
                    onChange={(event) => handleStatusChange(selected, event.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/15 disabled:opacity-60 sm:w-auto"
                  >
                    {STATUSES.map((status) => <option key={status} value={status}>Hiring: {status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                </label>
                <button type="button" disabled={viewingId === selected._id} onClick={() => handleResumeView(selected)} className="w-full rounded-xl border border-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-[#1679b9] hover:bg-blue-50 disabled:opacity-60 sm:w-auto">{viewingId === selected._id ? 'Opening...' : 'View Resume/CV'}</button>
                <button type="button" disabled={downloadingId === selected._id} onClick={() => handleResumeDownload(selected)} className="w-full rounded-xl bg-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c7fbe] disabled:opacity-60 sm:w-auto">{downloadingId === selected._id ? 'Downloading...' : 'Download Resume/CV'}</button>
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

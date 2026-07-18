'use client';

import { useCallback, useEffect, useState } from 'react';
import { createJob, deleteJob, fetchManagedJobs, updateJob } from '../../lib/jobApi';

const JOB_FIELDS = [
  'Medical',
  'Laboratory',
  'Nursing',
  'Admin',
  'Marketing',
  'Calling',
  'Counsellor',
  'Finance',
  'IT',
  'Other',
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Work from home', 'Alternate days'];

const EMPTY_FORM = {
  title: '',
  location: '',
  jobField: 'Medical',
  employmentType: 'Full-time',
  experience: '',
  description: '',
  status: 'published',
};

export default function HrOpenings({ onCountChange }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchManagedJobs();
      const safeRows = Array.isArray(rows) ? rows : [];
      setJobs(safeRows);
      onCountChange?.({
        total: safeRows.length,
        published: safeRows.filter((job) => job.status === 'published').length,
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to load openings');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadJobs, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadJobs]);

  function openCreateForm() {
    setEditingId('');
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  }

  function openEditForm(job) {
    setEditingId(job._id);
    setForm({
      title: job.title || '',
      location: job.location || '',
      jobField: job.jobField || 'Medical',
      employmentType: job.employmentType || 'Full-time',
      experience: job.experience || '',
      description: job.description || '',
      status: job.status === 'draft' ? 'draft' : 'published',
    });
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setIsFormOpen(false);
    setEditingId('');
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await updateJob(editingId, form);
        setSuccess('Opening updated successfully.');
      } else {
        await createJob(form);
        setSuccess('Opening created successfully.');
      }
      setIsFormOpen(false);
      setEditingId('');
      setForm(EMPTY_FORM);
      await loadJobs();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save opening');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete “${job.title}”? This opening will stop showing on the website.`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteJob(job._id);
      setSuccess('Opening deleted successfully.');
      await loadJobs();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete opening');
    }
  }

  return (
    <div className="mt-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Current Openings</h2>
          <p className="mt-1 text-sm text-zinc-600">Published openings appear automatically on the SOI careers page.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="w-full rounded-xl bg-[#cc2727] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#a91f1f] sm:w-auto"
        >
          + Add Opening
        </button>
      </div>

      {success ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">{editingId ? 'Edit Opening' : 'Add New Opening'}</h3>
              <p className="mt-1 text-sm text-zinc-500">Fill every field before saving.</p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close form">✕</button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700">
              Job title
              <input required maxLength={160} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g. Fertility Specialist / IVF Doctor" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20" />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Job location
              <input required maxLength={200} value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="e.g. Delhi, Mumbai, Bangalore" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20" />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Job field
              <select value={form.jobField} onChange={(e) => setForm((prev) => ({ ...prev, jobField: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20">
                {JOB_FIELDS.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Work type
              <select value={form.employmentType} onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20">
                {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Experience
              <input required maxLength={100} value={form.experience} onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))} placeholder="e.g. 5+ years or Fresher" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20" />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Visibility
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20">
                <option value="published">Published — show on website</option>
                <option value="draft">Draft — keep hidden</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-zinc-700 md:col-span-2">
              Job description
              <textarea required maxLength={3000} rows={8} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder={'About the role\n\nResponsibilities:\n• First responsibility\n• Second responsibility\n\nRequirements:\n1. First requirement\n2. Second requirement'} className="mt-2 w-full resize-y rounded-xl border border-zinc-300 px-4 py-3 font-normal leading-6 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20" />
              <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">
                Formatting is preserved on the website. Use Enter for new lines and •, -, or numbers for points.
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={closeForm} className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-100">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-xl bg-[#cc2727] px-5 py-3 text-sm font-bold text-white hover:bg-[#a91f1f] disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Update Opening' : 'Publish Opening'}</button>
          </div>
        </form>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading openings...</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="font-bold text-zinc-800">No openings added yet</p>
            <p className="mt-1 text-sm text-zinc-500">Click “Add Opening” to publish the first vacancy.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {jobs.map((job) => (
              <article key={job._id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#cc2727]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#cc2727]">{job.jobField}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${job.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{job.status}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-zinc-900">{job.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{job.location} · {job.employmentType} · {job.experience}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button type="button" onClick={() => openEditForm(job)} className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 sm:flex-none">Edit</button>
                    <button type="button" onClick={() => handleDelete(job)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 sm:flex-none">Delete</button>
                  </div>
                </div>
                <p className="mt-4 line-clamp-5 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">{job.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

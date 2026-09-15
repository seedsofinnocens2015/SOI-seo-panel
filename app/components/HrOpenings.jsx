'use client';

import { useCallback, useEffect, useState } from 'react';
import { createJob, deleteJob, fetchManagedJobs, updateJob } from '../../lib/jobApi';

const JOB_FIELDS = [
  'Accounts & Finance',
  'Admin & Operations',
  'Billing',
  'Business Development',
  'Call Center',
  'Clinical Operations',
  'Digital Marketing',
  'Embryology',
  'Facility & Maintenance',
  'Field Operations',
  'Human Resources',
  'IT',
  'IVF',
  'Lab Operations',
  'Management',
  'Molecular Biology',
  'Nursing',
  'OT Operations',
  'Pathology',
  'Patient Coordination',
  'Pharmacy',
  'Purchase & Procurement',
  'Quality & Compliances',
  'Sales & Marketing',
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Work from home', 'Alternate days'];

const EMPTY_FORM = {
  title: '',
  location: '',
  jobField: 'Accounts & Finance',
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
      jobField: JOB_FIELDS.includes(job.jobField) ? job.jobField : JOB_FIELDS[0],
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
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">Jobs Management</p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">Current Openings</h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">Published openings appear automatically on the SOI careers page.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#cc2627] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Opening
        </button>
      </div>

      {success ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 border border-emerald-100 shadow-sm animate-in fade-in">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
          <p className="text-sm font-bold text-emerald-800">{success}</p>
        </div>
      ) : null}
      
      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-4 border border-red-100 shadow-sm animate-in fade-in">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></span>
          <p className="text-sm font-bold text-red-800">{error}</p>
        </div>
      ) : null}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="mb-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl sm:p-10 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#cc2627] to-[#a01a1a] text-white shadow-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{editingId ? 'Edit Job Opening' : 'Create New Opening'}</h3>
                <p className="mt-1 text-sm font-medium text-zinc-500">Fill in the details below to publish the job immediately.</p>
              </div>
            </div>
            <button type="button" onClick={closeForm} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800" aria-label="Close form">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-sm font-bold text-zinc-700">
              Job Title
              <input required maxLength={160} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g. Fertility Specialist / IVF Doctor" className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10" />
            </label>
            <label className="text-sm font-bold text-zinc-700">
              Job Location
              <input required maxLength={200} value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="e.g. Delhi, Mumbai, Bangalore" className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10" />
            </label>
            <label className="text-sm font-bold text-zinc-700">
              Job Category (Field)
              <select value={form.jobField} onChange={(e) => setForm((prev) => ({ ...prev, jobField: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_1rem_center] bg-no-repeat pr-10">
                {JOB_FIELDS.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-zinc-700">
              Work Type
              <select value={form.employmentType} onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_1rem_center] bg-no-repeat pr-10">
                {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-zinc-700">
              Required Experience
              <input required maxLength={100} value={form.experience} onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))} placeholder="e.g. 5+ years or Fresher" className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10" />
            </label>
            <label className="text-sm font-bold text-zinc-700">
              Visibility Status
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-semibold text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_1rem_center] bg-no-repeat pr-10">
                <option value="published">Published — Active on website</option>
                <option value="draft">Draft — Hidden</option>
              </select>
            </label>
            <label className="text-sm font-bold text-zinc-700 md:col-span-2">
              Full Job Description
              <textarea required maxLength={3000} rows={10} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder={'About the role...\n\nResponsibilities:\n• First point\n• Second point\n\nRequirements:\n1. First requirement\n2. Second requirement'} className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 font-medium leading-relaxed text-zinc-900 transition-all outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10" />
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Formatting is preserved on the website. Use Enter for new lines and •, -, or numbers for bullet points.
              </div>
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-zinc-100">
            <button type="button" onClick={closeForm} className="rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-xl bg-[#cc2627] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg disabled:opacity-60 disabled:hover:shadow-md disabled:hover:bg-[#cc2627]">
              {saving ? 'Saving...' : editingId ? 'Update Opening' : 'Publish Opening'}
            </button>
          </div>
        </form>
      ) : null}

      <div>
        {loading ? (
          <div className="grid place-items-center rounded-[2rem] border border-dashed border-zinc-200 bg-white/50 p-12 min-h-[300px]">
             <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#cc2627]/20 border-t-[#cc2627]" />
                <p className="text-sm font-bold text-zinc-500">Loading openings...</p>
             </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="grid place-items-center rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm min-h-[300px]">
            <div className="flex flex-col items-center max-w-sm">
               <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <h3 className="text-xl font-black text-zinc-900">No Openings Added</h3>
               <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500">You haven&apos;t posted any job openings yet. Click “Add Opening” to publish your first vacancy.</p>
               <button onClick={openCreateForm} className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800">Add First Opening</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {jobs.map((job) => (
              <article key={job._id} className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#cc2627]/30 sm:p-7 relative overflow-hidden">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#cc2627]/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#cc2627]" />
                      {job.jobField}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${job.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-100 text-zinc-600'}`}>
                      {job.status === 'published' ? 'Live on Site' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-tight text-zinc-900 group-hover:text-[#cc2627] transition-colors">{job.title}</h3>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {job.employmentType}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {job.experience}
                    </div>
                  </div>
                  
                  <p className="mt-5 line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500 whitespace-pre-wrap">{job.description}</p>
                </div>

                <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => openEditForm(job)} className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Opening
                  </button>
                  <button type="button" onClick={() => handleDelete(job)} className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

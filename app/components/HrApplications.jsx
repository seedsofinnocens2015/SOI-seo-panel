'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  downloadApplicationResume,
  fetchManagedApplications,
  updateApplicationStatus,
} from '../../lib/jobApplicationApi';

const STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700',
  reviewing: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-violet-50 text-violet-700',
  rejected: 'bg-red-50 text-red-700',
  hired: 'bg-emerald-50 text-emerald-700',
};

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-800">{value || 'Not provided'}</p>
    </div>
  );
}

export default function HrApplications({ onCountChange }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchManagedApplications();
      const safeRows = Array.isArray(rows) ? rows : [];
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

  const filteredApplications = useMemo(
    () => filter === 'all' ? applications : applications.filter((item) => item.status === filter),
    [applications, filter]
  );

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

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Job Applications</h2>
          <p className="mt-1 text-sm text-zinc-600">Review candidate details, resumes and hiring status.</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700">
          <option value="all">All applications</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
        </select>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="font-bold text-zinc-800">No applications found</p>
            <p className="mt-1 text-sm text-zinc-500">Submitted job applications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((application) => (
              <article key={application._id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-zinc-900">{application.fullName}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[application.status] || STATUS_STYLES.new}`}>{application.status}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#c92c49]">{application.positionTitle}</p>
                    <p className="mt-1 text-xs text-zinc-500">{application.phone} · {application.email || 'No email'} · Applied {new Date(application.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelected(application)} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100">View Details</button>
                    <button type="button" disabled={downloadingId === application._id} onClick={() => handleResumeDownload(application)} className="rounded-lg bg-[#2EA6F7] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c7fbe] disabled:opacity-60">{downloadingId === application._id ? 'Downloading...' : 'Download CV'}</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hiring status</span>
                  <select disabled={updatingId === application._id} value={application.status} onChange={(event) => handleStatusChange(application, event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-60">
                    {STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                  <span className="text-xs text-zinc-500">Resume: {application.resume?.originalName} ({Math.max(1, Math.round((application.resume?.size || 0) / 1024))} KB)</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#2EA6F7]">Candidate Application</p>
                <h3 className="mt-1 text-2xl font-bold text-zinc-900">{selected.fullName}</h3>
                <p className="mt-1 text-sm font-semibold text-[#c92c49]">{selected.positionTitle}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close application details">✕</button>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Email" value={selected.email} />
                <Detail label="Current location" value={selected.currentLocation} />
                <Detail label="Position location" value={selected.positionLocation} />
                <Detail label="Job field" value={selected.jobField} />
                <Detail label="Work type" value={selected.employmentType} />
                <Detail label="Experience" value={selected.applicantExperience} />
                <Detail label="Notice period" value={selected.noticePeriod} />
                <Detail label="Qualification" value={selected.qualification} />
                <Detail label="Current organization" value={selected.currentOrganization} />
                <Detail label="Current CTC" value={selected.currentCtc} />
                <Detail label="Expected CTC" value={selected.expectedCtc} />
                <Detail label="Applied on" value={new Date(selected.createdAt).toLocaleString('en-IN')} />
                <Detail label="Application status" value={selected.status} />
                <Detail label="Resume/CV" value={selected.resume?.originalName} />
              </div>
              <div className="mt-4 rounded-xl bg-zinc-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cover Letter / Additional Information</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{selected.coverLetter || 'Not provided'}</p>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100">Close</button>
                <button type="button" disabled={downloadingId === selected._id} onClick={() => handleResumeDownload(selected)} className="rounded-xl bg-[#2EA6F7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c7fbe] disabled:opacity-60">{downloadingId === selected._id ? 'Downloading...' : 'Download Resume/CV'}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

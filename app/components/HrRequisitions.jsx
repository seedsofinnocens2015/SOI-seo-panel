'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRequisitions,
  fetchNextReqId,
  createRequisition,
  updateRequisition,
  deleteRequisition,
} from '../../lib/manpowerRequisitionApi';

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

const DEFAULT_DEPARTMENTS = [
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

const DEFAULT_DEPARTMENT_DESIGNATIONS = {
  'Human Resources': ['HR Executive', 'HR Manager', 'Recruiter', 'HR Generalist', 'Talent Acquisition Lead'],
  'Accounts & Finance': ['Accountant', 'Senior Accountant', 'Finance Manager', 'Accounts Executive', 'Billing Officer'],
  'Admin & Operations': ['Operations Manager', 'Center Coordinator', 'Admin Executive', 'Front Desk Executive', 'Facility Manager'],
  'Billing': ['Billing Executive', 'Billing In-charge', 'Cashier', 'Billing Assistant'],
  'Business Development': ['BD Executive', 'BD Manager', 'Corporate Relations Officer'],
  'Call Center': ['Telecaller', 'Customer Support Executive', 'Team Lead - Telecalling', 'Quality Analyst'],
  'Clinical Operations': ['Clinical Coordinator', 'Clinic Incharge', 'Counselor'],
  'Digital Marketing': ['SEO Specialist', 'Performance Marketer', 'Content Writer', 'Graphic Designer', 'Social Media Manager'],
  'Embryology': ['Junior Embryologist', 'Senior Embryologist', 'Lab Director', 'Embryology Trainee'],
  'Facility & Maintenance': ['Maintenance Supervisor', 'Electrician', 'Facility In-charge'],
  'Field Operations': ['Field Executive', 'Area Manager', 'Liaison Officer'],
  'IT': ['Software Engineer', 'Full Stack Developer', 'System Administrator', 'IT Support Executive'],
  'IVF': ['IVF Consultant', 'Fertility Specialist', 'Senior Consultant', 'Fellow - Reproductive Medicine'],
  'Lab Operations': ['Lab Technician', 'Lab Incharge', 'Senior Lab Tech', 'Phlebotomist'],
  'Management': ['General Manager', 'Assistant General Manager', 'Director Operations', 'Zonal Head'],
  'Molecular Biology': ['Molecular Biologist', 'Genetic Counselor', 'Research Associate'],
  'Nursing': ['Staff Nurse', 'Nursing Supervisor', 'OT Nurse', 'Ward Sister', 'Nurse In-charge'],
  'OT Operations': ['OT Technician', 'OT Incharge', 'Anesthesia Technician'],
  'Pathology': ['Pathologist', 'Senior Pathologist', 'Histotechnician'],
  'Patient Coordination': ['Patient Care Executive', 'Patient Counselor', 'Floor Coordinator'],
  'Pharmacy': ['Pharmacist', 'Senior Pharmacist', 'Pharmacy Manager', 'Pharmacy Assistant'],
  'Purchase & Procurement': ['Purchase Executive', 'Procurement Manager', 'Store Keeper'],
  'Quality & Compliances': ['Quality Manager', 'NABH Coordinator', 'Compliance Officer'],
  'Sales & Marketing': ['Marketing Executive', 'Area Sales Manager', 'Territory Manager', 'Medical Representative'],
};

const HIRING_TYPES = ['New Vacancy', 'Replacement', 'Budgeted', 'Urgent'];
const PRIORITIES = ['High', 'Medium', 'Low', 'Critical'];
const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected', 'On Hold'];

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

export default function HrRequisitions() {
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

  // Form fields
  const [formData, setFormData] = useState({
    reqId: '',
    company: 'Seeds of Innocence',
    dateRaised: formatDateForInput(new Date()),
    centre: '',
    department: '',
    designation: '',
    hiringType: 'New Vacancy',
    positionsRequired: 1,
    priority: 'Medium',
    requestedBy: '',
    approvalStatus: 'Pending',
    approvalDate: '',
    recruiterAssigned: '',
    remarks: '',
  });

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [deptDesignations, setDeptDesignations] = useState(DEFAULT_DEPARTMENT_DESIGNATIONS);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchRequisitions({
        search: search.trim() || undefined,
        centre: selectedCentre !== 'All centres' ? selectedCentre : undefined,
      });
      setRequisitions(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta?.departments) setDepartments(res.meta.departments);
      if (res?.meta?.departmentDesignations) setDeptDesignations(res.meta.departmentDesignations);
    } catch (err) {
      setError(err.message || 'Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCentre]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableDesignations = useMemo(() => {
    if (!formData.department) return [];
    return deptDesignations[formData.department] || [];
  }, [formData.department, deptDesignations]);

  const allAvailableCentres = useMemo(() => {
    const set = new Set(DEFAULT_CENTRES);
    requisitions.forEach((r) => {
      if (r.centre) set.add(r.centre);
    });
    return Array.from(set);
  }, [requisitions]);

  async function handleOpenNew() {
    setError('');
    setSuccess('');
    setEditingId(null);
    let nextId = 'REQ-0001';
    try {
      nextId = await fetchNextReqId();
    } catch {}
    setFormData({
      reqId: nextId,
      company: 'Seeds of Innocence',
      dateRaised: formatDateForInput(new Date()),
      centre: '',
      department: '',
      designation: '',
      hiringType: 'New Vacancy',
      positionsRequired: 1,
      priority: 'Medium',
      requestedBy: '',
      approvalStatus: 'Pending',
      approvalDate: '',
      recruiterAssigned: '',
      remarks: '',
    });
    setIsFormOpen(true);
  }

  function handleEdit(item) {
    setError('');
    setSuccess('');
    setEditingId(item._id);
    setFormData({
      reqId: item.reqId || '',
      company: item.company || 'Seeds of Innocence',
      dateRaised: formatDateForInput(item.dateRaised),
      centre: item.centre || '',
      department: item.department || '',
      designation: item.designation || '',
      hiringType: item.hiringType || 'New Vacancy',
      positionsRequired: item.positionsRequired || 1,
      priority: item.priority || 'Medium',
      requestedBy: item.requestedBy || '',
      approvalStatus: item.approvalStatus || 'Pending',
      approvalDate: formatDateForInput(item.approvalDate),
      recruiterAssigned: item.recruiterAssigned || '',
      remarks: item.remarks || '',
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id, reqId) {
    if (!window.confirm(`Delete requisition “${reqId || 'this requisition'}”?`)) return;
    try {
      await deleteRequisition(id);
      setSuccess('Requisition deleted successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateRequisition(editingId, formData);
        setSuccess('Requisition updated successfully.');
      } else {
        await createRequisition(formData);
        setSuccess('Requisition created successfully.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save requisition');
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
            Workforce Planning
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Manpower Requisition
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">
            One row per vacancy. Filled / Open / Status update automatically from Joining Tracker.
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
            Add Requisition
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
            placeholder="Search requisitions..."
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

      {/* Add / Edit Form Modal Card */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Requisition Form</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                {editingId ? 'Edit Manpower Requisition' : 'Add New Manpower Requisition'}
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
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <div>
                <label className="text-xs font-bold text-zinc-700">Req ID (auto)</label>
                <input
                  type="text"
                  readOnly
                  value={formData.reqId}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-xs font-mono font-bold text-zinc-600 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company Name"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Date Raised *</label>
                <input
                  type="date"
                  required
                  value={formData.dateRaised}
                  onChange={(e) => setFormData({ ...formData, dateRaised: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Centre *</label>
                <select
                  required
                  value={formData.centre}
                  onChange={(e) => setFormData({ ...formData, centre: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {allAvailableCentres.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    const desigs = deptDesignations[nextDept] || [];
                    setFormData({
                      ...formData,
                      department: nextDept,
                      designation: desigs[0] || '',
                    });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Designation *</label>
                {availableDesignations.length > 0 ? (
                  <select
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                  >
                    <option value="">-- select --</option>
                    {availableDesignations.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder={formData.department ? 'Type designation' : '-- select department first --'}
                    disabled={!formData.department}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Hiring Type</label>
                <select
                  value={formData.hiringType}
                  onChange={(e) => setFormData({ ...formData, hiringType: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {HIRING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="text-xs font-bold text-zinc-700">Positions Required *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.positionsRequired}
                  onChange={(e) => setFormData({ ...formData, positionsRequired: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Requested By</label>
                <input
                  type="text"
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                  placeholder="e.g. Center Manager"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Approval Status</label>
                <select
                  value={formData.approvalStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    setFormData({
                      ...formData,
                      approvalStatus: status,
                      approvalDate: status === 'Approved' && !formData.approvalDate ? formatDateForInput(new Date()) : formData.approvalDate,
                    });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                >
                  <option value="">-- select --</option>
                  {APPROVAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Approval Date</label>
                <input
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:bg-white focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Recruiter Assigned</label>
                <input
                  type="text"
                  value={formData.recruiterAssigned}
                  onChange={(e) => setFormData({ ...formData, recruiterAssigned: e.target.value })}
                  placeholder="Recruiter Name"
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
                placeholder="Any special remarks or hiring requirements..."
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
              {saving ? 'Saving...' : editingId ? 'Update Requisition' : 'Save Requisition'}
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
                <th className="px-4 py-3.5 whitespace-nowrap">Req ID</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Company</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Date Raised</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Designation</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Positions</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Priority</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Approval Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Approval Date</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Recruiter Assigned</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Target Closure</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Filled</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Open</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Req Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Ageing</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Remarks</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading requisitions...</span>
                    </div>
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 px-4 text-center text-zinc-400 font-medium">
                    No requisitions recorded yet.
                  </td>
                </tr>
              ) : (
                requisitions.map((req) => (
                  <tr key={req._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#cc2627] whitespace-nowrap">
                      {req.reqId}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">{req.company}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(req.dateRaised)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">{req.centre}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{req.department}</td>
                    <td className="px-4 py-3 text-zinc-900 font-bold whitespace-nowrap">
                      {req.designation}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-zinc-900 whitespace-nowrap">
                      {req.positionsRequired}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.priority === 'Critical' || req.priority === 'High'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : req.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {req.priority || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.approvalStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.approvalStatus === 'Rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : req.approvalStatus === 'On Hold'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {req.approvalStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(req.approvalDate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap font-medium">
                      {req.recruiterAssigned || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500 whitespace-nowrap">
                      {formatDateDisplay(req.targetClosure)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600 whitespace-nowrap">
                      {req.filled ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 whitespace-nowrap">
                      {req.open ?? req.positionsRequired}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.requisitionStatus === 'Open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.requisitionStatus === 'Closed'
                            ? 'bg-zinc-100 text-zinc-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.requisitionStatus || 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-zinc-600 whitespace-nowrap">
                      {req.ageingDays ?? 0} d
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={req.remarks}>
                      {req.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(req)}
                          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 transition hover:bg-[#cc2627]/10 hover:text-[#cc2627]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(req._id, req.reqId)}
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
          <span>{requisitions.length} record(s)</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

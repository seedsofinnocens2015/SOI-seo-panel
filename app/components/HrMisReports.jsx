'use client';

import { useEffect, useState } from 'react';
import { fetchMisReport, fetchMisDownloadData } from '../../lib/misReportsApi';

function formatDateInput(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function HrMisReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)); // 1st of month
  });
  const [toDate, setToDate] = useState(() => {
    return formatDateInput(new Date()); // today
  });

  // Download section state
  const [dlFromDate, setDlFromDate] = useState(() => {
    const now = new Date();
    return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [dlToDate, setDlToDate] = useState(() => {
    return formatDateInput(new Date());
  });
  const [dlDateBasis, setDlDateBasis] = useState('Profile date (registration)');
  const [dlDataset, setDlDataset] = useState('Complete candidate profiles (one row per candidate - all rounds, offer, joining, onboarding, remarks)');

  const loadData = async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMisReport({
        from: overrideParams.from !== undefined ? overrideParams.from : fromDate,
        to: overrideParams.to !== undefined ? overrideParams.to : toDate,
      });
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to load MIS report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick range filters
  const handleQuickRange = (type) => {
    const now = new Date();
    let f, t;
    if (type === 'thisMonth') {
      f = new Date(now.getFullYear(), now.getMonth(), 1);
      t = now;
    } else if (type === 'lastMonth') {
      f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      t = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (type === 'last3Months') {
      f = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      t = now;
    } else if (type === 'thisYear') {
      f = new Date(now.getFullYear(), 0, 1);
      t = now;
    }
    const fStr = formatDateInput(f);
    const tStr = formatDateInput(t);
    setFromDate(fStr);
    setToDate(tStr);
    loadData({ from: fStr, to: tStr });
  };

  // Export to Excel / CSV
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const rows = await fetchMisDownloadData({
        from: dlFromDate,
        to: dlToDate,
        dateBasis: dlDateBasis,
        dataset: dlDataset,
      });

      if (!rows || rows.length === 0) {
        alert('No data found for the selected download range.');
        return;
      }

      // Convert rows to CSV
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((header) => {
              const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SOI_MIS_Report_${dlFromDate}_to_${dlToDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const summary = reportData?.summaryCards || {
    positionsRaised: 0,
    candidatesRegistered: 0,
    interviewsDone: 0,
    offersReleased: 0,
    joined: 0,
  };

  const centreRows = reportData?.centreWiseRows || [];
  const totalCentre = reportData?.totalCentre || {};

  const deptRows = reportData?.departmentWiseRows || [];
  const totalDept = reportData?.totalDept || {};

  const trendRows = reportData?.monthWiseRows || [];
  const totalTrend = reportData?.totalTrend || {};

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header matching HR panel design */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Executive Summary & Analytics
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            MIS Reports
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Report for <span className="font-bold text-zinc-800">{formatDateDisplay(fromDate)}</span> to{' '}
            <span className="font-bold text-zinc-800">{formatDateDisplay(toDate)}</span> across all centres, departments, and monthly trends.
          </p>
        </div>

        {/* Print / Save as PDF Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {/* Filter Toolbar matching standard HR style */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          className="flex items-center gap-2 rounded-xl bg-[#cc2627] px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Apply
        </button>

        {/* Quick Range Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          <span className="text-xs font-bold text-zinc-400 mr-1">Quick:</span>
          <button
            type="button"
            onClick={() => handleQuickRange('thisMonth')}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-[#cc2627] hover:text-[#cc2627]"
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => handleQuickRange('lastMonth')}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-[#cc2627] hover:text-[#cc2627]"
          >
            Last month
          </button>
          <button
            type="button"
            onClick={() => handleQuickRange('last3Months')}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-[#cc2627] hover:text-[#cc2627]"
          >
            Last 3 months
          </button>
          <button
            type="button"
            onClick={() => handleQuickRange('thisYear')}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-[#cc2627] hover:text-[#cc2627]"
          >
            This year
          </button>
        </div>
      </div>

      {/* --- TOP 5 METRIC CARDS MATCHING SCREENSHOT --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Positions Raised */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Positions raised
            </span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-3 text-3xl font-black text-zinc-900">
            {summary.positionsRaised}
          </div>
        </div>

        {/* Card 2: Candidates registered */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Candidates registered
            </span>
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
          </div>
          <div className="mt-3 text-3xl font-black text-zinc-900">
            {summary.candidatesRegistered}
          </div>
        </div>

        {/* Card 3: Interviews done */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Interviews done
            </span>
            <span className="h-2 w-2 rounded-full bg-purple-500" />
          </div>
          <div className="mt-3 text-3xl font-black text-zinc-900">
            {summary.interviewsDone}
          </div>
        </div>

        {/* Card 4: Offers released */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Offers released
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-black text-zinc-900">
            {summary.offersReleased}
          </div>
        </div>

        {/* Card 5: Joined */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Joined
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-black text-zinc-900">
            {summary.joined}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION A: CENTRE-WISE REPORT                             */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#12395d] text-white font-black text-xs">
            A
          </span>
          <h3 className="text-lg font-black tracking-tight text-zinc-900">
            Centre-wise report
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3.5 whitespace-nowrap">Centre</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Positions Approved (all time)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Open Positions</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Candidates Registered (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Interviews Done (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Offers Released (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Joined (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Joined (all time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-400 font-medium">Loading centre report...</td>
                  </tr>
                ) : centreRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 font-medium">No centre data found.</td>
                  </tr>
                ) : (
                  <>
                    {centreRows.map((r) => (
                      <tr key={r.centre} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-3 font-bold text-zinc-800">{r.centre}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.positionsApprovedAllTime}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.openPositions}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.candidatesRegisteredRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.interviewsDoneRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.offersReleasedRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.joinedRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.joinedAllTime}</td>
                      </tr>
                    ))}

                    {/* Total Summary Row */}
                    <tr className="bg-zinc-100/80 font-black text-zinc-900 border-t-2 border-zinc-200">
                      <td className="px-5 py-3.5 font-black uppercase tracking-wider text-[11px]">Total</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalCentre.positionsApprovedAllTime || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalCentre.openPositions || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalCentre.candidatesRegisteredRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-blue-800 text-sm">{totalCentre.interviewsDoneRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-amber-800 text-sm">{totalCentre.offersReleasedRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-800 text-sm">{totalCentre.joinedRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-950 text-sm">{totalCentre.joinedAllTime || 0}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION B: DEPARTMENT-WISE REPORT                         */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#cc2627] text-white font-black text-xs">
            B
          </span>
          <h3 className="text-lg font-black tracking-tight text-zinc-900">
            Department-wise report
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3.5 whitespace-nowrap">Department</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Positions Approved (all time)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Open Positions</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Candidates Registered (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Interviews Done (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Offers Released (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Joined (range)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Joined (all time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-400 font-medium">Loading department report...</td>
                  </tr>
                ) : deptRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-400 font-medium">No department data found.</td>
                  </tr>
                ) : (
                  <>
                    {deptRows.map((r) => (
                      <tr key={r.department} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-3 font-bold text-zinc-800">{r.department}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.positionsApprovedAllTime}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.openPositions}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.candidatesRegisteredRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.interviewsDoneRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.offersReleasedRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.joinedRange}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.joinedAllTime}</td>
                      </tr>
                    ))}

                    {/* Total Summary Row */}
                    <tr className="bg-zinc-100/80 font-black text-zinc-900 border-t-2 border-zinc-200">
                      <td className="px-5 py-3.5 font-black uppercase tracking-wider text-[11px]">Total</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalDept.positionsApprovedAllTime || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalDept.openPositions || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalDept.candidatesRegisteredRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-blue-800 text-sm">{totalDept.interviewsDoneRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-amber-800 text-sm">{totalDept.offersReleasedRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-800 text-sm">{totalDept.joinedRange || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-950 text-sm">{totalDept.joinedAllTime || 0}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION C: MONTH-WISE TREND                               */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-black text-xs">
            C
          </span>
          <h3 className="text-lg font-black tracking-tight text-zinc-900">
            Month-wise trend (full months in the range)
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3.5 whitespace-nowrap">Month</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Positions Raised</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Candidates Registered</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Interviews Done</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Offers Released</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400 font-medium">Loading trend report...</td>
                  </tr>
                ) : trendRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 font-medium">No trend data for the selected range.</td>
                  </tr>
                ) : (
                  <>
                    {trendRows.map((r) => (
                      <tr key={r.month} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-3 font-bold text-zinc-800">{r.month}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.positionsRaised}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.candidatesRegistered}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.interviewsDone}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.offersReleased}</td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-700">{r.joined}</td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-zinc-100/80 font-black text-zinc-900 border-t-2 border-zinc-200">
                      <td className="px-5 py-3.5 font-black uppercase tracking-wider text-[11px]">Total</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalTrend.positionsRaised || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-zinc-900 text-sm">{totalTrend.candidatesRegistered || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-blue-800 text-sm">{totalTrend.interviewsDone || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-amber-800 text-sm">{totalTrend.offersReleased || 0}</td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-800 text-sm">{totalTrend.joined || 0}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION D: DOWNLOAD DATA (EXCEL / CSV)                    */}
      {/* ========================================================= */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-zinc-900">Download data</h3>
          <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">
            Choose what to download and the date range - only that data is downloaded (opens in Excel). &quot;Profile date&quot; = the candidate&apos;s registration date (all tabs of a candidate come together). &quot;Activity date&quot; = each tab&apos;s own date (interview date, offer release date, follow-up date).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-700 pt-2">
          {/* From */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-600">From</span>
            <input
              type="date"
              value={dlFromDate}
              onChange={(e) => setDlFromDate(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-[#cc2627]"
            />
          </div>

          {/* To */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-600">To</span>
            <input
              type="date"
              value={dlToDate}
              onChange={(e) => setDlToDate(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-[#cc2627]"
            />
          </div>

          {/* Date Basis */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-600">Date basis</span>
            <select
              value={dlDateBasis}
              onChange={(e) => setDlDateBasis(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#cc2627]"
            >
              <option value="Profile date (registration)">Profile date (registration)</option>
              <option value="Activity date">Activity date</option>
            </select>
          </div>

          {/* Download dataset */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="font-bold text-zinc-600">Download</span>
            <select
              value={dlDataset}
              onChange={(e) => setDlDataset(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#cc2627]"
            >
              <option value="Complete candidate profiles (one row per candidate - all rounds, offer, joining, onboarding, remarks)">
                Complete candidate profiles (one row per candidate - all rounds, offer, joining, onboarding, remarks)
              </option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 text-xs font-bold transition shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Preparing Download...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

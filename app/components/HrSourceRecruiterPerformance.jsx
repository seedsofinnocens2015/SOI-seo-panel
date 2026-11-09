'use client';

import { useEffect, useState } from 'react';
import { fetchPerformanceReport } from '../../lib/performanceReportsApi';

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

export default function HrSourceRecruiterPerformance() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [recruiter, setRecruiter] = useState('All recruiters');
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)); // 1st of current month
  });
  const [toDate, setToDate] = useState(() => {
    return formatDateInput(new Date()); // today
  });

  const loadData = async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPerformanceReport({
        recruiter: overrideParams.recruiter !== undefined ? overrideParams.recruiter : recruiter,
        from: overrideParams.from !== undefined ? overrideParams.from : fromDate,
        to: overrideParams.to !== undefined ? overrideParams.to : toDate,
      });
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to load performance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick range buttons
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

  const recruiters = reportData?.recruiterList || [];
  const sourceRows = reportData?.sourceWiseRows || [];
  const recruiterRows = reportData?.recruiterWiseRows || [];
  const totalSource = reportData?.totalSource || {};
  const totalRecruiter = reportData?.totalRecruiter || {};

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header matching HR panel standard */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Recruitment Analytics & Insights
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Source & Recruiter Performance
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Source-wise recruitment funnel and recruiter target achievement analytics from{' '}
            <span className="font-bold text-zinc-800">{formatDateDisplay(fromDate)}</span> to{' '}
            <span className="font-bold text-zinc-800">{formatDateDisplay(toDate)}</span>.
          </p>
        </div>

        {/* Quick Date Range Pills in Header */}
        <div className="flex flex-wrap items-center gap-1.5 sm:self-center">
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

      {/* Notifications */}
      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {/* Filter Toolbar matching standard HR page design */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Recruiter Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500">Recruiter:</label>
          <select
            value={recruiter}
            onChange={(e) => setRecruiter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          >
            <option value="All recruiters">All recruiters</option>
            {recruiters.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-500">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
        </div>

        {/* Filter Action Button */}
        <button
          type="button"
          onClick={() => loadData()}
          className="flex items-center gap-2 rounded-xl bg-[#cc2627] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>

        <button
          type="button"
          onClick={() => {
            const now = new Date();
            const fStr = formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
            const tStr = formatDateInput(now);
            setRecruiter('All recruiters');
            setFromDate(fStr);
            setToDate(tStr);
            loadData({ recruiter: 'All recruiters', from: fStr, to: tStr });
          }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          Reset
        </button>
      </div>

      {/* --- SECTION 1: SOURCE-WISE FUNNEL --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#cc2627]/10 text-[#cc2627] font-black text-xs">
              01
            </span>
            <h3 className="text-lg font-black tracking-tight text-zinc-900">
              Source-wise Performance
            </h3>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {sourceRows.length} recruitment channels tracked
          </span>
        </div>

        {/* Standard HR Panel Table Container */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-4 whitespace-nowrap">Source Channel</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Registered</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Interviews Done</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Offers Released</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Offers Accepted</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Joined</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Registered → Joined %</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Offer Acceptance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                        <span>Loading channel analytics...</span>
                      </div>
                    </td>
                  </tr>
                ) : sourceRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-400 font-medium">
                      No recruitment source data found for the selected period.
                    </td>
                  </tr>
                ) : (
                  <>
                    {sourceRows.map((s, idx) => {
                      const isHighConversion = parseInt(s.registeredToJoinedPct || '0', 10) >= 30;
                      return (
                        <tr
                          key={s.source}
                          className="hover:bg-zinc-50/80 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-bold text-zinc-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-300 group-hover:bg-[#cc2627] transition-colors" />
                            {s.source}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {s.registered > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
                                {s.registered}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {s.interviewsDone > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                {s.interviewsDone}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {s.offersReleased > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                                {s.offersReleased}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {s.offersAccepted > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                {s.offersAccepted}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {s.joined > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                                {s.joined}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isHighConversion
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {s.registeredToJoinedPct}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-600">
                            {s.offerAcceptancePct}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Total Summary Row with subtle zinc background and bold styling */}
                    <tr className="bg-zinc-100/80 font-black text-zinc-900 border-t-2 border-zinc-200">
                      <td className="px-5 py-4 font-black text-zinc-900 uppercase tracking-wider text-[11px]">
                        Total Summary
                      </td>
                      <td className="px-4 py-4 text-center font-black text-zinc-900 text-sm">
                        {totalSource.registered || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-blue-800 text-sm">
                        {totalSource.interviewsDone || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-amber-800 text-sm">
                        {totalSource.offersReleased || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-800 text-sm">
                        {totalSource.offersAccepted || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-900 text-sm">
                        {totalSource.joined || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-[#cc2627] text-sm">
                        {totalSource.registered > 0
                          ? `${Math.round(((totalSource.joined || 0) / totalSource.registered) * 100)}%`
                          : '0%'}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-[#cc2627] text-sm">
                        {totalSource.offersReleased > 0
                          ? `${Math.round(((totalSource.offersAccepted || 0) / totalSource.offersReleased) * 100)}%`
                          : '0%'}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: RECRUITER-WISE PERFORMANCE --- */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-black text-xs">
              02
            </span>
            <h3 className="text-lg font-black tracking-tight text-zinc-900">
              Recruiter-wise Target & Actuals
            </h3>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            Target formula: monthly target × (days in range) ÷ 30.4
          </span>
        </div>

        {/* Standard HR Panel Table Container */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-4 whitespace-nowrap">Recruiter</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Monthly Target</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Target for Range</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Registered</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Interviews Done</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Offers Released</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Offers Accepted</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Joined</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Achievement %</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Active in Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                        <span>Loading recruiter achievements...</span>
                      </div>
                    </td>
                  </tr>
                ) : recruiterRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-zinc-400 font-medium">
                      No recruiter data found for this period.
                    </td>
                  </tr>
                ) : (
                  <>
                    {recruiterRows.map((r) => {
                      const achNum = parseInt(r.achievementPct || '0', 10);
                      const isHighAch = achNum >= 80;
                      return (
                        <tr
                          key={r.recruiter}
                          className="hover:bg-zinc-50/80 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-bold text-zinc-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-300 group-hover:bg-[#cc2627] transition-colors" />
                            {r.recruiter}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-600">
                            {r.monthlyTarget}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.targetForRange}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.registered > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
                                {r.registered}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.interviewsDone > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                {r.interviewsDone}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.offersReleased > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                                {r.offersReleased}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.offersAccepted > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                {r.offersAccepted}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.joined > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                                {r.joined}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isHighAch
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : achNum > 0
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {r.achievementPct}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-700">
                            {r.activeInPipeline > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                                {r.activeInPipeline}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Total Summary Row */}
                    <tr className="bg-zinc-100/80 font-black text-zinc-900 border-t-2 border-zinc-200">
                      <td className="px-5 py-4 font-black text-zinc-900 uppercase tracking-wider text-[11px]">
                        Total Summary
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-zinc-400">-</td>
                      <td className="px-4 py-4 text-center font-black text-zinc-900 text-sm">
                        {totalRecruiter.targetForRange || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-zinc-900 text-sm">
                        {totalRecruiter.registered || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-blue-800 text-sm">
                        {totalRecruiter.interviewsDone || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-amber-800 text-sm">
                        {totalRecruiter.offersReleased || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-800 text-sm">
                        {totalRecruiter.offersAccepted || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-900 text-sm">
                        {totalRecruiter.joined || 0}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-[#cc2627] text-sm">
                        {totalRecruiter.targetForRange > 0
                          ? `${Math.round(((totalRecruiter.joined || 0) / totalRecruiter.targetForRange) * 100)}%`
                          : '0%'}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-purple-800 text-sm">
                        {totalRecruiter.activeInPipeline || 0}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 font-medium px-2 pt-1">
          * Target for the range = monthly target × days in the range / 30.4. Recruiter targets and active pipeline counts update in real-time with HR actions.
        </p>
      </div>
    </div>
  );
}

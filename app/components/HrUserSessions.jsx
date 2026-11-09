'use client';

import { useEffect, useState } from 'react';
import { fetchUserSessions } from '../../lib/userSessionApi';

function formatDateTime(dStr) {
  if (!dStr) return '-';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear();

  let hh = d.getHours();
  const ampm = hh >= 12 ? 'pm' : 'am';
  hh = hh % 12;
  hh = hh ? hh : 12;
  const hhStr = String(hh).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');

  return `${dayName}, ${dd} ${mm}, ${yyyy}, ${hhStr}:${min}:${sec} ${ampm}`;
}

function formatDuration(totalSeconds = 0) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function HrUserSessions() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalDurationSeconds: 0,
    avgDurationSeconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchUserSessions({
        search,
        status: selectedStatus,
        from: fromDate,
        to: toDate,
      });
      setSessions(res.data || []);
      setStats(res.stats || {});
    } catch (err) {
      setError(err.message || 'Failed to load user sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [selectedStatus]);

  // Periodic refresh for active duration updates
  useEffect(() => {
    const timer = setInterval(() => {
      loadSessions();
    }, 30000); // 30s refresh
    return () => clearInterval(timer);
  }, [search, selectedStatus, fromDate, toDate]);

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Security & Login Logs
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            User Sessions & Login History
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            Real-time tracking of team member login times, active work durations, device details, and session status across the HR portal.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSessions}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
        >
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Logs
        </button>
      </div>

      {/* Notifications */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold">✕</button>
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Total Logins
          </span>
          <div className="mt-2 text-3xl font-black text-zinc-900">
            {stats.totalSessions}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Online Now
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-700">
            {stats.activeSessions}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Avg Duration
          </span>
          <div className="mt-2 text-2xl font-black text-zinc-900 font-mono">
            {formatDuration(stats.avgDurationSeconds)}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Total Time Logged
          </span>
          <div className="mt-2 text-2xl font-black text-zinc-900 font-mono">
            {formatDuration(stats.totalDurationSeconds)}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
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
            onKeyDown={(e) => e.key === 'Enter' && loadSessions()}
            placeholder="Search by user or login ID..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm outline-none transition-all focus:border-[#cc2627] focus:ring-4 focus:ring-[#cc2627]/10"
        >
          <option value="All statuses">All statuses</option>
          <option value="Active">Active Online</option>
          <option value="Completed">Completed (Logged Out)</option>
          <option value="Timed Out">Timed Out</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#cc2627]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#cc2627]"
          />
        </div>

        <button
          type="button"
          onClick={loadSessions}
          className="rounded-xl bg-[#cc2627] hover:bg-[#b31e1e] text-white px-5 py-2.5 text-sm font-bold transition shadow-sm"
        >
          Filter
        </button>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-4 whitespace-nowrap">User</th>
                <th className="px-4 py-4 whitespace-nowrap">Login ID / Email</th>
                <th className="px-4 py-4 whitespace-nowrap">Login Time</th>
                <th className="px-4 py-4 whitespace-nowrap">Last Active Time</th>
                <th className="px-4 py-4 text-center whitespace-nowrap">Session Duration</th>
                <th className="px-4 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-4 whitespace-nowrap">IP / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#cc2627]/20 border-t-[#cc2627]" />
                      <span>Loading session logs...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 font-medium">
                    No session logs found for the selected criteria.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.status === 'Active';
                  return (
                    <tr key={sess._id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-900 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                        {sess.userName || sess.loginId}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-700">
                        {sess.loginId}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-800 whitespace-nowrap">
                        {formatDateTime(sess.loginTime)}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap">
                        {formatDateTime(sess.lastActiveTime)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {formatDuration(sess.durationSeconds)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : sess.status === 'Completed'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {sess.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-zinc-500 max-w-[220px] truncate" title={`${sess.ipAddress} - ${sess.userAgent}`}>
                        <div className="font-semibold text-zinc-700">{sess.ipAddress || 'Local'}</div>
                        <div className="truncate text-zinc-400">{sess.userAgent || 'Web Browser'}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

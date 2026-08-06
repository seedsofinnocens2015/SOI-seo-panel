'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchPanelLeads } from '../../lib/leadApi';
import { downloadExcelWorkbook } from '../../lib/leadExport';

const WEBSITE_COLUMNS = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['center', 'Center'],
  ['message', 'Message'],
  ['utm_source', 'UTM Source'],
  ['utm_medium', 'UTM Medium'],
  ['utm_campaign', 'UTM Campaign'],
];

const LANDING_COLUMNS = [
  ['name', 'Full Name'],
  ['phone', 'Phone Number'],
  ['center', 'Center'],
  ['source', 'Source'],
  ['utm_source', 'UTM Source'],
  ['utm_medium', 'UTM Medium'],
  ['utm_campaign', 'UTM Campaign'],
];

const SURGICAL_COLUMNS = [
  ['name', 'Name'],
  ['phone', 'Phone Number'],
  ['center', 'Center'],
  ['message', 'Message'],
  ['source', 'Source'],
];

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function getIndiaDateKey(value) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function hasUtmData(lead) {
  return ['utm_source', 'utm_medium', 'utm_campaign'].some(
    (key) => String(lead[key] || '').trim() !== ''
  );
}

export default function LeadsTable({ type }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);
  const columns =
    type === 'website'
      ? WEBSITE_COLUMNS
      : type === 'surgical-center'
        ? SURGICAL_COLUMNS
        : LANDING_COLUMNS;
  const title =
    type === 'website'
      ? 'Website Leads'
      : type === 'surgical-center'
        ? 'Surgical Center Leads'
        : 'Landing Page Leads';

  useEffect(() => {
    let cancelled = false;
    fetchPanelLeads(type)
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (selectedDate && getIndiaDateKey(lead.createdAt) !== selectedDate) return false;
      const isUtmLead = hasUtmData(lead);
      if (leadFilter === 'utm' && !isUtmLead) return false;
      if (leadFilter === 'organic' && isUtmLead) return false;
      if (!needle) return true;
      return [...columns.map(([key]) => lead[key]), lead.createdAt]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [columns, leadFilter, leads, query, selectedDate]);

  const filterCounts = useMemo(() => {
    const dateLeads = selectedDate
      ? leads.filter((lead) => getIndiaDateKey(lead.createdAt) === selectedDate)
      : leads;
    const utm = dateLeads.filter(hasUtmData).length;
    return { all: dateLeads.length, utm, organic: dateLeads.length - utm };
  }, [leads, selectedDate]);

  const exportData = useMemo(
    () => ({
      title,
      filter: `${leadFilter}-${selectedDate || 'all-dates'}`,
      headers: ['Submitted', ...columns.map(([, label]) => label)],
      rows: filteredLeads.map((lead) => [
        formatDate(lead.createdAt),
        ...columns.map(([key]) => lead[key] || ''),
      ]),
    }),
    [columns, filteredLeads, leadFilter, selectedDate, title]
  );

  async function handleExcelDownload() {
    setExportingExcel(true);
    try {
      await downloadExcelWorkbook(exportData);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-r from-white to-[#fff3f6] p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2EA6F7]">Lead Management</p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{leads.length} total submissions</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leads..."
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20 sm:max-w-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        {[
          ['all', 'All Leads'],
          ['utm', 'UTM'],
          ['organic', 'Organic'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setLeadFilter(value)}
            aria-pressed={leadFilter === value}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              leadFilter === value
                ? 'bg-[#cc2727] text-white shadow-sm'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                leadFilter === value ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              {filterCounts[value]}
            </span>
          </button>
        ))}
        <p className="ml-auto px-2 text-xs text-zinc-500">
          Showing {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Lead Date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
            />
          </label>
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            disabled={!selectedDate}
            className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            All Dates
          </button>
        </div>
        <button
          type="button"
          onClick={handleExcelDownload}
          disabled={loading || exportingExcel || filteredLeads.length === 0}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportingExcel ? 'Preparing Excel...' : 'Download Excel'}
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading leads...</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="max-h-[65vh] overflow-auto">
            <table className="min-w-max w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr>
                  <th className="border-b border-zinc-200 px-3 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Submitted</th>
                  {columns.map(([key, label]) => (
                    <th key={key} className="border-b border-zinc-200 px-3 py-3 text-left text-xs font-semibold uppercase text-zinc-500">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="border-b border-zinc-100 align-top even:bg-zinc-50/50 hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-600">{formatDate(lead.createdAt)}</td>
                    {columns.map(([key]) => (
                      <td key={key} className={`max-w-sm px-3 py-3 text-sm text-zinc-800 ${key === 'phone' ? 'whitespace-nowrap font-semibold' : 'break-words'}`}>
                        {lead[key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-500">No leads found.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

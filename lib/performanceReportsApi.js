import { getAuthToken, getPanelApiBaseUrl } from './authApi';

const BASE_PATH = '/api/performance-reports';

function buildUrl(path = '') {
  return `${getPanelApiBaseUrl()}${BASE_PATH}${path}`;
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPerformanceReport(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.recruiter && params.recruiter !== 'All recruiters') {
    searchParams.set('recruiter', params.recruiter);
  }
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const qs = searchParams.toString();
  const res = await fetch(buildUrl(qs ? `?${qs}` : ''), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to fetch performance report');
  }
  return payload.data;
}

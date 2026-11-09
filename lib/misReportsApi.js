import { getAuthToken, getPanelApiBaseUrl } from './authApi';

const BASE_PATH = '/api/mis-reports';

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

export async function fetchMisReport(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const qs = searchParams.toString();
  const res = await fetch(buildUrl(qs ? `?${qs}` : ''), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to fetch MIS report');
  }
  return payload.data;
}

export async function fetchMisDownloadData(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.dateBasis) searchParams.set('dateBasis', params.dateBasis);
  if (params.dataset) searchParams.set('dataset', params.dataset);

  const qs = searchParams.toString();
  const res = await fetch(buildUrl(`/download${qs ? `?${qs}` : ''}`), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to download MIS data');
  }
  return payload.data;
}

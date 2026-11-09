import { getAuthToken, getPanelApiBaseUrl } from './authApi';

const BASE_PATH = '/api/user-sessions';

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

export async function sendSessionHeartbeat(sessionId = null) {
  const res = await fetch(buildUrl('/heartbeat'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
    cache: 'no-store',
  });
  const payload = await res.json().catch(() => null);
  return payload?.data;
}

export async function endSessionRecord(sessionId = null) {
  const res = await fetch(buildUrl('/logout'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
    cache: 'no-store',
  });
  const payload = await res.json().catch(() => null);
  return payload;
}

export async function fetchUserSessions(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.user && params.user !== 'All users') searchParams.set('user', params.user);
  if (params.status && params.status !== 'All statuses') searchParams.set('status', params.status);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const qs = searchParams.toString();
  const res = await fetch(buildUrl(qs ? `?${qs}` : ''), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to fetch user sessions');
  }
  return payload;
}

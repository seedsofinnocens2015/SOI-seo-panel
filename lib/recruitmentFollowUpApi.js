import { getAuthToken, getPanelApiBaseUrl } from './authApi';

const BASE_PATH = '/api/recruitment-follow-up';

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

export async function fetchFollowUps(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.centre && params.centre !== 'All centres') searchParams.set('centre', params.centre);

  const qs = searchParams.toString();
  const res = await fetch(buildUrl(qs ? `?${qs}` : ''), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to fetch follow-ups');
  }
  return payload.data || [];
}

export async function createFollowUp(data) {
  const res = await fetch(buildUrl(), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to create follow-up');
  }
  return payload.data;
}

export async function updateFollowUp(id, data) {
  const res = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to update follow-up');
  }
  return payload.data;
}

export async function deleteFollowUp(id) {
  const res = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to delete follow-up');
  }
  return payload.data;
}

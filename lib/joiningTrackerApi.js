import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJoining(path, options = {}) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Joining Tracker service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete joining request');
  }
  return payload;
}

export async function fetchJoinings(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestJoining(`/api/joining-tracker${qs}`);
}

export async function createJoining(payload) {
  return requestJoining('/api/joining-tracker', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateJoining(id, payload) {
  return requestJoining(`/api/joining-tracker/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteJoining(id) {
  return requestJoining(`/api/joining-tracker/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

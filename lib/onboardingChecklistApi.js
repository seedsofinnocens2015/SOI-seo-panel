import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestChecklist(path, options = {}) {
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
    throw new Error('Onboarding Checklist service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete checklist request');
  }
  return payload;
}

export async function fetchChecklists(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestChecklist(`/api/onboarding-checklist${qs}`);
}

export async function createChecklist(payload) {
  return requestChecklist('/api/onboarding-checklist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateChecklist(id, payload) {
  return requestChecklist(`/api/onboarding-checklist/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteChecklist(id) {
  return requestChecklist(`/api/onboarding-checklist/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

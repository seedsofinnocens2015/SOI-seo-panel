import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestOffer(path, options = {}) {
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
    throw new Error('Offer Tracker service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete offer request');
  }
  return payload;
}

export async function fetchOffers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestOffer(`/api/offer-tracker${qs}`);
}

export async function createOffer(payload) {
  return requestOffer('/api/offer-tracker', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOffer(id, payload) {
  return requestOffer(`/api/offer-tracker/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteOffer(id) {
  return requestOffer(`/api/offer-tracker/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

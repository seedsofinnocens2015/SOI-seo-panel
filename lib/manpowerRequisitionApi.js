import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestRequisitions(path, options = {}) {
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
    throw new Error('Manpower Requisition service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete requisition request');
  }
  return payload;
}

export async function fetchRequisitions(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestRequisitions(`/api/manpower-requisitions${qs}`);
}

export async function fetchNextReqId() {
  const res = await requestRequisitions('/api/manpower-requisitions/next-id');
  return res?.data?.nextReqId || 'REQ-0001';
}

export async function createRequisition(payload) {
  return requestRequisitions('/api/manpower-requisitions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRequisition(id, payload) {
  return requestRequisitions(`/api/manpower-requisitions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRequisition(id) {
  return requestRequisitions(`/api/manpower-requisitions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

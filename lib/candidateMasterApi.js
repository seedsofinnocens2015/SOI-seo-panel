import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestCandidate(path, options = {}) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Candidate Master service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete candidate request');
  }
  return payload;
}

export async function fetchCandidates(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestCandidate(`/api/candidate-master${qs}`);
}

export async function fetchNextCandidateId() {
  const res = await requestCandidate('/api/candidate-master/next-id');
  return res?.data?.nextCandidateId || 'CAN-0001';
}

export async function createCandidate(data, file) {
  let body;
  if (file) {
    body = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
    body.append('resume', file);
  } else {
    body = JSON.stringify(data);
  }

  return requestCandidate('/api/candidate-master', {
    method: 'POST',
    body,
  });
}

export async function updateCandidate(id, data, file) {
  let body;
  if (file) {
    body = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
    body.append('resume', file);
  } else {
    body = JSON.stringify(data);
  }

  return requestCandidate(`/api/candidate-master/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
}

export async function deleteCandidate(id) {
  return requestCandidate(`/api/candidate-master/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

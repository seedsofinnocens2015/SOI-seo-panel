import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestInterview(path, options = {}) {
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
    throw new Error('Interview Tracker service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete interview request');
  }
  return payload;
}

export async function fetchInterviewRoundWise(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres' && val !== 'All rounds') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestInterview(`/api/interview-tracker${qs}`);
}

export async function fetchInterviewCandidateWise(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres' && val !== 'All stages') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestInterview(`/api/interview-tracker/candidate-wise${qs}`);
}

export async function createInterview(payload) {
  return requestInterview('/api/interview-tracker', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInterview(id, payload) {
  return requestInterview(`/api/interview-tracker/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteInterview(id) {
  return requestInterview(`/api/interview-tracker/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJobs(path, options = {}) {
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
    throw new Error('Jobs service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete jobs request');
  }
  return payload.data;
}

function fetchManagedJobs() {
  return requestJobs('/api/jobs/manage');
}

function createJob(payload) {
  return requestJobs('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });
}

function updateJob(id, payload) {
  return requestJobs(`/api/jobs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

function deleteJob(id) {
  return requestJobs(`/api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export { fetchManagedJobs, createJob, updateJob, deleteJob };

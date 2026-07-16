import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestApplications(path, options = {}) {
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
    throw new Error('Applications service is unreachable.');
  }
  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete application request');
  }
  return payload.data;
}

function fetchManagedApplications() {
  return requestApplications('/api/job-applications/manage');
}

function updateApplicationStatus(id, status) {
  return requestApplications(`/api/job-applications/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function downloadApplicationResume(id, fileName = 'resume') {
  const token = getAuthToken();
  const response = await fetch(
    `${getPanelApiBaseUrl()}/api/job-applications/${encodeURIComponent(id)}/resume`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw new Error(payload?.error || 'Unable to download resume');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'resume';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export { fetchManagedApplications, updateApplicationStatus, downloadApplicationResume };

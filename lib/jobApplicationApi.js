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

function updateApplication(id, application) {
  return requestApplications(`/api/job-applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(application),
  });
}

function deleteApplication(id) {
  return requestApplications(`/api/job-applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

async function fetchApplicationResumeBlob(id) {
  const token = getAuthToken();
  const response = await fetch(
    `${getPanelApiBaseUrl()}/api/job-applications/${encodeURIComponent(id)}/resume`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw new Error(payload?.error || 'Unable to download resume');
  }
  return response.blob();
}

async function downloadApplicationResume(id, fileName = 'resume') {
  const blob = await fetchApplicationResumeBlob(id);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'resume';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

async function viewApplicationResume(id) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    throw new Error('Please allow pop-ups to view the resume.');
  }
  previewWindow.opener = null;
  previewWindow.document.title = 'Loading resume...';
  previewWindow.document.body.innerHTML =
    '<p style="font-family:Arial,sans-serif;padding:24px;color:#444">Loading resume...</p>';

  try {
    const blob = await fetchApplicationResumeBlob(id);
    const url = window.URL.createObjectURL(blob);
    previewWindow.location.replace(url);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}

export {
  deleteApplication,
  downloadApplicationResume,
  fetchManagedApplications,
  updateApplication,
  updateApplicationStatus,
  viewApplicationResume,
};

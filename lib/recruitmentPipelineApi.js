import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestPipeline(path, options = {}) {
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
    throw new Error('Recruitment Pipeline service is unreachable.');
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to complete recruitment pipeline request');
  }
  return payload;
}

export async function fetchRecruitmentPipeline(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All centres') {
      query.append(key, val);
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return requestPipeline(`/api/recruitment-pipeline${qs}`);
}

export async function createPipelineEntry(payload) {
  return requestPipeline('/api/recruitment-pipeline', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePipelineEntry(id, payload) {
  return requestPipeline(`/api/recruitment-pipeline/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePipelineEntry(id) {
  return requestPipeline(`/api/recruitment-pipeline/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

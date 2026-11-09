import { getAuthToken, getPanelApiBaseUrl } from './authApi';

const BASE_PATH = '/api/master-settings';

function buildUrl(path = '') {
  return `${getPanelApiBaseUrl()}${BASE_PATH}${path}`;
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path = '', options = {}) {
  const res = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed request to master settings');
  }
  return payload;
}

export async function fetchMasterSettings() {
  const payload = await request();
  return payload.data;
}

export async function saveDropdownList(key, items) {
  const payload = await request('/dropdown', {
    method: 'POST',
    body: JSON.stringify({ key, items }),
  });
  return payload;
}

export async function saveLetterTemplate(type, template) {
  const payload = await request('/template', {
    method: 'POST',
    body: JSON.stringify({ type, template }),
  });
  return payload;
}

export async function resetLetterTemplate(type) {
  const payload = await request('/template/reset', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
  return payload.template;
}

export async function saveGeneralSettings(settings) {
  const payload = await request('/general', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return payload.data;
}

export async function fetchCompanies() {
  const payload = await request('/companies');
  return payload.data;
}

export async function createCompany(companyData) {
  const payload = await request('/companies', {
    method: 'POST',
    body: JSON.stringify(companyData),
  });
  return payload.data;
}

export async function updateCompany(id, companyData) {
  const payload = await request(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  });
  return payload.data;
}

export async function deleteCompany(id) {
  const payload = await request(`/companies/${id}`, {
    method: 'DELETE',
  });
  return payload;
}

export async function saveSignatory(companyId, signatoryData) {
  const payload = await request(`/companies/${companyId}/signatories`, {
    method: 'POST',
    body: JSON.stringify(signatoryData),
  });
  return payload.data;
}

export async function deleteSignatory(companyId, signatoryId) {
  const payload = await request(`/companies/${companyId}/signatories/${signatoryId}`, {
    method: 'DELETE',
  });
  return payload.data;
}

import { getAuthToken } from './authApi';
const API_BASE_URL = 'https://seeds.seedsofinnocens.com';

function buildSeoUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function normalizePageUrl(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '/';
  if (trimmed === 'common') return 'common';
  return trimmed.replace(/\/+$/, '');
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchSeo(pageUrl, hierarchyPath = []) {
  const normalizedPageUrl = normalizePageUrl(pageUrl);
  const url = buildSeoUrl(
    `/api/seo?pageUrl=${encodeURIComponent(normalizedPageUrl)}&hierarchyPath=${encodeURIComponent(
      JSON.stringify(hierarchyPath)
    )}`
  );
  let response;

  try {
    const token = getAuthToken();
    response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('Failed to fetch SEO data. Backend API is unreachable.');
  }

  const data = await parseJsonSafely(response);

  if (!response.ok || !data?.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login again.');
    }
    throw new Error(data?.error || 'Failed to fetch SEO data');
  }

  return data.data;
}

async function saveSeo(payload) {
  const normalizedPayload = {
    ...payload,
    pageUrl: normalizePageUrl(payload?.pageUrl),
    hierarchyPath: Array.isArray(payload?.hierarchyPath) ? payload.hierarchyPath : [],
  };
  let response;

  try {
    const token = getAuthToken();
    response = await fetch(buildSeoUrl('/api/seo'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(normalizedPayload),
    });
  } catch {
    throw new Error('Failed to save SEO data. Backend API is unreachable.');
  }

  const data = await parseJsonSafely(response);
  if (!response.ok || !data?.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login again.');
    }
    throw new Error(data?.error || 'Failed to save SEO data');
  }

  return data.data;
}

async function fetchSeoStats(pageUrls = []) {
  const safePageUrls = Array.isArray(pageUrls) ? pageUrls : [];
  const url = buildSeoUrl(`/api/seo/stats?pageUrls=${encodeURIComponent(JSON.stringify(safePageUrls))}`);
  let response;

  try {
    const token = getAuthToken();
    response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('Failed to fetch SEO stats. Backend API is unreachable.');
  }

  const data = await parseJsonSafely(response);
  if (!response.ok || !data?.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login again.');
    }
    throw new Error(data?.error || 'Failed to fetch SEO stats');
  }

  return data.data;
}

export { fetchSeo, saveSeo, fetchSeoStats };

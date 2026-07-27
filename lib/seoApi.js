import { getAuthToken } from './authApi';
const API_BASE_URL = 'https://seeds.seedsofinnocens.com';
// const API_BASE_URL = 'http://localhost:4000';

function buildSeoUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/** Legacy paths → current canonical paths (keep in sync with SOI_Main_Website redirects). */
const PAGE_URL_ALIASES = {
  '/reproductive-health-conditions/what-is-ovarian-hyperstimulation':
    '/reproductive-health-conditions/ovarian-hyperstimulation-syndrome-ohss',
  '/fertility-wellness/yoga-and-fertility-heres-how-yoga-can-support-fertility':
    '/fertility-wellness/yoga-for-fertility',
  '/ivf-doctor/dr-pratik-kakani-ivf-specialists': '/ivf-doctor/dr-pratik-kakani-gynae-endoscopy',
  '/reproductive-health-conditions/tuberculosis': '/reproductive-health-conditions/female-genital-tuberculosis',
};

function normalizePageUrl(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '/';
  if (trimmed === 'common') return 'common';
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return PAGE_URL_ALIASES[withoutTrailingSlash] || withoutTrailingSlash;
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
  let response;

  try {
    const token = getAuthToken();
    response = await fetch(buildSeoUrl('/api/seo/stats'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pageUrls: safePageUrls }),
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

export { fetchSeo, saveSeo, fetchSeoStats, normalizePageUrl };

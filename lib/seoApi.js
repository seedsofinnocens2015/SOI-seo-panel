function resolveApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_SEO_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_SEO_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return 'http://localhost:4000';
}

function buildSeoUrl(path) {
  const API_BASE_URL = resolveApiBaseUrl();
  return `${API_BASE_URL}${path}`;
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

async function fetchSeo(pageUrl) {
  const url = buildSeoUrl(`/api/seo?pageUrl=${encodeURIComponent(pageUrl)}`);
  let response;

  try {
    response = await fetch(url, { method: 'GET' });
  } catch (_networkError) {
    throw new Error('Failed to fetch SEO data. Backend API is unreachable.');
  }

  const data = await parseJsonSafely(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to fetch SEO data');
  }

  return data.data;
}

async function saveSeo(payload) {
  let response;

  try {
    response = await fetch(buildSeoUrl('/api/seo'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (_networkError) {
    throw new Error('Failed to save SEO data. Backend API is unreachable.');
  }

  const data = await parseJsonSafely(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to save SEO data');
  }

  return data.data;
}

export { fetchSeo, saveSeo };

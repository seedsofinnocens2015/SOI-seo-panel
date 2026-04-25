const API_BASE_URL = process.env.NEXT_PUBLIC_SEO_API_BASE_URL || 'http://localhost:4000';

function buildSeoUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function fetchSeo(pageUrl) {
  const url = buildSeoUrl(`/api/seo?pageUrl=${encodeURIComponent(pageUrl)}`);
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to fetch SEO data');
  }

  return data.data;
}

async function saveSeo(payload) {
  const response = await fetch(buildSeoUrl('/api/seo'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to save SEO data');
  }

  return data.data;
}

export { fetchSeo, saveSeo };

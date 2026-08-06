import { getAuthToken, getPanelApiBaseUrl } from './authApi';

export async function fetchPanelLeads(type) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(
      `${getPanelApiBaseUrl()}/api/panel-leads?type=${encodeURIComponent(type)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
  } catch {
    throw new Error('Leads service is unreachable.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The error below provides a consistent message for non-JSON responses.
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to load leads.');
  }
  return Array.isArray(payload.data) ? payload.data : [];
}

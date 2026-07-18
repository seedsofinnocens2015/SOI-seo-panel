import { getAuthToken, getPanelApiBaseUrl } from './authApi';

async function fetchPanelUsers(panelRole) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}/api/seo-auth/users/${panelRole}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
  } catch {
    throw new Error('Panel users service is unreachable.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to load panel users');
  }
  return Array.isArray(payload.data) ? payload.data : [];
}

async function updatePanelUser(userId, changes) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}/api/seo-auth/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(changes),
    });
  } catch {
    throw new Error('Panel users service is unreachable.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to update panel user');
  }
  return payload.data;
}

async function deletePanelUser(userId) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}/api/seo-auth/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('Panel users service is unreachable.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Unable to delete panel user');
  }
  return payload.data;
}

export { fetchPanelUsers, updatePanelUser, deletePanelUser };

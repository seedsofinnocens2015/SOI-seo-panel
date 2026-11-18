const AUTH_TOKEN_KEY = 'seoPanelAuthToken';
const AUTH_USER_KEY = 'seoPanelAuthUser';
const API_BASE_URL = 'https://seeds.seedsofinnocens.com';
// const API_BASE_URL = 'http://localhost:4000';

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getPanelApiBaseUrl() {
  return API_BASE_URL;
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestAuth(path, payload) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Auth service unreachable.');
  }

  const data = await parseJsonSafely(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Authentication failed');
  }

  return data.data;
}

function saveAuthSession(session) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user || {}));
}

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

async function requestSignupOtp(payload) {
  return requestAuth('/api/seo-auth/signup/request-otp', payload);
}

async function verifySignupOtp(payload) {
  return requestAuth('/api/seo-auth/signup/verify-otp', payload);
}

async function requestLoginOtp(payload) {
  return requestAuth('/api/seo-auth/login/request-otp', payload);
}

async function verifyLoginOtp(payload) {
  return requestAuth('/api/seo-auth/login/verify-otp', payload);
}

async function requestPasswordResetOtp(payload) {
  return requestAuth('/api/seo-auth/password/forgot/request-otp', payload);
}

async function resetPasswordWithOtp(payload) {
  return requestAuth('/api/seo-auth/password/forgot/reset', payload);
}

async function fetchCurrentUserProfile() {
  const token = getAuthToken();
  if (!token) return null;
  let response;
  try {
    response = await fetch(`${getPanelApiBaseUrl()}/api/seo-auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  const payload = await response.json().catch(() => null);
  if (response.ok && payload?.ok && payload?.data) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.data));
    }
    return payload.data;
  }
  return null;
}

export {
  requestSignupOtp,
  verifySignupOtp,
  requestLoginOtp,
  verifyLoginOtp,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  saveAuthSession,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  fetchCurrentUserProfile,
  getPanelApiBaseUrl,
};

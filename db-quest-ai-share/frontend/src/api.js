// Thin fetch wrapper for the backend API.
// Automatically attaches the JWT (Authorization) and the selected team (X-Team-Id)
// to every request, and routes 401s to a logout handler registered by AuthContext.

const TOKEN_KEY = 'dbquest_token';
const TEAM_KEY = 'dbquest_team_id';

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getTeamId() {
  return localStorage.getItem(TEAM_KEY);
}
export function setTeamId(id) {
  if (id != null) localStorage.setItem(TEAM_KEY, String(id));
  else localStorage.removeItem(TEAM_KEY);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const teamId = getTeamId();
  if (teamId) headers['X-Team-Id'] = teamId;

  const isForm = options.body instanceof FormData;
  if (!isForm && options.body != null) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, { ...options, headers });

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    let detail;
    try {
      detail = (await response.json()).detail;
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

export const apiGet = (path) => request(path, { method: 'GET' });
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined });
export const apiDelete = (path) => request(path, { method: 'DELETE' });
export const apiUpload = (path, formData) => request(path, { method: 'POST', body: formData });

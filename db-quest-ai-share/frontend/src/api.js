// Thin API client for the DB Quest AI backend.
// Uses relative URLs; the Vite dev server proxies /api to the FastAPI backend.

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const opts = { method, headers: {} }
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  } else if (body && isForm) {
    opts.body = body
  }
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  health: () => request('/api/health'),

  // Missions
  listMissions: () => request('/api/missions'),
  getMission: (id) => request(`/api/missions/${id}`),
  generateMission: (payload) =>
    request('/api/missions/generate', { method: 'POST', body: payload }),
  interact: (payload) => request('/api/missions/interact', { method: 'POST', body: payload }),
  hint: (payload) => request('/api/missions/hint', { method: 'POST', body: payload }),
  evaluate: (payload) => request('/api/missions/evaluate', { method: 'POST', body: payload }),
  report: (payload) => request('/api/missions/report', { method: 'POST', body: payload }),

  // Digital Colleague
  ask: (payload) => request('/api/colleague/ask', { method: 'POST', body: payload }),
  onboarding: (payload) => request('/api/colleague/onboarding', { method: 'POST', body: payload }),
  acronym: (payload) => request('/api/colleague/acronym', { method: 'POST', body: payload }),
  expert: (payload) => request('/api/colleague/expert', { method: 'POST', body: payload }),

  // Documents
  listDocuments: () => request('/api/documents'),
  uploadDocument: (formData) =>
    request('/api/documents/upload', { method: 'POST', body: formData, isForm: true }),
  pasteDocument: (payload) =>
    request('/api/documents/paste', { method: 'POST', body: payload }),
  summarize: (payload) => request('/api/documents/summarize', { method: 'POST', body: payload }),
}

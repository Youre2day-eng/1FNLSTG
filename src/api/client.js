// Single place for all API calls. All requests go to /api/* which Cloudflare
// Pages Functions handle. Dev mode proxies to your live deploy (see vite.config.js).

const adminToken = () => sessionStorage.getItem('fsp_admin_token') || '';

async function req(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (auth) headers.authorization = 'Bearer ' + adminToken();

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `${method} ${path} ${res.status}`);
  }
  return json;
}

export const api = {
  getState: () => req('/api/state').then(j => j.state || {}),
  saveState: (state) => req('/api/state', { method: 'POST', body: state, auth: true }),
  getTracks: () => req('/api/tracks').then(j => j.tracks || []),
  submitBooking: (payload) => req('/api/send-booking', { method: 'POST', body: payload }),
  submitQuote: (payload) => req('/api/send-quote', { method: 'POST', body: payload }),
  setAdminToken: (tok) => sessionStorage.setItem('fsp_admin_token', tok),
  clearAdminToken: () => sessionStorage.removeItem('fsp_admin_token'),
};

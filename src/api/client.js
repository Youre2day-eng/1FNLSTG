// src/api/client.js
// All API calls. /api/* handled by Cloudflare Pages Functions.
// Dev: Vite proxies /api/* to fnlstg.pages.dev (see vite.config.js).

const TOKEN_KEY = 'fsp_admin_token';

const getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

async function req(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (auth) headers.authorization = 'Bearer ' + getToken();

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `${method} ${path} → ${res.status}`);
  }
  return json;
}

export const api = {
  // ── Auth (per-device session) ─────────────────────────────────────────────
  // Login: POST /api/auth with username + password → stores token in sessionStorage
  login: async (username, password) => {
    const data = await req('/api/auth', { method: 'POST', body: { username, password } });
    setToken(data.token);
    return data;
  },
  logout: () => clearToken(),
  isLoggedIn: () => !!getToken(),

  // ── Global site state (Cloudflare KV) ────────────────────────────────────
  // Any visitor can read. Only host (with token) can write.
  // State includes: b1, b2, tag, loc, cats, svcs, imgs, ts, cd, creds,
  //                 phone, email, ig, pt, dep, pay, pyn, pw, pages, etc.
  getState: () => req('/api/state').then(j => j.state || {}),
  saveState: (state) => req('/api/state', { method: 'POST', body: state, auth: true }),

  // ── Music tracks ─────────────────────────────────────────────────────────
  getTracks: () => req('/api/tracks').then(j => j.tracks || []),

  // ── Bookings / quotes ─────────────────────────────────────────────────────
  submitBooking: (payload) => req('/api/send-booking', { method: 'POST', body: payload }),
  submitQuote:   (payload) => req('/api/send-quote',   { method: 'POST', body: payload }),
};

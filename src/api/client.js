// src/api/client.js
// All API calls. /api/* handled by Cloudflare Pages Functions.
// Dev: Vite proxies /api/* to fnlstg.pages.dev (see vite.config.js).

const TOKEN_KEY = 'fsp_admin_token';
const LOCAL_AUTH_KEY = 'fsp_local_admin';
const STATE_CACHE_KEY = 'fsp_local_state';
const BOOKINGS_CACHE_KEY = 'fsp_local_bookings';

const getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);
const setLocalAuth = (v) => sessionStorage.setItem(LOCAL_AUTH_KEY, v ? '1' : '');
const getLocalAuth = () => sessionStorage.getItem(LOCAL_AUTH_KEY) === '1';

function getLocalState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_CACHE_KEY) || '{}');
  } catch (e) {
    console.warn('Failed to parse local state cache:', e);
    return {};
  }
}

function setLocalState(state) {
  localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(state || {}));
}

function getLocalBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_CACHE_KEY) || '[]');
  } catch (e) {
    console.warn('Failed to parse local bookings cache:', e);
    return [];
  }
}

function setLocalBookings(bookings) {
  localStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify(bookings || []));
}

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
    try {
      const data = await req('/api/auth', { method: 'POST', body: { username, password } });
      setToken(data.token);
      setLocalAuth(false);
      return data;
    } catch (e) {
      console.warn('Remote login failed, trying local fallback:', e);
      const state = getLocalState();
      const validUser = username === (state.adminUser || 'host');
      const validPass = password === state.pw;
      if (!validUser || !validPass) throw e;
      setLocalAuth(true);
      return { ok: true, token: '' };
    }
  },
  logout: () => {
    clearToken();
    setLocalAuth(false);
  },
  isLoggedIn: () => !!getToken() || getLocalAuth(),

  // ── Global site state (Cloudflare KV) ────────────────────────────────────
  // Any visitor can read. Only host (with token) can write.
  getState: async () => {
    try {
      const j = await req('/api/state');
      const state = j.state || {};
      setLocalState(state);
      return state;
    } catch (e) {
      console.warn('Failed to load remote state, using local fallback:', e);
      return getLocalState();
    }
  },
  saveState: async (state) => {
    setLocalState(state);
    try {
      return await req('/api/state', { method: 'POST', body: state, auth: true });
    } catch (e) {
      console.warn('Failed to save remote state, preserving local cache:', e);
      return { ok: true, local: true };
    }
  },

  // ── Bookings ──────────────────────────────────────────────────────────────
  // GET all bookings (protected)
  getBookings: async () => {
    try {
      const j = await req('/api/bookings', { auth: true });
      const bookings = j.bookings || [];
      setLocalBookings(bookings);
      return bookings;
    } catch (e) {
      console.warn('Failed to load remote bookings, using local fallback:', e);
      return getLocalBookings();
    }
  },
  // POST new booking (public) — receives payload, backend assigns id/timestamp/status
  submitBooking: async (payload) => {
    try {
      const j = await req('/api/bookings', { method: 'POST', body: payload });
      const booking = j.booking;
      if (booking) setLocalBookings([...getLocalBookings(), booking]);
      return j;
    } catch (e) {
      console.warn('Failed to submit remote booking, creating local booking:', e);
      const bookings = getLocalBookings();
      const booking = {
        ...payload,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        history: [{ at: new Date().toISOString(), by: 'system', action: 'created', note: 'Booking received' }],
      };
      setLocalBookings([...bookings, booking]);
      return { ok: true, booking, local: true };
    }
  },
  // PATCH booking status: { id, status } where status is "approved" or "denied" (protected)
  updateBooking: async (id, status, note = '') => {
    try {
      const j = await req('/api/bookings', { method: 'PATCH', body: { id, status, note }, auth: true });
      const bookings = getLocalBookings().map((b) => (b.id === id ? j.booking : b));
      setLocalBookings(bookings);
      return j;
    } catch (e) {
      console.warn('Failed to update remote booking, applying local update:', e);
      const now = new Date().toISOString();
      const bookings = getLocalBookings().map((b) => {
        if (b.id !== id) return b;
        const history = [...(b.history || []), { at: now, by: 'admin', action: status, note }];
        return { ...b, status, note, history };
      });
      const booking = bookings.find((b) => b.id === id);
      setLocalBookings(bookings);
      return { ok: true, booking, local: true };
    }
  },

  // ── Music tracks ─────────────────────────────────────────────────────────
  getTracks: () => req('/api/tracks').then((j) => j.tracks || []),
};

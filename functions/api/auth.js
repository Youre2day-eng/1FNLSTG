// POST /api/auth
// Checks username + password against KV state.pw and state.adminUser
// Whitelist: state.whitelist = ["username1", "username2"]

const STATE_KEY = 'fsp_state';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ ok: false, error: 'Username and password required.' }, 400);

    const raw = await env.ADMIN_TOKEN.get(STATE_KEY);
    const state = raw ? JSON.parse(raw) : {};

    // Check whitelist if it exists
    const whitelist = state.whitelist || [];
    if (whitelist.length > 0 && !whitelist.includes(username)) {
      return json({ ok: false, error: 'Access denied.' }, 403);
    }

    // Check credentials
    const validUser = username === (state.adminUser || 'host');
    const validPass = password === state.pw;

    if (!validUser || !validPass) return json({ ok: false, error: 'Wrong credentials.' }, 401);

    // Return state.pw as the bearer token (matches what state.js validates against)
    return json({ ok: true, token: state.pw });
  } catch (e) {
    return json({ ok: false, error: 'Server error.' }, 500);
  }
}

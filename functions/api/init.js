// POST /api/init
// Sets the initial host password when KV state is empty.
// Requires the Cloudflare ADMIN_TOKEN env var as a bootstrap secret.
// Once pw is set in KV, this endpoint refuses to overwrite it
// unless the correct current password is provided.

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
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { bootstrapToken, username, password } = await request.json();

    if (!password || password.length < 6) return json({ ok: false, error: 'Password must be at least 6 characters.' }, 400);
    if (!username || username.length < 2) return json({ ok: false, error: 'Username required.' }, 400);

    const raw = await env.CONFIG.get(STATE_KEY);
    const state = raw ? JSON.parse(raw) : {};

    // If pw already set, require the bootstrap token to reset
    if (state.pw && bootstrapToken !== env.ADMIN_TOKEN) {
      return json({ ok: false, error: 'Password already set. Use host dashboard to change it.' }, 403);
    }

    // Save username + password into KV state
    state.pw = password;
    state.adminUser = username;
    await env.CONFIG.put(STATE_KEY, JSON.stringify(state));

    return json({ ok: true, message: 'Host credentials saved. You can now log in.' });
  } catch (e) {
    return json({ ok: false, error: 'Server error: ' + e.message }, 500);
  }
}

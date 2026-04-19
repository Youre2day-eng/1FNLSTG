const STATE_KEY = 'fsp_state';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
}

export async function onRequestGet({ env }) {
  try {
    const raw = await env.ADMIN_TOKEN.get(STATE_KEY);
    const state = raw ? JSON.parse(raw) : {};
    return json({ ok: true, state });
  } catch (e) {
    return json({ ok: false, error: 'Failed to read state.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();

    // Auth: check bearer token against state.pw in KV
    const raw = await env.ADMIN_TOKEN.get(STATE_KEY);
    const state = raw ? JSON.parse(raw) : {};
    if (!token || token !== state.pw) {
      return json({ ok: false, error: 'Unauthorized.' }, 401);
    }

    const newState = await request.json();
    await env.ADMIN_TOKEN.put(STATE_KEY, JSON.stringify(newState));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'Failed to save state.' }, 500);
  }
}

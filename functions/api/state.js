// GET  /api/state  — public, reads site state from KV
// POST /api/state  — protected, writes site state to KV (requires Bearer ADMIN_TOKEN)
//
// KV binding: CONFIG → fnlstg-config namespace (set in Cloudflare Pages → Settings → Bindings)

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

// GET — anyone can read site state
export async function onRequestGet({ env }) {
  try {
    const raw = await env.CONFIG.get(STATE_KEY);
    const state = raw ? JSON.parse(raw) : {};
    return json({ ok: true, state });
  } catch (e) {
    return json({ ok: false, error: 'Failed to read state.' }, 500);
  }
}

// POST — only admin can write
export async function onRequestPost({ request, env }) {
  try {
    // Auth check
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token || token !== env.ADMIN_TOKEN) {
      return json({ ok: false, error: 'Unauthorized.' }, 401);
    }

    const state = await request.json();
    await env.CONFIG.put(STATE_KEY, JSON.stringify(state));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'Failed to save state.' }, 500);
  }
}

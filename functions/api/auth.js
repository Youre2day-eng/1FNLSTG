// POST /api/auth
// Body: { username: string, password: string }
// Checks against ADMIN_USER + ADMIN_TOKEN env vars in Cloudflare.
// Returns { ok: true, token } on success.

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ ok: false, error: 'Username and password required.' }, 400);

    const validUser = username === (env.ADMIN_USER || 'host');
    const validPass = password === env.ADMIN_TOKEN;

    if (!validUser || !validPass) return json({ ok: false, error: 'Wrong credentials.' }, 401);

    return json({ ok: true, token: env.ADMIN_TOKEN });
  } catch (e) {
    return json({ ok: false, error: 'Server error.' }, 500);
  }
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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
  });
}

// POST /api/auth
// Body: { password: string }
// Checks password against ADMIN_TOKEN env var.
// Returns { ok: true, token } on success so the client can store it for writes.

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    if (!password) return json({ ok: false, error: 'No password.' }, 400);

    const valid = password === env.ADMIN_TOKEN;
    if (!valid) return json({ ok: false, error: 'Wrong password.' }, 401);

    return json({ ok: true, token: env.ADMIN_TOKEN });
  } catch (e) {
    return json({ ok: false, error: 'Server error.' }, 500);
  }
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

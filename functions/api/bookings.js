// GET  /api/bookings  — protected (Bearer token), reads booking list from KV
// POST /api/bookings  — public, submits a new booking (appended to list in KV)
// PATCH /api/bookings — protected (Bearer token), updates booking status
//
// KV binding: CONFIG → fnlstg-config namespace (set in Cloudflare Pages → Settings → Bindings)

const BOOKINGS_KEY = 'fsp_bookings';

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
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
}

function isAuthorized(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return token && token === env.ADMIN_TOKEN;
}

// GET — returns all bookings; requires Bearer token
export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }
  try {
    const raw = await env.CONFIG.get(BOOKINGS_KEY);
    const bookings = raw ? JSON.parse(raw) : [];
    return json({ ok: true, bookings });
  } catch (e) {
    return json({ ok: false, error: 'Failed to read bookings.' }, 500);
  }
}

// POST — public; appends new booking with id, timestamp, status:"pending"
export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return json({ ok: false, error: 'Invalid booking payload.' }, 400);
    }

    const raw = await env.CONFIG.get(BOOKINGS_KEY);
    const bookings = raw ? JSON.parse(raw) : [];

    const booking = {
      ...payload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    bookings.push(booking);
    await env.CONFIG.put(BOOKINGS_KEY, JSON.stringify(bookings));

    return json({ ok: true, booking });
  } catch (e) {
    return json({ ok: false, error: 'Failed to submit booking.' }, 500);
  }
}

// PATCH — requires Bearer token; body: { id, status } where status is "approved" or "denied"
export async function onRequestPatch({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return json({ ok: false, error: 'id and status are required.' }, 400);
    }
    if (!['approved', 'denied'].includes(status)) {
      return json({ ok: false, error: 'status must be "approved" or "denied".' }, 400);
    }

    const raw = await env.CONFIG.get(BOOKINGS_KEY);
    const bookings = raw ? JSON.parse(raw) : [];

    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) {
      return json({ ok: false, error: 'Booking not found.' }, 404);
    }

    bookings[idx] = { ...bookings[idx], status };
    await env.CONFIG.put(BOOKINGS_KEY, JSON.stringify(bookings));

    return json({ ok: true, booking: bookings[idx] });
  } catch (e) {
    return json({ ok: false, error: 'Failed to update booking.' }, 500);
  }
}

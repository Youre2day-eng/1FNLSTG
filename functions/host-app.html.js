// Intercepts /host-app.html and forces correct Content-Type.
// Fixes Safari blank page bug.

export async function onRequest(context) {
  const response = await context.env.ASSETS.fetch(context.request);

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

import { allowedHost, json, newSession, safeEqual, sameOrigin, sessionCookie } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!allowedHost(request)) return json({ error: 'Not found' }, 404);
  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (!env.WORKSHOP_PASSWORD || !env.WORKSHOP_SESSION_SECRET) return json({ error: 'Login unavailable' }, 503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Invalid request' }, 400);

  try {
    const body = await request.text();
    if (body.length > 512) return json({ error: 'Invalid request' }, 400);
    const { username, password } = JSON.parse(body);
    if (typeof username !== 'string' || typeof password !== 'string' ||
        !safeEqual(username, 'online18') || !safeEqual(password, env.WORKSHOP_PASSWORD)) {
      return json({ error: 'Invalid credentials' }, 401);
    }
    const session = await newSession(env.WORKSHOP_SESSION_SECRET);
    return json({ loggedIn: true }, 200, { 'Set-Cookie': sessionCookie(session) });
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
}

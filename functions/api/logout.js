import { allowedHost, clearSessionCookie, json, sameOrigin } from '../_lib/auth.js';

export function onRequestPost({ request }) {
  if (!allowedHost(request)) return json({ error: 'Not found' }, 404);
  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);
  return json({ loggedIn: false }, 200, { 'Set-Cookie': clearSessionCookie() });
}

import { allowedHost, json, validSession } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!allowedHost(request)) return json({ error: 'Not found' }, 404);
  return json({ loggedIn: await validSession(request, env) });
}

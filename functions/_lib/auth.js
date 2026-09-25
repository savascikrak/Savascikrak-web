const COOKIE_NAME = '__Host-workshop_session';
const SESSION_SECONDS = 12 * 60 * 60;
const REMEMBERED_SESSION_SECONDS = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

export const ALLOWED_HOSTS = new Set(['savascikrak.com', 'www.savascikrak.com']);
export const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

export function allowedHost(request) {
  return ALLOWED_HOSTS.has(new URL(request.url).hostname);
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin === new URL(request.url).origin;
}

export function safeEqual(left, right) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] || 0) ^ (b[i] || 0);
  return difference === 0;
}

function base64Url(bytes) {
  let string = '';
  for (const byte of bytes) string += String.fromCharCode(byte);
  return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')), c => c.charCodeAt(0));
}

async function sessionKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function newSession(secret, remember = false) {
  const lifetime = remember ? REMEMBERED_SESSION_SECONDS : SESSION_SECONDS;
  const payload = base64Url(encoder.encode(JSON.stringify({ sub: 'online18', exp: Math.floor(Date.now() / 1000) + lifetime })));
  const signature = base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(secret), encoder.encode(payload))));
  return `${payload}.${signature}`;
}

export async function validSession(request, env) {
  if (!allowedHost(request) || !env.WORKSHOP_SESSION_SECRET) return false;
  const cookie = request.headers.get('Cookie') || '';
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    if (payload.sub !== 'online18' || !Number.isSafeInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return false;
    return await crypto.subtle.verify('HMAC', await sessionKey(env.WORKSHOP_SESSION_SECRET), fromBase64Url(parts[1]), encoder.encode(parts[0]));
  } catch {
    return false;
  }
}

export function sessionCookie(value, remember = false) {
  const maxAge = remember ? `; Max-Age=${REMEMBERED_SESSION_SECONDS}` : '';
  return `${COOKIE_NAME}=${value}${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

const PLAYBACK_ID = "EgT4a011HEPoEzW1ARqAN1R2iVqiMLchb4UIGke9nN4s";
const ALLOWED_HOSTS = new Set(["savascikrak.com", "www.savascikrak.com"]);

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function jsonPart(value) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function verifyAccessToken(token, teamDomain, audience) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  let header;
  let claims;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  } catch {
    return false;
  }
  if (header.alg !== "RS256" || !header.kid) return false;

  const now = Math.floor(Date.now() / 1000);
  const validAudience = Array.isArray(claims.aud) ? claims.aud.includes(audience) : claims.aud === audience;
  if (!validAudience || claims.iss?.replace(/\/$/, "") !== teamDomain ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      (claims.nbf && claims.nbf > now)) return false;

  const certsResponse = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!certsResponse.ok) return false;
  const certs = await certsResponse.json();
  const jwk = certs.keys?.find((key) => key.kid === header.kid);
  if (!jwk) return false;
  const publicKey = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", publicKey, decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
}

async function signMuxToken(keyId, privateKeyBase64, restrictionId) {
  const pem = atob(privateKeyBase64);
  const der = Uint8Array.from(
    atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")),
    (character) => character.charCodeAt(0)
  );
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const header = jsonPart({ alg: "RS256", typ: "JWT", kid: keyId });
  const payload = jsonPart({
    sub: PLAYBACK_ID,
    aud: "v",
    exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
    playback_restriction_id: restrictionId,
  });
  const input = `${header}.${payload}`;
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(input)
  ));
  return `${input}.${encodeBase64Url(signature)}`;
}

export async function onRequestGet({ request, env }) {
  const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };
  const host = new URL(request.url).hostname;
  if (!ALLOWED_HOSTS.has(host)) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: noStore });
  }

  const { CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, MUX_SIGNING_KEY_ID,
    MUX_SIGNING_PRIVATE_KEY_B64, MUX_PLAYBACK_RESTRICTION_ID } = env;
  if (!CF_ACCESS_TEAM_DOMAIN || !CF_ACCESS_AUD || !MUX_SIGNING_KEY_ID ||
      !MUX_SIGNING_PRIVATE_KEY_B64 || !MUX_PLAYBACK_RESTRICTION_ID) {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!assertion) {
    return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: noStore });
  }

  try {
    const teamDomain = CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
    if (!await verifyAccessToken(assertion, teamDomain, CF_ACCESS_AUD)) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 403, headers: noStore });
    }
    const token = await signMuxToken(MUX_SIGNING_KEY_ID, MUX_SIGNING_PRIVATE_KEY_B64, MUX_PLAYBACK_RESTRICTION_ID);
    return new Response(JSON.stringify({ playbackId: PLAYBACK_ID, token }), { status: 200, headers: noStore });
  } catch {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }
}

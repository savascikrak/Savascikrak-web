const PLAYBACK_ID = "EgT4a011HEPoEzW1ARqAN1R2iVqiMLchb4UIGke9nN4s";
const ALLOWED_HOSTS = new Set(["savascikrak.com", "www.savascikrak.com"]);

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function jsonPart(value) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function asn1(tag, bytes) {
  const size = bytes.length;
  const length = size < 128 ? [size] : size < 65536 ? [0x82, size >> 8, size & 255] :
    [0x83, (size >> 16) & 255, (size >> 8) & 255, size & 255];
  return Uint8Array.from([tag, ...length, ...bytes]);
}

async function signMuxToken(keyId, privateKeyBase64, restrictionId) {
  const pem = atob(privateKeyBase64);
  const pkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
  const der = Uint8Array.from(
    atob(pem.replace(/-----BEGIN (RSA )?PRIVATE KEY-----|-----END (RSA )?PRIVATE KEY-----|\s/g, "")),
    (character) => character.charCodeAt(0)
  );
  const algorithm = Uint8Array.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
  const privateKeyDer = pkcs1 ? asn1(0x30, Uint8Array.from([0x02, 0x01, 0x00, ...algorithm, ...asn1(0x04, der)])) : der;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", privateKeyDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
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

  const { MUX_SIGNING_KEY_ID, MUX_SIGNING_PRIVATE_KEY_B64, MUX_PLAYBACK_RESTRICTION_ID } = env;
  if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_PRIVATE_KEY_B64 || !MUX_PLAYBACK_RESTRICTION_ID) {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }

  try {
    const token = await signMuxToken(MUX_SIGNING_KEY_ID, MUX_SIGNING_PRIVATE_KEY_B64, MUX_PLAYBACK_RESTRICTION_ID);
    return new Response(JSON.stringify({ playbackId: PLAYBACK_ID, token }), { status: 200, headers: noStore });
  } catch {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }
}

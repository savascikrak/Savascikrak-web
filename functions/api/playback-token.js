const VIDEOS = [
  { key: "day1-part1", title: "1. GÜN - BÖLÜM 1", playbackId: "EgT4a011HEPoEzW1ARqAN1R2iVqiMLchb4UIGke9nN4s" },
  { key: "day1-part2", title: "1. GÜN - BÖLÜM 2", playbackId: "8l33fSS2MVYItAz01KvNCnT2P8cl00179bBFIcG2uY9bs" },
  { key: "day1-part3", title: "1. GÜN - BÖLÜM 3", playbackId: "1dduwteEx7t7MoLHPeXq5Kv5TvKODzoZS5moCVkpMww" },
  { key: "day1-part4", title: "1. GÜN - BÖLÜM 4", playbackId: "wyqM39RDkRql8suxXZHo401QhQ3mwX6MzmhtAlUvS8ik" },
  { key: "day2-part1", title: "2. GÜN - BÖLÜM 1", playbackId: "rzBxP9fBL41sEnQEXhxLusgRHWcHVra00IJB4uc7X02EQ" },
  { key: "day2-part2", title: "2. GÜN - BÖLÜM 2", playbackId: "IY8QcBTITFRaDON86RHXUJlnLI8NAI5hezk8Argpick" },
  { key: "day2-part3", title: "2. GÜN - BÖLÜM 3", playbackId: "Dhl01Spxm3tjNfwUswVwXdNSrp36mtzXbrVBx5DRNwEk" },
  { key: "day3-part1", title: "3. GÜN - BÖLÜM 1", playbackId: "5K9VD801dWeGjiexFpkh01QOZ02UdRqotKT1vYRDbw63qc" },
  { key: "day3-part2", title: "3. GÜN - BÖLÜM 2", playbackId: "2EK01Zfu17IZErUUWS8TNyVf4OwVilDg6IZokzfZk00ls" },
  { key: "day3-part3", title: "3. GÜN - BÖLÜM 3", playbackId: "jtsNiLqHSp6dsuhEZJ01zkCsYev3nlu5A102EJh7xEajA" },
];
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

async function signMuxToken(keyId, privateKeyBase64, restrictionId, playbackId) {
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
    sub: playbackId,
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
  const url = new URL(request.url);
  const host = url.hostname;
  if (!ALLOWED_HOSTS.has(host)) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: noStore });
  }

  const videoKey = url.searchParams.get("video");
  if (!videoKey) {
    return new Response(JSON.stringify({ videos: VIDEOS.map(({ key, title }) => ({ key, title })) }),
      { status: 200, headers: noStore });
  }
  const video = VIDEOS.find(({ key }) => key === videoKey);
  if (!video) {
    return new Response(JSON.stringify({ error: "Video not found" }), { status: 404, headers: noStore });
  }

  const { MUX_SIGNING_KEY_ID, MUX_SIGNING_PRIVATE_KEY_B64, MUX_PLAYBACK_RESTRICTION_ID } = env;
  if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_PRIVATE_KEY_B64 || !MUX_PLAYBACK_RESTRICTION_ID) {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }

  try {
    const token = await signMuxToken(MUX_SIGNING_KEY_ID, MUX_SIGNING_PRIVATE_KEY_B64,
      MUX_PLAYBACK_RESTRICTION_ID, video.playbackId);
    return new Response(JSON.stringify({ playbackId: video.playbackId, token }), { status: 200, headers: noStore });
  } catch {
    return new Response(JSON.stringify({ error: "Playback unavailable" }), { status: 503, headers: noStore });
  }
}

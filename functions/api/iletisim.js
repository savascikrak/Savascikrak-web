import { json, sameOrigin } from '../_lib/auth.js';

// Iletisim formu -> e-posta (Resend). Cloudflare Pages ortam degiskenleri:
// RESEND_API_KEY (zorunlu), ILETISIM_ALICI (varsayilan iletisim@savascikrak.com),
// ILETISIM_GONDEREN (varsayilan 'Site Formu <form@savascikrak.com>' - alan adi Resend'de dogrulanmis olmali)
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (!env.RESEND_API_KEY) return json({ error: 'Form servisi hazir degil' }, 503);
  let d;
  try {
    const body = await request.text();
    if (body.length > 6000) return json({ error: 'Mesaj cok uzun' }, 400);
    d = JSON.parse(body);
  } catch { return json({ error: 'Gecersiz istek' }, 400); }
  if (d.web) return json({ ok: true }); // bal kupu (spam)
  const ad = String(d.ad || '').trim().slice(0, 100);
  const iletisim = String(d.iletisim || '').trim().slice(0, 120);
  const konu = String(d.konu || '').trim().slice(0, 60);
  const mesaj = String(d.mesaj || '').trim().slice(0, 4000);
  if (!ad || !iletisim || mesaj.length < 5 || d.kvkk !== true) return json({ error: 'Eksik alan' }, 400);
  const eposta = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(iletisim) ? iletisim : undefined;
  const html = `<p><b>Ad:</b> ${esc(ad)}<br><b>Iletisim:</b> ${esc(iletisim)}<br><b>Konu:</b> ${esc(konu || '-')}</p><p>${esc(mesaj).replace(/\n/g, '<br>')}</p>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.ILETISIM_GONDEREN || 'Site Formu <form@savascikrak.com>',
      to: [env.ILETISIM_ALICI || 'iletisim@savascikrak.com'],
      reply_to: eposta,
      subject: `Site formu: ${konu || 'Yeni mesaj'} - ${ad}`,
      html
    })
  });
  if (!r.ok) return json({ error: 'Gonderilemedi' }, 502);
  return json({ ok: true });
}

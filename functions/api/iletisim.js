import { json, sameOrigin } from '../_lib/auth.js';

// Iletisim formu -> e-posta (Resend). Cloudflare Pages ortam degiskenleri:
// RESEND_API_KEY (zorunlu), ILETISIM_ALICI (varsayilan iletisim@savascikrak.com),
// ILETISIM_GONDEREN_ADRES (varsayilan form@savascikrak.com). Gonderen ADI = formu dolduran kisinin adi.
// Hata yanitlari { error, alan } doner; form ilgili alani kirmizi isaretler.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KONULAR = ['Fotoğraf Çekimi', 'Video Çekimi', 'Fotoğrafçılık Eğitimi', 'Sosyal Medya Yönetimi', 'Firmalara Özel Fotoğraf Çözümleri', 'Diğer'];
const EPOSTA_RE = /^[^\s@]+@([A-Za-z0-9ğüşıöçĞÜŞİÖÇ-]+\.)+[A-Za-z]{2,}$/;
const hata = (alan, error) => json({ error, alan }, 400);

// Alan adi e-posta alabiliyor mu? (MX, yoksa A kaydi). DNS servisine ulasilamazsa engelleme.
async function alanAdiGecerli(domain) {
  const sor = async type => {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
    if (!r.ok) throw new Error('dns');
    return r.json();
  };
  try {
    const mx = await sor('MX');
    if (mx.Status === 3) return false; // alan adi yok
    if ((mx.Answer || []).some(a => a.type === 15 && !/^0\s+\.$/.test(a.data))) return true;
    const a = await sor('A');
    return (a.Answer || []).length > 0;
  } catch { return true; }
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (!env.RESEND_API_KEY) return json({ error: 'Form servisi hazir degil' }, 503);
  let d;
  try {
    const body = await request.text();
    if (body.length > 8000) return json({ error: 'Mesaj cok uzun' }, 400);
    d = JSON.parse(body);
  } catch { return json({ error: 'Gecersiz istek' }, 400); }
  if (d.web) return json({ ok: true }); // bal kupu (spam)

  const ad = String(d.ad || '').trim().slice(0, 100);
  const eposta = String(d.eposta || '').trim().slice(0, 120);
  const telefon = String(d.telefon || '').trim().slice(0, 20);
  const konu = String(d.konu || '').trim();
  const konuDiger = String(d.konu_diger || '').trim().slice(0, 80);
  const mesaj = String(d.mesaj || '').trim().slice(0, 4000);

  if (!ad) return hata('ad', 'Adınızı yazın.');
  if (!eposta) return hata('eposta', 'E-posta adresinizi yazın.');
  if (!EPOSTA_RE.test(eposta)) return hata('eposta', 'Geçerli bir e-posta adresi yazın (ör. ad@alanadi.com).');
  if (telefon) {
    const rakam = telefon.replace(/\D/g, '');
    if (!/^[\d\s()+\-.]+$/.test(telefon) || rakam.length < 10 || rakam.length > 13) return hata('telefon', 'Geçerli bir telefon numarası yazın (ör. 0532 123 45 67).');
  }
  if (!KONULAR.includes(konu)) return hata('konu', 'Bir konu seçin.');
  if (konu === 'Diğer' && !konuDiger) return hata('konu_diger', 'Konunuzu kısaca yazın.');
  if (mesaj.length < 10) return hata('mesaj', 'Mesajınız en az 10 karakter olmalı.');
  if (d.kvkk !== true) return hata('kvkk', 'Göndermek için KVKK onayını işaretleyin.');
  if (!(await alanAdiGecerli(eposta.split('@').pop()))) return hata('eposta', 'Bu e-posta adresinin alan adı e-posta almıyor. Lütfen adresi kontrol edin.');

  const konuMetni = konu === 'Diğer' ? konuDiger : konu;
  const satir = (k, v) => `<tr><td style="padding:5px 18px 5px 0;color:#777;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
  const html = `<table style="font:16px/27.2px Arial,sans-serif;color:#16151A">${satir('Ad', esc(ad))}${satir('E-posta', `<a href="mailto:${esc(eposta)}">${esc(eposta)}</a>`)}${satir('Telefon', telefon ? esc(telefon) : '-')}${satir('Konu', esc(konu === 'Diğer' ? `Diğer: ${konuDiger}` : konu))}</table><p style="font:16px/27.2px Arial,sans-serif;color:#16151A;margin:18px 0 0">${esc(mesaj).replace(/\n/g, '<br>')}</p>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `"${ad.replace(/["<>\\\r\n]/g, '').slice(0, 70) || 'Site ziyaretçisi'}" <${env.ILETISIM_GONDEREN_ADRES || 'form@savascikrak.com'}>`,
      to: [env.ILETISIM_ALICI || 'iletisim@savascikrak.com'],
      reply_to: eposta,
      subject: konuMetni,
      html
    })
  });
  if (!r.ok) return json({ error: 'Gonderilemedi' }, 502);
  return json({ ok: true });
}

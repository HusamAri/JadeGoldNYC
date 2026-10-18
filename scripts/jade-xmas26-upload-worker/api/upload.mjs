import { createHash, timingSafeEqual } from 'node:crypto';

// Storage only. No image generation provider, catalog mutations or external URLs.
const ORG = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c';
const BATCH = 'jade-xmas26-600-2026-10-18';
const SUPABASE = 'https://sewbrqflcrlgczilrusw.supabase.co';
const BUCKET = 'listing-images';
const EXPIRES = Date.parse('2026-10-21T00:00:00Z');
const hash = (value) => createHash('sha256').update(value).digest();
const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const secret = process.env.JADE_XMAS26_UPLOAD_TOKEN;
    if (!secret || secret.length < 48 || !timingSafeEqual(hash(request.headers.get('authorization') || ''), hash(`Bearer ${secret}`))) return json({ error: 'Unauthorized' }, 401);
    if (process.env.VERCEL_ENV !== 'preview' || Date.now() > EXPIRES) return json({ error: 'Upload worker inactive' }, 403);
    if (Number(request.headers.get('content-length')) > 512) return json({ error: 'Request too large' }, 413);
    let input;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'Missing body' }, 400);
      const chunks = []; let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 512) { await reader.cancel(); return json({ error: 'Request too large' }, 413); }
        chunks.push(value);
      }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { code, position, extension, sha256 } = input;
    if (Object.keys(input).some((key) => !['code','position','extension','sha256'].includes(key)) || !/^[BNEP](?:[1-9]|10)$/.test(code || '') || !Number.isInteger(position) || position < 1 || position > 15 || !['png','jpg'].includes(extension) || !/^[0-9a-f]{64}$/.test(sha256 || '')) return json({ error: 'Invalid fixed-catalog slot' }, 400);
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return json({ error: 'Storage credential unavailable' }, 503);
    const path = `${ORG}/${BATCH}/${code}/${String(position).padStart(2, '0')}-${sha256}.${extension}`;
    const public_url = `${SUPABASE}/storage/v1/object/public/${BUCKET}/${path}`;
    try {
      const prior = await fetch(public_url, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
      if (prior.ok) return json({ exists: true, storage_path: path, public_url });
      if (![400,404].includes(prior.status)) return json({ error: 'Storage preflight failed', storage_status: prior.status }, 502);
      const signed = await fetch(`${SUPABASE}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
        method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'x-upsert': 'false' },
        body: '{}', signal: AbortSignal.timeout(20000),
      });
      if (!signed.ok) return json({ error: 'Signed upload unavailable', storage_status: signed.status }, 502);
      const payload = await signed.json();
      if (typeof payload.url !== 'string' || !payload.url.startsWith(`/object/upload/sign/${BUCKET}/${path}?token=`)) return json({ error: 'Unexpected signed upload response' }, 502);
      // Supabase signatures are fixed to this one path and expire in two hours.
      return json({ exists: false, storage_path: path, public_url, signed_upload_url: `${SUPABASE}/storage/v1${payload.url}`, expires_in_seconds: 7200, upsert: false });
    } catch { return json({ error: 'Storage request failed' }, 502); }
  },
};

import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

// Standalone, preview-only worker. This never writes catalog or gallery rows.
const ORG = 'f155b853-dfaf-48fd-94c5-ddfcb856e07c';
const BATCH = 'jade-xmas26-600-2026-10-18';
const MODEL = 'gemini-nano-banana-2.1';
const PROVIDER = 'google_gemini';
const SUPABASE = 'https://sewbrqflcrlgczilrusw.supabase.co';
const BUCKET = 'listing-images';
const SOURCE = 'https://raw.githubusercontent.com/HusamAri/JadeGoldNYC/0ab1d3baf5fb08f17572a5b86715c785e3878cde/docs/jade/xmas26';
const EXPIRES = Date.parse('2026-10-21T00:00:00Z');
const sha = (data) => createHash('sha256').update(data).digest('hex');
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const publicUrl = (path) => `${SUPABASE}/storage/v1/object/public/${BUCKET}/${path}`;
const overrideBytes = gunzipSync(readFileSync(new URL('../data/qa-overrides.json.gz', import.meta.url)));
if (sha(overrideBytes) !== 'b0ce051cc3b91ac9855233d626c0de8d856946e493b755b6199b2ed316545609') throw new Error('QA override manifest hash mismatch');
const overrides = JSON.parse(overrideBytes);

function authorized(request) {
  const secret = process.env.JADE_XMAS26_WORKER_TOKEN;
  const received = request.headers.get('authorization') || '';
  return secret?.length >= 48 && timingSafeEqual(Buffer.from(sha(received)), Buffer.from(sha(`Bearer ${secret}`)));
}

async function storage(path, method = 'GET', body, contentType = 'application/json') {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${SUPABASE}/storage/v1/object/${BUCKET}${method === 'DELETE' ? '' : `/${path}`}`, {
    method,
    headers: { apikey: key, authorization: `Bearer ${key}`, 'Content-Type': contentType, 'x-upsert': 'false' },
    ...(method === 'DELETE' ? { body: JSON.stringify({ prefixes: [path] }) } : body === undefined ? {} : { body }),
    signal: AbortSignal.timeout(45000),
  });
  return response;
}

async function existing(path) {
  const result = await storage(`${path}.json`);
  let imagePath;
  for (const extension of ['jpg', 'png']) {
    const image = await fetch(publicUrl(`${path}.${extension}`), { method: 'HEAD', signal: AbortSignal.timeout(20000) });
    if (image.ok) { imagePath = `${path}.${extension}`; break; }
  }
  if (!imagePath) {
    const receipt = await storage(`${path}.receipt.json`);
    if (receipt.ok || result.ok) return { repair_needed: true, storage_path: path, reason: 'Successful generation receipt exists but image bytes need recovery' };
    return null;
  }
  if (result.ok) return result.json();
  const receipt = await storage(`${path}.receipt.json`);
  if (!receipt.ok) return { repair_needed: true, storage_path: imagePath };
  const metadata = await receipt.json();
  const downloaded = await fetch(publicUrl(imagePath), { signal: AbortSignal.timeout(45000) });
  const bytes = Buffer.from(await downloaded.arrayBuffer());
  if (sha(bytes) !== metadata.sha256) throw new Error('Orphan image receipt hash mismatch');
  const repaired = await storage(`${path}.json`, 'POST', JSON.stringify(metadata));
  if (!repaired.ok) return { repair_needed: true, storage_path: imagePath };
  return metadata;
}

function jpegDimensions(bytes) {
  if (bytes.length < 10 || bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Provider did not return a valid JPEG');
  let width, height, offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2) throw new Error('Invalid JPEG block');
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      height = bytes.readUInt16BE(offset + 3); width = bytes.readUInt16BE(offset + 5); break;
    }
    offset += length;
  }
  if (!width || !height) throw new Error('JPEG dimensions unavailable');
  if (Math.max(width, height) < 2048 || Math.abs(width / height - 4 / 3) > 0.02) {
    throw new Error(`Native 2K 4:3 requirement not met: ${width}x${height}`);
  }
  return { width, height };
}

function imageDimensions(bytes) {
  if (bytes.length > 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (Math.max(width, height) < 2048 || Math.abs(width / height - 4 / 3) > 0.02) throw new Error(`Native 2K 4:3 requirement not met: ${width}x${height}`);
    return { width, height, extension: 'png', mime_type: 'image/png' };
  }
  return { ...jpegDimensions(bytes), extension: 'jpg', mime_type: 'image/jpeg' };
}

function imageBlocks(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (value.type === 'image' && typeof value.data === 'string' && !value.thought) result.push(value);
  if (value.inlineData?.data && !value.thought) result.push({ data: value.inlineData.data, mime_type: value.inlineData.mimeType });
  const dataUrl = value.image_url?.url;
  if (typeof dataUrl === 'string' && /^data:image\/(png|jpeg);base64,/.test(dataUrl)) result.push({ data: dataUrl.split(',')[1] });
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => imageBlocks(item, result));
    else if (child && typeof child === 'object') imageBlocks(child, result);
  }
  return result;
}

function correctedPrompt(code, shot) {
  let prompt = shot.prompt;
  const patch = overrides.records.find((r) => r.product_code === code && r.source_shot_code === shot.code);
  if (!patch || sha(prompt) !== patch.source_prompt_sha256) throw new Error('Source prompt hash mismatch');
  for (const replacement of patch.replacements) {
    if (prompt.split(replacement.find).length - 1 !== replacement.expected_count) throw new Error('Prompt replacement count mismatch');
    prompt = prompt.replace(replacement.find, replacement.replace);
  }
  if (sha(prompt) !== patch.result_prompt_sha256) throw new Error('Corrected prompt hash mismatch');
  prompt += '\nProduce one 4:3 landscape image at native 2K resolution. The reference is the visual authority for silhouette, proportions, count of visible decorative elements, stone placement, grooves and colors; if descriptive text conflicts, preserve the reference. This is representative 14K yellow-gold product imagery for a listing with 10K, 14K and 18K choices. No invented hallmark, karat stamp, lettering, logo, dimensions or watermark anywhere in the image. Preserve truthful product geometry and do not add stones or decorative elements.';
  return prompt;
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!authorized(request)) return json({ error: 'Unauthorized' }, 401);
    if (process.env.VERCEL_ENV !== 'preview' || Date.now() > EXPIRES) return json({ error: 'Worker inactive' }, 403);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Required server credentials unavailable' }, 503);
    let input;
    try { const raw = await request.text(); if (raw.length > 1024) return json({ error: 'Request too large' }, 413); input = JSON.parse(raw); }
    catch { return json({ error: 'Invalid JSON' }, 400); }
    if (!['probe', 'gateway_probe', 'generate', 'status'].includes(input.action)) return json({ error: 'Invalid action' }, 400);
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const gatewayToken = process.env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN;
    if (input.action === 'gateway_probe') {
      if (!gatewayToken) return json({ error: 'Gateway OIDC unavailable' }, 503);
      const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', { headers: { Authorization: `Bearer ${gatewayToken}` }, signal: AbortSignal.timeout(30000) });
      const credits = await response.json();
      return json({ ok: response.ok, provider_status: response.status, credits }, response.ok ? 200 : 502);
    }
    if (input.action === 'probe') {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      return json({ ok: response.ok, model: MODEL, available: (data.models || []).some((m) => m.name === `models/${MODEL}`), image_models: (data.models || []).filter((m) => /image|banana/.test(m.name)).map((m) => m.name), provider_status: response.status, error: data.error ? { code: data.error.code, status: data.error.status, message: data.error.message } : undefined }, response.ok ? 200 : 502);
    }
    const { code, position } = input;
    if (!/^[BNEP](?:[1-9]|10)$/.test(code || '') || !Number.isInteger(position) || position < 1 || position > 15) return json({ error: 'Invalid fixed-catalog slot' }, 400);
    const path = `${ORG}/${BATCH}/${code}/${String(position).padStart(2, '0')}`;
    const prior = await existing(path);
    if (prior?.repair_needed) return json({ error: 'Existing image requires metadata repair; regeneration blocked', ...prior }, 409);
    if (prior) return json({ ok: true, cached: true, image: prior });
    if (input.action === 'status') return json({ ok: true, generated: false });
    if (!key) return json({ error: 'Google credential unavailable' }, 503);
    // Atomic create prevents two live requests charging for the same slot.
    const lease = await storage(`${path}.lock`, 'POST', JSON.stringify({ id: randomUUID(), created_at: new Date().toISOString() }));
    if (!lease.ok) return json({ error: 'Slot is locked or storage unavailable', storage_status: lease.status }, 409);
    let attemptPath;
    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const candidate = `${path}.${PROVIDER}.attempt-${attempt}.json`;
        const result = await storage(candidate, 'POST', JSON.stringify({ attempted_at: new Date().toISOString(), model: MODEL }));
        if (result.ok) { attemptPath = candidate; break; }
        if (result.status !== 400 && result.status !== 409) throw new Error(`Attempt accounting storage failure (${result.status})`);
      }
      if (!attemptPath) return json({ error: 'Maximum three generation attempts reached' }, 409);
      const [promptsResponse, referenceResponse] = await Promise.all([
        fetch(`${SOURCE}/prompts.json`, { signal: AbortSignal.timeout(30000) }),
        fetch(`${SOURCE}/images/heroes/crops/${code}.jpg`, { signal: AbortSignal.timeout(30000) }),
      ]);
      if (!promptsResponse.ok || !referenceResponse.ok) throw new Error('Immutable source assets unavailable');
      const catalog = await promptsResponse.json();
      const shot = catalog[code]?.find((s) => s.code === String(position + 1).padStart(2, '0'));
      if (!shot?.reference) throw new Error('Reference-conditioned shot missing');
      const reference = Buffer.from(await referenceResponse.arrayBuffer());
      const prompt = correctedPrompt(code, shot);
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, input: [{ type: 'text', text: prompt }, { type: 'image', mime_type: 'image/jpeg', data: reference.toString('base64') }], response_format: { type: 'image', aspect_ratio: '4:3', image_size: '2K', mime_type: 'image/jpeg' } }),
        signal: AbortSignal.timeout(240000),
      });
      const payload = await response.json();
      if (!response.ok) {
        if ([400,401,402,403,404,422,429].includes(response.status)) await storage(attemptPath, 'DELETE');
        return json({ error: 'Google generation failed', provider_status: response.status, detail: payload.error ? { code: payload.error.code, type: payload.error.type, status: payload.error.status, message: payload.error.message, details: payload.error.details } : undefined }, response.status === 429 ? 429 : 502);
      }
      const blocks = imageBlocks(payload);
      if (!blocks.length && payload.output_image?.data) blocks.push(payload.output_image);
      if (!blocks.length) return json({ error: 'Provider returned no image', response_keys: Object.keys(payload), generation_id: payload.id }, 502);
      const bytes = Buffer.from(blocks.at(-1).data, 'base64');
      const { extension, mime_type, ...dimensions } = imageDimensions(bytes);
      const image = {
        product_code: code, position, shot_code: shot.code, public_url: publicUrl(`${path}.${extension}`), storage_path: `${path}.${extension}`,
        ...dimensions, sha256: sha(bytes), bytes: bytes.length, mime_type, provider: PROVIDER, model: MODEL,
        generation_id: payload.id || response.headers.get('x-request-id') || `sha256:${sha(bytes)}`,
        generated_at: new Date().toISOString(), reference_url: `${SOURCE}/images/heroes/crops/${code}.jpg`, reference_sha256: sha(reference),
        prompt_sha256: sha(prompt), alt: shot.alt, qa_status: 'pending', qa_note: 'Native dimensions verified; visual review pending.',
        usage: payload.usage || payload.usage_metadata || null,
      };
      const receipt = await storage(`${path}.receipt.json`, 'POST', JSON.stringify(image));
      if (!receipt.ok) throw new Error(`Receipt save failed (${receipt.status})`);
      const uploaded = await storage(`${path}.${extension}`, 'POST', bytes, mime_type);
      if (!uploaded.ok) throw new Error(`Image upload failed (${uploaded.status})`);
      const saved = await storage(`${path}.json`, 'POST', JSON.stringify(image));
      if (!saved.ok) throw new Error(`Manifest upload failed (${saved.status}); image saved, do not regenerate`);
      console.info(JSON.stringify({ batch: BATCH, code, position, status: 'generated', width: image.width, height: image.height, bytes: image.bytes }));
      return json({ ok: true, cached: false, image });
    } catch (error) {
      // Provider credentials and raw provider response are never logged.
      console.error(JSON.stringify({ batch: BATCH, code, position, error: error instanceof Error ? error.message : 'Worker failed' }));
      return json({ error: error instanceof Error ? error.message : 'Worker failed' }, 502);
    } finally {
      await storage(`${path}.lock`, 'DELETE').catch(() => {});
    }
  },
};

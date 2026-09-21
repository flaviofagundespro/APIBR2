'use strict';

const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { createJobService } = require('./jobs');
const { ImportError, fail, UUID, VIDEO_ID, SHA, safeCode, MAX_COOKIE_BYTES } = require('./security');

const BASE = '/api/v1/video/youtube-imports';
function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'private, no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) });
  res.end(data);
}
function keys(value, expected) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === expected.slice().sort().join(',');
}
async function jsonBody(req, maxBytes = 4096) {
  if ((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') fail('invalid_request', 400);
  if (Number(req.headers['content-length'] || 0) > maxBytes) fail('invalid_request', 400);
  let bytes = 0; const chunks = [];
  const timeout = setTimeout(() => req.destroy(new ImportError('time_limit', 408)), 5000);
  timeout.unref();
  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > maxBytes) fail('invalid_request', 400);
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail('invalid_request', 400); }
  } finally { clearTimeout(timeout); }
}
function authorized(key, header) {
  if (typeof header !== 'string' || header.length > 4096) return false;
  const actual = Buffer.from(header); const expected = Buffer.from(key);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function createYoutubeImportsRouter({ apiKey, service, ...options } = {}) {
  // Eager startup/recovery, not lazily dependent on browser traffic. Failures are
  // contained in these new routes and do not disable legacy transcription.
  const ready = apiKey ? Promise.resolve(service || createJobService(options))
    .then(value => ({ value }), () => ({ error: true })) : Promise.resolve({ error: true });
  return {
    matches(url) { return typeof url === 'string' && (url === BASE || url.startsWith(`${BASE}/`) || url.startsWith(`${BASE}?`)); },
    async handle(req, res) {
      try {
        if (!apiKey) fail('unavailable', 503);
        if (!authorized(apiKey, req.headers['x-api-key'])) fail('unauthorized', 401);
        const workspace = req.headers['x-workspace-id']; const perfil = req.headers['x-perfil-id'];
        if (!UUID.test(workspace || '') || !UUID.test(perfil || '')) fail('invalid_request', 400);
        const suffix = req.url.slice(BASE.length);
        const match = /^\/([a-f0-9-]+)(?:\/(file|ack))?$/.exec(suffix);
        if (suffix && (!match || !UUID.test(match[1]))) fail('not_found', 404);
        const initialized = await ready;
        if (initialized.error) fail('unavailable', 503);
        const jobs = initialized.value;
        if (!suffix && req.method === 'POST') {
          const body = await jsonBody(req, 2_400_000);
          const baseKeys = ['request_id', 'workspace_id', 'perfil_id', 'video_id', 'policy'];
          const cookieKeys = ['request_id', 'workspace_id', 'perfil_id', 'video_id', 'policy', 'youtube_cookie', 'youtube_session_revision'];
          const hasCookie = Object.prototype.hasOwnProperty.call(body || {}, 'youtube_cookie');
          if (!(keys(body, baseKeys) || keys(body, cookieKeys)) || hasCookie !== Object.prototype.hasOwnProperty.call(body || {}, 'youtube_session_revision') ||
              (hasCookie && (typeof body.youtube_cookie !== 'string' || Buffer.byteLength(body.youtube_cookie, 'utf8') < 1 || Buffer.byteLength(body.youtube_cookie, 'utf8') > MAX_COOKIE_BYTES ||
                !Number.isSafeInteger(body.youtube_session_revision) || body.youtube_session_revision < 1)) ||
              !UUID.test(body.request_id) || body.workspace_id !== workspace || body.perfil_id !== perfil ||
              !VIDEO_ID.test(body.video_id) || !['soria-reel-v1', 'soria-reel-v2'].includes(body.policy)) fail('invalid_request', 400);
          const result = await jobs.admit(body);
          return send(res, result.created ? 202 : 200, result.job);
        }
        if (match && !match[2] && req.method === 'GET') return send(res, 200, await jobs.get(match[1], workspace, perfil));
        if (match?.[2] === 'ack' && req.method === 'POST') {
          const body = await jsonBody(req);
          if (!keys(body, ['sha256']) || !SHA.test(body.sha256)) fail('invalid_request', 400);
          return send(res, 200, await jobs.ack(match[1], workspace, perfil, body.sha256));
        }
        if (match?.[2] === 'file' && req.method === 'GET') {
          if (req.headers.range) fail('invalid_request', 400);
          const opened = await jobs.open(match[1], workspace, perfil);
          const stream = opened.fd.createReadStream({ autoClose: false });
          const timeout = setTimeout(() => stream.destroy(new ImportError('time_limit')), 60_000);
          timeout.unref();
          try {
            res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': opened.artifact.bytes,
              ETag: `"${opened.artifact.sha256}"`, 'Cache-Control': 'private, no-store' });
            await pipeline(stream, res);
          } finally { clearTimeout(timeout); await opened.release(); }
          return;
        }
        fail('not_found', 404);
      } catch (error) {
        if (!res.headersSent && !res.destroyed) send(res, error instanceof ImportError ? error.status : 500,
          { version: 1, error: { code: safeCode(error) } });
        else if (!res.destroyed) res.destroy();
      }
    },
    async close() { const initialized = await ready; await initialized.value?.close(); },
  };
}

module.exports = { BASE, createYoutubeImportsRouter };

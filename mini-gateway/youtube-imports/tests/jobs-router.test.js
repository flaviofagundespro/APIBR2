'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { createJobService, acquireLock, atomicJSON } = require('../jobs');
const { createYoutubeImportsRouter, BASE } = require('../router');
const { ImportError } = require('../security');

const workspace = '11111111-1111-4111-8111-111111111111';
const perfil = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const data = Buffer.from('synthetic-video-fixture');
const hash = crypto.createHash('sha256').update(data).digest('hex');
const artifact = { bytes: data.length, sha256: hash, mime_type: 'video/mp4', duration_seconds: 3 };
function payload(patch = {}) { return { request_id: crypto.randomUUID(), workspace_id: workspace, perfil_id: perfil, video_id: 'abcdefghijk', policy: 'soria-reel-v1', ...patch }; }
const code = expected => error => error.code === expected;
const fixtureServices = new Map();
async function temp(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'soria-jobs-test-'));
  fixtureServices.set(root, []);
  t.after(async () => {
    for (const jobs of fixtureServices.get(root)) await jobs.close();
    fixtureServices.delete(root);
    await fs.rm(root, { recursive: true, force: true });
  });
  return root;
}
async function downloadMedia(_selection, { dir }) { await fs.writeFile(path.join(dir, 'artifact.mp4'), data, { mode: 0o600, flag: 'wx' }); return artifact; }
async function service(t, options = {}) {
  const root = options.root || await temp(t);
  const jobs = await createJobService({ root, extractVideo: async () => ({}), downloadMedia, ...options });
  fixtureServices.get(root).push(jobs); return { jobs, root };
}
test('durable admission, replay and exact scoped envelope never expose paths/URLs', async t => {
  const { jobs, root } = await service(t); const body = payload();
  const first = await jobs.admit(body); assert.equal(first.created, true);
  assert.equal(JSON.parse(await fs.readFile(path.join(root, body.request_id, 'journal.json'), 'utf8')).request_id, body.request_id);
  const again = await jobs.admit(body); assert.equal(again.created, false);
  await jobs.idle();
  const ready = await jobs.get(body.request_id, workspace, perfil);
  assert.deepEqual(Object.keys(ready).sort(), ['version', 'request_id', 'job_id', 'workspace_id', 'perfil_id', 'video_id', 'status', 'created_at', 'updated_at', 'expires_at', 'artifact', 'error'].sort());
  assert.equal(ready.status, 'ready'); assert.deepEqual(ready.artifact, artifact);
  assert.equal(JSON.stringify(ready).includes(root), false);
  await assert.rejects(jobs.get(body.request_id, workspace, other), code('not_found'));
  await assert.rejects(jobs.admit({ ...body, perfil_id: other }), code('not_found'));
  await assert.rejects(jobs.admit({ ...body, video_id: 'zzzzzzzzzzz' }), code('conflict'));
  assert.equal((await fs.stat(path.join(root, body.request_id))).mode & 0o777, 0o700);
  assert.equal((await fs.stat(path.join(root, body.request_id, 'journal.json'))).mode & 0o777, 0o600);
});
test('same video different profiles has distinct immutable artifact and identity', async t => {
  const { jobs, root } = await service(t);
  const a = payload(); const b = payload({ perfil_id: other });
  await jobs.admit(a); await jobs.admit(b); await jobs.idle();
  assert.equal((await jobs.get(a.request_id, workspace, perfil)).status, 'ready');
  assert.equal((await jobs.get(b.request_id, workspace, other)).status, 'ready');
  await jobs.ack(a.request_id, workspace, perfil, hash);
  assert.deepEqual(await fs.readFile(path.join(root, b.request_id, 'artifact.mp4')), data);
});
test('ACK validates hash, is idempotent and waits for active readers before unlink', async t => {
  const { jobs, root } = await service(t); const body = payload(); await jobs.admit(body); await jobs.idle();
  await assert.rejects(jobs.ack(body.request_id, workspace, perfil, '0'.repeat(64)), code('artifact_mismatch'));
  const opened = await jobs.open(body.request_id, workspace, perfil);
  const ack = await jobs.ack(body.request_id, workspace, perfil, hash);
  assert.deepEqual(ack, { version: 1, request_id: body.request_id, acknowledged: true });
  assert.ok(await fs.stat(path.join(root, body.request_id, 'artifact.mp4')));
  await assert.rejects(jobs.open(body.request_id, workspace, perfil), code('artifact_expired'));
  assert.deepEqual(await jobs.ack(body.request_id, workspace, perfil, hash), ack);
  await opened.release();
  await assert.rejects(fs.stat(path.join(root, body.request_id, 'artifact.mp4')), { code: 'ENOENT' });
  const replay = await jobs.admit(body); assert.equal(replay.created, false); assert.equal(replay.job.status, 'expired');
});
test('TTL expiration keeps tombstone and forbids late ACK/redownload', async t => {
  let clock = Date.now(); let downloads = 0;
  const { jobs } = await service(t, { now: () => clock, retentionMs: 100, downloadMedia: async (...args) => { downloads++; return downloadMedia(...args); } });
  const body = payload(); await jobs.admit(body); await jobs.idle(); clock += 101;
  assert.equal((await jobs.get(body.request_id, workspace, perfil)).status, 'expired');
  await assert.rejects(jobs.ack(body.request_id, workspace, perfil, hash), code('artifact_expired'));
  await jobs.admit(body); assert.equal(downloads, 1);
});
test('retrieval rejects substituted symlink and mismatched file length', async t => {
  const { jobs, root } = await service(t); const body = payload(); await jobs.admit(body); await jobs.idle();
  const file = path.join(root, body.request_id, 'artifact.mp4');
  await fs.writeFile(file, 'bad'); await assert.rejects(jobs.open(body.request_id, workspace, perfil), code('artifact_mismatch'));
  await fs.unlink(file); await fs.symlink(path.join(root, 'owner.lock'), file);
  await assert.rejects(jobs.open(body.request_id, workspace, perfil), code('artifact_mismatch'));
});
test('concurrency is one with five queued and explicit overflow; deadline stops job', async t => {
  let started; const start = new Promise(resolve => { started = resolve; });
  const { jobs } = await service(t, { jobMs: 100, extractVideo: async (_id, { signal }) => {
    started(); await new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  const bodies = Array.from({ length: 6 }, () => payload());
  await jobs.admit(bodies[0]); await start;
  for (const body of bodies.slice(1)) await jobs.admit(body);
  await assert.rejects(jobs.admit(payload()), code('queue_full'));
  // Keep event loop alive for the intentionally unref'ed service deadline.
  const keepAlive = setInterval(() => {}, 1000);
  try { await jobs.idle(); } finally { clearInterval(keepAlive); }
  assert.equal((await jobs.get(bodies[0].request_id, workspace, perfil)).error.code, 'time_limit');
});
test('journal and disk admission limits fail closed while replay remains available', async t => {
  const { jobs } = await service(t, { maxJournals: 1 }); const body = payload(); await jobs.admit(body); await jobs.idle();
  await assert.rejects(jobs.admit(payload()), code('unavailable'));
  assert.equal((await jobs.admit(body)).created, false);
  const limited = await service(t, { maxDiskBytes: 100 });
  await assert.rejects(limited.jobs.admit(payload()), code('unavailable'));
});
test('safe failure state has error code only and no provider stderr/token/path', async t => {
  const { jobs } = await service(t, { extractVideo: async () => { throw new Error('TOKEN=secret /private/cookies youtube-unlisted-url'); } });
  const body = payload(); await jobs.admit(body); await jobs.idle();
  const failed = await jobs.get(body.request_id, workspace, perfil);
  assert.deepEqual(failed.error, { code: 'internal_error' }); assert.equal(failed.artifact, null);
  assert.equal(JSON.stringify(failed).includes('secret'), false);
});
test('exclusive owner and concurrent stale recovery cannot produce two schedulers', async t => {
  const root = await temp(t);
  await fs.writeFile(path.join(root, 'owner.lock'), JSON.stringify({ pid: 99999999, start: '0', nonce: 'stale' }));
  const attempts = await Promise.allSettled([acquireLock(root), acquireLock(root)]);
  assert.equal(attempts.filter(a => a.status === 'fulfilled').length, 1);
  await assert.rejects(acquireLock(root), code('unavailable'));
  await attempts.find(a => a.status === 'fulfilled').value();
});
test('orphaned recovery marker fails closed without deleting another owner', async t => {
  const root = await temp(t);
  await fs.writeFile(path.join(root, 'owner.lock'), JSON.stringify({ pid: 99999999, start: '0', nonce: 'stale' }));
  await fs.writeFile(path.join(root, 'owner.recovery'), '');
  await assert.rejects(acquireLock(root), code('unavailable'));
  assert.equal(JSON.parse(await fs.readFile(path.join(root, 'owner.lock'), 'utf8')).nonce, 'stale');
});
test('restart fails interrupted work, resumes only queued work, expires old queue', async t => {
  const root = await temp(t); const now = Date.now(); let extracts = 0;
  const entries = [payload(), payload(), payload()];
  for (let index = 0; index < entries.length; index++) {
    const body = entries[index]; const dir = path.join(root, body.request_id); await fs.mkdir(dir, { mode: 0o700 });
    await atomicJSON(dir, 'journal.json', { ...body, status: index === 0 ? 'extracting' : 'queued',
      created_at: new Date(now - (index === 2 ? 600_001 : 0)).toISOString(), updated_at: new Date(now).toISOString(),
      expires_at: null, artifact: null, error: null, process: null, acknowledged_sha256: null });
  }
  const { jobs } = await service(t, { root, now: () => now, extractVideo: async () => { extracts++; return {}; } });
  await jobs.idle();
  assert.equal((await jobs.get(entries[0].request_id, workspace, perfil)).error.code, 'interrupted');
  assert.equal((await jobs.get(entries[1].request_id, workspace, perfil)).status, 'ready');
  assert.equal((await jobs.get(entries[2].request_id, workspace, perfil)).error.code, 'time_limit');
  assert.equal(extracts, 1);
});

async function api(t, options = {}) {
  const { jobs } = await service(t);
  const router = createYoutubeImportsRouter({ apiKey: 'test-key', service: jobs, ...options });
  const server = http.createServer((req, res) => router.matches(req.url) ? router.handle(req, res) : res.end('legacy'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'x-api-key': 'test-key', 'x-workspace-id': workspace, 'x-perfil-id': perfil, 'content-type': 'application/json' };
  return { jobs, base, headers, request: (suffix, init = {}) => fetch(base + BASE + suffix, { ...init, headers: { ...headers, ...init.headers } }) };
}
test('HTTP authentication is fail-closed and strict request/scopes are enforced', async t => {
  const a = await api(t);
  const wrong = await a.request('', { method: 'POST', headers: { 'x-api-key': 'wrong' }, body: '{}' });
  assert.equal(wrong.status, 401); assert.deepEqual(await wrong.json(), { version: 1, error: { code: 'unauthorized' } });
  const body = payload();
  for (const value of [{ ...body, url: 'https://evil.test' }, { ...body, perfil_id: other }, { ...body, video_id: '../cookies' }, { ...body, policy: 'anything' }]) {
    const bad = await a.request('', { method: 'POST', body: JSON.stringify(value) }); assert.equal(bad.status, 400);
  }
  const oversized = await a.request('', { method: 'POST', body: JSON.stringify({ text: 'x'.repeat(5000) }) }); assert.equal(oversized.status, 400);
  const missing = await api(t, { apiKey: '' }); assert.equal((await missing.request('')).status, 503);
  assert.equal(await (await fetch(a.base + '/api/v1/audio/transcribe-url')).text(), 'legacy');
});
test('HTTP creation/status/file/ACK contract is exact, scoped and non-redirecting', async t => {
  const a = await api(t); const body = payload();
  const created = await a.request('', { method: 'POST', body: JSON.stringify(body) }); assert.equal(created.status, 202);
  assert.equal((await created.json()).job_id, body.request_id); await a.jobs.idle();
  const replay = await a.request('', { method: 'POST', body: JSON.stringify(body) }); assert.equal(replay.status, 200);
  const denied = await a.request(`/${body.request_id}`, { headers: { 'x-perfil-id': other } }); assert.equal(denied.status, 404);
  const file = await a.request(`/${body.request_id}/file`); assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'video/mp4'); assert.equal(file.headers.get('content-length'), String(data.length));
  assert.equal(file.headers.get('etag'), `"${hash}"`); assert.equal(file.headers.get('location'), null);
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), data);
  const ack = await a.request(`/${body.request_id}/ack`, { method: 'POST', body: JSON.stringify({ sha256: hash }) });
  assert.deepEqual(await ack.json(), { version: 1, request_id: body.request_id, acknowledged: true });
  assert.equal((await a.request(`/${body.request_id}/file`)).status, 410);
});
test('legacy server bytes survive after removing only the integration additions', async () => {
  const server = await fs.readFile(path.join(__dirname, '../../server.js'), 'utf8');
  const restored = server.replace("const { createYoutubeImportsRouter } = require('./youtube-imports/router');\n", '')
    .replace("const youtubeImports = createYoutubeImportsRouter({ apiKey: API_KEY, ytDlp: process.env.YT_DLP_PATH || '/home/ubuntu/.local/bin/yt-dlp', ffmpeg: FFMPEG });\n", '')
    .replace('  if (youtubeImports.matches(url)) return youtubeImports.handle(req, res);\n\n', '');
  assert.equal(crypto.createHash('sha256').update(restored).digest('hex'), 'be76284da227ffa4b124cfec7fa84c3f5a28681b0ff9a033bab303b960198ef9');
  assert.ok(server.indexOf('youtubeImports.matches(url)') < server.indexOf("if (API_KEY && req.headers"));
});

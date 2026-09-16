'use strict';

const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ImportError, fail, safeCode, UUID, MAX_BYTES, checkAbort } = require('./security');
const { extract, processIdentity, killOwnedProcess } = require('./extractor');
const { obtainMedia } = require('./media');

const OWNED_FILES = ['part-0.mp4', 'part-1.mp4', 'artifact.pending.mp4', 'artifact.mp4'];
const WORKING = new Set(['extracting', 'downloading']);
const TERMINAL = new Set(['ready', 'failed', 'expired']);
async function syncDirectory(dir) {
  const fd = await fs.open(dir, constants.O_RDONLY | constants.O_DIRECTORY);
  try { await fd.sync(); } finally { await fd.close(); }
}
async function secureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('unavailable', 503);
  await fs.chmod(dir, 0o700);
}
async function atomicJSON(dir, name, data) {
  const temp = path.join(dir, `${name}.pending`);
  const fd = await fs.open(temp, constants.O_CREAT | constants.O_TRUNC | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
  try { await fd.writeFile(JSON.stringify(data)); await fd.sync(); } finally { await fd.close(); }
  await fs.rename(temp, path.join(dir, name));
  await syncDirectory(dir);
}
async function acquireLock(root) {
  const filename = path.join(root, 'owner.lock');
  const recoveryPath = path.join(root, 'owner.recovery');
  const identity = { ...await processIdentity(process.pid), nonce: crypto.randomUUID() };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = await fs.open(filename, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
      await fd.writeFile(JSON.stringify(identity)); await fd.sync(); await fd.close(); await syncDirectory(root);
      return async () => {
        const found = JSON.parse(await fs.readFile(filename, 'utf8'));
        if (found.nonce === identity.nonce) { await fs.unlink(filename); await syncDirectory(root); }
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let recovery;
      try { recovery = await fs.open(recoveryPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600); }
      catch { fail('unavailable', 503); }
      try {
        const stat = await fs.lstat(filename);
        if (!stat.isFile()) fail('unavailable', 503);
        let owner;
        try { owner = JSON.parse(await fs.readFile(filename, 'utf8')); } catch { fail('unavailable', 503); }
        if (!Number.isInteger(owner.pid) || !/^\d+$/.test(owner.start || '')) fail('unavailable', 503);
        try {
          const active = await processIdentity(owner.pid);
          if (active.start === owner.start) fail('unavailable', 503);
        } catch (error) { if (error instanceof ImportError || (error.code !== 'ENOENT' && error.code !== 'ESRCH')) throw error; }
        // Recovery mutex serializes compare/unlink. An orphaned recovery marker
        // intentionally fails closed and requires operator inspection.
        await fs.unlink(filename);
      } finally { await recovery.close(); await fs.unlink(recoveryPath); }
    }
  }
  fail('unavailable', 503);
}
async function diskUsage(root) {
  let bytes = 0;
  async function visit(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) fail('unavailable', 503);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) bytes += (await fs.lstat(target)).size;
      else fail('unavailable', 503);
    }
  }
  await visit(root);
  return bytes;
}
function envelope(job) {
  return { version: 1, request_id: job.request_id, job_id: job.request_id,
    workspace_id: job.workspace_id, perfil_id: job.perfil_id, video_id: job.video_id,
    status: job.status, created_at: job.created_at, updated_at: job.updated_at,
    expires_at: job.expires_at, artifact: job.status === 'ready' ? { ...job.artifact } : null,
    error: job.error ? { code: job.error.code } : null };
}
async function createJobService({ root = path.join(__dirname, '../tmp/youtube-imports'),
  extractVideo = extract, downloadMedia = obtainMedia, now = Date.now, maxJournals = 10_000,
  maxDiskBytes = 500_000_000, queueLimit = 5, queueMs = 600_000, jobMs = 180_000,
  retentionMs = 86_400_000, sweepMs = 30_000, ...pipelineOptions } = {}) {
  await secureDirectory(root);
  const releaseLock = await acquireLock(root);
  const jobs = new Map();
  const readers = new Map();
  let closed = false; let unhealthy = false; let serial = Promise.resolve();
  let running = null; let active = null; let timer;
  const lifetime = new AbortController();
  const iso = () => new Date(now()).toISOString();
  const dirOf = id => path.join(root, id);
  const transaction = fn => {
    const result = serial.then(fn);
    serial = result.catch(() => {});
    return result;
  };
  async function write(job) {
    try { await atomicJSON(dirOf(job.request_id), 'journal.json', job); }
    catch (error) { unhealthy = true; throw error; }
    jobs.set(job.request_id, job);
    return job;
  }
  async function transition(id, patch) {
    return write({ ...jobs.get(id), ...patch, updated_at: iso() });
  }
  async function cleanup(id, includeArtifact = true) {
    for (const file of OWNED_FILES) {
      if (file === 'artifact.mp4' && (!includeArtifact || (readers.get(id) || 0) > 0)) continue;
      try { await fs.unlink(path.join(dirOf(id), file)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  async function expire(job) {
    if (job.status === 'ready' && Date.parse(job.expires_at) <= now()) {
      job = await transition(job.request_id, { status: 'expired', error: { code: 'artifact_expired' } });
    }
    if (job.status === 'expired' || job.status === 'failed') await cleanup(job.request_id);
    return job;
  }
  function scoped(id, workspace, perfil) {
    const job = jobs.get(id);
    if (!job || job.workspace_id !== workspace || job.perfil_id !== perfil) fail('not_found', 404);
    return job;
  }
  async function sweep() {
    return transaction(async () => {
      for (const job of jobs.values()) {
        if (job.status === 'queued' && now() - Date.parse(job.created_at) >= queueMs) {
          await transition(job.request_id, { status: 'failed', error: { code: 'time_limit' } });
        } else await expire(job);
      }
    });
  }
  async function work() {
    while (!closed && !unhealthy) {
      const job = await transaction(async () => {
        const queued = [...jobs.values()].find(j => j.status === 'queued');
        if (!queued) return null;
        if (now() - Date.parse(queued.created_at) >= queueMs) {
          await transition(queued.request_id, { status: 'failed', error: { code: 'time_limit' } });
          return { skipped: true };
        }
        if (await diskUsage(root) + 100_000_000 > maxDiskBytes) {
          await transition(queued.request_id, { status: 'failed', error: { code: 'unavailable' } });
          return { skipped: true };
        }
        active = queued.request_id;
        return transition(queued.request_id, { status: 'extracting', started_at: iso(),
          deadline_at: new Date(now() + jobMs).toISOString() });
      });
      if (!job) break;
      if (job.skipped) continue;
      const deadline = new AbortController();
      const timeout = setTimeout(() => deadline.abort(new ImportError('time_limit')), jobMs);
      timeout.unref();
      const signal = AbortSignal.any([lifetime.signal, deadline.signal]);
      try {
        const options = { ...pipelineOptions, dir: dirOf(job.request_id), signal,
          onProcess: identity => transaction(() => transition(job.request_id, { process: identity })) };
        const selection = await extractVideo(job.video_id, options);
        checkAbort(signal);
        await transaction(() => transition(job.request_id, { status: 'downloading', process: null }));
        const artifact = await downloadMedia(selection, options);
        checkAbort(signal);
        if (!artifact || !Number.isSafeInteger(artifact.bytes) || artifact.bytes < 1 || artifact.bytes > MAX_BYTES ||
            !/^[a-f0-9]{64}$/.test(artifact.sha256) || artifact.mime_type !== 'video/mp4' ||
            !Number.isFinite(artifact.duration_seconds) || artifact.duration_seconds < 3 || artifact.duration_seconds > 180) fail('media_incompatible');
        await transaction(() => transition(job.request_id, { status: 'ready', artifact,
          expires_at: new Date(now() + retentionMs).toISOString(), process: null, error: null }));
      } catch (error) {
        await killOwnedProcess(jobs.get(job.request_id)?.process, dirOf(job.request_id));
        await transaction(() => transition(job.request_id, { status: 'failed', artifact: null,
          error: { code: signal.aborted ? safeCode(signal.reason) : safeCode(error) }, process: null }));
        await cleanup(job.request_id);
      } finally { clearTimeout(timeout); active = null; }
    }
  }
  function wake() {
    if (running || closed || unhealthy) return;
    running = work().catch(() => { unhealthy = true; }).finally(() => {
      running = null;
      if (!closed && !unhealthy && [...jobs.values()].some(j => j.status === 'queued')) wake();
    });
  }
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'owner.lock') continue;
      if (!entry.isDirectory() || !UUID.test(entry.name) || jobs.size >= maxJournals) fail('unavailable', 503);
      const file = await fs.open(path.join(dirOf(entry.name), 'journal.json'), constants.O_RDONLY | constants.O_NOFOLLOW);
      let job;
      try { job = JSON.parse(await file.readFile('utf8')); } finally { await file.close(); }
      if (job.request_id !== entry.name || !UUID.test(job.workspace_id) || !UUID.test(job.perfil_id) ||
          !['queued', ...WORKING, ...TERMINAL].includes(job.status)) fail('unavailable', 503);
      jobs.set(job.request_id, job);
      if (WORKING.has(job.status)) {
        await killOwnedProcess(job.process, dirOf(job.request_id));
        await transition(job.request_id, { status: 'failed', error: { code: 'interrupted' }, artifact: null, process: null });
        await cleanup(job.request_id);
      }
    }
    await sweep();
    timer = setInterval(() => { sweep().then(wake).catch(() => { unhealthy = true; }); }, sweepMs);
    timer.unref();
    wake(); // Startup recovery never depends on a new browser request.
  } catch (error) { await releaseLock(); throw error; }
  return {
    async admit(payload) {
      const result = await transaction(async () => {
        if (closed || unhealthy) fail('unavailable', 503);
        const existing = jobs.get(payload.request_id);
        if (existing) {
          scoped(payload.request_id, payload.workspace_id, payload.perfil_id);
          if (existing.video_id !== payload.video_id || existing.policy !== payload.policy) fail('conflict', 409);
          return { created: false, job: envelope(await expire(existing)) };
        }
        if (jobs.size >= maxJournals || await diskUsage(root) + 100_000_000 > maxDiskBytes) fail('unavailable', 503);
        const occupied = [...jobs.values()].filter(j => j.status === 'queued' || WORKING.has(j.status)).length;
        if (occupied >= queueLimit + 1) fail('queue_full', 429);
        await fs.mkdir(dirOf(payload.request_id), { mode: 0o700 });
        const created = iso();
        const job = { ...payload, status: 'queued', created_at: created, updated_at: created,
          expires_at: null, artifact: null, error: null, process: null, acknowledged_sha256: null };
        await write(job); await syncDirectory(root);
        return { created: true, job: envelope(job) };
      });
      wake();
      return result;
    },
    get(id, workspace, perfil) {
      return transaction(async () => envelope(await expire(scoped(id, workspace, perfil))));
    },
    open(id, workspace, perfil) {
      return transaction(async () => {
        const job = await expire(scoped(id, workspace, perfil));
        if (job.status === 'expired') fail('artifact_expired', 410);
        if (job.status !== 'ready') fail('not_ready', 409);
        let fd;
        try {
          fd = await fs.open(path.join(dirOf(id), 'artifact.mp4'), constants.O_RDONLY | constants.O_NOFOLLOW);
          const stat = await fd.stat();
          if (!stat.isFile() || stat.size !== job.artifact.bytes) fail('artifact_mismatch', 409);
        } catch (error) { await fd?.close(); throw error instanceof ImportError ? error : new ImportError('artifact_mismatch', 409); }
        readers.set(id, (readers.get(id) || 0) + 1);
        let released = false;
        return { artifact: { ...job.artifact }, fd,
          async release() {
            if (released) return; released = true;
            await fd.close();
            await transaction(async () => {
              readers.set(id, (readers.get(id) || 1) - 1);
              if (jobs.get(id).status === 'expired') await cleanup(id);
            });
          } };
      });
    },
    ack(id, workspace, perfil, sha) {
      return transaction(async () => {
        let job = scoped(id, workspace, perfil);
        if (job.acknowledged_sha256) {
          if (job.acknowledged_sha256 !== sha) fail('artifact_mismatch', 409);
        } else {
          job = await expire(job);
          if (job.status === 'expired') fail('artifact_expired', 410);
          if (job.status !== 'ready') fail('not_ready', 409);
          if (job.artifact.sha256 !== sha) fail('artifact_mismatch', 409);
          await transition(id, { acknowledged_sha256: sha, status: 'expired', error: { code: 'artifact_expired' } });
          await cleanup(id);
        }
        return { version: 1, request_id: id, acknowledged: true };
      });
    },
    sweep,
    async idle() { while (running) await running; await serial; },
    async close() {
      closed = true; clearInterval(timer); lifetime.abort(new ImportError('interrupted'));
      if (running) await running;
      await serial; await releaseLock();
    },
  };
}

module.exports = { createJobService, acquireLock, atomicJSON, diskUsage, envelope };

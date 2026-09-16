'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ImportError, fail, MAX_BYTES, VIDEO_ID, mediaURL, createMetadataProxy, checkAbort, abortError } = require('./security');

function safeEnv(dir) {
  return { PATH: '/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8',
    TMPDIR: dir, YTDLP_NO_PLUGINS: '1' };
}
async function processIdentity(pid) {
  const stat = await fs.readFile(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
  return { pid, start: fields[19] };
}
async function killOwnedProcess(identity, dir) {
  if (!identity || !Number.isInteger(identity.pid) || identity.pid <= 1) return;
  try {
    const actual = await processIdentity(identity.pid);
    const cwd = await fs.readlink(`/proc/${identity.pid}/cwd`);
    if (actual.start === identity.start && cwd === dir) process.kill(-identity.pid, 'SIGKILL');
  } catch { /* Already gone, or not our process: never guess ownership. */ }
}

// Wrapper waits for IPC after its identity is journalled. On parent disconnect it
// terminates its own process group, including yt-dlp/ffmpeg children.
if (require.main === module && process.argv[2] === '--runner') {
  process.umask(0o077);
  process.on('disconnect', () => { try { process.kill(-process.pid, 'SIGKILL'); } catch { process.exit(1); } });
  process.once('message', ({ bin, args }) => {
    const child = spawn(bin, args, { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(process.stdout); child.stderr.pipe(process.stderr);
    child.on('error', () => process.exit(1));
    child.on('close', code => process.exit(code === 0 ? 0 : 1));
  });
}

async function runBounded(bin, args, { dir, signal, timeoutMs = 30_000, stdoutLimit = 2 * 1024 * 1024,
  stderrLimit = 256 * 1024, onProcess = async () => {}, spawnProcess = spawn } = {}) {
  checkAbort(signal);
  const child = spawnProcess(process.execPath, [__filename, '--runner'], {
    cwd: dir, env: safeEnv(dir), detached: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  return new Promise((resolve, reject) => {
    let out = []; let err = []; let outBytes = 0; let errBytes = 0; let finished = false;
    const finish = (error, result) => {
      if (finished) return;
      finished = true; clearTimeout(timer); signal?.removeEventListener('abort', aborted);
      if (error && child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
      if (error) reject(error); else resolve(result);
    };
    const aborted = () => finish(abortError(signal));
    const timer = setTimeout(() => finish(new ImportError('time_limit')), timeoutMs);
    timer.unref();
    signal?.addEventListener('abort', aborted, { once: true });
    child.stdout.on('data', chunk => { outBytes += chunk.length; if (outBytes > stdoutLimit) finish(new ImportError('size_limit')); else out.push(chunk); });
    child.stderr.on('data', chunk => { errBytes += chunk.length; if (errBytes > stderrLimit) finish(new ImportError('size_limit')); else err.push(chunk); });
    child.on('error', () => finish(new ImportError('unavailable')));
    child.on('close', code => {
      const stderr = Buffer.concat(err).toString('utf8');
      if (code !== 0) return finish(new ImportError(/sign.?in|login|private|authentication|cookies/i.test(stderr) ? 'source_requires_auth' : 'source_unavailable'));
      finish(null, Buffer.concat(out).toString('utf8'));
    });
    (async () => {
      try {
        const identity = await processIdentity(child.pid);
        await onProcess(identity);
        checkAbort(signal);
        if (!finished) child.send({ bin, args });
      } catch (error) { finish(error instanceof ImportError ? error : new ImportError('internal_error')); }
    })();
    if (signal?.aborted) aborted();
  });
}

function extractorArgs(videoId, proxy) {
  if (!VIDEO_ID.test(videoId)) fail('invalid_request', 400);
  return ['--ignore-config', '--no-plugin-dirs', '--no-remote-components', '--no-cookies',
    '--no-cookies-from-browser', '--no-exec', '--no-cache-dir', '--no-playlist', '--skip-download',
    '--dump-single-json', '--no-warnings', '--socket-timeout', '15', '--retries', '0',
    '--extractor-retries', '0', '--proxy', proxy, '--', `https://www.youtube.com/watch?v=${videoId}`];
}
const audioOK = f => /^mp4a\.40\.|^aac$/.test(f.acodec || '') && f.asr === 48000 &&
  Number.isInteger(f.audio_channels) && f.audio_channels >= 1 && f.audio_channels <= 2;
const videoOK = f => /^(avc1(?:\.|$)|h264$)/.test(f.vcodec || '') &&
  ((f.width === 720 && f.height === 1280) || (f.width === 1080 && f.height === 1920)) &&
  Number.isFinite(f.fps) && f.fps >= 24 && f.fps <= 60;
function direct(f) {
  if (!f || f.protocol !== 'https' || !['mp4', 'm4a'].includes(f.ext) || f.manifest_url || f.fragments) return false;
  try { mediaURL(f.url); return true; } catch { return false; }
}
function selectFormats(info, expectedId) {
  if (!info || info.id !== expectedId || (info._type && info._type !== 'video') || info.entries) fail('source_unavailable');
  if (info.is_live || info.is_upcoming || !['not_live', 'was_live'].includes(info.live_status)) fail('source_live');
  if (!['public', 'unlisted'].includes(info.availability)) fail('source_requires_auth');
  if (!Number.isFinite(info.duration) || info.duration < 3) fail('media_incompatible');
  if (info.duration > 180) fail('source_too_long');
  const formats = Array.isArray(info.formats) ? info.formats : [];
  const hasAudio = formats.some(f => typeof f.acodec === 'string' && f.acodec !== 'none');
  const compatible = formats.filter(direct);
  const combined = compatible.filter(f => videoOK(f) && f.ext === 'mp4' && audioOK(f));
  const video = compatible.filter(f => videoOK(f) && f.ext === 'mp4' && f.acodec === 'none');
  const audio = compatible.filter(f => f.vcodec === 'none' && audioOK(f));
  const candidates = combined.map(f => [f]);
  if (hasAudio) { for (const v of video) for (const a of audio) candidates.push([v, a]); }
  else candidates.push(...video.map(f => [f]));
  const withinLimit = candidates.filter(parts => parts.reduce((sum, f) => sum + (f.filesize || f.filesize_approx || 0), 0) <= MAX_BYTES);
  if (!withinLimit.length) fail(candidates.length ? 'size_limit' : 'media_incompatible');
  withinLimit.sort((a, b) => b[0].height - a[0].height || a.length - b.length);
  return { duration: info.duration, hasAudio, parts: withinLimit[0].map(f => ({ url: f.url, hasAudio: f.acodec !== 'none' })) };
}
async function extract(videoId, options) {
  const proxy = await (options.createProxy || createMetadataProxy)({ signal: options.signal, lookup: options.lookup });
  try {
    const output = await (options.run || runBounded)(options.ytDlp || '/home/ubuntu/.local/bin/yt-dlp',
      extractorArgs(videoId, proxy.url), { ...options, signal: proxy.signal, timeoutMs: 45_000 });
    if (proxy.failure) throw proxy.failure;
    let info;
    try { info = JSON.parse(output); } catch { fail('upstream_error'); }
    return selectFormats(info, videoId);
  } catch (error) { throw proxy.failure || error; }
  finally { await proxy.close(); }
}

module.exports = { safeEnv, processIdentity, killOwnedProcess, runBounded, extractorArgs, selectFormats, extract };

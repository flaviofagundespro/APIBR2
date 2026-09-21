'use strict';

const fs = require('node:fs/promises');
const { constants, createReadStream } = require('node:fs');
const https = require('node:https');
const tls = require('node:tls');
const path = require('node:path');
const crypto = require('node:crypto');
const { ImportError, fail, MAX_BYTES, mediaURL, pinnedAddress, checkAbort, abortError } = require('./security');
const { runBounded } = require('./extractor');

function openResponse(url, address, signal) {
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    const req = https.request({ protocol: 'https:', hostname: address, family: 4, port: 443,
      servername: url.hostname, checkServerIdentity: (_host, cert) => tls.checkServerIdentity(url.hostname, cert),
      method: 'GET', path: url.pathname + url.search, agent: false,
      headers: { Host: url.hostname, 'Accept-Encoding': 'identity', 'User-Agent': 'Soria-Video-Import/1' },
      signal }, resolve);
    req.on('error', () => reject(signal?.aborted ? abortError(signal) : new ImportError('upstream_error')));
    req.setTimeout(15_000, () => req.destroy(new ImportError('time_limit')));
    req.end();
  });
}
async function downloadPart(input, destination, budget, { signal, lookup, request = openResponse, policy } = {}) {
  let url = mediaURL(input);
  let response;
  let file;
  try {
    for (let redirects = 0; ; redirects++) {
      checkAbort(signal);
      const address = await pinnedAddress(url.hostname, { lookup, signal });
      response = await request(url, address, signal);
      if (![301, 302, 303, 307, 308].includes(response.statusCode)) break;
      response.destroy();
      if (redirects >= 3 || typeof response.headers.location !== 'string') fail('network_blocked');
      try { url = mediaURL(new URL(response.headers.location, url).href); }
      catch { fail('network_blocked'); }
    }
    if (response.statusCode !== 200 || response.headers['content-range']) fail('upstream_error');
    if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') fail('media_incompatible');
    const mime = (response.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (!(policy === 'soria-reel-v2' ? ['video/mp4', 'audio/mp4', 'video/webm', 'audio/webm', 'application/octet-stream'] : ['video/mp4', 'audio/mp4', 'application/octet-stream']).includes(mime)) fail('media_incompatible');
    const length = response.headers['content-length'];
    if (length !== undefined && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) fail('upstream_error');
    if (length !== undefined && Number(length) + budget.bytes > budget.max) fail('size_limit');
    file = await fs.open(destination, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    let received = 0;
    const aborted = () => response.destroy(abortError(signal));
    signal?.addEventListener('abort', aborted, { once: true });
    try {
      for await (const chunk of response) {
        checkAbort(signal);
        received += chunk.length; budget.bytes += chunk.length;
        if (budget.bytes > budget.max) fail('size_limit');
        await file.writeFile(chunk);
      }
    } finally { signal?.removeEventListener('abort', aborted); }
    checkAbort(signal);
    if (!received || (length !== undefined && received !== Number(length))) fail('upstream_error');
    await file.sync();
    return received;
  } catch (error) {
    response?.destroy();
    if (error instanceof ImportError) throw error;
    throw signal?.aborted ? abortError(signal) : new ImportError('upstream_error');
  } finally { if (file) await file.close(); }
}
function muxArgs(video, audio, output) {
  const args = ['-nostdin', '-hide_banner', '-v', 'error', '-n'];
  for (const input of [video, audio].filter(Boolean)) {
    args.push('-protocol_whitelist', 'file', '-format_whitelist', 'mov', '-enable_drefs', '0', '-use_absolute_path', '0', '-i', input);
  }
  args.push('-map', '0:v:0', '-map', audio ? '1:a:0' : '0:a:0?', '-c', 'copy',
    '-map_metadata', '-1', '-movflags', '+faststart', '-f', 'mp4', output);
  return args;
}
function validateProbe(probe, expectedAudio) {
  if (!probe || !Array.isArray(probe.streams) || !probe.format || !probe.format.format_name?.split(',').includes('mp4')) fail('media_incompatible');
  const video = probe.streams.filter(s => s.codec_type === 'video');
  const audio = probe.streams.filter(s => s.codec_type === 'audio');
  if (video.length !== 1 || audio.length > 1 || probe.streams.length !== video.length + audio.length || (expectedAudio && audio.length !== 1)) fail('media_incompatible');
  const v = video[0];
  const parts = String(v.avg_frame_rate).split('/').map(Number);
  const fps = parts.length === 2 && parts[1] > 0 ? parts[0] / parts[1] : NaN;
  const duration = Number(probe.format.duration);
  if (v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p' ||
      !((v.width === 720 && v.height === 1280) || (v.width === 1080 && v.height === 1920)) ||
      !Number.isFinite(fps) || fps < 24 || fps > 60 || !Number.isFinite(duration) || duration < 3 || duration > 180) fail('media_incompatible');
  if (audio.some(a => a.codec_name !== 'aac' || Number(a.sample_rate) !== 48000 || ![1, 2].includes(a.channels))) fail('media_incompatible');
  return duration;
}
async function hashFile(file, signal) {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(file, { flags: constants.O_RDONLY | constants.O_NOFOLLOW });
  const aborted = () => stream.destroy(abortError(signal));
  signal?.addEventListener('abort', aborted, { once: true });
  try { for await (const chunk of stream) { checkAbort(signal); hash.update(chunk); } }
  finally { signal?.removeEventListener('abort', aborted); }
  checkAbort(signal);
  return hash.digest('hex');
}
function phaseSignal(parent, ms) { return AbortSignal.any([parent, AbortSignal.timeout(ms)]); }
async function obtainMedia(selection, options) {
  if (options.policy === 'soria-reel-v2') return require('./normalize').obtainNormalizedMedia(selection, options);
  if (!selection.parts?.length || selection.parts.length > 2) fail('media_incompatible');
  const { dir, signal } = options;
  const budget = { bytes: 0, max: MAX_BYTES };
  const downloadSignal = phaseSignal(signal, 90_000);
  const parts = [];
  for (let index = 0; index < selection.parts.length; index++) {
    const destination = path.join(dir, `part-${index}.mp4`);
    await downloadPart(selection.parts[index].url, destination, budget, { ...options, signal: downloadSignal });
    parts.push(destination);
  }
  checkAbort(signal);
  const pending = path.join(dir, 'artifact.pending.mp4');
  // Always remux local files to exclude container-level external references and
  // remove provider metadata. No frame/audio transformation is requested.
  const ffmpeg = options.ffmpeg === 'ffmpeg' ? '/usr/bin/ffmpeg' : options.ffmpeg || '/usr/bin/ffmpeg';
  if (!path.isAbsolute(ffmpeg)) fail('unavailable', 503);
  try {
    await (options.run || runBounded)('/usr/bin/prlimit',
      [`--fsize=${MAX_BYTES}:${MAX_BYTES}`, '--core=0:0', '--', ffmpeg, ...muxArgs(parts[0], parts[1], pending)],
      { ...options, timeoutMs: 30_000 });
  } catch (error) {
    const partial = await fs.lstat(pending).catch(() => null);
    if (partial?.size >= MAX_BYTES) fail('size_limit');
    throw error;
  }
  await fs.chmod(pending, 0o600);
  const stat = await fs.lstat(pending);
  if (!stat.isFile() || stat.size < 1 || stat.size >= MAX_BYTES) fail('size_limit');
  const probeSignal = phaseSignal(signal, 15_000);
  const probeText = await (options.run || runBounded)(options.ffprobe || '/usr/bin/ffprobe',
    ['-v', 'error', '-protocol_whitelist', 'file', '-format_whitelist', 'mov', '-enable_drefs', '0', '-use_absolute_path', '0',
      '-show_streams', '-show_format', '-of', 'json', pending], { ...options, signal: probeSignal, timeoutMs: 15_000 });
  let probe;
  try { probe = JSON.parse(probeText); } catch { fail('media_incompatible'); }
  const duration = validateProbe(probe, selection.hasAudio);
  // A truncated mux must not silently turn a source into a shorter clip.
  if (Math.abs(duration - selection.duration) > 1) fail('media_incompatible');
  const sha256 = await hashFile(pending, probeSignal);
  const fd = await fs.open(pending, constants.O_RDONLY | constants.O_NOFOLLOW);
  await fd.sync(); await fd.close();
  checkAbort(signal);
  await fs.rename(pending, path.join(dir, 'artifact.mp4'));
  for (const part of parts) await fs.unlink(part);
  return { bytes: stat.size, sha256, mime_type: 'video/mp4', duration_seconds: duration };
}

module.exports = { openResponse, downloadPart, muxArgs, validateProbe, hashFile, obtainMedia };

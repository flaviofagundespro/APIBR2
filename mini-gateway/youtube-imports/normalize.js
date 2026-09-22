'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { fail, MAX_BYTES, SOURCE_MAX_BYTES, checkAbort } = require('./security');
const { runBounded } = require('./extractor');
const { downloadPart, validateProbe, hashFile } = require('./media');

// All demuxing/encoding is local: signed URLs never reach FFmpeg.
const LOCAL = ['-protocol_whitelist', 'file', '-format_whitelist', 'mov,matroska,webm'];
const LIMITS = ['--as=2147483648:2147483648', '--cpu=300:300', '--core=0:0'];
function fpsOf(stream) {
  const [n, d] = String(stream.avg_frame_rate || '0/1').split('/').map(Number);
  return d > 0 ? n / d : 0;
}
function encodingPlan(probes, selection, sourceBytes, retry = false) {
  const video = probes[0].streams?.find(s => s.codec_type === 'video');
  const audio = probes[probes.length - 1].streams?.find(s => s.codec_type === 'audio');
  if (!video || (selection.hasAudio && !audio)) fail('validation_failed');
  for (const probe of probes) {
    const duration = Number(probe.format?.duration);
    if (!Number.isFinite(duration) || Math.abs(duration - selection.duration) > 1) fail('validation_failed');
  }
  const videoRate = Math.floor(Math.min(3_000_000, MAX_BYTES * 8 * 0.90 / selection.duration - 128_000) * (retry ? 0.75 : 1));
  if (videoRate < 256_000) fail('size_limit');
  const fps = fpsOf(video);
  const copyVideo = !retry && sourceBytes < MAX_BYTES * 0.85 && video.codec_name === 'h264' && video.pix_fmt === 'yuv420p' && (!video.sample_aspect_ratio || video.sample_aspect_ratio === '1:1') &&
    !(video.side_data_list || []).some(s => Number(s.rotation)) &&
    ((video.width === 720 && video.height === 1280) || (video.width === 1080 && video.height === 1920)) && fps >= 24 && fps <= 60;
  const copyAudio = audio?.codec_name === 'aac' && Number(audio.sample_rate) === 48000 && [1, 2].includes(audio.channels);
  // AAC decoding/resampling may add sub-frame encoder padding. Keep exactly
  // the declared source samples; never shorten video or trim to fit bytes.
  const audioDuration = Number(audio?.duration) > 0 ? Number(audio.duration) : selection.duration;
  return { copyVideo, copyAudio, videoRate, hasAudio: Boolean(audio), audioSamples: Math.round(audioDuration * 48000) };
}
function normalizeArgs(parts, output, plan) {
  const args = ['-nostdin', '-hide_banner', '-v', 'error', '-xerror', '-n', '-filter_threads', '2', '-filter_complex_threads', '2'];
  for (const part of parts) args.push('-threads', '2', ...LOCAL, '-i', part);
  args.push('-map', '0:v:0');
  if (plan.hasAudio) args.push('-map', parts.length === 2 ? '1:a:0' : '0:a:0');
  if (plan.copyVideo) args.push('-c:v', 'copy');
  else args.push('-vf', 'scale=trunc(iw*sar/2)*2:ih,setsar=1,scale=720:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30',
    '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-b:v', String(plan.videoRate),
    '-maxrate', String(plan.videoRate), '-bufsize', String(plan.videoRate * 2), '-threads:v', '2');
  if (plan.hasAudio) args.push('-c:a', plan.copyAudio ? 'copy' : 'aac', ...(plan.copyAudio ? [] : ['-af', `aresample=48000,atrim=end_sample=${plan.audioSamples}`, '-ar', '48000', '-ac', '2', '-b:a', '128k', '-threads:a', '2']));
  args.push('-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart', '-f', 'mp4', output);
  return args;
}
async function probeFile(file, options) {
  const text = await (options.run || runBounded)('/usr/bin/prlimit', [...LIMITS, '--', options.ffprobe || '/usr/bin/ffprobe',
    '-v', 'error', '-threads', '2', ...LOCAL, '-show_streams', '-show_format', '-of', 'json', file],
  { ...options, timeoutMs: 15_000, failureCode: 'validation_failed' });
  try { return JSON.parse(text); } catch { fail('validation_failed'); }
}
async function normalizeFiles(parts, selection, sourceBytes, options) {
  const started = Date.now();
  const pending = path.join(options.dir, 'artifact.pending.mp4');
  const run = options.run || runBounded;
  const ffmpeg = options.ffmpeg || '/usr/bin/ffmpeg';
  if (!path.isAbsolute(ffmpeg)) fail('unavailable', 503);
  const probes = [];
  for (const part of parts) probes.push(await probeFile(part, options));
  let stat;
  for (let attempt = 0; attempt < 2; attempt++) {
    const plan = encodingPlan(probes, selection, sourceBytes, attempt === 1);
    try {
      await run('/usr/bin/prlimit', [...LIMITS, `--fsize=${MAX_BYTES}:${MAX_BYTES}`, '--', ffmpeg, ...normalizeArgs(parts, pending, plan)],
        { ...options, timeoutMs: 150_000, failureCode: 'conversion_failed' });
    } catch (error) {
      stat = await fs.lstat(pending).catch(() => null);
      if (!(stat?.size >= MAX_BYTES)) throw error;
    }
    stat = await fs.lstat(pending);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1) fail('validation_failed');
    if (stat.size < MAX_BYTES) break;
    await fs.unlink(pending);
    if (attempt === 1) fail('size_limit');
  }
  await fs.chmod(pending, 0o600);
  const probe = await probeFile(pending, options);
  let duration;
  try { duration = validateProbe(probe, selection.hasAudio); } catch { fail('validation_failed'); }
  if (Math.abs(duration - selection.duration) > 1) fail('validation_failed');
  for (const stream of probe.streams) {
    if (!Number.isFinite(Number(stream.duration)) || Math.abs(Number(stream.duration) - duration) > 1) fail('validation_failed');
  }
  // Decode every frame/sample, not only the header; truncation/corruption is terminal.
  await run('/usr/bin/prlimit', [...LIMITS, '--', ffmpeg, '-nostdin', '-hide_banner', '-v', 'error', '-xerror',
    '-threads', '2', ...LOCAL, '-i', pending, '-map', '0:v:0', '-map', '0:a:0?', '-threads', '2', '-f', 'null', '-'],
  { ...options, timeoutMs: 60_000, failureCode: 'validation_failed' });
  const sha256 = await hashFile(pending, options.signal);
  const fd = await fs.open(pending, 'r');
  try { await fd.sync(); } finally { await fd.close(); }
  checkAbort(options.signal);
  await fs.rename(pending, path.join(options.dir, 'artifact.mp4'));
  for (const part of parts) await fs.unlink(part);
  await options.onMetric?.({ phase: 'normalization', elapsed_ms: Date.now() - started, source_bytes: sourceBytes, final_bytes: stat.size });
  return { bytes: stat.size, sha256, mime_type: 'video/mp4', duration_seconds: duration };
}
async function obtainNormalizedMedia(selection, options) {
  if (!selection.parts?.length || selection.parts.length > 2 || !Number.isFinite(selection.duration) || selection.duration < 3 || selection.duration > 180) fail('media_incompatible');
  const budget = { bytes: 0, max: SOURCE_MAX_BYTES };
  const signal = AbortSignal.any([options.signal, AbortSignal.timeout(120_000)]);
  const parts = [];
  for (let index = 0; index < selection.parts.length; index++) {
    const destination = path.join(options.dir, `part-${index}.mp4`);
    await downloadPart(selection.parts[index].url, destination, budget, { ...options, signal });
    parts.push(destination);
  }
  return normalizeFiles(parts, selection, budget.bytes, options);
}
module.exports = { encodingPlan, normalizeArgs, normalizeFiles, obtainNormalizedMedia };

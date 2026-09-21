'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const exec = promisify(require('node:child_process').execFile);
const { normalizeFiles, encodingPlan, normalizeArgs } = require('../normalize');
const { selectFormats } = require('../extractor');
const { validateProbe } = require('../media');

for (const fixture of [
  { name: 'vertical AAC44100', video: 'libx264', audio: 'aac', rate: 44100, size: '720x1280', ext: 'mp4' },
  { name: 'horizontal VP9 Opus', video: 'libvpx-vp9', audio: 'libopus', rate: 48000, size: '320x180', ext: 'webm' },
  { name: 'AV1 horizontal', video: 'libaom-av1', audio: 'libopus', rate: 48000, size: '160x90', ext: 'webm' },
  { name: 'silent horizontal', video: 'libx264', size: '320x180', ext: 'mp4' },
  { name: 'compatible AAC48000', video: 'libx264', audio: 'aac', rate: 48000, size: '720x1280', ext: 'mp4' },
]) test(`real complete normalization: ${fixture.name}`, { timeout: 60000 }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'normalize-test-'));
  try {
    const input = path.join(dir, `source.${fixture.ext}`);
    const args = ['-v', 'error', '-f', 'lavfi', '-i', `testsrc2=s=${fixture.size}:r=30:d=3`];
    if (fixture.audio) args.push('-f', 'lavfi', '-i', `sine=frequency=440:sample_rate=${fixture.rate}:duration=3`);
    args.push('-c:v', fixture.video, '-threads', '2');
    if (fixture.video === 'libx264') args.push('-preset', 'ultrafast');
    if (fixture.audio) args.push('-c:a', fixture.audio);
    args.push(input);
    await exec('/usr/bin/ffmpeg', args);
    const size = (await fs.stat(input)).size;
    const result = await normalizeFiles([input], { duration: 3, hasAudio: Boolean(fixture.audio) }, size,
      { dir, signal: new AbortController().signal });
    assert.equal(result.mime_type, 'video/mp4');
    assert.match(result.sha256, /^[a-f0-9]{64}$/);
    assert.ok(result.duration_seconds >= 3 && result.duration_seconds <= 4);
    const { stdout } = await exec('/usr/bin/ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path.join(dir, 'artifact.mp4')]);
    validateProbe(JSON.parse(stdout), Boolean(fixture.audio));
    assert.equal(await fs.stat(input).then(() => true, () => false), false);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('v2 accepts 44.1 kHz and preserves v1 rejection and duration limits', () => {
  const url = 'https://r1.googlevideo.com/videoplayback';
  const info = { id: 'LRnwP-yahEQ', live_status: 'not_live', availability: 'public', duration: 48,
    formats: [{ protocol: 'https', ext: 'mp4', vcodec: 'avc1.64001f', acodec: 'none', width: 720, height: 1280, fps: 30, url },
      { protocol: 'https', ext: 'm4a', vcodec: 'none', acodec: 'mp4a.40.2', asr: 44100, audio_channels: 2, url }] };
  assert.throws(() => selectFormats(info, info.id), { code: 'media_incompatible' });
  assert.equal(selectFormats(info, info.id, 'soria-reel-v2').parts.length, 2);
  for (const duration of [3, 180]) assert.equal(selectFormats({ ...info, duration }, info.id, 'soria-reel-v2').duration, duration);
  assert.throws(() => selectFormats({ ...info, duration: 181 }, info.id, 'soria-reel-v2'), { code: 'source_too_long' });
});
test('conversion has no network or truncation and bitrate covers the 180s budget', () => {
  const plan = encodingPlan([{ streams: [{ codec_type: 'video', codec_name: 'vp9' }], format: { duration: 180 } }], { duration: 180 }, 100000000);
  assert.ok(plan.videoRate * 180 / 8 < 50000000);
  const args = normalizeArgs(['/local/source'], '/local/result', plan);
  assert.ok(!args.includes('-fs') && !args.includes('-t'));
  assert.equal(args[args.indexOf('-protocol_whitelist') + 1], 'file');
});

test('truncated input never becomes ready and abort is honored', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'normalize-corrupt-'));
  try {
    const input = path.join(dir, 'part-0.mp4');
    await fs.writeFile(input, Buffer.from('truncated MP4'));
    const selection = { duration: 3, hasAudio: false };
    await assert.rejects(normalizeFiles([input], selection, 13, { dir, signal: new AbortController().signal }), { code: 'validation_failed' });
    assert.equal(await fs.stat(path.join(dir, 'artifact.mp4')).then(() => true, () => false), false);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(normalizeFiles([input], selection, 13, { dir, signal: controller.signal }));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

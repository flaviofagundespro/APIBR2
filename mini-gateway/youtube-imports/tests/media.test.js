'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { downloadPart, muxArgs, validateProbe, obtainMedia } = require('../media');
const { runBounded } = require('../extractor');

const url = 'https://r1.googlevideo.com/video?private=signed';
const lookup = async () => [{ family: 4, address: '8.8.8.8' }];
const code = expected => error => error.code === expected;
async function directory(t) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soria-media-test-')); t.after(() => fs.rm(dir, { recursive: true, force: true })); return dir; }
function response(body = ['abcd'], headers = {}, statusCode = 200) {
  return Object.assign(Readable.from(body.map(value => Buffer.from(value))), { statusCode, headers: { 'content-type': 'video/mp4', ...headers } });
}
function probe() { return { format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2', duration: '3.000' }, streams: [
  { codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p', width: 720, height: 1280, avg_frame_rate: '30/1' },
  { codec_type: 'audio', codec_name: 'aac', sample_rate: '48000', channels: 2 },
] }; }

test('media GET uses pinned address; signed URL stays only inside transporter', async t => {
  const dir = await directory(t); const budget = { bytes: 0, max: 50 };
  const bytes = await downloadPart(url, path.join(dir, 'part.mp4'), budget, { lookup,
    request: async (target, address) => { assert.equal(target.hostname, 'r1.googlevideo.com'); assert.equal(address, '8.8.8.8'); return response(['abcd'], { 'content-length': '4' }); } });
  assert.equal(bytes, 4); assert.equal(budget.bytes, 4); assert.equal((await fs.stat(path.join(dir, 'part.mp4'))).mode & 0o777, 0o600);
});
test('every redirect is allowlisted and freshly pinned; rebinding fails before transfer', async t => {
  const dir = await directory(t); let resolutions = 0; let requests = 0;
  await assert.rejects(downloadPart(url, path.join(dir, 'part.mp4'), { bytes: 0, max: 50 }, {
    lookup: async () => [{ family: 4, address: ++resolutions === 1 ? '8.8.8.8' : '127.0.0.1' }],
    request: async () => { requests++; return response([], { location: '/redirect' }, 302); },
  }), code('network_blocked'));
  assert.equal(resolutions, 2); assert.equal(requests, 1);
  for (const location of ['http://r1.googlevideo.com/x', 'https://evil.test/x', 'https://googlevideo.com/x', 'https://u:p@r2.googlevideo.com/x']) {
    await assert.rejects(downloadPart(url, path.join(dir, 'part.mp4'), { bytes: 0, max: 50 }, {
      lookup, request: async () => response([], { location }, 302),
    }), code('network_blocked'));
  }
});
test('media redirect budget is three, never infinite', async t => {
  const dir = await directory(t); let requests = 0;
  await assert.rejects(downloadPart(url, path.join(dir, 'part.mp4'), { bytes: 0, max: 50 }, {
    lookup, request: async () => { requests++; return response([], { location: '/again' }, 307); },
  }), code('network_blocked'));
  assert.equal(requests, 4);
});
test('shared actual byte count bounds chunked parts and rejects misleading length', async t => {
  const dir = await directory(t);
  await assert.rejects(downloadPart(url, path.join(dir, 'oversize.mp4'), { bytes: 3, max: 5 }, { lookup, request: async () => response(['aa', 'bb']) }), code('size_limit'));
  assert.equal((await fs.stat(path.join(dir, 'oversize.mp4'))).size, 2);
  await assert.rejects(downloadPart(url, path.join(dir, 'short.mp4'), { bytes: 0, max: 50 }, { lookup, request: async () => response(['a'], { 'content-length': '2' }) }), code('upstream_error'));
  await assert.rejects(downloadPart(url, path.join(dir, 'announced.mp4'), { bytes: 4, max: 5 }, { lookup, request: async () => response(['ab'], { 'content-length': '2' }) }), code('size_limit'));
});
test('media rejects partial responses, encoding, MIME masquerade and aborted transfer', async t => {
  const dir = await directory(t);
  for (const [headers, status, expected] of [[{}, 206, 'upstream_error'], [{ 'content-encoding': 'gzip' }, 200, 'media_incompatible'], [{ 'content-type': 'text/html' }, 200, 'media_incompatible']]) {
    await assert.rejects(downloadPart(url, path.join(dir, 'bad.mp4'), { bytes: 0, max: 50 }, { lookup, request: async () => response(['x'], headers, status) }), code(expected));
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(downloadPart(url, path.join(dir, 'aborted.mp4'), { bytes: 0, max: 50 }, { lookup, signal: controller.signal }), code('time_limit'));
});
test('mux uses local file-only copy, no recoding or source network references', () => {
  const args = muxArgs('/own/part-0.mp4', '/own/part-1.mp4', '/own/artifact.pending.mp4');
  assert.equal(args[args.indexOf('-c') + 1], 'copy');
  assert.equal(args.filter(a => a === '-protocol_whitelist').length, 2);
  assert.equal(args.includes('file'), true); assert.equal(args.includes('-enable_drefs'), true);
  assert.equal(args.includes('-vf'), false); assert.equal(args.includes('-t'), false);
  assert.equal(args.includes('-fs'), false);
});
test('kernel file-size cap rejects overrun without silent successful truncation', async t => {
  const dir = await directory(t);
  await assert.rejects(runBounded('/usr/bin/prlimit', ['--fsize=1024:1024', '--core=0:0', '--', process.execPath,
    '-e', 'require("fs").writeFileSync("overrun", Buffer.alloc(2048))'], { dir }), code('source_unavailable'));
  assert.ok((await fs.stat(path.join(dir, 'overrun'))).size <= 1024);
  assert.equal((await fs.readdir(dir)).some(name => name.startsWith('core')), false);
});
test('mux result at resource-limit boundary never becomes a ready artifact', async t => {
  const dir = await directory(t);
  await assert.rejects(obtainMedia({ duration: 3, hasAudio: false, parts: [{ url }] }, {
    dir, signal: new AbortController().signal, lookup, request: async () => response(),
    run: async (bin, args) => {
      assert.equal(bin, '/usr/bin/prlimit'); assert.ok(args.includes('--core=0:0')); assert.equal(args.includes('-fs'), false);
      const fd = await fs.open(args.at(-1), 'w'); await fd.truncate(50_000_000); await fd.close(); return '';
    },
  }), code('size_limit'));
  await assert.rejects(fs.stat(path.join(dir, 'artifact.mp4')), { code: 'ENOENT' });
});
test('probe rejects codec, dimensions, audio omission and unknown duration', () => {
  assert.equal(validateProbe(probe(), true), 3);
  for (const change of [p => p.streams[0].pix_fmt = 'yuv444p', p => p.streams[0].width = 1280,
    p => p.streams[1].sample_rate = '44100', p => p.streams.pop(), p => p.format.duration = 'N/A']) {
    const bad = probe(); change(bad); assert.throws(() => validateProbe(bad, true), code('media_incompatible'));
  }
});
test('artifact requires probe+hash, only local synthetic bytes; shorter mux is rejected', async t => {
  const dir = await directory(t); const controller = new AbortController();
  const selection = { duration: 3, hasAudio: true, parts: [{ url }] };
  const run = async (bin, args) => {
    if (bin.includes('ffprobe')) return JSON.stringify(probe());
    await fs.writeFile(args.at(-1), 'synthetic-artifact', { mode: 0o600 }); return '';
  };
  const artifact = await obtainMedia(selection, { dir, signal: controller.signal, lookup, request: async () => response(), run });
  assert.equal(artifact.bytes, 18); assert.match(artifact.sha256, /^[a-f0-9]{64}$/);
  assert.equal(artifact.mime_type, 'video/mp4'); await assert.rejects(fs.stat(path.join(dir, 'part-0.mp4')), { code: 'ENOENT' });
  const second = await directory(t);
  await assert.rejects(obtainMedia({ ...selection, duration: 10 }, { dir: second, signal: controller.signal, lookup, request: async () => response(), run }), code('media_incompatible'));
});
test('real local synthetic MP4 survives copy-only resource-limited mux and ffprobe', async t => {
  const fixtureDir = await directory(t); const dir = await directory(t);
  const fixture = path.join(fixtureDir, 'synthetic.mp4');
  await runBounded('/usr/bin/ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=720x1280:r=30',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '3', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '35',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', fixture], { dir: fixtureDir });
  const bytes = await fs.readFile(fixture);
  const artifact = await obtainMedia({ duration: 3, hasAudio: true, parts: [{ url }] }, {
    dir, signal: new AbortController().signal, lookup,
    request: async () => response([bytes], { 'content-length': String(bytes.length) }),
  });
  assert.equal(artifact.mime_type, 'video/mp4'); assert.equal(artifact.duration_seconds, 3);
  assert.ok(artifact.bytes > 0 && artifact.bytes < 50_000_000);
  assert.equal((await fs.stat(path.join(dir, 'artifact.mp4'))).mode & 0o777, 0o600);
  assert.equal((await fs.readdir(dir)).includes('part-0.mp4'), false);
});

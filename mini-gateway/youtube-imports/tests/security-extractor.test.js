'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { Duplex } = require('node:stream');
const { ImportError, publicIPv4, metadataHost, mediaURL, pinnedAddress, createMetadataProxy } = require('../security');
const { safeEnv, extractorArgs, selectFormats, extract, runBounded, processIdentity, killOwnedProcess } = require('../extractor');

const id = 'abcdefghijk';
const url = 'https://r1.googlevideo.com/videoplayback?token=private';
function format(patch = {}) { return { protocol: 'https', ext: 'mp4', vcodec: 'avc1.640028', acodec: 'none', width: 720, height: 1280, fps: 30, url, ...patch }; }
function info(patch = {}) { return { id, _type: 'video', availability: 'unlisted', live_status: 'not_live', duration: 10, formats: [format()], ...patch }; }
const code = expected => error => error.code === expected;

test('public IPv4 denies private, obscure, reserved and Azure platform destinations', () => {
  for (const ip of ['0.0.0.0', '10.1.2.3', '127.0.0.1', '127.1', '2130706433', '0x7f000001', '100.64.0.1', '169.254.169.254',
    '172.16.1.1', '192.168.0.1', '192.0.0.1', '192.0.2.1', '192.88.99.1', '198.18.0.1', '198.51.100.1', '203.0.113.1',
    '224.0.0.1', '255.255.255.255', '168.63.129.16', '::1', '::ffff:8.8.8.8']) assert.equal(publicIPv4(ip), false, ip);
  assert.equal(publicIPv4('8.8.8.8'), true);
});
test('metadata and media hostname boundaries are distinct and exact', () => {
  for (const host of ['youtube.com', 'www.youtube.com', 'youtubei.googleapis.com', 'www.googleapis.com', 'i.ytimg.com']) assert.equal(metadataHost(host), true);
  for (const host of ['evilyoutube.com', 'youtube.com.evil.test', 'google.com', 'foo.googleapis.com', '127.0.0.1', 'youtube.com.']) assert.equal(metadataHost(host), false);
  assert.equal(mediaURL(url).hostname, 'r1.googlevideo.com');
  for (const input of ['http://r1.googlevideo.com/x', 'https://googlevideo.com/x', 'https://evilgooglevideo.com/x',
    'https://r1.googlevideo.com.evil.test/x', 'https://u:p@r1.googlevideo.com/x', 'https://r1.googlevideo.com:444/x', 'https://127.0.0.1/x']) {
    assert.throws(() => mediaURL(input), code('network_blocked'));
  }
});
test('DNS pinning examines every A answer and never allows IPv6/private fallback', async () => {
  const lookup = async (host, options) => { assert.equal(host, 'www.youtube.com'); assert.equal(options.all, true); assert.equal(options.family, 4); return [{ family: 4, address: '8.8.8.8' }]; };
  assert.equal(await pinnedAddress('www.youtube.com', { lookup }), '8.8.8.8');
  for (const addresses of [[], [{ family: 6, address: '::1' }], [{ family: 4, address: '8.8.8.8' }, { family: 4, address: '10.0.0.1' }]]) {
    await assert.rejects(pinnedAddress('www.youtube.com', { lookup: async () => addresses }), code('network_blocked'));
  }
});

async function connectProxy(proxy, authority) {
  return new Promise(resolve => {
    const req = http.request(proxy.url, { method: 'CONNECT', path: authority });
    req.once('connect', (_response, socket) => resolve({ socket }));
    req.once('error', error => resolve({ error })); req.end();
  });
}
test('CONNECT proxy pins public IP, denies plaintext and closes owned sockets', async () => {
  const connected = [];
  const proxy = await createMetadataProxy({ lookup: async () => [{ family: 4, address: '8.8.8.8' }],
    connect(options) {
      connected.push(options);
      const stream = new Duplex({ read() {}, write(_chunk, _encoding, done) { done(); } });
      process.nextTick(() => stream.emit('connect')); return stream;
    } });
  const result = await connectProxy(proxy, 'www.youtube.com:443');
  assert.equal(Boolean(result.socket), true); assert.deepEqual(connected, [{ host: '8.8.8.8', port: 443, family: 4 }]);
  result.socket.destroy(); await proxy.close();
  const blocked = await createMetadataProxy();
  assert.ok((await connectProxy(blocked, '127.0.0.1:443')).error);
  assert.equal(blocked.failure.code, 'network_blocked'); await blocked.close();
  const plain = await createMetadataProxy();
  await new Promise(resolve => { const req = http.get(plain.url + '/http://youtube.com', res => { res.resume(); res.on('end', resolve); }); req.on('error', resolve); });
  assert.equal(plain.failure.code, 'network_blocked'); await plain.close();
});
test('CONNECT connection budget and byte budget abort extraction', async () => {
  const proxy = await createMetadataProxy({ maxConnections: 0 });
  await connectProxy(proxy, 'youtube.com:443'); assert.equal(proxy.failure.code, 'network_blocked'); await proxy.close();
  const limited = await createMetadataProxy({ maxBytes: 2, lookup: async () => [{ family: 4, address: '8.8.8.8' }],
    connect() { const stream = new Duplex({ read() {}, write(_c, _e, cb) { cb(); } }); process.nextTick(() => stream.emit('connect')); return stream; } });
  const { socket } = await connectProxy(limited, 'youtube.com:443');
  socket.write('more than two bytes');
  await new Promise(resolve => socket.once('close', resolve));
  assert.equal(limited.failure.code, 'size_limit'); await limited.close();
});
test('extractor flags and env exclude inherited personal credentials/config/plugins', () => {
  const args = extractorArgs(id, 'http://127.0.0.1:1');
  for (const flag of ['--ignore-config', '--no-plugin-dirs', '--no-remote-components', '--no-cookies', '--no-cookies-from-browser', '--no-exec', '--no-cache-dir', '--no-playlist', '--skip-download', '--dump-single-json']) assert.ok(args.includes(flag));
  assert.equal(args.at(-1), `https://www.youtube.com/watch?v=${id}`);
  assert.equal(args.includes('--netrc'), false);
  assert.deepEqual(Object.keys(safeEnv('/isolated')).sort(), ['LANG', 'LC_ALL', 'PATH', 'TMPDIR', 'YTDLP_NO_PLUGINS']);
  assert.throws(() => extractorArgs('../cookies', 'proxy'), code('invalid_request'));
});
test('selection requires exact ID, single public/unlisted finite non-live source', () => {
  assert.equal(selectFormats(info(), id).parts.length, 1);
  for (const patch of [{ id: 'other-id' }, { _type: 'playlist' }, { entries: [] }]) assert.throws(() => selectFormats(info(patch), id), code('source_unavailable'));
  for (const patch of [{ is_live: true }, { live_status: 'is_upcoming' }, { live_status: undefined }]) assert.throws(() => selectFormats(info(patch), id), code('source_live'));
  for (const availability of ['private', 'needs_auth', null]) assert.throws(() => selectFormats(info({ availability }), id), code('source_requires_auth'));
  assert.throws(() => selectFormats(info({ duration: 181 }), id), code('source_too_long'));
  for (const duration of [null, Infinity, 0]) assert.throws(() => selectFormats(info({ duration }), id), code('media_incompatible'));
});
test('selection never drops known audio, recodes dimensions, or chooses manifests', () => {
  const audio = format({ vcodec: 'none', acodec: 'mp4a.40.2', ext: 'm4a', asr: 48000, audio_channels: 2 });
  assert.equal(selectFormats(info({ formats: [format(), audio] }), id).parts.length, 2);
  assert.throws(() => selectFormats(info({ formats: [format(), { ...audio, asr: 44100 }] }), id), code('media_incompatible'));
  for (const patch of [{ protocol: 'm3u8_native' }, { manifest_url: 'https://r1.googlevideo.com/x' }, { vcodec: 'vp9' }, { width: 1280, height: 720 }, { fps: 23 }, { url: 'https://private.test/x' }]) {
    assert.throws(() => selectFormats(info({ formats: [format(patch)] }), id), code('media_incompatible'));
  }
  assert.throws(() => selectFormats(info({ formats: [format({ filesize: 50_000_001 })] }), id), code('size_limit'));
});
test('extraction uses only forced proxy and closes it on parse/upstream failure', async () => {
  let closed = 0;
  const createProxy = async () => ({ url: 'http://127.0.0.1:99', signal: new AbortController().signal, close: async () => closed++ });
  await assert.rejects(extract(id, { createProxy, run: async (_bin, args) => { assert.equal(args[args.indexOf('--proxy') + 1], 'http://127.0.0.1:99'); return 'bad json'; } }), code('upstream_error'));
  assert.equal(closed, 1);
});
test('gated local subprocess has journalled identity before execution and bounded output', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soria-extractor-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let identity;
  const output = await runBounded(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({keys:Object.keys(process.env),cwd:process.cwd()}))'],
    { dir, onProcess: async value => { identity = value; assert.equal((await processIdentity(value.pid)).start, value.start); } });
  assert.ok(identity.pid); assert.equal(JSON.parse(output).cwd, dir);
  assert.equal(JSON.parse(output).keys.includes('API_KEY'), false);
  assert.equal(JSON.parse(output).keys.includes('HOME'), false);
  await assert.rejects(runBounded(process.execPath, ['-e', 'process.stdout.write("x".repeat(1000))'], { dir, stdoutLimit: 10 }), code('size_limit'));
  await assert.rejects(runBounded(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { dir, timeoutMs: 100 }), code('time_limit'));
  await killOwnedProcess({ pid: process.pid, start: 'wrong-start' }, dir); // Must not kill reused/unowned PID.
});
test('isolated runner dies with its owner before and after the execution gate', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'soria-runner-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  for (const start of [false, true]) {
    const child = spawn(process.execPath, [path.join(__dirname, '../extractor.js'), '--runner'],
      { cwd: dir, env: safeEnv(dir), detached: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    const exit = new Promise(resolve => child.once('exit', (status, signal) => resolve({ status, signal })));
    if (start) {
      const started = new Promise(resolve => child.stdout.once('data', resolve));
      child.send({ bin: process.execPath, args: ['-e', 'process.stdout.write("started");setInterval(()=>{},1000)'] });
      await started;
    }
    child.disconnect();
    const stopped = await exit;
    assert.notEqual(stopped.status, 0);
  }
});

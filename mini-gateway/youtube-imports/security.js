'use strict';

const dns = require('node:dns').promises;
const http = require('node:http');
const net = require('node:net');

const CODES = new Set('invalid_request unauthorized unavailable conflict queue_full not_found not_ready artifact_expired artifact_mismatch source_unavailable source_requires_auth source_live source_too_long media_incompatible size_limit time_limit network_blocked upstream_error conversion_failed validation_failed interrupted internal_error'.split(' '));
class ImportError extends Error {
  constructor(code, status = 502) { super(code); this.code = CODES.has(code) ? code : 'internal_error'; this.status = status; }
}
const fail = (code, status) => { throw new ImportError(code, status); };
const safeCode = (error) => error instanceof ImportError ? error.code : 'internal_error';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SHA = /^[a-f0-9]{64}$/;
const MAX_BYTES = 50_000_000;
const SOURCE_MAX_BYTES = 200_000_000;
const MAX_COOKIE_BYTES = 1_048_576;

function publicIPv4(value) {
  if (net.isIP(value) !== 4) return false;
  if (value === '168.63.129.16') return false; // Azure platform/WireServer VIP.
  const [a, b, c] = value.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}
function hostname(value) {
  return typeof value === 'string' && value.length <= 253 &&
    !net.isIP(value) && /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/.test(value);
}
const domain = (host, root) => host === root || host.endsWith(`.${root}`);
function metadataHost(host) {
  return hostname(host) && (domain(host, 'youtube.com') || domain(host, 'ytimg.com') ||
    host === 'youtubei.googleapis.com' || host === 'www.googleapis.com');
}
function mediaURL(input) {
  let url;
  try { url = new URL(input); } catch { fail('network_blocked'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      !hostname(url.hostname) || !url.hostname.endsWith('.googlevideo.com') || url.hash) fail('network_blocked');
  return url;
}
function abortError(signal) { return signal?.reason instanceof ImportError ? signal.reason : new ImportError('time_limit'); }
function checkAbort(signal) { if (signal?.aborted) throw abortError(signal); }
function abortable(promise, signal) {
  if (!signal) return promise;
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    const aborted = () => reject(abortError(signal));
    signal.addEventListener('abort', aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}
async function pinnedAddress(host, { lookup = dns.lookup, signal } = {}) {
  checkAbort(signal);
  const answers = await abortable(lookup(host, { all: true, family: 4, verbatim: true }), signal);
  if (!Array.isArray(answers) || !answers.length || answers.length > 32 ||
      answers.some(a => a.family !== 4 || !publicIPv4(a.address))) fail('network_blocked');
  return answers[0].address;
}

// One proxy per extraction. Connections use a resolved IP, never a hostname.
async function createMetadataProxy({ signal, lookup, connect = net.connect, maxBytes = 16 * 1024 * 1024,
  maxConnections = 32, timeoutMs = 45_000 } = {}) {
  const controller = new AbortController();
  const sockets = new Set();
  let connections = 0;
  let bytes = 0;
  let failure = null;
  const stop = (error = new ImportError('network_blocked')) => {
    if (!failure) failure = error;
    controller.abort(error);
    for (const socket of sockets) socket.destroy();
  };
  const onAbort = () => stop(abortError(signal));
  signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => stop(new ImportError('time_limit')), timeoutMs);
  timer.unref();
  const server = http.createServer((req, res) => {
    res.writeHead(403); res.end(); stop();
  });
  server.on('clientError', (_error, socket) => { socket.destroy(); stop(); });
  server.on('connection', socket => {
    sockets.add(socket); socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
  });
  server.on('connect', async (req, client, head) => {
    try {
      checkAbort(controller.signal);
      const match = /^([a-z0-9.-]+):443$/.exec(req.url || '');
      if (!match || !metadataHost(match[1]) || ++connections > maxConnections) fail('network_blocked');
      const address = await pinnedAddress(match[1], { lookup, signal: controller.signal });
      checkAbort(controller.signal);
      const upstream = connect({ host: address, port: 443, family: 4 });
      sockets.add(upstream);
      upstream.once('close', () => sockets.delete(upstream));
      upstream.on('error', () => stop(new ImportError('upstream_error')));
      const count = chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) stop(new ImportError('size_limit'));
      };
      client.on('data', count); upstream.on('data', count);
      client.on('close', () => upstream.destroy());
      upstream.on('close', () => client.destroy());
      upstream.once('connect', () => {
        if (controller.signal.aborted) return upstream.destroy();
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) { count(head); if (!controller.signal.aborted) upstream.write(head); }
        if (!controller.signal.aborted) { client.pipe(upstream); upstream.pipe(client); }
      });
    } catch (error) { stop(error instanceof ImportError ? error : new ImportError('upstream_error')); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  if (signal?.aborted) onAbort();
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    signal: controller.signal,
    get failure() { return failure; },
    async close() {
      clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
      controller.abort(new ImportError('interrupted'));
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

module.exports = { ImportError, fail, safeCode, UUID, VIDEO_ID, SHA, MAX_BYTES, SOURCE_MAX_BYTES, publicIPv4,
  metadataHost, mediaURL, pinnedAddress, createMetadataProxy, checkAbort, abortable, abortError, MAX_COOKIE_BYTES };

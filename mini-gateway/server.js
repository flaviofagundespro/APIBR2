'use strict';

/**
 * APIBR2 Mini-Gateway
 * Serves only the endpoint consumed by Soria Reel Clone:
 *   POST /api/v1/audio/transcribe-url   { url, language? }
 *   GET  /health
 *
 * Dependencies: none (Node 22 built-ins + yt-dlp + ffmpeg system binaries)
 * Env vars (loaded from .env in this dir):
 *   PORT                        default 3000
 *   API_KEY                     checked against x-api-key header
 *   AZURE_AUDIO_ENDPOINT        e.g. https://<resource>.services.ai.azure.com
 *   AZURE_AUDIO_DEPLOYMENT      e.g. gpt-4o-mini-transcribe
 *   AZURE_AUDIO_API_VERSION     e.g. 2025-04-01-preview
 *   AZURE_AUDIO_KEY             Azure OpenAI API key
 *   YT_DLP_PATH                 default "yt-dlp"
 *   FFMPEG_PATH                 default "ffmpeg"
 */

const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createYoutubeImportsRouter } = require('./youtube-imports/router');

// ── load .env (simple parser, no dependency) ──────────────────────────────────
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const PORT             = parseInt(process.env.PORT || '3000', 10);
const API_KEY          = process.env.API_KEY || '';
const AZURE_ENDPOINT   = (process.env.AZURE_AUDIO_ENDPOINT || '').replace(/\/$/, '');
const AZURE_DEPLOY     = process.env.AZURE_AUDIO_DEPLOYMENT || 'gpt-4o-mini-transcribe';
const AZURE_API_VER    = process.env.AZURE_AUDIO_API_VERSION || '2025-04-01-preview';
const AZURE_KEY        = process.env.AZURE_AUDIO_KEY || '';
const YT_DLP           = process.env.YT_DLP_PATH || 'yt-dlp';
const FFMPEG           = process.env.FFMPEG_PATH || 'ffmpeg';
const TMP_DIR          = path.join(__dirname, 'tmp');

fs.mkdirSync(TMP_DIR, { recursive: true });
const youtubeImports = createYoutubeImportsRouter({ apiKey: API_KEY, ytDlp: process.env.YT_DLP_PATH || '/home/ubuntu/.local/bin/yt-dlp', ffmpeg: FFMPEG });

// ── helpers ───────────────────────────────────────────────────────────────────

function run(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: 180_000, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}

async function downloadVideo(url, outDir) {
  const template = path.join(outDir, '%(id)s.%(ext)s');
  const args = [
    '--no-playlist',
    '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '--output', template,
    '--print', 'after_move:filepath',
    '--no-progress',
    url,
  ];
  const { stdout } = await run(YT_DLP, args);
  const filepath = stdout.trim().split('\n').pop();
  if (!filepath || !fs.existsSync(filepath)) {
    throw new Error('yt-dlp não retornou um arquivo válido.');
  }
  return filepath;
}

async function toWav(videoPath, outPath) {
  await run(FFMPEG, [
    '-y', '-i', videoPath,
    '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav',
    outPath,
  ]);
  return outPath;
}

async function transcribeAzure(wavPath, language = 'pt') {
  if (!AZURE_ENDPOINT || !AZURE_KEY) {
    throw new Error('AZURE_AUDIO_ENDPOINT ou AZURE_AUDIO_KEY não configurados.');
  }

  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOY}/audio/transcriptions?api-version=${AZURE_API_VER}`;
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(wavPath)], { type: 'audio/wav' });
  form.append('file', blob, path.basename(wavPath));
  form.append('language', language);
  form.append('response_format', 'json');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': AZURE_KEY },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Azure Whisper ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.text || '';
}

function cleanup(...paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
}

// ── request handler ───────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

async function handleTranscribeUrl(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    return sendJson(res, 400, { success: false, message: 'JSON inválido.' });
  }

  const { url, language = 'pt' } = parsed;
  if (!url || typeof url !== 'string') {
    return sendJson(res, 400, { success: false, message: 'Campo "url" obrigatório.' });
  }

  const jobId   = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const jobDir  = path.join(TMP_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  let videoPath = null;
  let wavPath   = null;

  try {
    console.log(`[${jobId}] Baixando: ${url}`);
    videoPath = await downloadVideo(url, jobDir);
    const filename = path.basename(videoPath);

    console.log(`[${jobId}] Convertendo para WAV: ${filename}`);
    wavPath = path.join(jobDir, `${jobId}.wav`);
    await toWav(videoPath, wavPath);

    console.log(`[${jobId}] Transcrevendo via Azure Whisper`);
    const text = await transcribeAzure(wavPath, language);

    console.log(`[${jobId}] Concluído. Chars: ${text.length}`);
    sendJson(res, 200, { success: true, text, filename, title: null, duration: null });
  } catch (err) {
    console.error(`[${jobId}] Erro:`, err.message);
    sendJson(res, 502, { success: false, message: err.message });
  } finally {
    cleanup(videoPath, wavPath);
    try { fs.rmdirSync(jobDir); } catch {}
  }
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'apibr2-mini', port: PORT });
  }

  // API key gate
  if (youtubeImports.matches(url)) return youtubeImports.handle(req, res);

  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return sendJson(res, 401, { success: false, message: 'Unauthorized' });
  }

  if (method === 'POST' && url === '/api/v1/audio/transcribe-url') {
    return handleTranscribeUrl(req, res);
  }

  sendJson(res, 404, { success: false, message: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`apibr2-mini ouvindo em 127.0.0.1:${PORT}`);
  console.log(`  Azure endpoint: ${AZURE_ENDPOINT || '(não configurado)'}`);
  console.log(`  yt-dlp: ${YT_DLP} | ffmpeg: ${FFMPEG}`);
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err.message);
  process.exit(1);
});

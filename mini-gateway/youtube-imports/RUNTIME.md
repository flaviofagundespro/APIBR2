# YouTube runtime — Story Soria 3.124

Execution mode: direct (bounded runtime correction authorized by operator).

## Deployment 2026-09-21

- Extractor explicitly enables Node using `process.execPath`, including with the sanitized child environment.
- Isolated yt-dlp 2026.08.19, EJS 0.8.0; dependency snapshot: `requirements-runtime.txt`.
- Installed at `/home/ubuntu/.local/share/apibr2/yt-dlp-2026.08.19`.
- `mini-gateway/.env`: `YT_DLP_PATH=/home/ubuntu/.local/share/apibr2/yt-dlp-2026.08.19/bin/yt-dlp`.
- Restart: `YT_DLP_PATH=/home/ubuntu/.local/share/apibr2/yt-dlp-2026.08.19/bin/yt-dlp pm2 restart apibr2-mini --update-env`.
- The variable also selects the binary for the legacy downloader. Global binary remains untouched.
- Preserve the metadata proxy, network validation, cookie isolation, byte/duration limits and copy-only mux.

## Verification

39 module tests passed; pip check passed; GET http://127.0.0.1:3000/health returned ok=true after restart.
Earlier isolated authenticated probes extracted metadata for three supplied videos with the original proxy; the existing Node transporter acquired separate video/audio streams. This was not full import acceptance.
Post-deploy authenticated HTTP jobs for ZGJUikuwr3A and y6QpSTqxVhA reached source_requires_auth. A fresh homepage probe of the stored session returned LOGGED_IN=false (earlier true). The reason for that session change is not established. No cookie values were logged or committed.
Full authenticated acceptance remains pending. Known subsequent constraints: AAC 44100 Hz is rejected by the 48000 Hz policy; 285 seconds exceeds the 180-second limit. No transcoding or policy extension was introduced.

## Reinstall / rollback

Create the venv at the path above and run its pip with `install -r mini-gateway/youtube-imports/requirements-runtime.txt`.
Rollback the extractor commit, restore `YT_DLP_PATH=/home/ubuntu/.local/bin/yt-dlp` in the private env file and restart with that same variable and `--update-env`. Check /health. Never copy cookie material into this document.


## Story APIBR2 1.3 / Soria 3.125 — v2 normalization

V1 remains copy-only and preserves historical eligibility. V2 (`soria-reel-v2`) accepts direct HTTPS MP4/WebM H264, VP9 or AV1 sources, AAC44.1/48 and Opus, then produces strict MP4 H264/yuv420p vertical video with AAC48k where audio exists. Sources without an approved direct URL are rejected; FFmpeg never fetches manifests or remote resources.

All limits below are decimal bytes: source transfer 200,000,000; output strictly below 50,000,000; managed root 500,000,000. Admission reserves 300,000,000 within that cap (not in addition to it) and checks real filesystem free space. One active job; source plus one pending output uses at most250MB; a failed first output is unlinked before the only retry. Retained outputs count toward root usage. Owned filenames remain part-0.mp4, part-1.mp4, artifact.pending.mp4, artifact.mp4 and cookies.txt, even for detected WebM input.

FFmpeg/FFprobe use local-only file protocol and mov/matroska/webm demuxers (`mov` is the MP4 demuxer, validated by real fixtures), 2 decoder/encoder/filter threads, 2GiB address-space cap, 300CPU-second process cap and no core dumps. Timeouts: metadata45s, download120s, each probe15s, each of at most2 encodes150s, complete decode60s, totaljob600s. Queue expiry10min and consumer deadline20min remain finite; a late queued job may expire at the consumer and is not a success. Whole-job cancellation bounds hashing/cleanup and kills only owned process groups.

Video copy requires probed H264/yuv420p, square pixels, allowed vertical dimensions/fps and source below42.5MB. Audio copy requires AAC48k mono/stereo. Other inputs scale proportionally with pixel-aspect correction and pad to720x1280 at30fps; no cropping or duration clipping. Video bitrate=min(3Mbps,50MB*8*0.90/duration-128kbps), with one75% retry on size overflow. Kernel file-size cap aborts incomplete output; incomplete files are never published. Final probe, per-stream duration agreement, complete decode, byte count and SHA256 precede ready. Journal stores only sanitized normalization timing and byte counts; error codes distinguish source_requires_auth, conversion_failed, validation_failed and existing limits/transfer failures.

2026-09-21: real synthetic fixtures passed for AAC44.1, Opus/VP9, AV1, horizontal, silent and already-compatible sources. Test-suite observation:25.01s elapsed, peak RSS212112KiB (includes fixture generation, not a180s production benchmark). Actual LRnwP-yahEQ HTTP tests with updated yt-dlp and ephemeral supplied cookie failed source_requires_auth both through the proxy and directly. No real YouTube MP4/GET or Soria-ready claim is made yet.

Rollback: stop new v2 admission by reverting Soria consumer first. Preserve additive0045 migration and historical policy. Drain active provider jobs, then restore previous provider commit and restart apibr2-mini. Pending v2 operations require explicit retry after restoration; never rewrite their policy or reuse a different-policy identity. The legacy server.js is unchanged.

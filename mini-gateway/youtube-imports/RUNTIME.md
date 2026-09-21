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

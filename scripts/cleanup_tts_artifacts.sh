#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIO_DIR="$ROOT_DIR/integrations/generated_audio"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

if [[ ! -d "$AUDIO_DIR" ]]; then
  echo "missing_dir: $AUDIO_DIR"
  exit 0
fi

# Scoped patterns: cleanup only known experiment artifacts.
PATTERNS=(
  "ab_*"
  "qwen*"
  "chatterbox*"
  "*_smoke_*"
  "test_*tts*.wav"
)

mapfile -t CANDIDATES < <(
  cd "$AUDIO_DIR"
  for p in "${PATTERNS[@]}"; do
    ls -1 $p 2>/dev/null || true
  done | sort -u
)

if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
  echo "no_artifacts_found"
  exit 0
fi

echo "audio_dir=$AUDIO_DIR"
echo "apply=$APPLY"
echo "candidates=${#CANDIDATES[@]}"

TOTAL_BYTES=0
for f in "${CANDIDATES[@]}"; do
  size=$(stat -c '%s' "$AUDIO_DIR/$f" 2>/dev/null || echo 0)
  TOTAL_BYTES=$((TOTAL_BYTES + size))
  echo "- $f ($(numfmt --to=iec --suffix=B "$size" 2>/dev/null || echo "${size}B"))"
done

echo "total_size=$(numfmt --to=iec --suffix=B "$TOTAL_BYTES" 2>/dev/null || echo "${TOTAL_BYTES}B")"

if [[ "$APPLY" == "true" ]]; then
  for f in "${CANDIDATES[@]}"; do
    rm -f "$AUDIO_DIR/$f"
  done
  echo "cleanup=done"
else
  echo "cleanup=dry_run"
  echo "tip: run with --apply to delete"
fi

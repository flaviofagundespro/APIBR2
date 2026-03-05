#!/usr/bin/env python3
"""
XTTS-v2 fine-tuning script for AMD ROCm environments.

Default dataset layout:
backend/workers/xtts/datasets/flaviofagundes/
  - metadata.txt or metadata.csv  (format: file_name|text), OR
  - legacy pair format: *.wav + *.txt (same stem, e.g. manual_001.wav/manual_001.txt)
"""

import argparse
import gc
import logging
import os
import random
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# ROCm stability flags (must be set before torch import in many setups).
os.environ.setdefault("HSA_OVERRIDE_GFX_VERSION", "10.3.0")
os.environ.setdefault("PYTORCH_ROCM_ARCH", "gfx1030")
os.environ.setdefault("PYTORCH_TUNABLEOP_ENABLED", "0")
os.environ.setdefault("TORCH_ROCM_AOT_DISABLE_HIPBLASLT", "1")
os.environ.setdefault("PYTORCH_HIP_ALLOC_CONF", "expandable_segments:True")
os.environ.setdefault("COQUI_TOS_AGREED", "1")

import torch
from huggingface_hub import snapshot_download

# Transformers 5.x compat:
# coqui-tts/xtts still imports `isin_mps_friendly` from transformers.pytorch_utils.
try:
    import transformers.pytorch_utils as _tpu
    if not hasattr(_tpu, "isin_mps_friendly"):
        def _isin_mps_friendly(elements: "torch.Tensor", test_elements: "torch.Tensor") -> "torch.Tensor":
            if test_elements.ndim == 0:
                test_elements = test_elements.unsqueeze(0)
            return elements.unsqueeze(-1).eq(test_elements).any(dim=-1)
        _tpu.isin_mps_friendly = _isin_mps_friendly
except Exception:
    # Keep training script resilient if transformers is not installed yet.
    pass


LOG = logging.getLogger("train_xtts_amd")


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )


def ensure_gpu(allow_cpu: bool = False) -> None:
    if not torch.cuda.is_available():
        if allow_cpu:
            LOG.warning("GPU/ROCm indisponivel; seguindo em modo diagnostico CPU (--allow-cpu).")
            return
        raise RuntimeError(
            "GPU/ROCm nao detectada (torch.cuda.is_available() == False). "
            "Treino XTTS-v2 foi configurado para uso obrigatorio de GPU."
        )
    device_name = torch.cuda.get_device_name(0)
    LOG.info("GPU detectada e obrigatoria: %s", device_name)


def find_metadata_file(dataset_dir: Path) -> Path:
    candidates = [
        dataset_dir / "metadata.txt",
        dataset_dir / "metadata.csv",
        dataset_dir / "manifest.txt",
        dataset_dir / "manifest.csv",
    ]
    for p in candidates:
        if p.exists():
            return p
    ignore_names = {"metadata_train_xtts.csv", "metadata_eval_xtts.csv"}
    for p in sorted(dataset_dir.rglob("*.txt")) + sorted(dataset_dir.rglob("*.csv")):
        if p.name in ignore_names:
            continue
        if p.name.lower().startswith(("metadata", "manifest")):
            return p
    raise FileNotFoundError(
        f"Nenhum metadata encontrado em {dataset_dir}. Esperado: metadata.txt/csv no formato nome_arquivo|texto."
    )


def _resolve_audio_path(dataset_dir: Path, rel_audio: str) -> Path:
    raw = rel_audio.strip()
    if not raw:
        raise ValueError("Entrada de metadata com nome de arquivo vazio.")

    p = Path(raw)
    candidates = []
    if p.is_absolute():
        candidates.append(p)
    else:
        candidates.append(dataset_dir / p)
        if p.suffix == "":
            candidates.append(dataset_dir / f"{raw}.wav")
            candidates.append(dataset_dir / "wavs" / f"{raw}.wav")
        candidates.append(dataset_dir / "wavs" / raw)

    for c in candidates:
        if c.exists():
            return c.resolve()

    # Fallback search by basename.
    wav_name = p.name if p.suffix else f"{p.name}.wav"
    matches = list(dataset_dir.rglob(wav_name))
    if matches:
        return matches[0].resolve()

    raise FileNotFoundError(f"Arquivo de audio nao encontrado para '{rel_audio}'.")


def _audio_duration_seconds(audio_path: Path) -> float:
    try:
        import soundfile as sf
        info = sf.info(str(audio_path))
        if not info.samplerate:
            return 0.0
        return float(info.frames) / float(info.samplerate)
    except Exception:
        return 0.0


def parse_dataset(
    dataset_dir: Path,
    language: str,
    speaker_name: str,
    max_audio_seconds: int,
    min_audio_seconds: float = 1.0,
) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    metadata_path: Path | None = None
    try:
        metadata_path = find_metadata_file(dataset_dir)
    except FileNotFoundError:
        metadata_path = None

    if metadata_path:
        LOG.info("Metadata detectado: %s", metadata_path)
        with metadata_path.open("r", encoding="utf-8") as f:
            for line_idx, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                if "|" not in line:
                    LOG.warning("Linha %d ignorada (sem '|'): %s", line_idx, line[:120])
                    continue
                if line.lower().startswith("audio_file|text"):
                    continue
                audio_ref, text = line.split("|", 1)
                text = text.strip()
                if not text:
                    LOG.warning("Linha %d ignorada (texto vazio).", line_idx)
                    continue
                # XTTS GPT training is memory sensitive; keep text length bounded for 12GB GPUs.
                if len(text) > 200:
                    text = text[:200].rstrip()
                audio_path = _resolve_audio_path(dataset_dir, audio_ref)
                rows.append(
                    {
                        "audio_file": str(audio_path),
                        "text": text,
                        "speaker_name": speaker_name,
                        "language": language,
                    }
                )
    else:
        LOG.info("Metadata nao encontrado. Usando formato legado wav+txt por par.")
        wav_files = sorted(dataset_dir.rglob("*.wav"))
        for wav in wav_files:
            txt = wav.with_suffix(".txt")
            if not txt.exists():
                LOG.warning("Ignorando %s (sem .txt correspondente).", wav)
                continue
            text = txt.read_text(encoding="utf-8").strip()
            if not text:
                LOG.warning("Ignorando %s (transcricao vazia em %s).", wav, txt)
                continue
            if len(text) > 200:
                text = text[:200].rstrip()
            rows.append(
                {
                    "audio_file": str(wav.resolve()),
                    "text": text,
                    "speaker_name": speaker_name,
                    "language": language,
                }
            )

    valid_rows: List[Dict[str, str]] = []
    skipped_too_short = 0
    skipped_too_long = 0
    skipped_unreadable = 0

    for row in rows:
        dur = _audio_duration_seconds(Path(row["audio_file"]))
        if dur <= 0:
            skipped_unreadable += 1
            continue
        if dur < min_audio_seconds:
            skipped_too_short += 1
            continue
        if dur > float(max_audio_seconds):
            skipped_too_long += 1
            continue
        valid_rows.append(row)

    if skipped_too_short or skipped_too_long or skipped_unreadable:
        LOG.info(
            "Filtro de duracao aplicado: removidas=%d (curtas=%d longas=%d ilegiveis=%d) | limite=%.1fs",
            skipped_too_short + skipped_too_long + skipped_unreadable,
            skipped_too_short,
            skipped_too_long,
            skipped_unreadable,
            float(max_audio_seconds),
        )

    if len(valid_rows) < 2:
        raise RuntimeError(
            "Dataset invalido apos filtro de duracao: "
            f"{len(valid_rows)} amostra(s) dentro de {min_audio_seconds:.1f}s..{float(max_audio_seconds):.1f}s. "
            "Sugestao: usar dataset segmentado (<user_id>_fixed) ou aumentar --max-audio-seconds com cautela."
        )

    if len(rows) < 2:
        raise RuntimeError(
            f"Dataset invalido: apenas {len(rows)} amostra(s) valida(s). "
            "Sao necessarias pelo menos 2 amostras para split train/eval."
        )

    LOG.info("Amostras validas carregadas: %d", len(valid_rows))
    return valid_rows


def split_train_eval(samples: List[Dict[str, str]], eval_ratio: float = 0.1) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    rnd = random.Random(42)
    shuffled = samples[:]
    rnd.shuffle(shuffled)
    eval_count = max(1, int(len(shuffled) * eval_ratio))
    eval_samples = shuffled[:eval_count]
    train_samples = shuffled[eval_count:]
    if not train_samples:
        train_samples = eval_samples
    return train_samples, eval_samples


def estimate_max_wav_length(
    samples: List[Dict[str, str]],
    sample_rate: int = 22050,
    max_audio_seconds: int = 30,
) -> int:
    """Estimate max waveform length from dataset to avoid recursive sample filtering."""
    max_len = 0
    try:
        import soundfile as sf

        for s in samples:
            info = sf.info(s["audio_file"])
            max_len = max(max_len, int(info.frames))
    except Exception:
        # Conservative fallback: 30s
        max_len = 30 * sample_rate
    # Add 10% margin, clamp between 15s and user-defined ceiling.
    max_len = int(max_len * 1.1)
    return max(15 * sample_rate, min(max_len, max_audio_seconds * sample_rate))


def write_coqui_metadata(rows: List[Dict[str, str]], out_file: Path, dataset_dir: Path) -> None:
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open("w", encoding="utf-8") as f:
        f.write("audio_file|text|speaker_name|emotion_name\n")
        for row in rows:
            rel = os.path.relpath(row["audio_file"], dataset_dir)
            f.write(f"{rel}|{row['text']}|{row['speaker_name']}|neutral\n")


def _find_existing_xtts_repo(cache_dir: Path) -> Path | None:
    candidates: List[Path] = []
    candidates.append(cache_dir / "coqui_xtts_v2")

    # Reuse previous runs cache if available.
    ft_root = Path("backend/models/xtts_finetuned")
    if ft_root.exists():
        candidates.extend(ft_root.glob("*/runs/*/pretrained_cache/coqui_xtts_v2"))

    for p in candidates:
        if p.exists() and (p / "model.pth").exists() and (p / "config.json").exists():
            return p.resolve()
    return None


def download_xtts_v2_checkpoint(cache_dir: Path) -> Dict[str, str]:
    """
    Download XTTS-v2 checkpoint artifacts from Hugging Face and return key paths.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)

    existing = _find_existing_xtts_repo(cache_dir)
    if existing:
        local_repo = existing
        LOG.info("Usando checkpoint XTTS-v2 local em: %s", local_repo)
    else:
        LOG.info("Baixando checkpoint XTTS-v2 (multilingual) para: %s", cache_dir)
        local_repo = Path(
            snapshot_download(
                repo_id="coqui/XTTS-v2",
                local_dir=str(cache_dir / "coqui_xtts_v2"),
                local_dir_use_symlinks=False,
                resume_download=True,
            )
        )
        LOG.info("Checkpoint baixado em: %s", local_repo)

    def pick(*patterns: str) -> str:
        for pattern in patterns:
            hits = sorted(local_repo.rglob(pattern))
            if hits:
                return str(hits[0].resolve())
        return ""

    # Common XTTS-v2 artifact names.
    artifacts = {
        "checkpoint": pick("model.pth", "*xtts*.pth", "*checkpoint*.pth"),
        "config": pick("config.json"),
        "vocab": pick("vocab.json", "vocab.txt", "*tokenizer*.json"),
        "dvae": pick("*dvae*.pth"),
        "mel_stats": pick("*mel_stats*.pth", "*mel_stats*.json"),
        "speaker_encoder": pick("*speaker*encoder*.pth"),
    }
    missing = [k for k, v in artifacts.items() if k in ("checkpoint", "config", "vocab") and not v]
    if missing:
        raise RuntimeError(f"Artefatos obrigatorios ausentes no XTTS-v2: {missing}")
    LOG.info("Artefatos principais detectados: %s", {k: Path(v).name if v else None for k, v in artifacts.items()})
    return artifacts


def safe_setattr(obj, attr: str, value) -> bool:
    if hasattr(obj, attr):
        setattr(obj, attr, value)
        return True
    return False


def build_and_train(
    dataset_dir: Path,
    output_dir: Path,
    language: str,
    epochs: int,
    grad_accum_steps: int,
    num_workers: int,
    batch_size: int,
    eval_batch_size: int,
    speaker_name: str,
    max_audio_seconds: int,
    gpt_checkpointing: bool,
) -> None:
    try:
        from trainer import Trainer, TrainerArgs
        from TTS.tts.datasets import load_tts_samples
        from TTS.config.shared_configs import BaseDatasetConfig
        from TTS.tts.layers.xtts.trainer.gpt_trainer import GPTArgs, GPTTrainer, GPTTrainerConfig
        from TTS.tts.models.xtts import XttsAudioConfig
    except Exception as e:
        raise RuntimeError(
            "Falha ao importar coqui-tts/trainer. Instale dependencies com:\n"
            "pip install -r requirements_xtts.txt"
        ) from e

    cache_dir = output_dir.parent / "_pretrained_cache"
    artifacts = download_xtts_v2_checkpoint(cache_dir=cache_dir)

    samples = parse_dataset(
        dataset_dir=dataset_dir,
        language=language,
        speaker_name=speaker_name,
        max_audio_seconds=max_audio_seconds,
    )
    train_samples, eval_samples = split_train_eval(samples, eval_ratio=0.1)
    max_wav_length = estimate_max_wav_length(samples, max_audio_seconds=max_audio_seconds)

    # Keep metadata inside dataset root so formatter root_path stays consistent.
    meta_train = dataset_dir / "metadata_train_xtts.csv"
    meta_eval = dataset_dir / "metadata_eval_xtts.csv"
    write_coqui_metadata(train_samples, meta_train, dataset_dir)
    write_coqui_metadata(eval_samples, meta_eval, dataset_dir)
    LOG.info("Train/Eval split pronto: train=%d | eval=%d", len(train_samples), len(eval_samples))

    dataset_cfg = BaseDatasetConfig(
        formatter="coqui",
        dataset_name=speaker_name,
        path=str(dataset_dir),
        meta_file_train=meta_train.name,
        meta_file_val=meta_eval.name,
        language=language,
    )

    # XTTS official fine-tuning args (GPTTrainer) to avoid checkpoint incompatibility.
    model_args = GPTArgs(
        max_conditioning_length=132300,
        min_conditioning_length=66150,
        max_wav_length=max_wav_length,
        max_text_length=200,
        mel_norm_file=artifacts["mel_stats"],
        dvae_checkpoint=artifacts["dvae"],
        xtts_checkpoint=artifacts["checkpoint"],
        tokenizer_file=artifacts["vocab"],
        gpt_num_audio_tokens=1026,
        gpt_start_audio_token=1024,
        gpt_stop_audio_token=1025,
        gpt_use_masking_gt_prompt_approach=True,
        gpt_use_perceiver_resampler=True,
    )
    # Some coqui-tts versions expose this flag only on XttsArgs.
    safe_setattr(model_args, "gpt_checkpointing", gpt_checkpointing)
    audio_config = XttsAudioConfig(sample_rate=22050, dvae_sample_rate=22050, output_sample_rate=24000)
    config = GPTTrainerConfig(
        epochs=epochs,
        output_path=str(output_dir),
        model_args=model_args,
        run_name=f"xtts_v2_finetune_{speaker_name}",
        project_name="APIBR2_XTTS_FT",
        dashboard_logger="tensorboard",
        run_eval=False,
        test_delay_epochs=999999,
        audio=audio_config,
        batch_size=batch_size,
        eval_batch_size=eval_batch_size,
        num_loader_workers=num_workers,
        eval_split_max_size=max(1, len(eval_samples)),
        print_step=20,
        save_step=200,
        save_n_checkpoints=2,
        save_checkpoints=True,
        optimizer="AdamW",
        optimizer_wd_only_on_weights=True,
        optimizer_params={"betas": [0.9, 0.96], "eps": 1e-8, "weight_decay": 1e-2},
        lr=5e-6,
        datasets=[dataset_cfg],
    )

    # Coqui helper loader for metadata.
    train_data, eval_data = load_tts_samples(
        dataset_cfg,
        eval_split=True,
        eval_split_max_size=len(eval_samples),
        eval_split_size=0.1,
    )
    model = GPTTrainer.init_from_config(config)

    trainer_args = TrainerArgs(
        restore_path=None,
        skip_train_epoch=False,
        start_with_eval=False,
        grad_accum_steps=grad_accum_steps,
    )

    trainer = Trainer(
        trainer_args,
        config,
        output_path=str(output_dir),
        model=model,
        train_samples=train_data,
        eval_samples=eval_data,
    )

    LOG.info(
        "Iniciando treino XTTS-v2 | epochs=%d | batch=%d | eval_batch=%d | grad_accum=%d | num_workers=%d | optimizer=AdamW(wd=1e-2) | max_wav_length=%d",
        epochs,
        batch_size,
        eval_batch_size,
        grad_accum_steps,
        num_workers,
        max_wav_length,
    )
    trainer.fit()
    LOG.info("Treino finalizado. Artefatos em: %s", output_dir)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tuning XTTS-v2 (AMD ROCm)")
    parser.add_argument(
        "--dataset-dir",
        default="backend/workers/xtts/datasets/flaviofagundes",
        help="Diretorio com metadata + audios.",
    )
    parser.add_argument(
        "--output-dir",
        default="backend/models/xtts_finetuned",
        help="Diretorio de saida dos artefatos do fine-tuning.",
    )
    parser.add_argument("--language", default="pt", help="Idioma do dataset (padrao: pt).")
    parser.add_argument("--epochs", type=int, default=10, help="Numero de epocas.")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size de treino.")
    parser.add_argument("--eval-batch-size", type=int, default=2, help="Batch size de validacao.")
    parser.add_argument("--grad-accumulation-steps", type=int, default=128, help="Gradient accumulation.")
    parser.add_argument("--num-workers", type=int, default=8, help="DataLoader workers.")
    parser.add_argument("--speaker-name", default="flaviofagundes", help="Nome do speaker para o dataset.")
    parser.add_argument(
        "--max-audio-seconds",
        type=int,
        default=30,
        help="Duracao maxima por amostra em segundos (default: 30, recomendado para GPU 12GB).",
    )
    parser.add_argument(
        "--auto-safe-retries",
        type=int,
        default=1,
        help="Numero de retentativas automaticas com configuracao conservadora em caso de OOM.",
    )
    parser.add_argument(
        "--allow-cpu",
        action="store_true",
        help="Permite treino em CPU apenas para diagnostico local. Por padrao, GPU e obrigatoria.",
    )
    return parser.parse_args()


def main() -> int:
    configure_logging()
    args = parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    LOG.info("Dataset dir: %s", dataset_dir)
    LOG.info("Output dir: %s", output_dir)
    LOG.info(
        "Parametros: language=%s epochs=%d max_audio_seconds=%d",
        args.language,
        args.epochs,
        args.max_audio_seconds,
    )

    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory nao existe: {dataset_dir}")

    ensure_gpu(allow_cpu=args.allow_cpu)
    batch_size = args.batch_size
    eval_batch_size = args.eval_batch_size
    grad_accum_steps = args.grad_accumulation_steps
    num_workers = args.num_workers
    max_audio_seconds = args.max_audio_seconds
    max_attempts = 1 + max(0, args.auto_safe_retries)

    for attempt in range(1, max_attempts + 1):
        try:
            LOG.info(
                "Tentativa %d/%d | batch=%d eval_batch=%d grad_accum=%d workers=%d max_audio_seconds=%d",
                attempt,
                max_attempts,
                batch_size,
                eval_batch_size,
                grad_accum_steps,
                num_workers,
                max_audio_seconds,
            )
            build_and_train(
                dataset_dir=dataset_dir,
                output_dir=output_dir,
                language=args.language,
                epochs=args.epochs,
                grad_accum_steps=grad_accum_steps,
                num_workers=num_workers,
                batch_size=batch_size,
                eval_batch_size=eval_batch_size,
                speaker_name=args.speaker_name,
                max_audio_seconds=max_audio_seconds,
                gpt_checkpointing=True,
            )
            break
        except Exception as exc:
            oom_msg = str(exc).lower()
            is_oom = "outofmemory" in oom_msg or "out of memory" in oom_msg
            if (not is_oom) or attempt >= max_attempts:
                raise

            LOG.warning(
                "OOM detectado na tentativa %d. Reconfigurando para modo seguro e tentando novamente...",
                attempt,
            )
            batch_size = 1
            eval_batch_size = 1
            grad_accum_steps = min(512, max(grad_accum_steps, 128) * 2)
            num_workers = 0
            max_audio_seconds = min(max_audio_seconds, 20)
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        LOG.exception("Falha no pipeline de fine-tuning XTTS-v2: %s", exc)
        raise

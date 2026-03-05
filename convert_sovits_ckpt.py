#!/usr/bin/env python3
"""
Convert raw SoVITS G-checkpoint (training format) to inference format.
Training format:  {model, iteration, optimizer, learning_rate}
Inference format: {weight, config, info}
"""

import os, sys, shutil
from collections import OrderedDict
from time import time as ttime

import torch

FINETUNED = "/home/flaviofagundes/Projetos/APIBR2/integrations/gpt_sovits/models/finetuned/flaviofagundes"
SRC  = f"{FINETUNED}/flaviofagundes_sovits.pth"       # raw G-checkpoint
DST  = f"{FINETUNED}/flaviofagundes_sovits_infer.pth" # inference-ready

# ── Exact config used during training ────────────────────────────────────────
PRETRAINED = "/home/flaviofagundes/Projetos/GPT-SoVITS/GPT_SoVITS/pretrained_models"
OPT_DIR    = f"/home/flaviofagundes/Projetos/GPT-SoVITS/logs/flaviofagundes"

hps_config = {
    "train": {
        "segment_size": 20480,
    },
    "data": {
        "max_wav_value":  32768.0,
        "sampling_rate":  32000,
        "filter_length":  2048,
        "hop_length":     640,
        "win_length":     2048,
        "n_mel_channels": 128,
        "mel_fmin":       0.0,
        "mel_fmax":       None,
        "add_blank":      True,
        "n_speakers":     300,
        "cleaned_text":   True,
        "exp_dir":        OPT_DIR,
    },
    "model": {
        "inter_channels":         192,
        "hidden_channels":        192,
        "filter_channels":        768,
        "n_heads":                2,
        "n_layers":               6,
        "kernel_size":            3,
        "p_dropout":              0.1,
        "resblock":               "1",
        "resblock_kernel_sizes":  [3, 7, 11],
        "resblock_dilation_sizes":[[1, 3, 5], [1, 3, 5], [1, 3, 5]],
        "upsample_rates":         [10, 8, 2, 2, 2],
        "upsample_initial_channel": 512,
        "upsample_kernel_sizes":  [16, 16, 8, 2, 2],
        "n_layers_q":             3,
        "use_spectral_norm":      False,
        "gin_channels":           512,
        "semantic_frame_rate":    "25hz",
        "freeze_quantizer":       True,
        "version":                "v2",
    },
}

print(f"Loading G-checkpoint: {SRC}")
raw = torch.load(SRC, map_location="cpu", weights_only=False)
print(f"  Raw keys: {list(raw.keys())}")
print(f"  Iteration: {raw.get('iteration', '?')}")

# raw["model"] is the state_dict (from the G model only)
model_sd = raw["model"]
print(f"  Weight keys (first 5): {list(model_sd.keys())[:5]}")

opt = OrderedDict()
opt["weight"] = {}
for key, val in model_sd.items():
    if "enc_q" in key:
        continue
    opt["weight"][key] = val.half()

opt["config"] = hps_config
opt["info"]   = f"epoch8_converted_from_G_ckpt"

print(f"  Kept {len(opt['weight'])} weight tensors (enc_q excluded)")

# Save using the my_save pattern (atomic rename)
tmp = f"{ttime()}.pth"
torch.save(opt, tmp)
shutil.move(tmp, DST)

print(f"\n✅  Inference checkpoint saved: {DST}")

# Quick sanity check
check = torch.load(DST, map_location="cpu", weights_only=False)
print(f"   Keys: {list(check.keys())}")
print(f"   Weight tensors: {len(check['weight'])}")
print(f"   Sampling rate: {check['config']['data']['sampling_rate']}")

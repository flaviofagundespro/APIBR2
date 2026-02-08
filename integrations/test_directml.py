#!/usr/bin/env python3
"""
Teste simples para verificar se DirectML está funcionando
"""

import torch

print("=== Teste DirectML ===")
print(f"PyTorch version: {torch.__version__}")
print(f"DirectML available: {hasattr(torch, 'dml')}")

if hasattr(torch, 'dml'):
    try:
        device = torch.device('dml')
        print(f"DirectML device: {device}")
        
        # Teste simples com tensor
        x = torch.randn(3, 3)
        y = x.to(device)
        print(f"Tensor moved to DirectML: {y.device}")
        print("DirectML funcionando!")
        
    except Exception as e:
        print(f"Erro ao usar DirectML: {e}")
else:
    print("DirectML não disponível")
    print("Tentando instalar torch-directml...")
    
    import subprocess
    import sys
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "torch-directml"])
        print("torch-directml instalado. Reinicie o Python.")
    except Exception as e:
        print(f"Erro ao instalar: {e}")

print("=== Fim do teste ===") 
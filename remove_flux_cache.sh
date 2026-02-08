#!/bin/bash
# Script para remover cache do FLUX e liberar ~60GB

echo "🗑️ Removendo cache do FLUX.1-schnell..."
echo ""

FLUX_DIR="$HOME/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell"

if [ -d "$FLUX_DIR" ]; then
    SIZE=$(du -sh "$FLUX_DIR" | cut -f1)
    echo "📊 Tamanho atual: $SIZE"
    echo ""
    echo "⚠️ Isso vai liberar espaço em disco permanentemente."
    echo "Tem certeza? (s/N)"
    read -r response
    
    if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
        echo ""
        echo "🗑️ Removendo..."
        rm -rf "$FLUX_DIR"
        echo "✅ FLUX removido com sucesso!"
        echo "💾 Espaço liberado: $SIZE"
    else
        echo "❌ Operação cancelada"
    fi
else
    echo "ℹ️ FLUX não encontrado em cache"
    echo "   Nada para remover"
fi

echo ""
echo "📊 Espaço total usado pelo cache HuggingFace:"
du -sh ~/.cache/huggingface/hub/ 2>/dev/null || echo "Cache vazio"

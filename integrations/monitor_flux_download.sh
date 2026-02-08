#!/bin/bash
# Monitor FLUX download progress

echo "🔍 Monitorando download do FLUX.1-schnell..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FLUX_DIR="$HOME/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell"
TARGET_SIZE=12  # GB aproximado

while true; do
    if [ -d "$FLUX_DIR" ]; then
        CURRENT_SIZE=$(du -sh "$FLUX_DIR" | cut -f1)
        CURRENT_GB=$(du -sm "$FLUX_DIR" | cut -f1)
        CURRENT_GB_FLOAT=$(echo "scale=2; $CURRENT_GB / 1024" | bc)
        PERCENT=$(echo "scale=1; ($CURRENT_GB_FLOAT / $TARGET_SIZE) * 100" | bc)
        
        echo -ne "\r📥 Baixado: $CURRENT_SIZE (~${CURRENT_GB_FLOAT}GB de ${TARGET_SIZE}GB) - ${PERCENT}%   "
        
        # Check if download is complete (>11GB)
        if [ "$CURRENT_GB" -gt 11000 ]; then
            echo -e "\n✅ Download completo!"
            break
        fi
    else
        echo -ne "\r⏳ Aguardando início do download...   "
    fi
    
    sleep 5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 FLUX.1-schnell pronto para uso!"

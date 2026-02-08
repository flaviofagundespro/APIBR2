#!/bin/bash
# Script de Diagnóstico

echo "🔍 Verificando servidores..."

# 1. Verificar Node.js
echo -n "Testando Node.js (/api/v1/image/models)... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/image/models)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ OK ($HTTP_CODE)"
else
    echo "❌ FALHA ($HTTP_CODE) - Verifique se 'npm start' está rodando em backend/"
fi

# 2. Verificar Python
echo -n "Testando Python Direct (/models)... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/models)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ OK ($HTTP_CODE)"
else
    echo "❌ FALHA ($HTTP_CODE) - Verifique se 'python ultra_optimized_server.py' está rodando em integrations/"
fi

# 3. Verificar Endpoint img2img
echo -n "Testando existência do img2img Node (/api/v1/image/img2img)... "
# Esperamos 400 Bad Request (missing file) ou 500, mas não 404
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/image/img2img)

if [ "$HTTP_CODE" == "404" ]; then
    echo "❌ 404 NOT FOUND - O servidor Node não reconhece a rota. Reinicie-o."
elif [ "$HTTP_CODE" == "000" ]; then
     echo "❌ FALHA DE CONEXÃO - Servidor desligado."
else
    echo "✅ Rota existe (Retornou $HTTP_CODE, esperado pois não enviamos arquivo)"
fi

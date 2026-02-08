@echo off
echo ========================================
echo APIBR2 - Real Image Generation Server
echo ========================================
echo.
echo Iniciando servidor com Stable Diffusion real...
echo.
echo Pasta atual: %CD%
echo.
echo Servidor sera iniciado em: http://localhost:5001
echo.
echo IMPORTANTE:
echo - Na primeira execucao, o modelo sera baixado automaticamente
echo - Isso pode demorar alguns minutos
echo - O modelo ficara em cache para proximas execucoes
echo.
echo Pressione Ctrl+C para parar
echo.
python real_image_server.py
pause 
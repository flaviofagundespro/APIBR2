# APIBR2 - Testes do YouTube
# Testa os endpoints do YouTube que foram adicionados

Write-Host "APIBR2 - Testes do YouTube" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$API_BASE = "http://localhost:3000"
$API_KEY = "your-api-key-here"  # Substitua pela sua API key

$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $API_KEY
}

# 1. SCRAPING DE CANAL DO YOUTUBE
Write-Host "1. Scraping de Canal do YouTube" -ForegroundColor Yellow

$youtubeData = @{
    channelUrl = "https://www.youtube.com/@thiagocalimanIA"
    maxResults = 2
    sort = "popular"
    enableOCR = $false
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/youtube/scrape" -Method POST -Headers $headers -Body $youtubeData
    Write-Host "SUCESSO: YouTube scraping funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no YouTube scraping: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. DETALHES DE VIDEO
Write-Host "2. Detalhes de Video" -ForegroundColor Yellow

$videoData = @{
    videoUrl = "https://www.youtube.com/watch?v=3awkj2_gSes"
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/youtube/video" -Method POST -Headers $headers -Body $videoData
    Write-Host "SUCESSO: Detalhes de video funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO nos detalhes de video: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. OCR DE IMAGEM
Write-Host "3. OCR de Imagem" -ForegroundColor Yellow

$ocrData = @{
    imageUrl = "https://i.ytimg.com/vi/3awkj2_gSes/hqdefault.jpg"
    languages = "por+eng"
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/youtube/ocr" -Method POST -Headers $headers -Body $ocrData
    Write-Host "SUCESSO: OCR funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no OCR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testes do YouTube concluidos!" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints testados:" -ForegroundColor Yellow
Write-Host "  - /api/youtube/scrape: Scraping de canais"
Write-Host "  - /api/youtube/video: Detalhes de videos"
Write-Host "  - /api/youtube/ocr: OCR de imagens" 
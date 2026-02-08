# APIBR2 - Testes de Scraping Corrigidos
# Exemplos com a estrategia obrigatoria

Write-Host "APIBR2 - Testes de Scraping Corrigidos" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$API_BASE = "http://localhost:3000"
$API_KEY = "your-api-key-here"  # Substitua pela sua API key

$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $API_KEY
}

# 1. SCRAPING BASICO (com estrategia 'basic')
Write-Host "1. Scraping Basico" -ForegroundColor Yellow

$basicScrapingData = @{
    strategy = "basic"
    url = "https://httpbin.org/json"
    selectors = @{
        title = @{
            query = "h1"
        }
        content = @{
            query = "p"
        }
        links = @{
            query = "a"
            attribute = "href"
            multiple = $true
        }
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape" -Method POST -Headers $headers -Body $basicScrapingData
    Write-Host "SUCESSO: Scraping basico funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no scraping basico: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. SCRAPING COM SCREENSHOT (estrategia 'screenshot')
Write-Host "2. Scraping com Screenshot" -ForegroundColor Yellow

$screenshotData = @{
    strategy = "screenshot"
    url = "https://httpbin.org/html"
    screenshotOptions = @{
        fullPage = $true
        type = "png"
        quality = 90
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape" -Method POST -Headers $headers -Body $screenshotData
    Write-Host "SUCESSO: Screenshot funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no screenshot: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. SCRAPING JAVASCRIPT (estrategia 'javascript')
Write-Host "3. Scraping JavaScript" -ForegroundColor Yellow

$javascriptData = @{
    strategy = "javascript"
    url = "https://httpbin.org/json"
    script = "return document.title;"
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape" -Method POST -Headers $headers -Body $javascriptData
    Write-Host "SUCESSO: JavaScript scraping funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no JavaScript scraping: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. SCRAPING ASSINCRONO
Write-Host "4. Scraping Assincrono" -ForegroundColor Yellow

$asyncData = @{
    strategy = "basic"
    url = "https://httpbin.org/html"
    selectors = @{
        title = @{
            query = "h1"
        }
    }
    priority = "normal"
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape/async" -Method POST -Headers $headers -Body $asyncData
    Write-Host "SUCESSO: Scraping assincrono funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO no scraping assincrono: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. ESTATISTICAS DO BROWSER POOL
Write-Host "5. Estatisticas do Browser Pool" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape/stats" -Method GET -Headers @{"X-API-Key" = $API_KEY}
    Write-Host "SUCESSO: Estatisticas obtidas!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "ERRO ao obter estatisticas: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testes de scraping concluidos!" -ForegroundColor Green
Write-Host ""
Write-Host "Estrategias disponiveis:" -ForegroundColor Yellow
Write-Host "  - basic: Scraping simples com seletores CSS"
Write-Host "  - javascript: Execucao de scripts JavaScript"
Write-Host "  - form: Interacao com formularios"
Write-Host "  - screenshot: Captura de screenshots" 
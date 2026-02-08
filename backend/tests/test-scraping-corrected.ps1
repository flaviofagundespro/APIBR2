# 🧪 APIBR2 - Testes de Scraping Corrigidos
# Exemplos com a estratégia obrigatória

Write-Host "🚀 APIBR2 - Testes de Scraping Corrigidos" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$API_BASE = "http://localhost:3000"
$API_KEY = "your-api-key-here"  # Substitua pela sua API key

$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $API_KEY
}

# 1. SCRAPING BÁSICO (com estratégia 'basic')
Write-Host "🕷️ 1. Scraping Básico" -ForegroundColor Yellow

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
    Write-Host "✅ Scraping básico funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erro no scraping básico: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. SCRAPING COM SCREENSHOT (estratégia 'screenshot')
Write-Host "📸 2. Scraping com Screenshot" -ForegroundColor Yellow

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
    Write-Host "✅ Screenshot funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erro no screenshot: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. SCRAPING JAVASCRIPT (estratégia 'javascript')
Write-Host "⚡ 3. Scraping JavaScript" -ForegroundColor Yellow

$javascriptData = @{
    strategy = "javascript"
    url = "https://httpbin.org/json"
    script = "return document.title;"
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape" -Method POST -Headers $headers -Body $javascriptData
    Write-Host "✅ JavaScript scraping funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erro no JavaScript scraping: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. SCRAPING ASSÍNCRONO
Write-Host "⏳ 4. Scraping Assíncrono" -ForegroundColor Yellow

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
    Write-Host "✅ Scraping assíncrono funcionou!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erro no scraping assíncrono: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. ESTATÍSTICAS DO BROWSER POOL
Write-Host "📊 5. Estatísticas do Browser Pool" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/scrape/stats" -Method GET -Headers @{"X-API-Key" = $API_KEY}
    Write-Host "✅ Estatísticas obtidas!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erro ao obter estatísticas: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 Testes de scraping concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Estratégias disponíveis:" -ForegroundColor Yellow
Write-Host "  - basic: Scraping simples com seletores CSS"
Write-Host "  - javascript: Execução de scripts JavaScript"
Write-Host "  - form: Interação com formulários"
Write-Host "  - screenshot: Captura de screenshots" 
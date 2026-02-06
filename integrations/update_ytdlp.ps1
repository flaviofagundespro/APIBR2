# PowerShell script to update yt-dlp to latest version
# Run this if TikTok downloads are failing with "Unable to extract webpage video data"

Write-Host "Updating yt-dlp to latest version..." -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Update yt-dlp
Write-Host "Installing/updating yt-dlp..." -ForegroundColor Yellow
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  1. Stable release (recommended)" -ForegroundColor White
Write-Host "  2. Nightly/master (latest fixes, may be unstable)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose option (1 or 2, default: 1)"

if ($choice -eq "2") {
    Write-Host "Installing nightly version..." -ForegroundColor Yellow
    python -m pip install --upgrade --force-reinstall "yt-dlp[default] @ https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz"
} else {
    Write-Host "Installing stable version..." -ForegroundColor Yellow
    python -m pip install --upgrade --force-reinstall "yt-dlp[default]"
}

# Verify installation
Write-Host ""
Write-Host "Verifying yt-dlp version..." -ForegroundColor Cyan
python -m yt_dlp --version

Write-Host ""
Write-Host "Update complete! Restart the server to use the new version." -ForegroundColor Green
Write-Host "If TikTok still fails, try:" -ForegroundColor Yellow
Write-Host "  1. Export fresh cookies from browser" -ForegroundColor Yellow
Write-Host "  2. Check if video is accessible in browser" -ForegroundColor Yellow
Write-Host "  3. TikTok may have changed their API (check yt-dlp GitHub issues)" -ForegroundColor Yellow

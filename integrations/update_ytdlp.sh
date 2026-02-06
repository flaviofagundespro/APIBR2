#!/bin/bash
# Bash script to update yt-dlp to latest version
# Run this if TikTok downloads are failing with "Unable to extract webpage video data"

echo "🔄 Updating yt-dlp to latest version..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python first."
    exit 1
fi

echo "✅ Found Python: $(python3 --version)"

# Update yt-dlp
echo "📦 Installing/updating yt-dlp..."
echo "   Options:"
echo "   1. Stable release (recommended)"
echo "   2. Nightly/master (latest fixes, may be unstable)"
echo ""
read -p "Choose option (1 or 2, default: 1): " choice

if [ "$choice" = "2" ]; then
    echo "📦 Installing nightly version..."
    python3 -m pip install --upgrade --force-reinstall "yt-dlp[default] @ https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz"
else
    echo "📦 Installing stable version..."
    python3 -m pip install --upgrade --force-reinstall "yt-dlp[default]"
fi

# Verify installation
echo ""
echo "🔍 Verifying yt-dlp version..."
python3 -m yt_dlp --version

echo ""
echo "✅ Update complete! Restart the server to use the new version."
echo "💡 If TikTok still fails, try:"
echo "   1. Export fresh cookies from browser"
echo "   2. Check if video is accessible in browser"
echo "   3. TikTok may have changed their API (check yt-dlp GitHub issues)"


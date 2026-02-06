# TikTok Download Troubleshooting Guide

## Current Status

**Issue**: TikTok downloads failing with "Unable to extract webpage video data" even with valid cookies.

**Status**: This is a known issue with yt-dlp and TikTok's frequently changing API structure.

## Quick Fixes

### 1. Update yt-dlp (Most Important)

TikTok changes their API frequently, so yt-dlp needs regular updates:

```powershell
# Windows
cd APIBR2\integrations
.\update_ytdlp.ps1

# Or manually
pip install --upgrade yt-dlp
```

**Check current version:**
```bash
python -m yt_dlp --version
```

### 2. Verify Cookies

1. **Check if cookies file exists**: `integrations/cookies/tiktok_cookies.txt`
2. **Verify cookies are fresh**: Export new cookies if they're older than a few days
3. **Test cookies manually**: Try accessing TikTok in browser while logged in

### 3. Test Video Accessibility

1. Open the TikTok URL in your browser
2. Verify the video plays correctly
3. Check if video is private/restricted
4. Some videos may require specific permissions

### 4. URL Format

The code automatically cleans TikTok URLs by removing query parameters like:
- `?is_from_webapp=1`
- `&sender_device=pc`

Use the base URL format: `https://www.tiktok.com/@username/video/VIDEO_ID`

## Common Error Messages

### "Unable to extract webpage video data"

**Cause**: TikTok changed their API structure or yt-dlp is outdated.

**Solutions**:
1. Update yt-dlp to latest version
2. Check yt-dlp GitHub issues: https://github.com/yt-dlp/yt-dlp/issues?q=tiktok
3. Wait for yt-dlp maintainers to fix the extractor

### "TikTok is requiring login"

**Cause**: Cookies expired or invalid.

**Solutions**:
1. Re-export cookies from browser
2. Ensure you're logged into TikTok in browser
3. Verify cookie file format (Netscape format)

## Alternative Solutions

### Option 1: Use TikTok API Directly (Advanced)

If yt-dlp continues to fail, you may need to:
1. Use TikTok's official API (requires API key)
2. Use browser automation (Selenium/Playwright)
3. Use third-party TikTok downloader APIs

### Option 2: Wait for yt-dlp Update

1. Monitor yt-dlp GitHub issues
2. Check for new releases: https://github.com/yt-dlp/yt-dlp/releases
3. Update as soon as new version is released

### Option 3: Use Alternative Tools

- **snapTik** (web-based)
- **TikTok downloader websites**
- **Browser extensions**

## Testing

After updating yt-dlp, test with:

```bash
# Test via API
curl -X POST http://localhost:5002/tiktok/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@username/video/VIDEO_ID"}'

# Test via yt-dlp CLI directly
python -m yt_dlp "https://www.tiktok.com/@username/video/VIDEO_ID" \
  --cookies integrations/cookies/tiktok_cookies.txt
```

## Monitoring yt-dlp Updates

- **GitHub**: https://github.com/yt-dlp/yt-dlp
- **Issues**: Search for "TikTok" to see current problems
- **Releases**: Check for new versions weekly

## Why This Happens

TikTok actively tries to prevent automated downloads by:
1. Changing their API structure frequently
2. Adding new authentication requirements
3. Implementing bot detection
4. Encrypting video URLs

yt-dlp maintainers work hard to keep up, but there's often a delay between TikTok changes and yt-dlp fixes.

## Current Workaround

Until yt-dlp is updated:
1. ✅ **Instagram downloads work** - Use as alternative for similar content
2. ✅ **YouTube downloads work** - Use for YouTube Shorts/TikTok reposts
3. ⚠️ **TikTok downloads** - Wait for yt-dlp update or use manual browser download

## Status Check

- ✅ Cookies configured correctly
- ✅ Headers optimized
- ✅ URL cleaning implemented
- ✅ Retry logic added
- ⚠️ yt-dlp extractor needs update (TikTok API changed)

---

**Last Updated**: December 2025
**yt-dlp Version**: Check with `python -m yt_dlp --version`
**Status**: Waiting for yt-dlp update to fix TikTok extractor


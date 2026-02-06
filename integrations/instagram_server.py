import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yt_dlp
import os
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="APIBR2 Universal Video Downloader", version="2.0.0")

# Configurações
BASE_DIR = Path(__file__).parent
DOWNLOAD_DIR = BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

COOKIES_DIR = BASE_DIR / "cookies"
COOKIES_DIR.mkdir(exist_ok=True)
COOKIES_FILE = COOKIES_DIR / "insta_cookie.txt"
TIKTOK_COOKIES_FILE = COOKIES_DIR / "tiktok_cookies.txt"  # Fixed: was tiktok_cookie.txt

class DownloadRequest(BaseModel):
    url: str

class TikTokRequest(BaseModel):
    url: str
    quality: str = "high"
    remove_watermark: bool = True

class YouTubeRequest(BaseModel):
    url: str
    quality: str = "720"
    audio_only: bool = False
    playlist: bool = False

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Universal Video Downloader (Insta/TikTok/YT)"}

def get_base_opts():
    opts = {
        'outtmpl': str(DOWNLOAD_DIR / '%(title)s_%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'restrictfilenames': True,
    }
    if COOKIES_FILE.exists():
        opts['cookiefile'] = str(COOKIES_FILE)
    return opts

@app.post("/download")
def download_instagram(req: DownloadRequest):
    """Legacy endpoint for Instagram, kept for compatibility."""
    logger.info(f"📷 Instagram request: {req.url}")
    try:
        # Check for unsupported Instagram URL types
        if '/direct/' in req.url or '/messages/' in req.url:
            raise HTTPException(
                status_code=400,
                detail="Instagram Direct messages are not supported. Please use public posts, reels, or stories URLs."
            )
        
        ydl_opts = get_base_opts()
        ydl_opts['format'] = 'best'
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)
            filename = ydl.prepare_filename(info)
            
        return {
            "status": "success", 
            "filename": os.path.basename(filename), 
            "path": str(filename),
            "title": info.get('title'),
            "duration": info.get('duration'),
            "platform": "instagram"
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Instagram error: {error_msg}")
        
        # Provide helpful error for unsupported URLs
        if "Unsupported URL" in error_msg or "direct" in req.url.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported Instagram URL type. Supported: public posts, reels, stories, IGTV. "
                       f"Direct messages are not supported. Error: {error_msg}"
            )
        
        raise HTTPException(status_code=500, detail=error_msg)

def convert_to_mobile_url(url):
    """Convert TikTok web URL to mobile format (sometimes works better)"""
    try:
        # Extract video ID from URL
        if '/video/' in url:
            video_id = url.split('/video/')[-1].split('?')[0]
            # Extract username if available
            if '@' in url:
                username = url.split('@')[1].split('/')[0]
                return f'https://m.tiktok.com/@{username}/video/{video_id}'
            else:
                return f'https://m.tiktok.com/v/{video_id}'
    except Exception as e:
        logger.warning(f"Could not convert to mobile URL: {e}")
    return None

@app.post("/tiktok/download")
def download_tiktok(req: TikTokRequest):
    # Clean TikTok URL - remove query parameters that might cause issues
    clean_url = req.url.split('?')[0]  # Remove query params like ?is_from_webapp=1&sender_device=pc
    logger.info(f"🎵 TikTok request: {clean_url} (original: {req.url})")
    try:
        ydl_opts = get_base_opts()
        ydl_opts['format'] = 'best'
        ydl_opts['verbose'] = True  # Enable verbose logging for debugging
        
        # Additional TikTok-specific options
        ydl_opts.update({
            'extract_flat': False,
            'playlist_items': '1',  # If playlist, get only first item
            'geo_bypass': True,
            'geo_bypass_country': 'US',  # TikTok sometimes blocks by region
        })
        
        # TikTok-specific optimizations with multiple API hostname options
        ydl_opts['extractor_args'] = {
            'tiktok': {
                'webpage_download_retries': 3,
                'api_hostname': 'api16-normal-c-useast1a.tiktokv.com',  # Try mobile API first
            }
        }
        
        # Enhanced headers that TikTok expects (even with cookies)
        tiktok_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.tiktok.com/',
            'Origin': 'https://www.tiktok.com',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not.A/Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        }
        
        # TikTok specific cookies - try multiple sources
        cookies_configured = False
        
        # First, try TikTok-specific cookie file
        if TIKTOK_COOKIES_FILE.exists():
            logger.info(f"✅ Using TikTok cookies from: {TIKTOK_COOKIES_FILE}")
            ydl_opts['cookiefile'] = str(TIKTOK_COOKIES_FILE)
            cookies_configured = True
        # Fallback: try extracting cookies from browser (Chrome/Edge)
        else:
            try:
                # Try Chrome first (most common), then Edge
                ydl_opts['cookiesfrombrowser'] = ('chrome',)
                logger.info("🔍 Attempting to extract TikTok cookies from Chrome browser")
                cookies_configured = True
            except (KeyError, AttributeError, ImportError) as browser_error:
                logger.warning(f"Browser cookie extraction not available: {browser_error}")
                logger.info("💡 Tip: Install browser_cookie3 for automatic cookie extraction")
                logger.warning("⚠️ No TikTok cookies found - some videos may require authentication")
        
        # Always set headers (TikTok needs them even with cookies)
        ydl_opts['http_headers'] = tiktok_headers
        
        # Additional TikTok-specific options
        ydl_opts['no_check_certificate'] = False
        ydl_opts['prefer_insecure'] = False
        
        # Try extraction with multiple strategies
        urls_to_try = [
            clean_url,  # First: cleaned web URL
        ]
        
        # Add mobile URL as fallback
        mobile_url = convert_to_mobile_url(clean_url)
        if mobile_url:
            urls_to_try.append(mobile_url)
        
        last_error = None
        
        for url_index, url_to_try in enumerate(urls_to_try):
            try:
                url_type = "mobile" if url_index > 0 else "web"
                logger.info(f"🔄 Attempting {url_type} URL: {url_to_try}")
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # First, try to get info without downloading
                    info = ydl.extract_info(url_to_try, download=False)
                    
                    # If successful, now download
                    ydl_opts_download = ydl_opts.copy()
                    with yt_dlp.YoutubeDL(ydl_opts_download) as ydl_download:
                        ydl_download.download([url_to_try])
                        filename = ydl_download.prepare_filename(info)
                    
                    logger.info(f"✅ Success with {url_type} URL")
                    return {
                        "status": "success", 
                        "filename": os.path.basename(filename), 
                        "path": str(filename),
                        "title": info.get('title'),
                        "duration": info.get('duration'),
                        "platform": "tiktok",
                        "url_type": url_type
                    }
            except Exception as attempt_error:
                last_error = attempt_error
                logger.warning(f"❌ {url_type.capitalize()} URL failed: {str(attempt_error)}")
                
                # If this was the last URL to try, raise the error
                if url_index == len(urls_to_try) - 1:
                    raise
                
                # Try different API hostname for next attempt
                if url_index == 0:
                    # Switch to standard API hostname for mobile attempt
                    ydl_opts['extractor_args']['tiktok']['api_hostname'] = 'api.tiktok.com'
                    import time
                    time.sleep(1)  # Brief pause before retry
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"TikTok error: {error_msg}")
        
        # Check if yt-dlp needs update
        if "Unable to extract" in error_msg or "please report this issue" in error_msg:
            # Try to get current yt-dlp version
            try:
                import subprocess
                result = subprocess.run(['python', '-m', 'yt_dlp', '--version'], 
                                      capture_output=True, text=True, timeout=5)
                current_version = result.stdout.strip() if result.returncode == 0 else "unknown"
            except:
                current_version = "unknown"
            
            raise HTTPException(
                status_code=500,
                detail=f"TikTok extractor failed. Current yt-dlp version: {current_version}\n\n"
                       f"🔧 Solutions (try in order):\n"
                       f"1. Update yt-dlp to latest/nightly:\n"
                       f"   pip install --upgrade --force-reinstall 'yt-dlp[default]'\n"
                       f"   OR nightly: pip install -U 'yt-dlp[default] @ https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz'\n"
                       f"2. Verify cookies are fresh (export new ones from browser)\n"
                       f"3. Check if video is accessible in browser\n"
                       f"4. TikTok frequently changes API - check GitHub issues:\n"
                       f"   https://github.com/yt-dlp/yt-dlp/issues?q=tiktok\n"
                       f"5. Try a different TikTok video\n\n"
                       f"💡 Note: Tried both web and mobile URL formats.\n"
                       f"Original error: {error_msg}"
            )
        
        # Provide helpful error message for authentication issues
        if "login" in error_msg.lower() or "authentication" in error_msg.lower() or "cookies" in error_msg.lower():
            raise HTTPException(
                status_code=401,
                detail=f"TikTok requires authentication. Please export cookies from your browser:\n"
                       f"1. Install browser extension to export cookies (e.g., 'Get cookies.txt LOCALLY')\n"
                       f"2. Save cookies to: {TIKTOK_COOKIES_FILE}\n"
                       f"3. Or ensure you're logged into TikTok in Chrome/Edge browser\n"
                       f"Original error: {error_msg}"
            )
        
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/youtube/download")
def download_youtube(req: YouTubeRequest):
    logger.info(f"▶️ YouTube request: {req.url} | Audio: {req.audio_only} | Quality: {req.quality}")
    try:
        ydl_opts = get_base_opts()
        
        if req.audio_only:
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
            # Update extension for filename prediction
            ydl_opts['outtmpl'] = str(DOWNLOAD_DIR / '%(title)s_%(id)s.mp3')
        else:
            # Format selection based on quality
            # Note: 'bestvideo[height<=?720]+bestaudio/best' ensures we don't go above requested res
            # but fallback to best if not available.
            try:
                height = int(req.quality)
                ydl_opts['format'] = f'bestvideo[height<=?{height}]+bestaudio/best[height<=?{height}]/best'
            except:
                ydl_opts['format'] = 'best'
            
            ydl_opts['merge_output_format'] = 'mp4'

        if not req.playlist:
            ydl_opts['noplaylist'] = True

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)
            
            # Handle playlist vs single video
            if 'entries' in info:
                # It's a playlist
                first_entry = info['entries'][0]
                filename = ydl.prepare_filename(first_entry)
                title = info.get('title', 'Playlist')
            else:
                filename = ydl.prepare_filename(info)
                title = info.get('title')
                
                # Fix filename extension if audio conversion happened
                if req.audio_only:
                    base, _ = os.path.splitext(filename)
                    filename = base + ".mp3"

        return {
            "status": "success", 
            "filename": os.path.basename(filename), 
            "path": str(filename),
            "title": title,
            "duration": info.get('duration'),
            "platform": "youtube"
        }
    except Exception as e:
        logger.error(f"YouTube error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/facebook/download")
def download_facebook(req: DownloadRequest):
    logger.info(f"📘 Facebook request: {req.url}")
    try:
        # Check for valid Facebook URL
        if 'facebook.com' not in req.url and 'fb.watch' not in req.url:
             raise HTTPException(
                status_code=400,
                detail="Invalid Facebook URL. Please provide a valid facebook.com or fb.watch URL."
            )

        ydl_opts = get_base_opts()
        ydl_opts['format'] = 'best'
        
        # Facebook specific options
        ydl_opts.update({
             'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
             'referer': 'https://www.facebook.com/',
        })

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)
            filename = ydl.prepare_filename(info)
            
        return {
            "status": "success", 
            "filename": os.path.basename(filename), 
            "path": str(filename),
            "title": info.get('title'),
            "duration": info.get('duration'),
            "platform": "facebook"
        }
    except Exception as e:
        logger.error(f"Facebook error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/universal/download")
def download_universal(req: DownloadRequest):
    """Generic downloader for Amazon, Shopee, and other supported platforms"""
    logger.info(f"🌐 Universal request: {req.url}")
    
    if req.url.startswith("blob:"):
         raise HTTPException(
            status_code=400,
            detail="Blob URLs (começando com 'blob:') são links temporários do navegador e não podem ser baixados. Por favor, use o link da página do produto."
        )

    try:
        ydl_opts = get_base_opts()
        ydl_opts['format'] = 'best'
        
        # Ensure we merge into mp4 if it's a stream (HLS)
        ydl_opts['merge_output_format'] = 'mp4'
        
        # Do NOT use explicit FFmpegVideoConvertor postprocessor here as it crashes on some Amazon streams
        # yt-dlp usually handles HLS automatically if ffmpeg is present.

        # Enhanced headers for specific platforms
        if 'amazon' in req.url or 'amzn' in req.url:
            logger.info("📦 Detected Amazon URL, applying optimized headers")
            ydl_opts.update({
                 'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                 'referer': 'https://www.amazon.com/',
            })
        elif 'shopee' in req.url:
            logger.info("🛍️ Detected Shopee URL, applying optimized headers")
            ydl_opts.update({
                 'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            })
        else:
            ydl_opts.update({
                 'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            })

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info
            info = ydl.extract_info(req.url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Additional check: If result is m3u8, it might be the problem the user reported (playlist file only).
            # However, with merge_output_format='mp4', yt-dlp normally downloads segments and merges.
            # If it still returns m3u8, we check if there is an mp4 counterpart.
            
            base, ext = os.path.splitext(filename)
            possible_mp4 = base + ".mp4"
            
            if os.path.exists(possible_mp4):
                filename = possible_mp4
                logger.info(f"🔄 Using merged MP4 file: {filename}")
            elif ext == '.m3u8':
                 # If we only have the m3u8 file, it means download failed to grab segments.
                 # We can't do much but warn, or maybe the file IS the video (unlikely for m3u8).
                 logger.warning("⚠️ File resulted in .m3u8 format, might not be playable.")
            
        return {
            "status": "success", 
            "filename": os.path.basename(filename), 
            "path": str(filename),
            "title": info.get('title'),
            "duration": info.get('duration'),
            "platform": info.get('extractor', 'unknown')
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Universal download error: {error_msg}")
        
        if "HTTP Error 503" in error_msg:
             raise HTTPException(
                status_code=503, 
                detail="A plataforma bloqueou a requisição (Erro 503). Tente novamente mais tarde."
            )
        
        if "Postprocessing" in error_msg:
             raise HTTPException(
                status_code=500,
                detail="Erro de processamento de vídeo (ffmpeg). O vídeo pode estar protegido ou corrompido."
            )

        if "Unsupported URL" in error_msg and "shopee" in req.url:
            raise HTTPException(
                status_code=400,
                detail="A Shopee protege as páginas do produto (Unsupported URL). Para baixar da Shopee, por favor use o link DIRETO do vídeo (inspecione o elemento e copie o link .mp4 ou similar)."
            )
            
        raise HTTPException(status_code=500, detail=f"Download failed: {error_msg}")

if __name__ == "__main__":
    logger.info(f"🚀 Starting Universal Video Downloader on port 5002")
    logger.info(f"📂 Downloads: {DOWNLOAD_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=5002)

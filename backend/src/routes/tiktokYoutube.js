import { Router } from 'express';
import axios from 'axios';

const router = Router();

const PYTHON_TIKTOK_URL = process.env.PYTHON_TIKTOK_URL || 'http://localhost:5002';
const PYTHON_YOUTUBE_URL = process.env.PYTHON_YOUTUBE_URL || 'http://localhost:5002';

// TikTok Download
router.post('/tiktok/download', async (req, res) => {
    try {
        const { url, quality = 'high', remove_watermark = true } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: 'Please provide a valid TikTok URL in the request body'
            });
        }

        if (!url.includes('tiktok.com')) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'Please provide a valid TikTok URL'
            });
        }

        console.log(`Forwarding TikTok download request to Python service: ${PYTHON_TIKTOK_URL}`);

        const response = await axios.post(`${PYTHON_TIKTOK_URL}/tiktok/download`, {
            url,
            quality,
            remove_watermark
        });

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('TikTok download error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'TikTok download service is not running. Please start the TikTok/YouTube server'
            });
        }

        const status = error.response?.status || 500;
        const details = error.response?.data?.detail || error.message;

        res.status(status).json({
            error: 'TikTok download failed',
            details: details
        });
    }
});

// YouTube Download
router.post('/youtube/download', async (req, res) => {
    try {
        const { url, quality = '720', audio_only = false, playlist = false } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: 'Please provide a valid YouTube URL in the request body'
            });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'Please provide a valid YouTube URL'
            });
        }

        console.log(`Forwarding YouTube download request to Python service: ${PYTHON_YOUTUBE_URL}`);

        const response = await axios.post(`${PYTHON_YOUTUBE_URL}/youtube/download`, {
            url,
            quality,
            audio_only,
            playlist
        });

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('YouTube download error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'YouTube download service is not running. Please start the TikTok/YouTube server'
            });
        }

        const status = error.response?.status || 500;
        const details = error.response?.data?.detail || error.message;

        res.status(status).json({
            error: 'YouTube download failed',
            details: details
        });
    }
});

export { router as tiktokYoutubeRoutes };

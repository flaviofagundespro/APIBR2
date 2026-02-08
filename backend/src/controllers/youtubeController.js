import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import Joi from 'joi';
import { performance } from 'perf_hooks';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const youtubeScrapeSchema = Joi.object({
    channelUrl: Joi.string().uri().required(),
    sort: Joi.string().valid('popular', 'recent').default('popular'),
    maxResults: Joi.number().integer().min(1).max(100).default(10),
    enableOCR: Joi.boolean().default(false)
});

class YouTubeController {
    constructor() {
        this.ocrProcessor = null;
        this.initOCR();
    }

    async initOCR() {
        try {
            // Check if Tesseract is available
            await this.checkTesseract();
            logger.info('✅ Tesseract OCR initialized');
        } catch (error) {
            logger.warn('⚠️ Tesseract not available, OCR features disabled');
        }
    }

    async checkTesseract() {
        return new Promise((resolve, reject) => {
            exec('tesseract --version', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async scrapeChannel(req, res) {
        try {
            // Validate payload with Joi schema
            const { error, value } = youtubeScrapeSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: 'Validation Error', details: error.details.map(d => d.message) });
            }
            const { channelUrl, sort, maxResults, enableOCR } = value;

            if (!channelUrl) {
                return res.status(400).json({
                    error: 'channelUrl is required',
                    example: 'https://www.youtube.com/@channelname'
                });
            }

            logger.info('Starting YouTube scraping with options:', { channelUrl, sort, maxResults, enableOCR });

            // Mock response for now - implement full scraping later
            const mockResponse = [
                {
                    "success": true,
                    "count": 2,
                    "channel": "thiagocalimanIA",
                    "videos": [
                        {
                            "videoId": "3awkj2_gSes",
                            "title": "AI Sci-Fi Short Film | Made with Google Veo 2 + Flow + MusicFX",
                            "url": "https://www.youtube.com/watch?v=3awkj2_gSes",
                            "views": 0,
                            "age": "1 month ago",
                            "thumbnail": "https://i.ytimg.com/vi/3awkj2_gSes/hqdefault.jpg",
                            "channelUrl": "https://www.youtube.com/@thiagocalimanIA",
                            "channel": "thiagocalimanIA",
                            "publishedAt": "2025-06-03T13:36:48.698Z",
                            "ocrText": null
                        },
                        {
                            "videoId": "kRNDjmODeaM",
                            "title": "AI Career Prep： Resumes and Interviews",
                            "url": "https://www.youtube.com/watch?v=kRNDjmODeaM",
                            "views": 0,
                            "age": "2 months ago",
                            "thumbnail": "https://i.ytimg.com/vi/kRNDjmODeaM/hqdefault.jpg",
                            "channelUrl": "https://www.youtube.com/@thiagocalimanIA",
                            "channel": "thiagocalimanIA",
                            "publishedAt": "2025-05-03T13:36:48.698Z",
                            "ocrText": null
                        }
                    ]
                }
            ];

            res.json(mockResponse);

        } catch (error) {
            logger.error('YouTube scraping error:', error);
            res.status(500).json({
                error: 'Failed to scrape YouTube channel',
                message: error.message
            });
        }
    }

    async getVideoDetails(req, res) {
        try {
            const { videoUrl } = req.body;
            
            if (!videoUrl) {
                return res.status(400).json({
                    error: 'videoUrl is required',
                    example: 'https://www.youtube.com/watch?v=VIDEO_ID'
                });
            }

            // Mock response for now
            const mockResponse = {
                success: true,
                video: {
                    title: "Sample Video Title",
                    description: "Sample video description",
                    views: "1,234",
                    likes: "56",
                    channel: "Sample Channel",
                    publishedAt: "2025-01-01T00:00:00.000Z"
                }
            };

            res.json(mockResponse);

        } catch (error) {
            logger.error('Video details error:', error);
            res.status(500).json({
                error: 'Failed to get video details',
                message: error.message
            });
        }
    }

    async extractTextFromImage(req, res) {
        try {
            const { imageUrl, languages = "por+eng" } = req.body;
            
            if (!imageUrl) {
                return res.status(400).json({
                    error: 'imageUrl is required'
                });
            }

            // Mock OCR response for now
            const mockResponse = {
                success: true,
                text: "Sample OCR text extracted from image",
                confidence: 0.85
            };

            res.json(mockResponse);

        } catch (error) {
            logger.error('OCR error:', error);
            res.status(500).json({
                error: 'Failed to extract text from image',
                message: error.message
            });
        }
    }
}

export default new YouTubeController(); 
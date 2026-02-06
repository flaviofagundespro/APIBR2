import { Router } from 'express';
import { scrapeRoutes } from './scrape.js';
import { jobRoutes } from './jobs.js';
import { metricsRoutes } from './metrics.js';
import { docsRoutes } from './docs.js';

// Media studio routes (audio/image/video orchestration)
import { audioRoutes } from './audioRoutes.js';
import { imageRoutes } from './imageRoutes.js';
import { videoRoutes } from './videoRoutes.js';
import { studioRoutes } from './studioRoutes.js';

// Social modules
import { youtubeRoutes } from './youtube.js';
import { instagramRoutes } from './instagram.js';
import { tiktokYoutubeRoutes } from './tiktokYoutube.js';
import { universalRoutes } from './universal.js';

const router = Router();

// API routes
router.use('/scrape', scrapeRoutes);
router.use('/jobs', jobRoutes);
router.use('/metrics', metricsRoutes);
router.use('/docs', docsRoutes);

// YouTube routes
router.use('/youtube', youtubeRoutes);

// Instagram routes
router.use('/instagram', instagramRoutes);

// TikTok and YouTube download routes
router.use('/', tiktokYoutubeRoutes);

// Universal download routes (Facebook, Amazon, Shopee)
router.use('/', universalRoutes);

// Media studio versioned routes
router.use('/v1/audio', audioRoutes);
router.use('/v1/image', imageRoutes);
router.use('/v1/video', videoRoutes);
router.use('/v1/studio', studioRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'APIBR - Web Scraping & Media Studio API',
    version: '1.0.0',
    description: 'Professional web scraping and AI media generation API',
    endpoints: {
      // Web Scraping
      scrape: '/api/scrape',
      async_scrape: '/api/scrape/async',
      jobs: '/api/jobs/:id',
      metrics: '/api/metrics',
      docs: '/api/docs',
      health: '/health',

      // YouTube
      youtube_scrape: '/api/youtube/scrape',
      youtube_video: '/api/youtube/video',
      youtube_ocr: '/api/youtube/ocr',

      // Media Studio
      audio: {
        generate_speech: '/api/v1/audio/generate-speech',
        clone_voice: '/api/v1/audio/clone-voice',
        voices: '/api/v1/audio/voices'
      },
      image: {
        generate: '/api/v1/image/generate',
        edit: '/api/v1/image/edit',
        upscale: '/api/v1/image/upscale'
      },
      video: {
        create_avatar: '/api/v1/video/create-avatar',
        animate: '/api/v1/video/animate',
        status: '/api/v1/video/status/:job_id'
      },
      studio: {
        create_project: '/api/v1/studio/create-project',
        generate_content: '/api/v1/studio/generate-content',
        projects: '/api/v1/studio/projects'
      }
    },
  });
});

export { router as apiRoutes };


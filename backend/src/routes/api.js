import { Router } from 'express';
import { config } from '../config/index.js';
import { scrapeRoutes } from './scrape.js';
import { jobRoutes } from './jobs.js';
import { metricsRoutes } from './metrics.js';
import { docsRoutes } from './docs.js';

// Media studio routes (audio/image/video orchestration)
import { audioRoutes } from './audioRoutes.js';
import { imageRoutes } from './imageRoutes.js';
import { videoRoutes } from './videoRoutes.js';
import { studioRoutes } from './studioRoutes.js';
import { chatRoutes } from './chat.js';

// Social modules
import { youtubeRoutes } from './youtube.js';
import { instagramRoutes } from './instagram.js';
import { tiktokYoutubeRoutes } from './tiktokYoutube.js';
import { universalRoutes } from './universal.js';

// AIOS WhatsApp Gateway
import { aiosRoutes } from './aios.js';

const router = Router();

function disabledFeatureRouter(moduleName, envFlag) {
  const disabledRouter = Router();

  disabledRouter.use((req, res) => {
    res.status(503).json({
      error: 'Feature Disabled',
      module: moduleName,
      message: `${moduleName} is disabled in this environment`,
      envFlag,
      enableHint: `Set ${envFlag}=true and restart the backend`,
    });
  });

  return disabledRouter;
}

// API routes
router.use('/scrape', scrapeRoutes);
router.use('/jobs', jobRoutes);
router.use('/metrics', metricsRoutes);
router.use('/docs', docsRoutes);

// YouTube routes
router.use('/youtube', youtubeRoutes);

// Instagram + downloader routes (optional for VPS lean mode)
if (config.features.videoDl) {
  router.use('/instagram', instagramRoutes);
  router.use('/', tiktokYoutubeRoutes);
  router.use('/', universalRoutes);
} else {
  router.use('/instagram', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/tiktok', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/youtube/download', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/facebook', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/amazon', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/shopee', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
  router.use('/universal', disabledFeatureRouter('video-downloader', 'FEATURE_VIDEO_DL'));
}

// Media studio versioned routes
router.use(
  '/v1/audio',
  config.features.audioAi
    ? audioRoutes
    : disabledFeatureRouter('audio-ai', 'FEATURE_AUDIO_AI')
);
router.use(
  '/v1/image',
  config.features.imageAi
    ? imageRoutes
    : disabledFeatureRouter('image-ai', 'FEATURE_IMAGE_AI')
);
router.use('/v1/video', videoRoutes);
router.use('/v1/studio', studioRoutes);

// AI Chat routes
router.use(
  '/v1/chat',
  config.features.chatAi
    ? chatRoutes
    : disabledFeatureRouter('chat-ai', 'FEATURE_CHAT_AI')
);

// AIOS WhatsApp Gateway
router.use('/aios', aiosRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'APIBR - Web Scraping & Media Studio API',
    version: '1.0.0',
    description: 'Professional web scraping and AI media generation API',
    features: {
      FEATURE_IMAGE_AI: config.features.imageAi,
      FEATURE_AUDIO_AI: config.features.audioAi,
      FEATURE_CHAT_AI: config.features.chatAi,
      FEATURE_VIDEO_DL: config.features.videoDl,
    },
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
        enabled: config.features.audioAi,
        generate_speech: '/api/v1/audio/generate-speech',
        clone_voice: '/api/v1/audio/clone-voice',
        voices: '/api/v1/audio/voices'
      },
      image: {
        enabled: config.features.imageAi,
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
      },
      chat: {
        enabled: config.features.chatAi,
        chat: '/api/v1/chat/chat',
        models: '/api/v1/chat/models'
      },
      video_dl: {
        enabled: config.features.videoDl,
        instagram_download: '/api/instagram/download',
        tiktok_download: '/api/tiktok/download',
        youtube_download: '/api/youtube/download',
        universal_download: '/api/universal/download'
      }
    },
  });
});

export { router as apiRoutes };

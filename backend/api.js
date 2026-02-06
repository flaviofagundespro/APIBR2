errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrimport { Router } from 'express';
import { scrapeRoutes } from './scrape.js';
import { jobRoutes } from './jobs.js';
import { metricsRoutes } from './metrics.js';
import { docsRoutes } from './docs.js';
import { audioRoutes } from './audioRoutes.js';
import { imageRoutes } from './imageRoutes.js';
import { videoRoutes } from './videoRoutes.js';
import { studioRoutes } from './studioRoutes.js';

const router = Router();

// API routes
router.use('/scrape', scrapeRoutes);
router.use('/jobs', jobRoutes);
router.use('/metrics', metricsRoutes);
router.use('/docs', docsRoutes);
router.use('/audio', audioRoutes);
router.use('/image', imageRoutes);
router.use('/video', videoRoutes);
router.use('/studio', studioRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'APIBR - Web Scraping API',
    version: '1.0.0',
    description: 'Professional web scraping API with browser pool management',
    endpoints: {
      scrape: '/api/scrape',
      async_scrape: '/api/scrape/async',
      jobs: '/api/jobs/:id',
      metrics: '/api/metrics',
      docs: '/api/docs',
      audio: '/api/audio',
      image: '/api/image',
      video: '/api/video',
      studio: '/api/studio',
      health: '/health',
    },
  });
});

export { router as apiRoutes };



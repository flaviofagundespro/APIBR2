import { Router } from 'express';
import { generateImage, editImage, upscaleImage, getModels } from '../controllers/imageController.js';

const router = Router();

router.post('/generate', generateImage);
router.post('/edit', editImage);
router.post('/upscale', upscaleImage);
router.get('/models', getModels);

export { router as imageRoutes };



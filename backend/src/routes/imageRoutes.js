import { Router } from 'express';
import multer from 'multer';
import { generateImage, editImage, upscaleImage, getModels, img2imgGenerate } from '../controllers/imageController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/generate', generateImage);
router.post('/edit', editImage);
router.post('/upscale', upscaleImage);
router.get('/models', getModels);
router.post('/img2img', upload.single('image'), img2imgGenerate);

export { router as imageRoutes };



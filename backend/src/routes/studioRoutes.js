import { Router } from 'express';
import { createProject, generateContent, getProjects, getFile } from '../controllers/studioController.js';

const router = Router();

router.post('/create-project', createProject);
router.post('/generate-content', generateContent);
router.get('/projects', getProjects);
router.get('/file/:type/:filename', getFile);

export { router as studioRoutes };



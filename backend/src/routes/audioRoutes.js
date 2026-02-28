import { Router } from 'express';
import multer from 'multer';
import {
  generateSpeech,
  cloneVoice,
  getVoices,
  transcribeAudio,
  transcribeMeeting,
  onboardingUpload,
  saveVoiceProfile,
  listProfiles,
  getProfileFiles,
  startTraining,
  getFinetunedModels,
  generateFinetuned,
  getTrainingJob,
} from '../controllers/audioController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Voices
router.get('/voices', getVoices);
router.post('/generate-speech', generateSpeech);
router.post('/clone-voice', upload.single('reference_audio'), cloneVoice);
router.post('/voices/clone/save', upload.single('reference_audio'), saveVoiceProfile);

// Transcription
router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.post('/transcribe-meeting', upload.single('audio'), transcribeMeeting);

// Onboarding
router.post('/onboarding/upload', upload.array('audio', 50), onboardingUpload);
router.get('/onboarding/profiles', listProfiles);
router.get('/onboarding/profiles/:userId', getProfileFiles);
router.post('/train/start', upload.none(), startTraining);
router.get('/train/jobs/:jobId', getTrainingJob);
router.get('/finetuned-models', getFinetunedModels);
router.post('/generate-finetuned', upload.none(), generateFinetuned);

export { router as audioRoutes };

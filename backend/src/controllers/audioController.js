import { logger } from "../config/logger.js";
import axios from 'axios';
import FormData from 'form-data';

const AUDIO_SERVER_URL = process.env.AUDIO_SERVER_URL || 'http://localhost:5002';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function handlePythonError(pythonError, res, context) {
  logger.error(`Python audio server error (${context}):`, pythonError.message);
  if (pythonError.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Audio service is not running. Start it with: python integrations/audio_server.py',
    });
  }
  return res.status(500).json({
    error: `${context} Error`,
    message: pythonError.response?.data?.detail || pythonError.message,
  });
}

// ─── GET /api/v1/audio/voices ─────────────────────────────────────────────────

export const getVoices = async (req, res, next) => {
  try {
    const pythonResponse = await axios.get(`${AUDIO_SERVER_URL}/voices`, {
      timeout: 10000,
    });
    res.status(200).json(pythonResponse.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      // Return fallback list so frontend still works without Python server
      return res.status(200).json({
        voices: [
          { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Feminino)', language: 'pt', model: 'edge_tts', clone_capable: false, type: 'standard', is_profile: false },
          { id: 'pt-BR-AntonioNeural', name: 'Antonio (Masculino)', language: 'pt', model: 'edge_tts', clone_capable: false, type: 'standard', is_profile: false },
        ],
      });
    }
    logger.error('Error fetching voices:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/generate-speech ──────────────────────────────────────

export const generateSpeech = async (req, res, next) => {
  try {
    const { text, voice, language } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'text is required' });
    }

    logger.info('TTS request', { chars: text.length, voice, language });

    const formData = new FormData();
    formData.append('text', text.trim());
    formData.append('voice', voice || 'pt-BR-FranciscaNeural');
    formData.append('language', language || 'pt');

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/tts`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 120000, // 2 min — TTS is fast even on CPU
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Speech Generation');
    }
  } catch (error) {
    logger.error('Error generating speech:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/clone-voice ──────────────────────────────────────────

export const cloneVoice = async (req, res, next) => {
  try {
    const { text, language, voice_profile_name } = req.body;
    const referenceFile = req.file;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'text is required' });
    }
    if (!voice_profile_name && !referenceFile) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'either voice_profile_name or reference_audio file is required',
      });
    }

    logger.info('Voice clone request', {
      chars: text.length, language,
      profile: voice_profile_name || null,
      ref: referenceFile?.originalname || null,
    });

    const formData = new FormData();
    formData.append('text', text.trim());
    formData.append('language', language || 'pt');

    if (voice_profile_name) {
      formData.append('voice_profile_name', voice_profile_name);
    }
    if (referenceFile) {
      formData.append('reference_audio', referenceFile.buffer, {
        filename: referenceFile.originalname,
        contentType: referenceFile.mimetype,
      });
    }

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/clone`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 300000, // 5 min — XTTS can be slow on CPU
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Voice Clone');
    }
  } catch (error) {
    logger.error('Error cloning voice:', error);
    next(error);
  }
};

// ─── GET /api/v1/audio/onboarding/profiles ───────────────────────────────────

export const listProfiles = async (req, res, next) => {
  try {
    const pythonResponse = await axios.get(`${AUDIO_SERVER_URL}/onboarding/profiles`, { timeout: 10000 });
    res.status(200).json(pythonResponse.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') return handlePythonError(error, res, 'List Profiles');
    next(error);
  }
};

// ─── GET /api/v1/audio/onboarding/profiles/:userId ───────────────────────────

export const getProfileFiles = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const pythonResponse = await axios.get(`${AUDIO_SERVER_URL}/onboarding/profiles/${encodeURIComponent(userId)}`, { timeout: 15000 });
    res.status(200).json(pythonResponse.data);
  } catch (error) {
    if (error.response?.status === 404) return res.status(404).json({ error: 'Not Found', message: error.response.data?.detail });
    if (error.code === 'ECONNREFUSED') return handlePythonError(error, res, 'Get Profile Files');
    next(error);
  }
};

// ─── POST /api/v1/audio/voices/clone/save ────────────────────────────────────

export const saveVoiceProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const referenceFile = req.file;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'name is required' });
    }
    if (!referenceFile) {
      return res.status(400).json({ error: 'Validation Error', message: 'reference_audio file is required' });
    }

    logger.info('Save voice profile', { name, ref: referenceFile.originalname });

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('reference_audio', referenceFile.buffer, {
      filename: referenceFile.originalname,
      contentType: referenceFile.mimetype,
    });

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/voices/clone/save`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 120000, // 2 min — normalization only
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Save Voice Profile');
    }
  } catch (error) {
    logger.error('Error saving voice profile:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/transcribe ───────────────────────────────────────────

export const transcribeAudio = async (req, res, next) => {
  try {
    const audioFile = req.file;
    const { language } = req.body;

    if (!audioFile) {
      return res.status(400).json({ error: 'Validation Error', message: 'audio file is required' });
    }

    logger.info('Transcription request', { file: audioFile.originalname, language });

    const formData = new FormData();
    formData.append('audio', audioFile.buffer, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
    });
    formData.append('language', language || 'pt');

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/transcribe`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 1800000, // 30 min for long recordings
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Transcription');
    }
  } catch (error) {
    logger.error('Error transcribing audio:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/onboarding/upload ────────────────────────────────────

export const onboardingUpload = async (req, res, next) => {
  try {
    const { user_id, source, language } = req.body;
    const files = req.files;

    if (!user_id || !user_id.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'user_id is required' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'at least one audio file is required' });
    }

    logger.info('Onboarding upload', { user_id, source, language, files: files.length });

    const formData = new FormData();
    formData.append('user_id', user_id.trim());
    formData.append('source', source || 'manual');
    formData.append('language', language || 'pt');
    for (const file of files) {
      formData.append('audio', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    }

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/onboarding/upload`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 600000, // 10 min — batch transcription can be slow
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Onboarding Upload');
    }
  } catch (error) {
    logger.error('Error in onboarding upload:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/train/start ──────────────────────────────────────────

export const startTraining = async (req, res, next) => {
  try {
    const { user_id, whatsapp, epochs } = req.body;

    if (!user_id || !user_id.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'user_id is required' });
    }

    logger.info('Start XTTS fine-tune request', {
      user_id,
      has_whatsapp: Boolean(whatsapp),
      epochs: epochs || 10,
    });

    const formData = new FormData();
    formData.append('user_id', user_id.trim());
    if (whatsapp && whatsapp.trim()) formData.append('whatsapp', whatsapp.trim());
    if (epochs) formData.append('epochs', String(epochs));

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/train/start`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 30000,
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Start Training');
    }
  } catch (error) {
    logger.error('Error starting fine-tune training:', error);
    next(error);
  }
};

// ─── GET /api/v1/audio/finetuned-models ─────────────────────────────────────

export const getFinetunedModels = async (req, res, next) => {
  try {
    const pythonResponse = await axios.get(`${AUDIO_SERVER_URL}/finetuned-models`, { timeout: 15000 });
    res.status(200).json(pythonResponse.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') return handlePythonError(error, res, 'List Finetuned Models');
    next(error);
  }
};

// ─── POST /api/v1/audio/generate-finetuned ──────────────────────────────────

export const generateFinetuned = async (req, res, next) => {
  try {
    const { user_id, text, speed } = req.body;

    if (!user_id || !user_id.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'user_id is required' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'text is required' });
    }

    const formData = new FormData();
    formData.append('user_id', user_id.trim());
    formData.append('text', text.trim());
    if (speed !== undefined && speed !== null && `${speed}`.trim()) {
      formData.append('speed', String(speed));
    }

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/generate-finetuned`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 300000,
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Generate Finetuned');
    }
  } catch (error) {
    logger.error('Error generating finetuned speech:', error);
    next(error);
  }
};

// ─── GET /api/v1/audio/train/jobs/:jobId ────────────────────────────────────

export const getTrainingJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!jobId || !jobId.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'jobId is required' });
    }

    try {
      const pythonResponse = await axios.get(`${AUDIO_SERVER_URL}/train/jobs/${encodeURIComponent(jobId)}`, {
        timeout: 15000,
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      if (pythonError.response?.status === 404) {
        return res.status(404).json({ error: 'Not Found', message: pythonError.response.data?.detail });
      }
      return handlePythonError(pythonError, res, 'Get Training Job');
    }
  } catch (error) {
    logger.error('Error getting training job:', error);
    next(error);
  }
};

// ─── POST /api/v1/audio/transcribe-meeting ───────────────────────────────────

export const transcribeMeeting = async (req, res, next) => {
  try {
    const audioFile = req.file;
    const { language, max_speakers } = req.body;

    if (!audioFile) {
      return res.status(400).json({ error: 'Validation Error', message: 'audio file is required' });
    }

    logger.info('Meeting transcription request', {
      file: audioFile.originalname,
      language,
      max_speakers,
    });

    const formData = new FormData();
    formData.append('audio', audioFile.buffer, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
    });
    formData.append('language', language || 'pt');
    formData.append('max_speakers', max_speakers || 8);

    try {
      const pythonResponse = await axios.post(`${AUDIO_SERVER_URL}/transcribe-speakers`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 1800000, // 30 min — diarization is slow
      });
      res.status(200).json(pythonResponse.data);
    } catch (pythonError) {
      return handlePythonError(pythonError, res, 'Meeting Transcription');
    }
  } catch (error) {
    logger.error('Error transcribing meeting:', error);
    next(error);
  }
};

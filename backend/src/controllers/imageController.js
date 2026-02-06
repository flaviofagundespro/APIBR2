import { logger } from "../config/logger.js";
import { config } from "../config/index.js";
import axios from 'axios';

// Python inference server endpoint (can be overridden via env var)
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || config.pythonServerUrl || 'http://localhost:5001';

export const generateImage = async (req, res, next) => {
  try {
    const { prompt, model, size, quality } = req.body;

    logger.info('Image generation request', { prompt, model, size, quality });

    // Basic validation
    if (!prompt) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Prompt is required'
      });
    }

    if (!model) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Model is required'
      });
    }

    // Supported models
    const supportedModels = {
      // Public models (safe defaults for AMD/CPU hosts)
      'runwayml/stable-diffusion-v1-5': 'Stable Diffusion 1.5 (Public)',
      'stabilityai/sdxl-turbo': 'SDXL Turbo (Very fast)',
      'lykon/dreamshaper-8': 'DreamShaper (Artistic)',
      'stable-diffusion-1.5': 'Stable Diffusion 1.5 (short name)',
      'sdxl-turbo': 'SDXL Turbo (short name)',
      'dreamshaper': 'DreamShaper (short name)',

      // Premium models (require authentication/token)
      'stabilityai/stable-diffusion-3.5': 'Stable Diffusion 3.5',
      'stabilityai/stable-diffusion-3.5-large': 'Stable Diffusion 3.5 Large',
      'stable-diffusion-3.5': 'Stable Diffusion 3.5 (short name)',
      'stable-diffusion-3.5-large': 'Stable Diffusion 3.5 Large (short name)',

      // Additional community models
      'prompthero/openjourney': 'OpenJourney (Midjourney style)',
      'Linaqruf/anything-v3.0': 'Anything V3 (Anime)',
      'openjourney': 'OpenJourney (short name)',
      'anything-v3': 'Anything V3 (short name)',

      // Fallback alias
      'FLUX.1-dev': 'Flux model (fallback)'
    };

    if (!supportedModels[model]) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Unsupported model. Supported models: ${Object.keys(supportedModels).join(', ')}`
      });
    }

    // Parse size if provided (e.g. "768x512")
    let width = 512;
    let height = 512;
    if (size) {
      try {
        const sizeParts = size.split('x');
        if (sizeParts.length === 2) {
          width = parseInt(sizeParts[0]);
          height = parseInt(sizeParts[1]);
        }
      } catch (e) {
        logger.warning(`Invalid size format: ${size}, using default 512x512`);
      }
    }

    // Forward request to the Python image service
    try {
      logger.info(`Calling Python image generation server at ${PYTHON_SERVER_URL}...`);
      logger.info(`Request: prompt="${prompt}", model="${model}", size=${width}x${height}`);

      const pythonResponse = await axios.post(`${PYTHON_SERVER_URL}/generate`, {
        prompt,
        model,
        size: `${width}x${height}`,
        steps: req.body.steps ? parseInt(req.body.steps) : 10,
        guidance_scale: req.body.guidance_scale ? parseFloat(req.body.guidance_scale) : 7.5,
        scheduler: req.body.scheduler || 'dpm++',
        device: req.body.device || 'auto',
        width: width,
        height: height
      }, {
        timeout: 600000, // 10 minutes (DirectML can be slow)
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Python server response received', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });

      // Bubble the Python response back to the client
      res.status(200).json(pythonResponse.data);

    } catch (pythonError) {
      logger.error('Python server error:', pythonError.message);

      // If the Python server is down, surface a clear message
      if (pythonError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Image generation service is not available. Please ensure the Python server is running on port 5001.',
          details: 'Start the Python server with: python image_server.py'
        });
      }

      // For any other Python-side error, expose payload
      return res.status(500).json({
        error: 'Image Generation Error',
        message: pythonError.response?.data?.error || pythonError.message
      });
    }

  } catch (error) {
    logger.error("Error generating image:", error);
    next(error);
  }
};

export const getModels = async (req, res, next) => {
  try {
    const supportedModels = {
      // Public models (safe defaults for AMD/CPU hosts)
      'runwayml/stable-diffusion-v1-5': 'Stable Diffusion 1.5 (Public)',
      'stabilityai/sdxl-turbo': 'SDXL Turbo (Very fast)',
      'lykon/dreamshaper-8': 'DreamShaper (Artistic)',
      'stable-diffusion-1.5': 'Stable Diffusion 1.5 (short name)',
      'sdxl-turbo': 'SDXL Turbo (short name)',
      'dreamshaper': 'DreamShaper (short name)',

      // Premium models (require authentication/token)
      'stabilityai/stable-diffusion-3.5': 'Stable Diffusion 3.5',
      'stabilityai/stable-diffusion-3.5-large': 'Stable Diffusion 3.5 Large',
      'stable-diffusion-3.5': 'Stable Diffusion 3.5 (short name)',
      'stable-diffusion-3.5-large': 'Stable Diffusion 3.5 Large (short name)',

      // Additional community models
      'prompthero/openjourney': 'OpenJourney (Midjourney style)',
      'Linaqruf/anything-v3.0': 'Anything V3 (Anime)',
      'openjourney': 'OpenJourney (short name)',
      'anything-v3': 'Anything V3 (short name)',

      // Fallback alias
      'FLUX.1-dev': 'Flux model (fallback)'
    };

    res.status(200).json({ models: supportedModels });
  } catch (error) {
    logger.error("Error fetching models:", error);
    next(error);
  }
};

export const editImage = async (req, res, next) => {
  try {
    const { image_url, prompt, model } = req.body;

    logger.info('Image editing request', { image_url, prompt, model });

    // Basic validation
    if (!image_url || !prompt) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Image URL and prompt are required'
      });
    }

    // Forward request to the Python editing endpoint
    try {
      logger.info('Calling Python image editing server...');

      const pythonResponse = await axios.post(`${PYTHON_SERVER_URL}/edit`, {
        image_url,
        prompt,
        model: model || 'stabilityai/stable-diffusion-3.5-large'
      }, {
        timeout: 300000, // 5 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Python server response received', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });

      // Bubble the Python response back to the client
      res.status(200).json(pythonResponse.data);

    } catch (pythonError) {
      logger.error('Python server error:', pythonError.message);

      if (pythonError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Image editing service is not available. Please ensure the Python server is running on port 5001.'
        });
      }

      return res.status(500).json({
        error: 'Image Editing Error',
        message: pythonError.response?.data?.error || pythonError.message
      });
    }

  } catch (error) {
    logger.error("Error editing image:", error);
    next(error);
  }
};

export const upscaleImage = async (req, res, next) => {
  try {
    const { image_url, model } = req.body;

    logger.info('Image upscale request', { image_url, model });

    // Basic validation
    if (!image_url) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Image URL is required'
      });
    }

    // Forward request to the Python upscale endpoint
    try {
      logger.info('Calling Python image upscale server...');

      const pythonResponse = await axios.post(`${PYTHON_SERVER_URL}/upscale`, {
        image_url,
        model: model || 'stabilityai/stable-diffusion-3.5-large'
      }, {
        timeout: 300000, // 5 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Python server response received', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });

      // Bubble the Python response back to the client
      res.status(200).json(pythonResponse.data);

    } catch (pythonError) {
      logger.error('Python server error:', pythonError.message);

      if (pythonError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Image upscale service is not available. Please ensure the Python server is running on port 5001.'
        });
      }

      return res.status(500).json({
        error: 'Image Upscale Error',
        message: pythonError.response?.data?.error || pythonError.message
      });
    }

  } catch (error) {
    logger.error("Error upscaling image:", error);
    next(error);
  }
};


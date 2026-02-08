import { Router } from 'express';
import axios from 'axios';
import { logger } from '../config/logger.js';

const router = Router();

// Connect to the Magic Prompt & Chat Server
// Default to 5003 where text_generation_server.py is running
const CHAT_SERVER_URL = process.env.CHAT_SERVER_URL || 'http://localhost:5003';

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: Chat with the local AI
 *     tags: [AI Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, system, assistant]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', async (req, res) => {
    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Proxy to Python Service
        const response = await axios.post(`${CHAT_SERVER_URL}/chat`, {
            messages,
            model: model || "qwen2.5:3b"
        });

        res.json(response.data);

    } catch (error) {
        logger.error('Chat endpoint error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'AI Chat Service Unavailable',
                details: 'The local AI server (port 5003) appears to be down.'
            });
        }

        res.status(500).json({
            error: 'Failed to process chat request',
            details: error.response?.data?.detail || error.message
        });
    }
});

/**
 * @swagger
 * /api/v1/chat/models:
 *   get:
 *     summary: List available AI models
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: List of models
 */
router.get('/models', async (req, res) => {
    try {
        const response = await axios.get(`${CHAT_SERVER_URL}/models`);
        res.json(response.data);
    } catch (error) {
        logger.error('Chat models endpoint error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch models',
            details: error.message
        });
    }
});

export { router as chatRoutes };

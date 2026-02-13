import { Router } from 'express';
import { AiosController } from '../controllers/aiosController.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';

const router = Router();
const aiosController = new AiosController();

/**
 * @swagger
 * /api/aios/agent:
 *   post:
 *     summary: Send message to AIOS agent via WhatsApp
 *     description: |
 *       Receives a message from n8n (originating from WhatsApp via Evolution API),
 *       processes it asynchronously using the specified AIOS agent (via claude --print),
 *       and sends the response directly back to the sender via the enviar-msg-whatsapp skill.
 *       Returns 202 immediately — fire & forget pattern.
 *     tags: [AIOS]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - from
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content from WhatsApp
 *                 example: "@dev como implemento autenticação JWT?"
 *               from:
 *                 type: string
 *                 description: Sender's WhatsApp number (international format, no +)
 *                 example: "5527992618345"
 *               agent:
 *                 type: string
 *                 description: Agent to use (dev, qa, architect, pm, sm, analyst). Defaults to dev.
 *                 example: "dev"
 *               session_id:
 *                 type: string
 *                 description: Session ID for conversation history. Defaults to `from` value.
 *                 example: "5527992618345"
 *     responses:
 *       202:
 *         description: Message accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "processing"
 *                 session_id:
 *                   type: string
 *                 agent:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/agent', apiKeyAuth, (req, res, next) => {
  aiosController.handleMessage(req, res, next);
});

export { router as aiosRoutes };

import { logger } from '../config/logger.js';
import { AiosService } from '../services/aiosService.js';
import { AiosRouter } from '../services/aiosRouter.js';

export class AiosController {
  constructor() {
    this.aiosService = new AiosService();
    this.aiosRouter = new AiosRouter();
  }

  async handleMessage(req, res, next) {
    try {
      const { message, from, agent, session_id } = req.body;

      // Validate required fields
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Field "message" is required and must be a non-empty string',
        });
      }

      if (!from || typeof from !== 'string' || !from.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Field "from" is required (WhatsApp number in international format)',
        });
      }

      const resolvedSessionId = session_id || from;

      logger.info('AIOS message received', {
        from,
        session_id: resolvedSessionId,
        messageLength: message.length,
      });

      // Respond immediately — fire & forget
      res.status(202).json({
        status: 'processing',
        session_id: resolvedSessionId,
      });

      // Route and process async (after response is sent)
      setImmediate(async () => {
        try {
          const { agent: resolvedAgent, method } = await this.aiosRouter.route(message.trim(), agent);

          logger.info('AIOS routing resolved', { agent: resolvedAgent, method, session_id: resolvedSessionId });

          await this.aiosService.processMessage({
            message: message.trim(),
            from: from.trim(),
            agent: resolvedAgent,
            sessionId: resolvedSessionId,
          });
        } catch (err) {
          logger.error('AIOS async processing error', { error: err.message, from, session_id: resolvedSessionId });
        }
      });

    } catch (error) {
      logger.error('AIOS controller error:', error);
      next(error);
    }
  }
}

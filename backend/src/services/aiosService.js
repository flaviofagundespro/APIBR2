import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import axios from 'axios';
import { CacheService } from '../infrastructure/cacheService.js';
import { logger } from '../config/logger.js';
import { AGENT_PROMPTS } from './aiosAgentPrompts.js';
import { AGENT_SIGNATURE } from './aiosRouter.js';

const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH || '/usr/local/bin/claude';
const AIOS_PROJECT_PATH = process.env.AIOS_PROJECT_PATH || '/home/flaviofagundes/aios';
const EVOLUTION_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const SESSION_TTL = 86400; // 24h
const MAX_HISTORY = 20;

export class AiosService {
  constructor() {
    this.cache = CacheService.getInstance();
  }

  async processMessage({ message, from, agent, sessionId }) {
    // Load session history
    const history = await this._getHistory(sessionId);

    // Add user message to history
    history.push({ role: 'user', content: message, timestamp: Date.now() });

    // Build prompt
    const prompt = this._buildPrompt({ agent, history, message });

    // Invoke claude --print and capture response
    const response = await this._invokeClaudeCli(prompt, sessionId);

    if (response) {
      // Add assistant response to history
      history.push({ role: 'assistant', content: response, timestamp: Date.now() });

      // Prefix response with agent signature
      const signature = AGENT_SIGNATURE[agent] || `🤖 *${agent}*`;
      const formattedResponse = `${signature}:\n\n${response}`;

      // Send response via Evolution API
      await this._sendWhatsApp(from, formattedResponse);
    }

    // Save updated history
    await this.cache.set(`aios:session:${sessionId}`, history.slice(-MAX_HISTORY), SESSION_TTL);
  }

  _buildPrompt({ agent, history, message }) {
    const persona = AGENT_PROMPTS[agent] || AGENT_PROMPTS['dev'];

    const historyText = history.length > 1
      ? history
          .slice(0, -1)
          .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
          .join('\n')
      : '';

    const historySection = historyText
      ? `\n\nHistórico da conversa:\n${historyText}\n`
      : '';

    return [
      persona,
      historySection,
      `\nMensagem recebida:`,
      message,
    ].join('\n');
  }

  async _invokeClaudeCli(prompt, sessionId) {
    const tmpFile = `/tmp/aios_prompt_${sessionId}_${Date.now()}.txt`;

    try {
      await writeFile(tmpFile, prompt, 'utf8');
    } catch (err) {
      logger.error('AIOS: failed to write prompt file', { error: err.message, sessionId });
      return null;
    }

    logger.info('AIOS: invoking claude CLI', { sessionId });

    return new Promise((resolve) => {
      const claudeCmd = `${CLAUDE_CLI} --print < "${tmpFile}"`;

      exec(claudeCmd, {
        cwd: AIOS_PROJECT_PATH,
        shell: '/bin/bash',
        timeout: 120000,
        env: { ...process.env, HOME: process.env.HOME || '/home/flaviofagundes' },
      }, async (err, stdout, stderr) => {
        await unlink(tmpFile).catch(() => {});

        if (err) {
          logger.error('AIOS: claude CLI error', { error: err.message, sessionId, stderr: stderr?.slice(0, 200) });
          resolve(null);
        } else {
          const response = stdout?.trim();
          logger.info('AIOS: claude CLI completed', { sessionId, outputLength: response?.length });
          resolve(response || null);
        }
      });
    });
  }

  async _sendWhatsApp(to, text) {
    if (!EVOLUTION_BASE_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
      logger.error('AIOS: Evolution API env vars not configured');
      return;
    }

    try {
      const url = `${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
      await axios.post(url, {
        number: to,
        text,
        options: { delay: 1200, presence: 'composing' },
      }, {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      logger.info('AIOS: WhatsApp message sent', { to });
    } catch (err) {
      logger.error('AIOS: failed to send WhatsApp', {
        error: err.message,
        status: err.response?.status,
        to,
      });
    }
  }

  async _getHistory(sessionId) {
    const history = await this.cache.get(`aios:session:${sessionId}`);
    return Array.isArray(history) ? history : [];
  }
}

import { exec } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import axios from 'axios';
import { CacheService } from '../infrastructure/cacheService.js';
import { logger } from '../config/logger.js';
import { AGENT_PROMPTS } from './aiosAgentPrompts.js';
import { AGENT_SIGNATURE } from './aiosRouter.js';

const AIOS_LLM_BACKEND = (process.env.AIOS_LLM_BACKEND || 'codex').toLowerCase();
const CODEX_CLI = process.env.CODEX_CLI_PATH || 'codex';
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
    const history = await this._getHistory(sessionId);

    history.push({ role: 'user', content: message, timestamp: Date.now() });

    const prompt = this._buildPrompt({ agent, history, message });

    const response = await this._invokeAssistant(prompt, sessionId);

    if (response) {
      history.push({ role: 'assistant', content: response, timestamp: Date.now() });

      const signature = AGENT_SIGNATURE[agent] || `🤖 *${agent}*`;
      const formattedResponse = `${signature}:\n\n${response}`;

      await this._sendWhatsApp(from, formattedResponse);
    }

    await this.cache.set(`aios:session:${sessionId}`, history.slice(-MAX_HISTORY), SESSION_TTL);
  }

  _buildPrompt({ agent, history, message }) {
    const persona = AGENT_PROMPTS[agent] || AGENT_PROMPTS['aios-master'] || AGENT_PROMPTS['dev'];

    const historyText = history.length > 1
      ? history
          .slice(0, -1)
          .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
          .join('\n')
      : '';

    const historySection = historyText
      ? `\n\nHistórico da conversa:\n${historyText}\n`
      : '';

    return [
      persona,
      historySection,
      '\nMensagem recebida:',
      message,
      '\nInstrução: responda em português do Brasil, de forma objetiva e acionável.',
    ].join('\n');
  }

  async _invokeAssistant(prompt, sessionId) {
    if (AIOS_LLM_BACKEND === 'claude') {
      return this._invokeClaudeCli(prompt, sessionId);
    }

    const codexResponse = await this._invokeCodexCli(prompt, sessionId);
    if (codexResponse) {
      return codexResponse;
    }

    logger.warn('AIOS: codex failed, falling back to claude CLI', { sessionId });
    return this._invokeClaudeCli(prompt, sessionId);
  }

  async _invokeCodexCli(prompt, sessionId) {
    const tmpPromptFile = `/tmp/aios_prompt_${sessionId}_${Date.now()}.txt`;
    const tmpOutFile = `/tmp/aios_codex_out_${sessionId}_${Date.now()}.txt`;

    try {
      await writeFile(tmpPromptFile, prompt, 'utf8');
    } catch (err) {
      logger.error('AIOS: failed to write codex prompt file', { error: err.message, sessionId });
      return null;
    }

    logger.info('AIOS: invoking codex CLI', { sessionId, backend: AIOS_LLM_BACKEND });

    return new Promise((resolve) => {
      const codexCmd = `${CODEX_CLI} exec --skip-git-repo-check -C "${AIOS_PROJECT_PATH}" --output-last-message "${tmpOutFile}" - < "${tmpPromptFile}"`;

      exec(codexCmd, {
        cwd: AIOS_PROJECT_PATH,
        shell: '/bin/bash',
        timeout: 180000,
        env: {
          ...process.env,
          HOME: process.env.HOME || '/home/flaviofagundes',
        },
      }, async (err, _stdout, stderr) => {
        await unlink(tmpPromptFile).catch(() => {});

        if (err) {
          logger.error('AIOS: codex CLI error', {
            error: err.message,
            sessionId,
            stderr: stderr?.slice(0, 300),
          });
          await unlink(tmpOutFile).catch(() => {});
          resolve(null);
          return;
        }

        try {
          const content = await readFile(tmpOutFile, 'utf8');
          const response = content?.trim() || null;
          logger.info('AIOS: codex CLI completed', { sessionId, outputLength: response?.length || 0 });
          await unlink(tmpOutFile).catch(() => {});
          resolve(response);
        } catch (readErr) {
          logger.error('AIOS: failed reading codex output file', { error: readErr.message, sessionId });
          await unlink(tmpOutFile).catch(() => {});
          resolve(null);
        }
      });
    });
  }

  async _invokeClaudeCli(prompt, sessionId) {
    const tmpFile = `/tmp/aios_prompt_${sessionId}_${Date.now()}.txt`;

    try {
      await writeFile(tmpFile, prompt, 'utf8');
    } catch (err) {
      logger.error('AIOS: failed to write prompt file', { error: err.message, sessionId });
      return null;
    }

    logger.info('AIOS: invoking claude CLI', { sessionId, backend: AIOS_LLM_BACKEND });

    return new Promise((resolve) => {
      const claudeCmd = `${CLAUDE_CLI} --print < "${tmpFile}"`;

      exec(claudeCmd, {
        cwd: AIOS_PROJECT_PATH,
        shell: '/bin/bash',
        timeout: 120000,
        env: { ...process.env, HOME: process.env.HOME || '/home/flaviofagundes', CLAUDECODE: undefined },
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

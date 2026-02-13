import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger.js';

const VALID_AGENTS = ['dev', 'qa', 'architect', 'pm', 'sm', 'analyst'];

const AGENT_PREFIXES = {
  '@dev': 'dev', '@qa': 'qa', '@architect': 'architect',
  '@pm': 'pm', '@sm': 'sm', '@analyst': 'analyst',
};

const AGENT_NAMES = {
  'dex': 'dev', 'quinn': 'qa', 'alex': 'architect',
  'morgan': 'pm', 'river': 'sm', 'sam': 'analyst',
};

export const AGENT_SIGNATURE = {
  dev: '👨‍💻 *Dex (Dev)*',
  qa: '🔍 *Quinn (QA)*',
  architect: '🏛️ *Alex (Architect)*',
  pm: '📋 *Morgan (PM)*',
  sm: '🔄 *River (SM)*',
  analyst: '📊 *Sam (Analyst)*',
};

const CLASSIFICATION_PROMPT = `Classifique a intenção desta mensagem e responda com APENAS UMA PALAVRA:
dev | qa | architect | pm | sm | analyst

Regras:
- dev: código, implementação, bug, endpoint, função, banco de dados, programação
- qa: teste, qualidade, review, bug report, validação, cobertura
- architect: arquitetura, padrão, design, escalabilidade, decisão técnica, sistema
- pm: produto, feature, requisito, roadmap, prioridade, negócio
- sm: história, sprint, processo, estimativa, retrospectiva, ágil
- analyst: dados, pesquisa, análise, relatório, benchmark, métrica

Mensagem: "{message}"

Resposta (apenas uma palavra):`;

export class AiosRouter {
  constructor() {
    this.client = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  async route(message, agentOverride = null) {
    // 1. Payload override tem prioridade máxima
    if (agentOverride && VALID_AGENTS.includes(agentOverride)) {
      logger.info('AIOS Router: override', { agent: agentOverride });
      return { agent: agentOverride, method: 'override' };
    }

    // 2. Prefix detection (@dev, @qa...)
    const byPrefix = this._detectByPrefix(message);
    if (byPrefix) {
      logger.info('AIOS Router: prefix detection', { agent: byPrefix });
      return { agent: byPrefix, method: 'prefix' };
    }

    // 3. Name detection (Dex,, Quinn,...)
    const byName = this._detectByName(message);
    if (byName) {
      logger.info('AIOS Router: name detection', { agent: byName });
      return { agent: byName, method: 'name' };
    }

    // 4. Auto-route via Claude classification
    const byIntent = await this._detectByIntent(message);
    if (byIntent) {
      logger.info('AIOS Router: intent classification', { agent: byIntent });
      return { agent: byIntent, method: 'auto' };
    }

    // 5. Fallback
    logger.info('AIOS Router: fallback to dev');
    return { agent: 'dev', method: 'fallback' };
  }

  _detectByPrefix(message) {
    const lower = message.toLowerCase();
    for (const [prefix, agent] of Object.entries(AGENT_PREFIXES)) {
      if (lower.includes(prefix)) return agent;
    }
    return null;
  }

  _detectByName(message) {
    const lower = message.toLowerCase().trim();
    for (const [name, agent] of Object.entries(AGENT_NAMES)) {
      // Matches "Dex, " or "dex," at the start of the message
      if (lower.startsWith(`${name},`) || lower.startsWith(`${name} `)) {
        return agent;
      }
    }
    return null;
  }

  async _detectByIntent(message) {
    if (!this.client) {
      logger.warn('AIOS Router: Anthropic client not configured, skipping intent detection');
      return null;
    }

    try {
      const prompt = CLASSIFICATION_PROMPT.replace('{message}', message.slice(0, 300));

      const result = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = result.content[0]?.text?.trim().toLowerCase();
      return VALID_AGENTS.includes(raw) ? raw : null;
    } catch (err) {
      logger.error('AIOS Router: intent classification failed', { error: err.message });
      return null;
    }
  }
}

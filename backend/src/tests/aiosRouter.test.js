import { jest } from '@jest/globals';

// Mock Anthropic SDK
const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

// Mock logger
jest.unstable_mockModule('../config/logger.js', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { AiosRouter } = await import('../services/aiosRouter.js');

describe('AiosRouter', () => {
  let router;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    router = new AiosRouter();
    mockCreate.mockReset();
  });

  afterEach(() => jest.clearAllMocks());

  describe('Override (payload agent)', () => {
    test('uses override when valid agent provided', async () => {
      const result = await router.route('Oi, preciso de ajuda', 'qa');
      expect(result).toEqual({ agent: 'qa', method: 'override' });
    });

    test('ignores invalid override and continues routing', async () => {
      mockCreate.mockResolvedValue({ content: [{ text: 'dev' }] });
      const result = await router.route('@dev faça isso', 'invalid-agent');
      expect(result.agent).toBe('dev');
      expect(result.method).not.toBe('override');
    });
  });

  describe('Prefix Detection (@agente)', () => {
    test.each([
      ['@dev me ajuda com código', 'dev'],
      ['@qa preciso de testes', 'qa'],
      ['@architect design do sistema', 'architect'],
      ['@pm nova feature', 'pm'],
      ['@sm criar história', 'sm'],
      ['@analyst análise de dados', 'analyst'],
    ])('detecta "%s" → %s', async (message, expected) => {
      const result = await router.route(message);
      expect(result).toEqual({ agent: expected, method: 'prefix' });
    });
  });

  describe('Name Detection (Nome, ...)', () => {
    test.each([
      ['Dex, como faço um endpoint?', 'dev'],
      ['Quinn, preciso de testes', 'qa'],
      ['Alex, arquitetura do sistema', 'architect'],
      ['Morgan, nova feature', 'pm'],
      ['River, criar sprint', 'sm'],
      ['Sam, análise de métricas', 'analyst'],
    ])('detecta "%s" → %s', async (message, expected) => {
      const result = await router.route(message);
      expect(result).toEqual({ agent: expected, method: 'name' });
    });

    test('é case insensitive', async () => {
      const result = await router.route('dex, como implemento isso?');
      expect(result).toEqual({ agent: 'dev', method: 'name' });
    });
  });

  describe('Auto-routing via Claude', () => {
    test('usa classificação do Claude quando não há prefix/name', async () => {
      mockCreate.mockResolvedValue({ content: [{ text: 'architect' }] });
      const result = await router.route('Preciso de um diagrama de sistema');
      expect(result).toEqual({ agent: 'architect', method: 'auto' });
    });

    test('fallback para dev se Claude retornar valor inválido', async () => {
      mockCreate.mockResolvedValue({ content: [{ text: 'invalido' }] });
      const result = await router.route('mensagem qualquer');
      expect(result).toEqual({ agent: 'dev', method: 'fallback' });
    });

    test('fallback para dev se Claude lançar erro', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));
      const result = await router.route('mensagem qualquer');
      expect(result).toEqual({ agent: 'dev', method: 'fallback' });
    });
  });

  describe('Fallback', () => {
    test('usa dev quando Anthropic não configurado', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const routerNoKey = new AiosRouter();
      const result = await routerNoKey.route('mensagem sem prefix nem nome');
      expect(result.agent).toBe('dev');
      expect(result.method).toBe('fallback');
    });
  });
});

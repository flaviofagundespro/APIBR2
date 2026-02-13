import { jest } from '@jest/globals';

// Mock child_process
const mockExec = jest.fn();
jest.unstable_mockModule('child_process', () => ({
  exec: mockExec,
}));

// Mock CacheService
const mockGet = jest.fn();
const mockSet = jest.fn();
jest.unstable_mockModule('../infrastructure/cacheService.js', () => ({
  CacheService: {
    getInstance: () => ({ get: mockGet, set: mockSet }),
  },
}));

// Mock logger
jest.unstable_mockModule('../config/logger.js', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { AiosController } = await import('../controllers/aiosController.js');
const { AiosService } = await import('../services/aiosService.js');

describe('AiosController', () => {
  let controller;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    controller = new AiosController();
    mockNext = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(true);
    mockExec.mockImplementation((cmd, opts, cb) => {
      if (cb) cb(null, '', '');
      else opts(null, '', '');
    });
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 400 when message is missing', async () => {
    mockReq = { body: { from: '5527999999999' } };
    await controller.handleMessage(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation Error' })
    );
  });

  test('returns 400 when from is missing', async () => {
    mockReq = { body: { message: 'Olá' } };
    await controller.handleMessage(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test('returns 202 with valid payload', async () => {
    mockReq = { body: { message: 'Como faço JWT?', from: '5527999999999', agent: 'dev' } };
    await controller.handleMessage(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(202);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing', agent: 'dev' })
    );
  });

  test('defaults to agent=dev when agent is invalid', async () => {
    mockReq = { body: { message: 'Olá', from: '5527999999999', agent: 'invalid-agent' } };
    await controller.handleMessage(mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ agent: 'dev' })
    );
  });

  test('uses from as session_id when session_id not provided', async () => {
    mockReq = { body: { message: 'Olá', from: '5527999999999' } };
    await controller.handleMessage(mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: '5527999999999' })
    );
  });
});

describe('AiosService', () => {
  let service;

  beforeEach(() => {
    service = new AiosService();
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(true);
    // Mock exec: first call (write prompt), second call (claude --print)
    mockExec
      .mockImplementationOnce((cmd, opts, cb) => cb(null, '', ''))
      .mockImplementationOnce((cmd, opts, cb) => cb(null, 'resposta mock', ''))
      .mockImplementation((cmd, cb) => { if (cb) cb(null, '', ''); });
  });

  afterEach(() => jest.clearAllMocks());

  test('loads empty history for new session', async () => {
    mockGet.mockResolvedValue(null);
    await service.processMessage({ message: 'Oi', from: '5511999', agent: 'dev', sessionId: 'new-session' });
    expect(mockGet).toHaveBeenCalledWith('aios:session:new-session');
  });

  test('loads existing history from Redis', async () => {
    const existingHistory = [{ role: 'user', content: 'msg anterior', timestamp: Date.now() }];
    mockGet.mockResolvedValue(existingHistory);
    await service.processMessage({ message: 'Nova msg', from: '5511999', agent: 'qa', sessionId: 'existing-session' });
    expect(mockSet).toHaveBeenCalledWith(
      'aios:session:existing-session',
      expect.any(Array),
      86400
    );
  });

  test('prompt includes agent persona and from number', () => {
    const prompt = service._buildPrompt({
      agent: 'dev',
      history: [{ role: 'user', content: 'teste', timestamp: Date.now() }],
      from: '5527999999999',
      message: 'teste',
    });
    expect(prompt).toContain('5527999999999');
    expect(prompt).toContain('enviar-msg-whatsapp');
    expect(prompt).toContain('Dex');
  });
});

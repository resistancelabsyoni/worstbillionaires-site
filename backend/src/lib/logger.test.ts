import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should log errors with structured format', () => {
    const error = new Error('Test error');
    const context = {
      path: '/api/vote',
      method: 'POST',
      clientId: 'test-client'
    };

    logger.error(error, context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"error"')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test error"')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"path":"/api/vote"')
    );
  });

  it('should include timestamp in ISO format', () => {
    const error = new Error('Test');
    logger.error(error, {});

    const logCall = consoleErrorSpy.mock.calls[0][0] as string;
    const logData = JSON.parse(logCall);

    expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include stack trace when available', () => {
    const error = new Error('Test with stack');
    logger.error(error, {});

    const logCall = consoleErrorSpy.mock.calls[0][0];
    expect(logCall).toContain('"stack":');
  });
});

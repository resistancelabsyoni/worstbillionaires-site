import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 1); // 3 requests per second for testing
  });

  it('should allow requests under limit', () => {
    expect(limiter.check('client1')).toBe(true);
    expect(limiter.check('client1')).toBe(true);
    expect(limiter.check('client1')).toBe(true);
  });

  it('should block requests over limit', () => {
    limiter.check('client1');
    limiter.check('client1');
    limiter.check('client1');
    expect(limiter.check('client1')).toBe(false);
  });

  it('should track different clients separately', () => {
    limiter.check('client1');
    limiter.check('client1');
    limiter.check('client1');

    // client2 should still be allowed
    expect(limiter.check('client2')).toBe(true);
  });

  it('should reset after time window', async () => {
    limiter.check('client1');
    limiter.check('client1');
    limiter.check('client1');

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should be allowed again
    expect(limiter.check('client1')).toBe(true);
  });

  it('should cleanup old entries', () => {
    limiter.check('client1');
    limiter.check('client2');

    // Wait for entries to expire
    setTimeout(() => {
      limiter.cleanup();
      expect(limiter['requests'].size).toBe(0);
    }, 1100);
  });
});

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

describe('RateLimiter cleanup', () => {
  it('should automatically clean up stale entries during check()', () => {
    const limiter = new RateLimiter(1000, 1); // 1 second window, high limit

    // Add some requests that will become stale
    expect(limiter.check('client1')).toBe(true);
    expect(limiter.check('client2')).toBe(true);

    // Wait for entries to become stale
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    return sleep(1100).then(() => {
      // Make 100 more requests to trigger cleanup
      // At this point, client1 and client2 are stale
      for (let i = 3; i <= 102; i++) {
        limiter.check(`client${i}`);
      }

      // After 100 more checks, cleanup should have been triggered (at check #102)
      // and stale client1 and client2 should be removed
      expect(limiter.getMapSize()).toBeLessThan(102); // Should be ~100, not 102
    });
  });

  it('should clean up on every 100th request', () => {
    const limiter = new RateLimiter(1000, 60);

    // Make 100 requests to trigger cleanup
    for (let i = 0; i < 100; i++) {
      limiter.check(`client${i}`);
    }

    // Cleanup should have been called at least once
    // Verify this through exposed counter or spy
    expect(limiter.getCleanupCount()).toBeGreaterThan(0);
  });
});

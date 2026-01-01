/**
 * In-Memory Rate Limiter for Cloudflare Workers
 *
 * LIMITATIONS:
 * - State is NOT shared between Worker instances
 * - Rate limits reset when Worker instance is recycled (seconds to minutes)
 * - Effective only within a single Worker instance's lifetime
 * - Not suitable for strict rate limiting in high-traffic production
 *
 * PRODUCTION CONSIDERATIONS:
 * For distributed rate limiting across Worker instances, consider:
 * 1. Cloudflare Durable Objects - Guaranteed single instance per key
 * 2. Cloudflare KV with TTL - Distributed state with eventual consistency
 * 3. Cloudflare Rate Limiting API - Native platform feature
 *
 * CURRENT USE CASE:
 * This implementation provides basic protection against:
 * - Accidental repeated clicks by individual users
 * - Simple abuse attempts from single IP addresses
 * - Reducing load on database from rapid-fire requests
 *
 * For the Worst Billionaire Tournament use case (low to medium traffic,
 * non-financial application), this provides adequate protection without
 * the complexity and cost of distributed rate limiting.
 *
 * @see https://developers.cloudflare.com/durable-objects/
 * @see https://developers.cloudflare.com/kv/
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly window: number; // seconds
  private checkCount = 0; // Track number of checks for periodic cleanup

  constructor(limit: number, window: number) {
    this.limit = limit;
    this.window = window;
  }

  /**
   * Check if client has exceeded rate limit
   * @param clientId - Unique identifier (IP address, email hash, etc.)
   * @returns true if request is allowed, false if rate limited
   */
  check(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.window * 1000;

    // Periodic cleanup: every 100 checks
    this.checkCount++;
    if (this.checkCount % 100 === 0) {
      this.cleanup();
    }

    // Get existing requests for this client
    let clientRequests = this.requests.get(clientId) || [];

    // Filter out requests outside the time window
    clientRequests = clientRequests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (clientRequests.length >= this.limit) {
      return false;
    }

    // Add current request timestamp
    clientRequests.push(now);
    this.requests.set(clientId, clientRequests);

    return true;
  }

  /**
   * Clean up old entries (call periodically to prevent memory leaks)
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.window * 1000;

    for (const [clientId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((t) => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, filtered);
      }
    }
  }

  // Expose for testing
  getMapSize(): number {
    return this.requests.size;
  }

  getCleanupCount(): number {
    return Math.floor(this.checkCount / 100);
  }
}

// Singleton instances for different endpoints
export const votesLimiter = new RateLimiter(5, 60); // 5 votes per minute
export const registerLimiter = new RateLimiter(2, 60); // 2 registrations per minute
export const tournamentLimiter = new RateLimiter(20, 60); // 20 tournament queries per minute

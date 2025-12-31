/**
 * Simple rate limiter using Cloudflare Workers KV (if available)
 * Falls back to in-memory Map for development
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number; // seconds

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
}

// Singleton instances for different endpoints
export const votesLimiter = new RateLimiter(5, 60); // 5 votes per minute
export const registerLimiter = new RateLimiter(2, 60); // 2 registrations per minute
export const tournamentLimiter = new RateLimiter(20, 60); // 20 tournament queries per minute

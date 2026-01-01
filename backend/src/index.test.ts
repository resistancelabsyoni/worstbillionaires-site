import { describe, it, expect } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from './index';

describe('/register endpoint', () => {
  it('should reject missing email', async () => {
    const request = new Request('http://localhost/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.1',
      },
      body: JSON.stringify({ name: 'Test' }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid email format', async () => {
    const request = new Request('http://localhost/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.2',
      },
      body: JSON.stringify({ email: 'notanemail' }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid ZIP code', async () => {
    const request = new Request('http://localhost/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.3',
      },
      body: JSON.stringify({ email: 'test@example.com', zip: 'ABCDE' }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Invalid input');
  });

  it('should accept valid registration', async () => {
    const request = new Request('http://localhost/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.4',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        zip: '12345',
        optIn: true,
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { success: boolean };
    expect(data.success).toBe(true);
  });
});

describe('/votes endpoint validation', () => {
  it('should reject invalid matchup ID format', async () => {
    const request = new Request('http://localhost/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.1.0.1',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        votes: { invalid: 'elon_musk' },
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Invalid input');
  });

  it('should reject votes for non-existent matchup', async () => {
    const request = new Request('http://localhost/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.1.0.2',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        votes: { r5m1: 'elon_musk' },
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { invalid: string[]; votesSubmitted: number };
    expect(data.invalid).toContain('r5m1');
    expect(data.votesSubmitted).toBe(0);
  });

  it('should reject votes for wrong candidate in matchup', async () => {
    const request = new Request('http://localhost/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.1.0.3',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        votes: { r1m1: 'jeff_bezos' }, // jeff_bezos is in r1m2, not r1m1
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { invalid: string[]; votesSubmitted: number };
    expect(data.invalid).toContain('r1m1:jeff_bezos');
    expect(data.votesSubmitted).toBe(0);
  });

  it('should accept valid votes', async () => {
    // Use unique email to avoid UNIQUE constraint conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const request = new Request('http://localhost/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.1.0.4',
      },
      body: JSON.stringify({
        email: uniqueEmail,
        votes: {
          r1m1: 'elon_musk',
          r1m2: 'jeff_bezos',
        },
      }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { success: boolean; votesSubmitted: number };
    expect(data.success).toBe(true);
    expect(data.votesSubmitted).toBe(2);
  });
});

describe('CORS configuration', () => {
  it('should reject requests from unauthorized origins', async () => {
    const request = new Request('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com' },
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).not.toBe('https://evil.com');
  });

  it('should allow requests from worstbillionaires.com', async () => {
    const request = new Request('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'https://worstbillionaires.com' },
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).toBe('https://worstbillionaires.com');
  });

  it('should allow requests from localhost for development', async () => {
    const request = new Request('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).toBe('http://localhost:5173');
  });
});

describe('Rate limiting', () => {
  it('should enforce rate limit on /votes endpoint', async () => {
    // Send 6 requests (limit is 5 per minute)
    const requests = Array.from({ length: 6 }, (_, i) => {
      const request = new Request('http://localhost/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '1.2.3.4',
        },
        body: JSON.stringify({
          email: `test${i}@example.com`,
          votes: { r1m1: 'elon_musk' },
        }),
      });

      const ctx = createExecutionContext();
      return Promise.resolve(worker.fetch(request, env, ctx)).then(async (response: Response) => {
        await waitOnExecutionContext(ctx);
        return response;
      });
    });

    const responses = await Promise.all(requests);
    const statuses = responses.map((r: Response) => r.status);

    // First 5 should succeed or fail validation (200/400), last should be rate limited (429)
    expect(statuses[5]).toBe(429);
  });

  it('should enforce rate limit on /register endpoint', async () => {
    // Send 3 requests (limit is 2 per minute)
    const requests = Array.from({ length: 3 }, (_, i) => {
      const request = new Request('http://localhost/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '1.2.3.5',
        },
        body: JSON.stringify({
          email: `test${i}@example.com`,
        }),
      });

      const ctx = createExecutionContext();
      return Promise.resolve(worker.fetch(request, env, ctx)).then(async (response: Response) => {
        await waitOnExecutionContext(ctx);
        return response;
      });
    });

    const responses = await Promise.all(requests);
    const statuses = responses.map((r: Response) => r.status);

    // First 2 should succeed, last should be rate limited
    expect(statuses[2]).toBe(429);
  });
});

describe('Error handling', () => {
  it('should return structured error for validation failures', async () => {
    const request = new Request('http://localhost/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.2.0.1',
      },
      body: JSON.stringify({ email: 'invalid' }),
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string; code: string; details: unknown[] };
    expect(data.error).toBe('Invalid input');
    expect(data.code).toBe('VALIDATION_ERROR');
    // Zod errors have a details field with error array
    expect(Array.isArray(data.details)).toBe(true);
  });

  it('should return structured error for rate limiting', async () => {
    // Exhaust rate limit
    const requests = Array.from({ length: 6 }, () => {
      const request = new Request('http://localhost/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '1.2.3.6',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          votes: { r1m1: 'elon_musk' },
        }),
      });

      const ctx = createExecutionContext();
      return Promise.resolve(worker.fetch(request, env, ctx)).then(async (response: Response) => {
        await waitOnExecutionContext(ctx);
        return response;
      });
    });

    const responses = await Promise.all(requests);
    const lastResponse = responses[5];

    expect(lastResponse.status).toBe(429);
    const data = (await lastResponse.json()) as { error: string; code: string };
    expect(data.error).toContain('Too many votes');
    expect(data.code).toBe('RATE_LIMIT_ERROR');
  });

  it('should not expose internal error details', async () => {
    const request = new Request('http://localhost/tournament', {
      method: 'GET',
      headers: { 'CF-Connecting-IP': '10.3.0.1' },
    });

    // Mock database failure by temporarily breaking DB connection
    const originalPrepare = env.DB.prepare;
    env.DB.prepare = (() => {
      throw new Error('SQLITE_CANTOPEN: unable to open database file');
    }) as any;

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    // Restore DB
    env.DB.prepare = originalPrepare;

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    // Verify internal error details are not exposed
    expect(data.error).not.toContain('SQLITE_CANTOPEN');
    expect(data.error).not.toContain('database file');
    expect(data.error).toMatch(/server error|internal error|something went wrong/i);
  });
});

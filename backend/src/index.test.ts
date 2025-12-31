import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('/register endpoint', () => {
  let worker: any;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should reject missing email', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.1',
      },
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid email format', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.2',
      },
      body: JSON.stringify({ email: 'notanemail' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid ZIP code', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '10.0.0.3',
      },
      body: JSON.stringify({ email: 'test@example.com', zip: 'ABCDE' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should accept valid registration', async () => {
    const response = await worker.fetch('http://localhost/register', {
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

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe('/votes endpoint validation', () => {
  let worker: any;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should reject invalid matchup ID format', async () => {
    const response = await worker.fetch('http://localhost/votes', {
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

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should reject votes for non-existent matchup', async () => {
    const response = await worker.fetch('http://localhost/votes', {
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

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.invalid).toContain('r5m1');
    expect(data.votesSubmitted).toBe(0);
  });

  it('should reject votes for wrong candidate in matchup', async () => {
    const response = await worker.fetch('http://localhost/votes', {
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

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.invalid).toContain('r1m1:jeff_bezos');
    expect(data.votesSubmitted).toBe(0);
  });

  it('should accept valid votes', async () => {
    // Use unique email to avoid UNIQUE constraint conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const response = await worker.fetch('http://localhost/votes', {
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

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.votesSubmitted).toBe(2);
  });
});

describe('CORS configuration', () => {
  let worker: any;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should reject requests from unauthorized origins', async () => {
    const response = await worker.fetch('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com' },
    });

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).not.toBe('https://evil.com');
  });

  it('should allow requests from worstbillionaires.com', async () => {
    const response = await worker.fetch('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'https://worstbillionaires.com' },
    });

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).toBe('https://worstbillionaires.com');
  });

  it('should allow requests from localhost for development', async () => {
    const response = await worker.fetch('http://localhost/tournament', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    });

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).toBe('http://localhost:5173');
  });
});

describe('Rate limiting', () => {
  let worker: any;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should enforce rate limit on /votes endpoint', async () => {
    // Send 6 requests (limit is 5 per minute)
    const requests = Array.from({ length: 6 }, (_, i) =>
      worker.fetch('http://localhost/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '1.2.3.4',
        },
        body: JSON.stringify({
          email: `test${i}@example.com`,
          votes: { r1m1: 'elon_musk' },
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // First 5 should succeed or fail validation (200/400), last should be rate limited (429)
    expect(statuses[5]).toBe(429);
  });

  it('should enforce rate limit on /register endpoint', async () => {
    // Send 3 requests (limit is 2 per minute)
    const requests = Array.from({ length: 3 }, (_, i) =>
      worker.fetch('http://localhost/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '1.2.3.5',
        },
        body: JSON.stringify({
          email: `test${i}@example.com`,
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // First 2 should succeed, last should be rate limited
    expect(statuses[2]).toBe(429);
  });
});

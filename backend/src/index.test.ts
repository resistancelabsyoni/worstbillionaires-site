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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid email format', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should reject invalid ZIP code', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', zip: 'ABCDE' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should accept valid registration', async () => {
    const response = await worker.fetch('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

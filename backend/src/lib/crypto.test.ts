import { describe, it, expect } from 'vitest';
import { hashEmail } from './crypto';

describe('hashEmail', () => {
  const testSecret = 'test-secret-key';

  it('should return consistent hash for same email', async () => {
    const email = 'test@example.com';
    const hash1 = await hashEmail(email, testSecret);
    const hash2 = await hashEmail(email, testSecret);
    expect(hash1).toBe(hash2);
  });

  it('should normalize email to lowercase', async () => {
    const hash1 = await hashEmail('Test@Example.Com', testSecret);
    const hash2 = await hashEmail('test@example.com', testSecret);
    expect(hash1).toBe(hash2);
  });

  it('should trim whitespace from email', async () => {
    const hash1 = await hashEmail('  test@example.com  ', testSecret);
    const hash2 = await hashEmail('test@example.com', testSecret);
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different emails', async () => {
    const hash1 = await hashEmail('test1@example.com', testSecret);
    const hash2 = await hashEmail('test2@example.com', testSecret);
    expect(hash1).not.toBe(hash2);
  });

  it('should return 64-character hex string (SHA-256)', async () => {
    const hash = await hashEmail('test@example.com', testSecret);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });

  it('should handle special characters in email', async () => {
    const email = 'user+tag@example.com';
    const hash = await hashEmail(email, testSecret);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('hashEmail with HMAC', () => {
  it('should produce different hashes with different secrets', async () => {
    const email = 'test@example.com';
    const secret1 = 'secret-key-1';
    const secret2 = 'secret-key-2';

    const hash1 = await hashEmail(email, secret1);
    const hash2 = await hashEmail(email, secret2);

    expect(hash1).not.toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(hash2).toHaveLength(64);
  });

  it('should produce same hash for same email and secret', async () => {
    const email = 'test@example.com';
    const secret = 'consistent-secret';

    const hash1 = await hashEmail(email, secret);
    const hash2 = await hashEmail(email, secret);

    expect(hash1).toBe(hash2);
  });

  it('should normalize email before hashing', async () => {
    const secret = 'test-secret';

    const hash1 = await hashEmail('TEST@EXAMPLE.COM', secret);
    const hash2 = await hashEmail('  test@example.com  ', secret);

    expect(hash1).toBe(hash2);
  });

  it('should resist rainbow table attacks', async () => {
    // Without salt/HMAC, common emails would have predictable hashes
    const commonEmails = [
      'admin@example.com',
      'user@gmail.com',
      'test@test.com'
    ];
    const secret = 'application-secret';

    const hashes = await Promise.all(
      commonEmails.map(email => hashEmail(email, secret))
    );

    // With HMAC, an attacker can't pre-compute these hashes
    // They would need the secret key
    expect(new Set(hashes).size).toBe(commonEmails.length);
  });
});

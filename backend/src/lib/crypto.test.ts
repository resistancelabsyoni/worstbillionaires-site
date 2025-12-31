import { describe, it, expect } from 'vitest';
import { hashEmail } from './crypto';

describe('hashEmail', () => {
  it('should return consistent hash for same email', async () => {
    const email = 'test@example.com';
    const hash1 = await hashEmail(email);
    const hash2 = await hashEmail(email);
    expect(hash1).toBe(hash2);
  });

  it('should normalize email to lowercase', async () => {
    const hash1 = await hashEmail('Test@Example.Com');
    const hash2 = await hashEmail('test@example.com');
    expect(hash1).toBe(hash2);
  });

  it('should trim whitespace from email', async () => {
    const hash1 = await hashEmail('  test@example.com  ');
    const hash2 = await hashEmail('test@example.com');
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different emails', async () => {
    const hash1 = await hashEmail('test1@example.com');
    const hash2 = await hashEmail('test2@example.com');
    expect(hash1).not.toBe(hash2);
  });

  it('should return 64-character hex string (SHA-256)', async () => {
    const hash = await hashEmail('test@example.com');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });

  it('should handle special characters in email', async () => {
    const email = 'user+tag@example.com';
    const hash = await hashEmail(email);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

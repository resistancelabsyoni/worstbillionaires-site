import { describe, it, expect } from 'vitest';
import { RegisterSchema, VotesSchema, validateMatchupId, validateCandidateId } from './validation';

describe('Validation Schemas', () => {
  it('should export RegisterSchema', () => {
    expect(RegisterSchema).toBeDefined();
  });

  it('should export VotesSchema', () => {
    expect(VotesSchema).toBeDefined();
  });

  it('should export validateMatchupId function', () => {
    expect(validateMatchupId).toBeDefined();
  });
});

describe('RegisterSchema', () => {
  it('should accept valid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'notanemail',
    });
    expect(result.success).toBe(false);
  });

  it('should reject email over 255 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'a'.repeat(256) + '@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid ZIP code', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      zip: '12345',
    });
    expect(result.success).toBe(true);
  });

  it('should accept ZIP+4 format', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      zip: '12345-6789',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid ZIP code', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      zip: 'ABCDE',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name over 100 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema - ZIP validation', () => {
  it('should accept empty string for optional ZIP field', () => {
    const validInput = {
      email: 'test@example.com',
      zip: '',
      optIn: true
    };
    const result = RegisterSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zip).toBe('');
    }
  });

  it('should accept undefined for optional ZIP field', () => {
    const validInput = {
      email: 'test@example.com',
      optIn: true
    };
    const result = RegisterSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zip).toBeUndefined();
    }
  });

  it('should validate format when ZIP is provided', () => {
    const validZip5 = RegisterSchema.safeParse({ email: 'test@example.com', zip: '12345' });
    expect(validZip5.success).toBe(true);

    const validZip9 = RegisterSchema.safeParse({ email: 'test@example.com', zip: '12345-6789' });
    expect(validZip9.success).toBe(true);

    const invalidZip = RegisterSchema.safeParse({ email: 'test@example.com', zip: 'abc' });
    expect(invalidZip.success).toBe(false);
  });
});

describe('VotesSchema', () => {
  it('should accept valid votes object', () => {
    const result = VotesSchema.safeParse({
      email: 'test@example.com',
      votes: {
        r1m1: 'elon_musk',
        r1m2: 'jeff_bezos',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid matchup ID format', () => {
    const result = VotesSchema.safeParse({
      email: 'test@example.com',
      votes: {
        invalid: 'elon_musk',
      },
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid candidate ID format', () => {
    const result = VotesSchema.safeParse({
      email: 'test@example.com',
      votes: {
        r1m1: 'Invalid-Name',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('validateMatchupId', () => {
  it('should accept valid matchup ID', () => {
    expect(validateMatchupId('r1m1')).toBe(true);
    expect(validateMatchupId('r10m99')).toBe(true);
  });

  it('should reject invalid matchup ID', () => {
    expect(validateMatchupId('invalid')).toBe(false);
    expect(validateMatchupId('r1')).toBe(false);
    expect(validateMatchupId('m1')).toBe(false);
  });
});

describe('validateCandidateId', () => {
  it('should accept valid candidate ID', () => {
    expect(validateCandidateId('elon_musk')).toBe(true);
    expect(validateCandidateId('jeff_bezos')).toBe(true);
  });

  it('should reject invalid candidate ID', () => {
    expect(validateCandidateId('Invalid-Name')).toBe(false);
    expect(validateCandidateId('UPPERCASE')).toBe(false);
    expect(validateCandidateId('has space')).toBe(false);
  });
});

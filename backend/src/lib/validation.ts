import { z } from 'zod';

/**
 * Schema for /register endpoint
 * Validates email format, name/zip length, and optIn boolean
 */
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  name: z.string().max(100, 'Name too long').optional(),
  zip: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .or(z.literal(''))
    .optional(),
  optIn: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema for /votes endpoint
 * Validates matchup IDs (format: r1m1) and candidate IDs (lowercase_snake_case)
 */
export const VotesSchema = z.object({
  email: z.string().email('Invalid email format'),
  votes: z.record(
    z.string().regex(/^r\d+m\d+$/, 'Invalid matchup ID format'),
    z.string().regex(/^[a-z_]+$/, 'Invalid candidate ID format')
  ),
});

export type VotesInput = z.infer<typeof VotesSchema>;

/**
 * Helper function to validate matchup ID format
 * @param id - Matchup ID to validate (e.g., "r1m1")
 * @returns true if format matches r{round}m{matchup}
 */
export function validateMatchupId(id: string): boolean {
  return /^r\d+m\d+$/.test(id);
}

/**
 * Helper function to validate candidate ID format
 * @param id - Candidate ID to validate (e.g., "elon_musk")
 * @returns true if format matches lowercase with underscores
 */
export function validateCandidateId(id: string): boolean {
  return /^[a-z_]+$/.test(id);
}

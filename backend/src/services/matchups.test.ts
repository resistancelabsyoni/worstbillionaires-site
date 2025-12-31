import { describe, it, expect } from 'vitest';
import { getMatchups, validateCandidateInMatchup, type Matchup } from './matchups';

describe('getMatchups', () => {
  it('should return round 1 matchups', async () => {
    const matchups = await getMatchups(null, 1);
    expect(matchups).toHaveLength(4);
    expect(matchups[0].matchupId).toBe('r1m1');
    expect(matchups[0].candidates).toContain('elon_musk');
  });

  it('should return empty array for invalid round', async () => {
    const matchups = await getMatchups(null, 99);
    expect(matchups).toHaveLength(0);
  });
});

describe('validateCandidateInMatchup', () => {
  const testMatchups: Matchup[] = [
    { matchupId: 'r1m1', candidates: ['elon_musk', 'mark_zuckerberg'] },
    { matchupId: 'r1m2', candidates: ['jeff_bezos', 'bill_gates'] },
  ];

  it('should return true for valid candidate in matchup', () => {
    expect(validateCandidateInMatchup('r1m1', 'elon_musk', testMatchups)).toBe(true);
  });

  it('should return false for candidate not in matchup', () => {
    expect(validateCandidateInMatchup('r1m1', 'jeff_bezos', testMatchups)).toBe(false);
  });

  it('should return false for non-existent matchup', () => {
    expect(validateCandidateInMatchup('r5m1', 'elon_musk', testMatchups)).toBe(false);
  });
});

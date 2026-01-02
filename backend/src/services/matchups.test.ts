import { describe, it, expect } from 'vitest';
import { getMatchups, validateCandidateInMatchup, type Matchup } from './matchups';

describe('getMatchups', () => {
  it('should return round 1 matchups', async () => {
    // db parameter not used yet (static data), so pass empty object
    const matchups = await getMatchups({} as D1Database, 1);
    expect(matchups).toHaveLength(8);
    expect(matchups[0].matchupId).toBe('r1m1');
    expect(matchups[0].candidates).toContain('musk');
  });

  it('should return empty array for invalid round', async () => {
    const matchups = await getMatchups({} as D1Database, 99);
    expect(matchups).toHaveLength(0);
  });
});

describe('validateCandidateInMatchup', () => {
  const testMatchups: Matchup[] = [
    { matchupId: 'r1m1', candidates: ['musk', 'andreessen'] },
    { matchupId: 'r1m2', candidates: ['trump', 'sacks'] },
  ];

  it('should return true for valid candidate in matchup', () => {
    expect(validateCandidateInMatchup('r1m1', 'musk', testMatchups)).toBe(true);
  });

  it('should return false for candidate not in matchup', () => {
    expect(validateCandidateInMatchup('r1m1', 'trump', testMatchups)).toBe(false);
  });

  it('should return false for non-existent matchup', () => {
    expect(validateCandidateInMatchup('r5m1', 'musk', testMatchups)).toBe(false);
  });
});

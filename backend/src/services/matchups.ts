import { getCurrentRound } from '../config/tournament';

export interface Matchup {
  matchupId: string;
  candidates: string[];
}

/**
 * Get all valid matchups for the current round
 * This would typically fetch from database, but for now returns static config
 */
export async function getMatchups(db: any, round: number): Promise<Matchup[]> {
  // TODO: Fetch from database once matchups table is created
  // For now, return hardcoded matchups for round 1
  if (round === 1) {
    return [
      { matchupId: 'r1m1', candidates: ['elon_musk', 'mark_zuckerberg'] },
      { matchupId: 'r1m2', candidates: ['jeff_bezos', 'bill_gates'] },
      { matchupId: 'r1m3', candidates: ['larry_ellison', 'warren_buffett'] },
      { matchupId: 'r1m4', candidates: ['bernard_arnault', 'larry_page'] },
    ];
  }

  // For subsequent rounds, query previous round winners
  // This will be implemented when tournament progression is built
  return [];
}

/**
 * Validate that a candidate belongs to a specific matchup
 */
export function validateCandidateInMatchup(
  matchupId: string,
  candidateId: string,
  matchups: Matchup[]
): boolean {
  const matchup = matchups.find((m) => m.matchupId === matchupId);
  if (!matchup) return false;
  return matchup.candidates.includes(candidateId);
}

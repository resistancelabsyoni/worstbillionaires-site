import { getCurrentRound, INITIAL_BRACKET } from '../config/tournament';

export interface Matchup {
  matchupId: string;
  candidates: string[];
}

/**
 * Get all valid matchups for the current round
 * This would typically fetch from database, but for now returns static config
 */
export async function getMatchups(db: D1Database, round: number): Promise<Matchup[]> {
  // TODO: Fetch from database once matchups table is created
  // For now, return initial bracket for round 1
  if (round === 1) {
    return INITIAL_BRACKET;
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

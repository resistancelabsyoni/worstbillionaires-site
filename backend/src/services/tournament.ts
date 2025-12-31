import { INITIAL_BRACKET } from '../config/tournament';

export async function getMatchups(
  db: D1Database,
  round: number
): Promise<Array<{ matchupId: string; candidates: string[] }>> {
  if (round === 1) {
    return INITIAL_BRACKET;
  }

  // For later rounds, generate from previous round winners
  // Note: results table doesn't exist - need to count votes manually
  const prevRound = round - 1;

  // Get previous round matchups
  const prevMatchups = await getMatchups(db, prevRound);

  // Calculate winners from vote counts
  const winners: string[] = [];
  for (const matchup of prevMatchups) {
    const voteCounts = await db
      .prepare('SELECT candidate_id, COUNT(*) as count FROM votes WHERE round = ? AND matchup_id = ? GROUP BY candidate_id')
      .bind(prevRound, matchup.matchupId)
      .all();

    if (!voteCounts.results || voteCounts.results.length === 0) {
      throw new Error(`No votes found for round ${prevRound} matchup ${matchup.matchupId}`);
    }

    // Find winner (most votes)
    const sorted = (voteCounts.results as any[]).sort((a, b) => b.count - a.count);
    winners.push(sorted[0].candidate_id);
  }

  // Pair winners into new matchups
  const matchups = [];
  for (let i = 0; i < winners.length; i += 2) {
    matchups.push({
      matchupId: `r${round}m${Math.floor(i / 2) + 1}`,
      candidates: [winners[i], winners[i + 1]],
    });
  }

  return matchups;
}

export async function getVoteCounts(
  db: D1Database,
  round: number
): Promise<Record<string, Record<string, number>>> {
  const votes = await db
    .prepare('SELECT matchup_id, candidate_id FROM votes WHERE round = ?')
    .bind(round)
    .all();

  const counts: Record<string, Record<string, number>> = {};
  for (const vote of votes.results || []) {
    const { matchup_id, candidate_id } = vote as any;
    if (!counts[matchup_id]) counts[matchup_id] = {};
    counts[matchup_id][candidate_id] = (counts[matchup_id][candidate_id] || 0) + 1;
  }

  return counts;
}

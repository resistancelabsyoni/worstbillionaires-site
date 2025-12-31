export const ROUNDS = [
  { round: 1, start: '2025-01-15T00:00:00Z', end: '2025-01-22T23:59:59Z' },
  { round: 2, start: '2025-01-23T00:00:00Z', end: '2025-01-30T23:59:59Z' },
  { round: 3, start: '2025-01-31T00:00:00Z', end: '2025-02-07T23:59:59Z' },
  { round: 4, start: '2025-02-08T00:00:00Z', end: '2025-02-15T23:59:59Z' },
];

export const INITIAL_BRACKET = [
  { matchupId: 'r1m1', candidates: ['elon-musk', 'jeff-bezos'] },
  { matchupId: 'r1m2', candidates: ['mark-zuckerberg', 'bill-gates'] },
  { matchupId: 'r1m3', candidates: ['larry-ellison', 'warren-buffett'] },
  { matchupId: 'r1m4', candidates: ['larry-page', 'sergey-brin'] },
  { matchupId: 'r1m5', candidates: ['steve-ballmer', 'michael-bloomberg'] },
  { matchupId: 'r1m6', candidates: ['jim-walton', 'rob-walton'] },
  { matchupId: 'r1m7', candidates: ['alice-walton', 'mackenzie-scott'] },
  { matchupId: 'r1m8', candidates: ['bernard-arnault', 'francoise-bettencourt-meyers'] },
];

export function getCurrentRound(): number {
  const now = new Date();
  for (const r of ROUNDS) {
    const start = new Date(r.start);
    const end = new Date(r.end);
    if (now >= start && now <= end) return r.round;
  }
  return 0; // Tournament not active
}

export function isVotingOpen(): boolean {
  return getCurrentRound() > 0;
}

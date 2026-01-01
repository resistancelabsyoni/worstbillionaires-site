export const ROUNDS = [
  { round: 1, start: '2026-01-01T00:00:00Z', end: '2026-01-08T23:59:59Z' },
  { round: 2, start: '2026-01-09T00:00:00Z', end: '2026-01-16T23:59:59Z' },
  { round: 3, start: '2026-01-17T00:00:00Z', end: '2026-01-24T23:59:59Z' },
  { round: 4, start: '2026-01-25T00:00:00Z', end: '2026-02-01T23:59:59Z' },
];

export const INITIAL_BRACKET = [
  { matchupId: 'r1m1', candidates: ['musk', 'andreessen'] },
  { matchupId: 'r1m2', candidates: ['trump', 'sacks'] },
  { matchupId: 'r1m3', candidates: ['bezos', 'zuckerberg'] },
  { matchupId: 'r1m4', candidates: ['adelson', 'sun'] },
  { matchupId: 'r1m5', candidates: ['ellison', 'thiel'] },
  { matchupId: 'r1m6', candidates: ['zhao', 'murdoch'] },
  { matchupId: 'r1m7', candidates: ['schwarzman', 'adani'] },
  { matchupId: 'r1m8', candidates: ['koch', 'dimon'] },
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

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCurrentRound, isVotingOpen } from './config/tournament';
import { getMatchups, getVoteCounts } from './services/tournament';
import { hashEmail } from './lib/crypto';
import { RegisterSchema, VotesSchema } from './lib/validation';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/tournament', async (c) => {
  const db = c.env.DB;
  const currentRound = getCurrentRound();

  if (currentRound === 0) {
    return c.json({
      currentRound: 0,
      matchups: [],
      totalVotes: 0,
      message: 'Tournament not currently active',
    });
  }

  const matchups = await getMatchups(db, currentRound);
  const voteCounts = await getVoteCounts(db, currentRound);

  // Calculate total votes
  const totalVotes = Object.values(voteCounts).reduce(
    (sum, counts) => sum + Object.values(counts).reduce((a, b) => a + b, 0),
    0
  );

  return c.json({
    currentRound,
    matchups: matchups.map((m) => ({
      ...m,
      votes: voteCounts[m.matchupId] || {},
    })),
    totalVotes,
  });
});

app.post('/votes', async (c) => {
  const body = await c.req.json();
  const { email, votes } = body;

  if (!email || !votes) {
    return c.json({ error: 'Missing required fields: email, votes' }, 400);
  }

  if (!isVotingOpen()) {
    return c.json({ error: 'Voting is not currently open' }, 403);
  }

  const currentRound = getCurrentRound();
  const emailHash = await hashEmail(email);
  const db = c.env.DB;

  let votesSubmitted = 0;
  const skipped: string[] = [];

  // votes is { matchupId: candidateId, ... }
  for (const [matchupId, candidateId] of Object.entries(votes)) {
    try {
      await db
        .prepare('INSERT INTO votes (email_hash, matchup_id, candidate_id, round) VALUES (?, ?, ?, ?)')
        .bind(emailHash, matchupId, candidateId, currentRound)
        .run();
      votesSubmitted++;
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        skipped.push(matchupId);
        continue;
      }
      throw err;
    }
  }

  return c.json({
    success: true,
    votesSubmitted,
    skipped,
  });
});

app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const validated = RegisterSchema.parse(body);

    const db = c.env.DB;

    await db
      .prepare(
        'INSERT INTO contacts (email, name, zip, opt_in) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT(email) DO UPDATE SET name=?, zip=?, opt_in=?'
      )
      .bind(
        validated.email,
        validated.name || null,
        validated.zip || null,
        validated.optIn ? 1 : 0,
        validated.name || null,
        validated.zip || null,
        validated.optIn ? 1 : 0
      )
      .run();

    return c.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: err.errors }, 400);
    }
    console.error('Registration error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCurrentRound, isVotingOpen } from './config/tournament';
import { getMatchups as getTournamentMatchups, getVoteCounts } from './services/tournament';
import { getMatchups } from './services/matchups';
import { hashEmail } from './lib/crypto';
import { RegisterSchema, VotesSchema } from './lib/validation';
import { z } from 'zod';
import { votesLimiter, registerLimiter, tournamentLimiter } from './lib/rate-limiter';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const ALLOWED_ORIGINS = [
  'https://worstbillionaires.com',
  'https://www.worstbillionaires.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev port
];

app.use('/*', cors({
  origin: (origin) => {
    // Allow same-origin requests (no Origin header)
    if (!origin) return origin;
    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// Helper function to get client identifier
function getClientId(c: any): string {
  // Use CF-Connecting-IP header (Cloudflare provides this)
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
}

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/tournament', async (c) => {
  const clientId = getClientId(c);
  if (!tournamentLimiter.check(clientId)) {
    return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

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

  const matchups = await getTournamentMatchups(db, currentRound);
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
  try {
    const clientId = getClientId(c);
    if (!votesLimiter.check(clientId)) {
      return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
    }

    const body = await c.req.json();
    const validated = VotesSchema.parse(body);
    const { email, votes } = validated;

    if (!isVotingOpen()) {
      return c.json({ error: 'Voting is not currently open' }, 403);
    }

    const currentRound = getCurrentRound();
    const validMatchups = await getMatchups(c.env.DB, currentRound);

    // Create lookup map for O(1) validation
    const matchupMap = new Map(
      validMatchups.map((m) => [m.matchupId, new Set(m.candidates)])
    );

    const emailHash = await hashEmail(email);
    const db = c.env.DB;

    let votesSubmitted = 0;
    const skipped: string[] = [];
    const invalid: string[] = [];

    for (const [matchupId, candidateId] of Object.entries(votes)) {
      // Validate matchup exists in current round
      const validCandidates = matchupMap.get(matchupId);
      if (!validCandidates) {
        invalid.push(matchupId);
        continue;
      }

      // Validate candidate is in this matchup
      if (!validCandidates.has(candidateId)) {
        invalid.push(`${matchupId}:${candidateId}`);
        continue;
      }

      try {
        await db
          .prepare(
            'INSERT INTO votes (email_hash, matchup_id, candidate_id, round) VALUES (?, ?, ?, ?)'
          )
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
      invalid,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: err.errors }, 400);
    }
    console.error('Voting error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/register', async (c) => {
  try {
    const clientId = getClientId(c);
    if (!registerLimiter.check(clientId)) {
      return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
    }

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

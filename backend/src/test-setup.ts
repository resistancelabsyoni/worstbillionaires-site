import { beforeAll } from 'vitest';
import { env } from 'cloudflare:test';

// Inline schema to avoid file system issues in bundled Workers environment
const SCHEMA = `
-- Votes table with privacy-preserving email_hash
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  email_hash TEXT NOT NULL,
  matchup_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  UNIQUE(email_hash, matchup_id)
);
CREATE INDEX idx_votes_hash ON votes(email_hash);
CREATE INDEX idx_votes_matchup ON votes(matchup_id);
CREATE INDEX idx_votes_round ON votes(round);

-- Contacts table with plaintext email for outreach
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  zip TEXT,
  opt_in INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'Worst Billionaire 2025'
);
CREATE INDEX idx_contacts_email ON contacts(email);
`;

beforeAll(async () => {
  // Split into individual statements and clean them
  const statements = SCHEMA
    .split(';')
    .map(s => {
      // Remove comments and trim
      return s
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
    })
    .filter(s => s.length > 0);

  // Execute each statement
  for (const statement of statements) {
    try {
      await env.DB.prepare(statement).run();
    } catch (error) {
      console.error('Failed to execute statement:', statement);
      console.error('Error:', error);
      throw error;
    }
  }
});

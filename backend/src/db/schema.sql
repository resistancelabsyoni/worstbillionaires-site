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
CREATE INDEX idx_votes_email_matchup ON votes(email_hash, matchup_id);

-- Contacts table with plaintext email for outreach
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  zip TEXT,
  opt_in INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'Worst Billionaire 2026'
);
CREATE INDEX idx_contacts_email ON contacts(email);

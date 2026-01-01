-- Migration: Add composite index for duplicate vote detection
-- Date: 2026-01-01
--
-- Improves INSERT performance for duplicate vote detection by covering
-- both columns used in UNIQUE constraint enforcement.

CREATE INDEX IF NOT EXISTS idx_votes_email_matchup ON votes(email_hash, matchup_id);

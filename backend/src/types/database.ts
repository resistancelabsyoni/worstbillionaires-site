/**
 * Result type for vote count aggregation queries
 */
export interface VoteCountResult {
  candidate_id: string;
  count: number;
}

/**
 * Result type for individual vote records
 */
export interface VoteResult {
  email_hash: string;
  matchup_id: string;
  candidate_id: string;
  round: number;
  created_at: string;
}

/**
 * Result type for contact records
 */
export interface ContactResult {
  id: number;
  email: string;
  name: string | null;
  zip: string | null;
  opt_in: number;
  created_at: string;
}

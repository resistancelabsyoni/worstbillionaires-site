# Security Implementation

## Input Validation

All user inputs are validated using Zod schemas:

- **Email validation**: RFC-compliant format, max 255 characters
- **ZIP code validation**: 5-digit or ZIP+4 format (e.g., 12345 or 12345-6789)
- **Name validation**: Max 100 characters to prevent buffer overflow
- **Vote validation**: Matchup IDs must match `r{round}m{matchup}` format, candidate IDs must be lowercase_snake_case

## Rate Limiting

Rate limits are enforced per IP address:

- `/votes`: 5 requests per minute
- `/register`: 2 requests per minute
- `/tournament`: 20 requests per minute

Rate limits can be adjusted in `src/lib/rate-limiter.ts`.

## CORS Configuration

Only the following origins are allowed:

- `https://worstbillionaires.com`
- `https://www.worstbillionaires.com`
- `http://localhost:5173` (development only)
- `http://localhost:3000` (development only)

To add new origins, update the `ALLOWED_ORIGINS` array in `src/index.ts`.

## Vote Integrity

Votes are validated against the current round's matchup configuration:

1. Matchup ID must exist in the current round
2. Candidate ID must be one of the two candidates in that matchup
3. Each email can only vote once per matchup (enforced by database UNIQUE constraint)

Invalid votes are returned in the `invalid` array but do not cause the entire request to fail.

## Email Privacy

Email addresses are **hashed using HMAC-SHA256** with a secret key before storage:

- ✅ Protects against rainbow table attacks (requires secret key)
- ✅ Prevents email enumeration in database
- ✅ Allows duplicate vote detection without storing plaintext emails
- ✅ Secret key stored in Cloudflare Workers secrets (not in code)

**Setup:**
```bash
# Generate a secure random secret
openssl rand -hex 32

# Add to Cloudflare Workers
npx wrangler secret put EMAIL_HASH_SECRET --env production
```

**Security note:** The secret key must be kept confidential. If compromised, attackers could compute email hashes and potentially identify voters. Rotate the key if compromise is suspected (note: this will invalidate existing duplicate vote detection).

## Error Handling

All errors are caught and sanitized before being returned to clients:

- Validation errors return structured error details
- Internal errors return generic "Internal server error" message
- Error details are logged server-side for debugging

## Database Security

- All queries use parameterized statements to prevent SQL injection
- Database access is restricted via Cloudflare Workers environment bindings
- Different database IDs for dev/staging/production environments

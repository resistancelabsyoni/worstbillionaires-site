# Security Implementation

## Input Validation

All user inputs are validated using Zod schemas:

- **Email validation**: RFC-compliant format, max 255 characters
- **ZIP code validation**: 5-digit or ZIP+4 format (e.g., 12345 or 12345-6789)
- **Name validation**: Max 100 characters to prevent buffer overflow
- **Vote validation**: Matchup IDs must match `r{round}m{matchup}` format, candidate IDs must be lowercase_snake_case

## Rate Limiting Architecture

### Current Implementation: In-Memory Per-Instance

**Design:**
- Each Cloudflare Worker instance maintains its own rate limit counters
- Limits are enforced within that instance's lifetime
- State is **not shared** between Worker instances

**Protection Provided:**
- ✅ Prevents accidental repeated submissions (user clicks "vote" multiple times)
- ✅ Mitigates simple abuse from single source
- ✅ Reduces database load from rapid requests
- ⚠️ Does NOT provide strict distributed rate limiting

**Limits Configured:**
- Votes: 5 per minute per client
- Registrations: 2 per minute per client
- Tournament queries: 20 per minute per client

**Why In-Memory is Sufficient:**

For our application:
1. **Low fraud incentive** - No financial gain from voting
2. **Low traffic volume** - Not a high-frequency API
3. **Defense in depth** - Rate limiting is one of multiple protections:
   - Email hash prevents duplicate votes (stronger guarantee)
   - CORS restricts origin access
   - Input validation prevents malformed data
   - Database constraints enforce data integrity

**When to Upgrade:**

Consider distributed rate limiting (Durable Objects or KV) if:
- Traffic increases significantly (>1000 votes/minute)
- Abuse patterns emerge in monitoring
- Application handles sensitive data or financial transactions
- Compliance requirements mandate strict rate limiting

**Monitoring:**
- All rate-limited requests are logged with structured logging
- Use Cloudflare Analytics to track patterns
- Review logs for coordinated abuse attempts

### Alternative Architectures (Future)

**Option 1: Durable Objects**
```typescript
// Single instance guarantees accurate counting
export class RateLimiterDO implements DurableObject {
  private storage: DurableObjectStorage;

  async check(clientId: string): Promise<boolean> {
    // Persistent state across all Worker instances
  }
}
```

**Option 2: Cloudflare KV**
```typescript
// Distributed state with eventual consistency
const count = await env.RATE_LIMITS.get(clientId);
if (count >= limit) return false;
await env.RATE_LIMITS.put(clientId, count + 1, { expirationTtl: 60 });
```

**Option 3: Platform Rate Limiting**
```toml
# wrangler.toml
[env.production]
route = { pattern = "worstbillionaires.org/*", zone_name = "worstbillionaires.org" }
# Configure rate limiting via Cloudflare Dashboard
```

## CORS Configuration

Only the following origins are allowed:

- `https://worstbillionaires.com`
- `https://www.worstbillionaires.com`
- `https://fuck2025.org`
- `https://www.fuck2025.org`
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

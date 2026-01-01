# Worst Billionaires API

Cloudflare Workers backend for the Worst Billionaires voting tournament.

## Environments

### Development
```bash
npm run dev
```
Uses `preview_*` database ID for local testing.

### Staging
```bash
npx wrangler deploy --env staging
```
Uses `staging_*` database ID.

### Production
```bash
npx wrangler deploy --env production
```
Uses production database ID.

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

Run type checking:
```bash
npm run typecheck
```

## Database

The application uses Cloudflare D1 (SQLite) database with different instances per environment:
- Development: `worst-billionaires-dev`
- Staging: `worst-billionaires-staging`
- Production: `worst-billionaires`

### Database Migrations

Apply migrations to each environment:

**Development (Local):**
```bash
npx wrangler d1 execute worst-billionaires-dev --file=migrations/0001_add_composite_index.sql --local
```

**Staging:**
```bash
npx wrangler d1 execute worst-billionaires-staging --file=migrations/0001_add_composite_index.sql
```

**Production:**
```bash
npx wrangler d1 execute worst-billionaires --file=migrations/0001_add_composite_index.sql
```

**Verify migration:**
```bash
npx wrangler d1 execute <database-name> --command="SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='votes';"
```

## Known Limitations

### Rate Limiting

The current rate limiting implementation uses in-memory state that is **not shared between Cloudflare Worker instances**:

- **Scope**: Rate limits apply only within a single Worker instance
- **Duration**: State is lost when Worker instance is recycled (typically seconds to minutes)
- **Effect**: In distributed deployments, each Worker instance maintains separate counters

**Why this is acceptable for our use case:**
- Low to medium traffic volume (not high-frequency API)
- Non-financial application (no monetary fraud risk)
- Primary goal: Prevent accidental double-voting and simple abuse
- Cost vs. benefit: Distributed rate limiting adds complexity and cost

**Future improvements (if needed):**

If traffic patterns or abuse attempts warrant stricter rate limiting:

1. **Cloudflare Durable Objects** - Guaranteed single instance per client ID
   ```typescript
   // Example: Rate limiter as Durable Object
   export class RateLimiterDO implements DurableObject {
     // Persistent state across all requests
   }
   ```

2. **Cloudflare KV with TTL** - Distributed state with eventual consistency
   ```typescript
   // Store rate limit counters in KV with expiration
   await env.RATE_LIMITS.put(clientId, count, { expirationTtl: 60 });
   ```

3. **Cloudflare Rate Limiting API** - Use platform native features
   - Configure via Wrangler or Dashboard
   - Enforced at edge before Worker execution

**Monitoring:**
Track rate limiting effectiveness in production:
- Log rate-limited requests (already implemented)
- Monitor abuse patterns in Cloudflare Analytics
- Evaluate need for distributed solution based on real data

See `src/lib/rate-limiter.ts` for implementation details.

## Security

See [SECURITY.md](./SECURITY.md) for detailed security implementation documentation.

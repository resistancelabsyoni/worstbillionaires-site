# Worst Billionaire Tournament Site

A collective voting tournament to crown the worst billionaire.

## Architecture

- **Frontend**: `index.html` - Static HTML/CSS/JS
- **Backend**: `backend/` - Cloudflare Workers + Hono API + D1 database
- **E2E Tests**: `e2e/` - Playwright tests
- **Legacy**: `google-apps-script.js` - Original Google Sheets backend

## Development

```bash
# Backend
cd backend/
npm run dev          # Start local dev server (Wrangler)
npm test             # Run Vitest unit tests
npm run typecheck    # TypeScript check
npm run deploy       # Deploy to Cloudflare

# E2E Tests
cd e2e/
npm test             # Run Playwright tests
```

## Tech Stack

- **Backend**: Hono (web framework), Cloudflare D1 (SQLite), Zod (validation)
- **Testing**: Vitest (unit), Playwright (E2E), `@cloudflare/vitest-pool-workers`
- **Deployment**: Cloudflare Workers

## Key Points

- Uses Cloudflare D1 for data persistence (votes, contacts, results)
- Backend has separate environments: dev, staging, production
- E2E tests use `cloudflare:test` environment with D1 support
- Frontend is self-contained in single HTML file with inline CSS/JS
- Round scheduling and timing logic in both frontend and backend

## Testing Patterns

- Unit tests mock D1 database bindings
- E2E tests use real Cloudflare environment with database cleanup between tests
- Database schema automatically initialized in test environment

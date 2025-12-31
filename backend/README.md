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

## Security

See [SECURITY.md](./SECURITY.md) for detailed security implementation documentation.

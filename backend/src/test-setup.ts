import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeAll } from 'vitest';
import { env } from 'cloudflare:test';

beforeAll(async () => {
  // Read schema file
  const schemaPath = join(__dirname, 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split into individual statements (handle CREATE TABLE and CREATE INDEX separately)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Execute each statement
  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
});

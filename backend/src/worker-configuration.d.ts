declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    EMAIL_HASH_SECRET: string;
  }
}

export {};

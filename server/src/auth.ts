import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'battleset',
  user:     process.env.PGUSER     ?? 'battleset',
  password: process.env.PGPASSWORD ?? '',
});

export const auth = betterAuth({
  database: {
    db: pool,
    type: 'pg',
  },
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
  trustedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map(s => s.trim()),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
});

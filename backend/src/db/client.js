import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

config({ path: new URL('../../../.env', import.meta.url) });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

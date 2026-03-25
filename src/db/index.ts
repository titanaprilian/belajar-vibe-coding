import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

if (process.env.NODE_ENV === 'test') {
  await import('dotenv').then(dotenv => dotenv.config({ path: '.env.test' }));
}

import { env } from 'bun';

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
});

export const db = drizzle(pool);

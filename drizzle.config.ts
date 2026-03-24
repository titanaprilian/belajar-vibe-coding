import { defineConfig } from 'drizzle-kit';
import { env } from 'bun';

export default defineConfig({
  schema: './src/modules/**/*.schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});

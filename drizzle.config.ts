import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/**/*.schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: 'mysql://root:root@localhost:3306/belajar_vibe_coding',
  },
});

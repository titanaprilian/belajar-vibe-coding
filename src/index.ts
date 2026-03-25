import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRouter } from './modules/users';
import { env } from 'bun';

const app = new Elysia()
  .use(swagger())
  .get('/api/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }, {
    detail: { tags: ['Health'] }
  })
  .use(usersRouter)
  .listen(env.PORT || 3000);

console.log(`Server is running at http://localhost:${env.PORT || 3000}`);
console.log(`Swagger docs at http://localhost:${env.PORT || 3000}/swagger`);

export type App = typeof app;

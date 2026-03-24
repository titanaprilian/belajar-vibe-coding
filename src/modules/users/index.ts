import { Elysia } from 'elysia';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './users.service';

export const usersRouter = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    return getUsers();
  })
  .get('/:id', async ({ params }) => {
    const id = Number(params.id);
    return getUserById(id);
  })
  .post('/', async ({ body }) => {
    return createUser(body as { name: string; email: string });
  })
  .put('/:id', async ({ params, body }) => {
    const id = Number(params.id);
    return updateUser(id, body as { name?: string; email?: string });
  })
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id);
    return deleteUser(id);
  });

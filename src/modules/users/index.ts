import { Elysia, t } from 'elysia';
import { getUsers, getUserById, createUser, updateUser, deleteUser, registerUser } from './users.service';

const registerSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

export const usersRouter = new Elysia({ prefix: '/api/users' })
  .get('/', async () => {
    return getUsers();
  })
  .get('/:id', async ({ params }) => {
    const id = Number(params.id);
    return getUserById(id);
  })
  .post('/', async ({ body }) => {
    const { name, email, password } = body as { name: string; email: string; password: string };
    try {
      await registerUser(name, email, password);
      return { data: 'OK' };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, {
    body: registerSchema,
  })
  .put('/:id', async ({ params, body }) => {
    const id = Number(params.id);
    return updateUser(id, body as { name?: string; email?: string });
  })
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id);
    return deleteUser(id);
  });

import { Elysia, t } from 'elysia';
import { getAllUsers, getUsers, getUserById, createUser, updateUser, deleteUser, registerUser, loginUser, getCurrentUser, updateCurrentUser } from './users.service';

const registerSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
});

const loginSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
});

const updateProfileSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
});

const paginationQuery = t.Object({
  page: t.Number({ minimum: 1, default: 1 }),
  size: t.Number({ minimum: 1, maximum: 100, default: 10 }),
});

export const usersRouter = new Elysia({ prefix: '/api/users' })
  .get('/', async ({ query }) => {
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    return getUsers(page, size);
  }, {
    query: paginationQuery,
  })
  .get('/me', async ({ headers, set }) => {
    const authHeader = headers['authorization'];
    
    if (!authHeader) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    
    const token = parts[1]!;
    
    try {
      const user = await getCurrentUser(token);
      return { data: user };
    } catch (error) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  })
  .put('/me', async ({ headers, body, set }) => {
    const authHeader = headers['authorization'];
    
    if (!authHeader) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
    
    const token = parts[1]!;
    const { name, email } = body as { name: string; email: string };
    
    try {
      await updateCurrentUser(token, name, email);
      return { data: 'OK' };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 400;
      return { error: errorMessage };
    }
  }, {
    body: updateProfileSchema,
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
  .post('/login', async ({ body, set }) => {
    const { email, password } = body as { email: string; password: string };
    try {
      const token = await loginUser(email, password);
      return { token };
    } catch (error) {
      set.status = 400;
      return { error: (error as Error).message };
    }
  }, {
    body: loginSchema,
  })
  .put('/:id', async ({ params, body }) => {
    const id = Number(params.id);
    return updateUser(id, body as { name?: string; email?: string });
  })
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id);
    return deleteUser(id);
  });

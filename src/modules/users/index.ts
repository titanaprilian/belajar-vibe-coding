import { Elysia, t } from "elysia";
import {
  getUsers,
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
  logoutUser,
} from "./users.service";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  paginationQuery,
} from "./users.validation";

const ERROR_UNAUTHORIZED = "Unauthorized";

const extractToken = (headers: Record<string, string | undefined>) => {
  const authHeader = headers["authorization"];

  if (!authHeader) {
    throw new Error(ERROR_UNAUTHORIZED);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error(ERROR_UNAUTHORIZED);
  }

  return parts[1]!;
};

export const usersRouter = new Elysia({ prefix: "/api/users" })
  .onError(({ error, set }) => {
    if ((error as Error).message === ERROR_UNAUTHORIZED) {
      set.status = 401;
      return { error: ERROR_UNAUTHORIZED };
    }
  })
  .get(
    "/",
    async ({ query }) => {
      const page = query.page ?? 1;
      const size = query.size ?? 10;
      return getUsers(page, size);
    },
    {
      query: paginationQuery,
    },
  )
  .post(
    "/",
    async ({ body, set }) => {
      const { name, email, password } = body as {
        name: string;
        email: string;
        password: string;
      };
      try {
        await registerUser(name, email, password);
        return { data: "OK" };
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      body: registerSchema,
    },
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const { email, password } = body as { email: string; password: string };
      try {
        const token = await loginUser(email, password);
        return { token };
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      body: loginSchema,
    },
  )
  .get("/me", async ({ headers }) => {
    const token = extractToken(headers);
    const user = await getCurrentUser(token);
    return { data: user };
  })
  .put(
    "/me",
    async ({ headers, body, set }) => {
      const token = extractToken(headers);
      const { name, email } = body as { name: string; email: string };

      try {
        await updateCurrentUser(token, name, email);
        return { data: "OK" };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage === ERROR_UNAUTHORIZED) {
          throw error;
        }
        set.status = 400;
        return { error: errorMessage };
      }
    },
    {
      body: updateProfileSchema,
    },
  )
  .put(
    "/me/password",
    async ({ headers, body, set }) => {
      const token = extractToken(headers);
      const { oldPassword, newPassword } = body as {
        oldPassword: string;
        newPassword: string;
      };

      try {
        await updatePassword(token, oldPassword, newPassword);
        return { data: "OK" };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage === ERROR_UNAUTHORIZED) {
          throw error;
        }
        set.status = 400;
        return { error: errorMessage };
      }
    },
    {
      body: updatePasswordSchema,
    },
  )
  .delete("/logout", async ({ headers }) => {
    const token = extractToken(headers);
    await logoutUser(token);
    return { data: "OK" };
  });

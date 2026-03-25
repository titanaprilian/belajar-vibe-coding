import { Elysia } from "elysia";
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

export const usersRouter = new Elysia({ prefix: "/api/users" })
  .derive(({ headers, set }) => {
    const authHeader = headers["authorization"];

    if (!authHeader) {
      return { error: "Unauthorized" };
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return { error: "Unauthorized" };
    }

    const token = parts[1]!;
    return { token };
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
  .get("/me", async ({ token, set }) => {
    if (!token || token === "Unauthorized") {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const user = await getCurrentUser(token as string);
      return { data: user };
    } catch (error) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .put(
    "/me",
    async ({ token, body, set }) => {
      if (!token || token === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { name, email } = body as { name: string; email: string };

      try {
        await updateCurrentUser(token as string, name, email);
        return { data: "OK" };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
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
    async ({ token, body, set }) => {
      if (!token || token === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { oldPassword, newPassword } = body as {
        oldPassword: string;
        newPassword: string;
      };

      try {
        await updatePassword(token as string, oldPassword, newPassword);
        return { data: "OK" };
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 400;
        return { error: errorMessage };
      }
    },
    {
      body: updatePasswordSchema,
    },
  )
  .delete("/logout", async ({ token, set }) => {
    if (!token || token === "Unauthorized") {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      await logoutUser(token as string);
      return { data: "OK" };
    } catch (error) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });

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
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Returns paginated list of users",
            content: {
              "application/json": {
                example: {
                  data: [
                    {
                      id: 1,
                      name: "John Doe",
                      email: "john@example.com",
                      createdAt: "2024-01-01T00:00:00.000Z",
                    },
                  ],
                  meta: {
                    current_page: 1,
                    page_size: 10,
                    total_records: 1,
                    total_pages: 1,
                    next_url: null,
                    prev_url: null,
                  },
                },
              },
            },
          },
        },
      },
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
        set.status = 201;
        return { data: "OK" };
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      body: registerSchema,
      detail: {
        tags: ["Users"],
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          400: {
            description: "Email already in use",
            content: {
              "application/json": {
                example: { error: "Email is already in use" },
              },
            },
          },
        },
      },
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
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                example: { token: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
              },
            },
          },
          400: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                example: { error: "Email or password is wrong" },
              },
            },
          },
        },
      },
    },
  )
  .get(
    "/me",
    async ({ headers }) => {
      const token = extractToken(headers);
      const user = await getCurrentUser(token);
      return { data: user };
    },
    {
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Returns current user",
            content: {
              "application/json": {
                example: {
                  data: {
                    id: 1,
                    name: "John Doe",
                    email: "john@example.com",
                    createdAt: "2024-01-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  )
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
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          400: {
            description: "Email already in use by another user",
            content: {
              "application/json": {
                example: { error: "The email should be a valid email" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
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
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Password updated successfully",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          400: {
            description: "Old password is incorrect",
            content: {
              "application/json": {
                example: { error: "The old password is not match" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  )
  .delete(
    "/logout",
    async ({ headers }) => {
      const token = extractToken(headers);
      await logoutUser(token);
      return { data: "OK" };
    },
    {
      detail: {
        tags: ["Users"],
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  );

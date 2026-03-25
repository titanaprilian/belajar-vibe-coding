import { t } from "elysia";

export const registerSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const loginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const updateProfileSchema = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
});

export const updatePasswordSchema = t.Object({
  oldPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 8 }),
});

export const paginationQuery = t.Object({
  page: t.Number({ minimum: 1, default: 1 }),
  size: t.Number({ minimum: 1, maximum: 100, default: 10 }),
});

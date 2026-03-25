import { t } from "elysia";

export const registerSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 255 }),
});

export const loginSchema = t.Object({
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 1, maxLength: 255 }),
});

export const updateProfileSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email", maxLength: 255 }),
});

export const updatePasswordSchema = t.Object({
  oldPassword: t.String({ minLength: 1, maxLength: 255 }),
  newPassword: t.String({ minLength: 8, maxLength: 255 }),
});

export const paginationQuery = t.Object({
  page: t.Number({ minimum: 1, default: 1 }),
  size: t.Number({ minimum: 1, maximum: 100, default: 10 }),
});

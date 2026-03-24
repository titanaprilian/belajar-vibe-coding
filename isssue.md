# Issue: User Registration

## Overview

Implement user registration feature. This includes creating the `users` table and a `POST /api/users` endpoint.

All changes go inside `src/modules/users/`. Do not create new files — work only in these three existing files:

- `users.schema.ts` — Drizzle table definition
- `users.service.ts` — business logic
- `index.ts` — Elysia routes

---

## Step 1 — Define the Table in `users.schema.ts`

Define the `users` table using Drizzle with the following columns:

| Column       | Type         | Constraint                  |
| ------------ | ------------ | --------------------------- |
| `id`         | integer      | primary key, auto increment |
| `name`       | varchar(255) | not null                    |
| `email`      | varchar(255) | not null                    |
| `password`   | varchar(255) | not null                    |
| `created_at` | timestamp    | default current_timestamp   |

After editing this file, run `bun run db:generate` then `bun run db:migrate` to apply the table to the database.

---

## Step 2 — Implement Business Logic in `users.service.ts`

Create a function `registerUser` that accepts `name`, `email`, and `password` as arguments.

The function must do the following **in order**:

1. **Check for duplicate email** — query the `users` table for an existing row with the same email. If found, throw an error with the message `"Email is already in use"`.
2. **Hash the password** — use `argon2` to hash the plain-text password. Install the package with `bun add argon2`.
3. **Insert the new user** — insert a row into the `users` table with `name`, `email`, and the hashed password.
4. **Return** `"OK"`.

---

## Step 3 — Validate the Request Body in `index.ts`

Elysia has built-in validation via `t` (TypeBox) — no extra package needed, import it from `elysia`.

Define a body schema on the route with these rules:

| Field      | Rule                                 |
| ---------- | ------------------------------------ |
| `name`     | string, minimum 1 character          |
| `email`    | string, must be a valid email format |
| `password` | string, minimum 8 characters         |

When validation fails, Elysia will automatically reject the request with status `422` before it reaches the handler. No manual validation code is needed.

---

## Step 4 — Register the Route in `index.ts`

Add a `POST /api/users` route to the Elysia instance in this file.

The route must:

1. Read `name`, `email`, `password` from the validated request body.
2. Call `registerUser` from `users.service.ts`.
3. On success, return `{ "data": "OK" }` with HTTP status `201`.
4. On error (e.g. duplicate email), return `{ "error": "<error message>" }` with HTTP status `400`.

---

## API Contract

**Endpoint**

```
POST /api/users
```

**Request Body**

```json
{
  "name": "Patrick",
  "email": "patrick@email.com",
  "password": "verysecret password"
}
```

**Response — Success `201`**

```json
{
  "data": "OK"
}
```

**Response — Error `400`**

```json
{
  "error": "Email is already in use"
}
```

---

## Acceptance Criteria

- `users` table exists in the database with the correct columns after running migration
- `POST /api/users` with a new valid email returns `{ "data": "OK" }` with status `201`
- `POST /api/users` with a duplicate email returns `{ "error": "Email is already in use" }` with status `400`
- `POST /api/users` with an invalid email format (e.g. `"notanemail"`) returns status `422`
- `POST /api/users` with an empty or short password returns status `422`
- Password stored in the database is a hashed string, never plain text

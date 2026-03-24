# Issue: User Login

## Overview

Implement user login feature. This includes creating the `sessions` table and a `POST /api/users/login` endpoint.

All changes go inside `src/modules/users/`. Do not create new files or new modules — work only in these three existing files:

- `users.schema.ts` — add the `sessions` table definition here
- `users.service.ts` — add login and session creation logic here
- `index.ts` — add the login route here

Do not put login business logic inside the route handler. Keep the route thin.

---

## Step 1 — Add the Sessions Table in `users.schema.ts`

In the existing `src/modules/users/users.schema.ts`, add a second table definition for `sessions` alongside the existing `users` table.

| Column       | Type         | Constraint                  |
| ------------ | ------------ | --------------------------- |
| `id`         | integer      | primary key, auto increment |
| `token`      | varchar(255) | not null                    |
| `user_id`    | integer      | foreign key → `users.id`    |
| `created_at` | timestamp    | default current_timestamp   |

After editing this file, run `bun run db:generate` then `bun run db:migrate` to apply the table to the database.

---

## Step 2 — Implement Login Logic in `users.service.ts`

In the existing `src/modules/users/users.service.ts`, add two new functions.

### `createSession(userId)`

Accepts `userId` as an argument and must do the following **in order**:

1. **Generate a token** — use `crypto.randomUUID()` (built into Bun, no extra package needed).
2. **Insert the session** — insert a row into the `sessions` table with the generated `token` and the provided `userId`.
3. **Return the token** string.

### `loginUser(email, password)`

Accepts `email` and `password` as arguments and must do the following **in order**:

1. **Find the user by email** — query the `users` table for a row matching the given email. If no user is found, throw an error with the message `"Email or password is wrong"`.
2. **Verify the password** — use `argon2.verify()` to compare the plain-text password against the stored hashed password. If it does not match, throw an error with the same message `"Email or password is wrong"`.
3. **Create a session** — call `createSession` with the found user's `id`.
4. **Return the token** string received from `createSession`.

> **Important:** Both "user not found" and "wrong password" must return the exact same error message. Never reveal which one failed — this is a security best practice.

---

## Step 3 — Validate the Request Body in `index.ts`

Add validation for the login route body using Elysia's built-in `t` (TypeBox).

| Field      | Rule                                 |
| ---------- | ------------------------------------ |
| `email`    | string, must be a valid email format |
| `password` | string, minimum 1 character          |

When validation fails, Elysia will automatically reject the request with status `422`.

---

## Step 4 — Register the Route in `index.ts`

Add a `POST /api/users/login` route to the existing Elysia instance in `src/modules/users/index.ts`.

The route must:

1. Read `email` and `password` from the validated request body.
2. Call `loginUser` from `users.service.ts`.
3. On success, return `{ "token": "<token>" }` with HTTP status `200`.
4. On error, return `{ "error": "<error message>" }` with HTTP status `400`.

---

## API Contract

**Endpoint**

```
POST /api/users/login
```

**Request Body**

```json
{
  "email": "patrick@email.com",
  "password": "verysecret password"
}
```

**Response — Success `200`**

```json
{
  "token": "very_long_token"
}
```

**Response — Error `400`**

```json
{
  "error": "Email or password is wrong"
}
```

---

## Acceptance Criteria

- `sessions` table exists in the database with the correct columns after running migration
- `POST /api/users/login` with correct credentials returns `{ "token": "..." }` with status `200`
- `POST /api/users/login` with a wrong password returns `{ "error": "Email or password is wrong" }` with status `400`
- `POST /api/users/login` with an email that does not exist returns the same `{ "error": "Email or password is wrong" }` with status `400` — not a different message
- `POST /api/users/login` with an invalid email format returns status `422`
- The token stored in the `sessions` table matches the one returned in the response

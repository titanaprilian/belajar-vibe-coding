# belajar-vibe-coding

A RESTful API for user management built with Bun, Elysia, Drizzle ORM, and MySQL. Features user registration, authentication via session tokens, profile management, and paginated user listing.

---

## Tech Stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Runtime          | [Bun](https://bun.sh) v1.3.3                      |
| Language         | TypeScript                                        |
| HTTP Framework   | [Elysia](https://elysiajs.com)                    |
| ORM              | [Drizzle ORM](https://orm.drizzle.team)           |
| Database         | MySQL                                             |
| Password Hashing | [Argon2](https://github.com/ranisalt/node-argon2) |

---

## Project Structure

```
project-root/
├── src/
│   ├── db/
│   │   └── index.ts              # Drizzle client, DB connection
│   ├── modules/
│   │   └── users/
│   │       ├── index.ts          # Elysia router, route handlers
│   │       ├── users.schema.ts   # Drizzle table definitions
│   │       ├── users.service.ts  # Business logic, DB queries
│   │       └── users.validation.ts # TypeBox validation schemas
│   └── index.ts                  # App entry point
├── tests/
│   └── users/
│       ├── register.test.ts
│       ├── login.test.ts
│       ├── get-users.test.ts
│       ├── get-me.test.ts
│       ├── update-me.test.ts
│       ├── update-password.test.ts
│       ├── delete-me.test.ts
│       └── logout.test.ts
├── drizzle/                      # Generated migration files
├── drizzle.config.ts
├── tsconfig.json
├── .env
├── .env.test
└── package.json
```

### Module Convention

Each feature module lives under `src/modules/<feature>/` and contains exactly four files:

- `index.ts` — routes only, no business logic
- `<feature>.schema.ts` — Drizzle table definitions for this module
- `<feature>.service.ts` — all business logic and DB queries
- `<feature>.validation.ts` — all Elysia/TypeBox request validation schemas

---

## Database Schema

### `users`

| Column       | Type         | Constraint                  |
| ------------ | ------------ | --------------------------- |
| `id`         | integer      | primary key, auto increment |
| `name`       | varchar(255) | not null                    |
| `email`      | varchar(255) | not null, unique            |
| `password`   | varchar(255) | not null (argon2 hash)      |
| `created_at` | timestamp    | default current_timestamp   |

### `sessions`

| Column       | Type         | Constraint                  |
| ------------ | ------------ | --------------------------- |
| `id`         | integer      | primary key, auto increment |
| `token`      | varchar(255) | not null (UUID)             |
| `user_id`    | integer      | foreign key → `users.id`    |
| `created_at` | timestamp    | default current_timestamp   |

---

## API Reference

All endpoints are prefixed with `/api/users`.

### Authentication

Protected endpoints require the following header:

```
Authorization: Bearer <token>
```

The token is obtained from the login endpoint and maps to a row in the `sessions` table.

---

### `GET /api/health` — Health Check

Check if the server is running.

**Response `200`**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### `POST /api/users` — Register

Register a new user.

**Request Body**

```json
{
  "name": "Patrick Star",
  "email": "patrick@email.com",
  "password": "verysecretpassword"
}
```

**Response `201`**

```json
{ "data": "OK" }
```

**Response `400`** — email already in use

```json
{ "error": "Email is already in use" }
```

---

### `POST /api/users/login` — Login

Authenticate and receive a session token.

**Request Body**

```json
{
  "email": "patrick@email.com",
  "password": "verysecretpassword"
}
```

**Response `200`**

```json
{ "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

**Response `400`** — wrong credentials

```json
{ "error": "Email or password is wrong" }
```

---

### `GET /api/users` — Get User List

Returns a paginated list of all users.

**Query Params**
| Param | Type | Default | Constraint |
|---|---|---|---|
| `page` | number | `1` | min 1 |
| `size` | number | `10` | min 1, max 100 |

**Response `200`**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Patrick Star",
      "email": "patrick@email.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "page_size": 10,
    "total_records": 100,
    "total_pages": 10,
    "next_url": "/api/users?page=2&size=10",
    "prev_url": null
  }
}
```

---

### `GET /api/users/me` — Get Current User 🔒

Returns the profile of the currently logged-in user.

**Response `200`**

```json
{
  "data": {
    "id": 1,
    "name": "Patrick Star",
    "email": "patrick@email.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response `401`**

```json
{ "error": "Unauthorized" }
```

---

### `PUT /api/users/me` — Update Profile 🔒

Update the current user's name and email.

**Request Body**

```json
{
  "name": "Patrick Star Updated",
  "email": "patrick@emailupdated.com"
}
```

**Response `200`**

```json
{ "data": "OK" }
```

**Response `400`** — email already in use by another user

```json
{ "error": "The email should be a valid email" }
```

---

### `PUT /api/users/me/password` — Update Password 🔒

Change the current user's password.

**Request Body**

```json
{
  "oldPassword": "verysecretpassword",
  "newPassword": "newverysecretpassword"
}
```

**Response `200`**

```json
{ "data": "OK" }
```

**Response `400`** — old password incorrect

```json
{ "error": "The old password is not match" }
```

---

### `DELETE /api/users/me` — Delete Account 🔒

Permanently delete the current user and all their sessions.

**Response `200`**

```json
{ "data": "OK" }
```

---

### `DELETE /api/users/logout` — Logout 🔒

Invalidate the current session token. Other active sessions are unaffected.

**Response `200`**

```json
{ "data": "OK" }
```

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.3 or later
- MySQL server running locally or remotely

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=mysql://user:password@localhost:3306/myapp
PORT=3000
```

### 3. Run database migrations

```bash
bun run db:generate
bun run db:migrate
```

### 4. Start the server

```bash
bun run dev
```

The server will start at `http://localhost:3000`.

---

## Available Scripts

| Script                | Description                             |
| --------------------- | --------------------------------------- |
| `bun run dev`         | Start server with hot reload            |
| `bun run start`       | Start server in production mode         |
| `bun run db:generate` | Generate migration files from schema    |
| `bun run db:migrate`  | Apply migrations to the database        |
| `bun test`            | Run all tests against the test database |

---

## Running Tests

Tests use a separate database to avoid affecting development data.

### 1. Create a test database

```bash
mysql -u root -p -e "CREATE DATABASE myapp_test;"
```

### 2. Configure test environment

```bash
cp .env .env.test
```

Edit `.env.test` and point `DATABASE_URL` to the test database:

```env
DATABASE_URL=mysql://user:password@localhost:3306/myapp_test
```

### 3. Run migrations on the test database

```bash
NODE_ENV=test bun run db:migrate
```

### 4. Run tests

```bash
bun test
```

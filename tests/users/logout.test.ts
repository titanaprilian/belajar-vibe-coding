import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users, sessions } from "../../src/modules/users/users.schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

describe("DELETE /api/users/logout", () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(async () => {
    await truncateTables();
    app = createTestApp();

    await db.insert(users).values({
      name: "John Doe",
      email: "john@example.com",
      password: await argon2.hash("password123"),
    });

    const user = await db.select().from(users).where(eq(users.email, "john@example.com"));
    const userId = user[0]!.id;

    token = crypto.randomUUID();
    await db.insert(sessions).values({
      token,
      userId,
    });
  });

  test("Valid token → 200", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: "OK" });
  });

  test("After logout, session is deleted from sessions table", async () => {
    await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    const session = await db.select().from(sessions).where(eq(sessions.token, token));
    expect(session).toHaveLength(0);
  });

  test("After logout, using same token → 401", async () => {
    await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    expect(response.status).toBe(401);
  });

  test("Other sessions of same user are NOT deleted", async () => {
    const user = await db.select().from(users).where(eq(users.email, "john@example.com"));
    const userId = user[0]!.id;

    const otherToken = crypto.randomUUID();
    await db.insert(sessions).values({
      token: otherToken,
      userId,
    });

    await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    const otherSessions = await db.select().from(sessions).where(eq(sessions.token, otherToken));
    expect(otherSessions).toHaveLength(1);
  });

  test("No Authorization header → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
  });

  test("Token does not exist → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { "Authorization": "Bearer invalid-token" },
      })
    );

    expect(response.status).toBe(401);
  });
});

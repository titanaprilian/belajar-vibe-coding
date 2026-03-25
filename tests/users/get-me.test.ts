import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users, sessions } from "../../src/modules/users/users.schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

describe("GET /api/users/me", () => {
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

  test("Valid token → 200 with user fields", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toHaveProperty("id");
    expect(body.data).toHaveProperty("name");
    expect(body.data).toHaveProperty("email");
    expect(body.data).toHaveProperty("createdAt");
  });

  test("Response never contains password field", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` },
      })
    );

    const body = await response.json();
    expect(body.data).not.toHaveProperty("password");
  });

  test("No Authorization header → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("Malformed header (Token abc) → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        headers: { "Authorization": `Token ${token}` },
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("Token does not exist in sessions → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        headers: { "Authorization": "Bearer invalid-token" },
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});

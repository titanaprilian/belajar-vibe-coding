import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users, sessions } from "../../src/modules/users/users.schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

describe("PUT /api/users/me", () => {
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

    await db.insert(users).values({
      name: "Jane Doe",
      email: "jane@example.com",
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

  test("Valid token and body → 200, changes persisted", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
          email: "updated@example.com",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: "OK" });

    const user = await db.select().from(users).where(eq(users.email, "updated@example.com"));
    expect(user[0]!.name).toBe("Updated Name");
  });

  test("Updating email to same email → 200", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
        }),
      })
    );

    expect(response.status).toBe(200);
  });

  test("Email already in use by different user → 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          email: "jane@example.com",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "The email should be a valid email" });
  });

  test("Invalid email format → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
          email: "notanemail",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Empty name → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "",
          email: "updated@example.com",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Name exceeding 255 characters → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "A".repeat(300),
          email: "updated@example.com",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("No Authorization header → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Name",
          email: "updated@example.com",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  test("Token does not exist → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer invalid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
          email: "updated@example.com",
        }),
      })
    );

    expect(response.status).toBe(401);
  });
});
